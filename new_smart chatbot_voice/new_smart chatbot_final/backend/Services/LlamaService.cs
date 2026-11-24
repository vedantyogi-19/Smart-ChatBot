using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SmartChatbot.Api.Models;

namespace SmartChatbot.Api.Services
{
    public class LlamaService
    {
        private readonly HttpClient _httpClient;
        private readonly string _modelId;
        private readonly string _defaultHfToken;

        public LlamaService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _modelId = configuration["HuggingFace:Model"] ?? "meta-llama/Llama-3.2-1B-Instruct";
            _defaultHfToken = configuration["HuggingFace:Token"] ?? string.Empty;
        }

        public async Task<string> AskLlamaAsync(
            string? clientApiKey,
            string moduleName,
            string manualContent,
            string userMsg,
            List<ChatMessage> history,
            string language = "en")
        {
            // Resolve Token
            var token = !string.IsNullOrEmpty(clientApiKey) ? clientApiKey :
                        (!string.IsNullOrEmpty(_defaultHfToken) ? _defaultHfToken :
                        Environment.GetEnvironmentVariable("HF_TOKEN"));

            // Strict Output Language Instruction
            string langInstruction = language.ToLower() switch
            {
                "mr" => "CRITICAL REQUIREMENT: You MUST answer the question ENTIRELY in MARATHI (मराठी) language using Devanagari script. Do NOT respond in English.",
                _ => "CRITICAL REQUIREMENT: Answer strictly in English."
            };

            // Fast Context Extraction (RAG) — filter manual content down to 2,000-3,000 chars of relevant sections for ultra-fast generation
            string targetedContext = GetRelevantContext(manualContent, userMsg);

            var systemPrompt = $@"{langInstruction}

You are the official AI Assistant for the SMART Maharashtra Integrated MIS Platform, developed for the Department of Agriculture, Government of Maharashtra.
Your specialized module is: ""{moduleName}"".

Relevant Manual Excerpt:
---
{targetedContext}
---

Rules for your output:
1. Answer the query accurately based on the manual excerpt above.
2. Structure your response professionally:
   - Use bold markdown (**text**) for UI elements, button names, and menu paths.
   - Use clean numbered lists (1., 2., 3.) for procedural steps.
   - Keep answers direct, concise, and easy to read.
3. Remember: {langInstruction}";

            var messages = new List<object>
            {
                new { role = "system", content = systemPrompt }
            };

            // Include last 4 history messages for speed and context window efficiency
            var recentHistory = history.TakeLast(4);
            foreach (var msg in recentHistory)
            {
                messages.Add(new { role = msg.Role == "assistant" ? "assistant" : "user", content = msg.Content });
            }

            // Add latest user query
            messages.Add(new { role = "user", content = userMsg });

            var payload = new
            {
                model = _modelId,
                messages = messages,
                max_tokens = 350,
                temperature = 0.2,
                top_p = 0.9
            };

            // Call HuggingFace Router API Endpoint
            var requestUrl = "https://router.huggingface.co/hf-inference/v1/chat/completions";
            
            var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            if (!string.IsNullOrEmpty(token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            var requestJson = JsonSerializer.Serialize(payload);
            request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                // Fallback to legacy Hugging Face inference endpoint if router format returns 404
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return await FallbackLegacyHuggingFaceApi(token, _modelId, systemPrompt, userMsg);
                }
                throw new Exception($"Hugging Face API Error ({response.StatusCode}): {responseString}");
            }

            try
            {
                using var doc = JsonDocument.Parse(responseString);
                var root = doc.RootElement;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var firstChoice = choices[0];
                    if (firstChoice.TryGetProperty("message", out var messageObj))
                    {
                        if (messageObj.TryGetProperty("content", out var contentElem))
                        {
                            var text = contentElem.GetString();
                            return text?.Trim() ?? "No content returned.";
                        }
                    }
                }

                throw new Exception("Unexpected response structure from Hugging Face API.");
            }
            catch (Exception ex)
            {
                throw new Exception($"Error parsing Hugging Face response: {ex.Message}. Raw: {responseString}");
            }
        }

        private string GetRelevantContext(string manualContent, string userMsg)
        {
            if (string.IsNullOrWhiteSpace(manualContent)) return string.Empty;
            if (manualContent.Length <= 3000) return manualContent;

            var paragraphs = manualContent.Split(new[] { "\r\n\r\n", "\n\n", "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                                          .Where(p => p.Trim().Length > 20)
                                          .ToList();

            var queryWords = userMsg.ToLower()
                                    .Split(new[] { ' ', '?', '!', '.', ',', ';', ':', '-', '_', '/', '\\' }, StringSplitOptions.RemoveEmptyEntries)
                                    .Where(w => w.Length > 2)
                                    .ToHashSet();

            var scoredParagraphs = paragraphs.Select(p => {
                var lower = p.ToLower();
                int score = queryWords.Count(w => lower.Contains(w));
                return new { Paragraph = p, Score = score };
            })
            .OrderByDescending(p => p.Score)
            .Take(5)
            .Select(p => p.Paragraph)
            .ToList();

            if (!scoredParagraphs.Any() || scoredParagraphs.Sum(p => p.Length) < 150)
            {
                return manualContent.Substring(0, Math.Min(manualContent.Length, 3000));
            }

            var result = string.Join("\n\n", scoredParagraphs);
            return result.Length > 3500 ? result.Substring(0, 3500) : result;
        }

        private async Task<string> FallbackLegacyHuggingFaceApi(string? token, string modelId, string systemPrompt, string userMsg)
        {
            var fallbackUrl = $"https://api-inference.huggingface.co/models/{modelId}";
            var request = new HttpRequestMessage(HttpMethod.Post, fallbackUrl);
            if (!string.IsNullOrEmpty(token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            var promptText = $"<|system|>\n{systemPrompt}\n<|user|>\n{userMsg}\n<|assistant|>\n";
            var payload = new
            {
                inputs = promptText,
                parameters = new
                {
                    max_new_tokens = 350,
                    temperature = 0.2,
                    return_full_text = false
                }
            };

            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.SendAsync(request);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Hugging Face Legacy API Error ({response.StatusCode}): {responseString}");
            }

            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;
            if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
            {
                if (root[0].TryGetProperty("generated_text", out var genText))
                {
                    return genText.GetString()?.Trim() ?? "No output generated.";
                }
            }
            return responseString;
        }
    }
}
