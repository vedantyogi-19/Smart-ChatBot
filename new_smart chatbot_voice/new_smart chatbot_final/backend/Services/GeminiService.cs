using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SmartChatbot.Api.Models;

namespace SmartChatbot.Api.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _modelName;
        private readonly string _defaultApiKey;

        public GeminiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _modelName = configuration["Gemini:Model"] ?? "gemini-2.5-flash";
            _defaultApiKey = configuration["Gemini:DefaultApiKey"] ?? string.Empty;
        }

        public async Task<string> AskGeminiAsync(
            string? clientApiKey,
            string moduleName,
            string manualContent,
            string userMsg,
            List<ChatMessage> history,
            string language = "en")
        {
            // Resolve API Key
            var apiKey = !string.IsNullOrEmpty(clientApiKey) ? clientApiKey : 
                         (!string.IsNullOrEmpty(_defaultApiKey) ? _defaultApiKey : 
                         Environment.GetEnvironmentVariable("GEMINI_API_KEY"));

            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Gemini API key is not configured. Please set the API key in the sidebar or backend configuration.");
            }

            string langInstruction = language.ToLower() switch
            {
                "mr" => "CRITICAL REQUIREMENT: You MUST answer the question ENTIRELY in MARATHI (मराठी) language using Devanagari script. Do NOT respond in English.",
                _ => "CRITICAL REQUIREMENT: Answer strictly in English."
            };

            var systemInstruction = $@"{langInstruction}

You are a helpful assistant for the SMART Maharashtra Integrated MIS Platform, developed by Amnex Infotechnologies for the Department of Agriculture, Government of Maharashtra.

You specialize in answering questions about the ""{moduleName}"".

Here is the manual content:

---
{manualContent}
---

Instructions:
- Answer ONLY based on the manual content provided above.
- Be concise, clear, and practical.
- When explaining procedures, use numbered steps.
- Refer to UI elements exactly as mentioned in the manual.
- For navigation paths use: Menu → Submenu → Page format.
- Use markdown formatting: **bold** for UI elements, numbered lists for steps.
- Remember: {langInstruction}";

            // Construct payload
            var contents = new List<GeminiContent>();

            // Add history
            foreach (var msg in history)
            {
                var role = msg.Role == "assistant" ? "model" : "user";
                contents.Add(new GeminiContent
                {
                    Role = role,
                    Parts = new List<GeminiPart> { new GeminiPart { Text = msg.Content } }
                });
            }

            // Add latest message
            contents.Add(new GeminiContent
            {
                Role = "user",
                Parts = new List<GeminiPart> { new GeminiPart { Text = userMsg } }
            });

            var payload = new GeminiRequest
            {
                Contents = contents,
                SystemInstruction = new GeminiSystemInstruction
                {
                    Parts = new List<GeminiPart> { new GeminiPart { Text = systemInstruction } }
                }
            };

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_modelName}:generateContent?key={apiKey}";
            var jsonSerializerOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };

            var requestJson = JsonSerializer.Serialize(payload, jsonSerializerOptions);
            var content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Gemini API Error ({response.StatusCode}): {responseString}");
            }

            try
            {
                using var doc = JsonDocument.Parse(responseString);
                var root = doc.RootElement;
                
                if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                {
                    var firstCandidate = candidates[0];
                    if (firstCandidate.TryGetProperty("content", out var resContent))
                    {
                        if (resContent.TryGetProperty("parts", out var parts) && parts.GetArrayLength() > 0)
                        {
                            var text = parts[0].GetProperty("text").GetString();
                            return text ?? "No text returned from model.";
                        }
                    }
                }
                
                throw new Exception("Unexpected response structure from Gemini API.");
            }
            catch (Exception ex)
            {
                throw new Exception($"Error parsing Gemini API response: {ex.Message}. Raw response: {responseString}");
            }
        }

        // Inner request/response models for Gemini
        private class GeminiRequest
        {
            [JsonPropertyName("contents")]
            public List<GeminiContent> Contents { get; set; } = new();

            [JsonPropertyName("systemInstruction")]
            public GeminiSystemInstruction SystemInstruction { get; set; } = new();
        }

        private class GeminiContent
        {
            [JsonPropertyName("role")]
            public string Role { get; set; } = string.Empty;

            [JsonPropertyName("parts")]
            public List<GeminiPart> Parts { get; set; } = new();
        }

        private class GeminiPart
        {
            [JsonPropertyName("text")]
            public string Text { get; set; } = string.Empty;
        }

        private class GeminiSystemInstruction
        {
            [JsonPropertyName("parts")]
            public List<GeminiPart> Parts { get; set; } = new();
        }
    }
}
