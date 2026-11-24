using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using SmartChatbot.Api.Models;
using SmartChatbot.Api.Services;

namespace SmartChatbot.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ModulesController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _cache;
        private readonly GeminiService _geminiService;
        private readonly LlamaService _llamaService;
        private readonly List<ModuleConfig> _modules;

        public ModulesController(
            IConfiguration configuration,
            IMemoryCache cache,
            GeminiService geminiService,
            LlamaService llamaService)
        {
            _configuration = configuration;
            _cache = cache;
            _geminiService = geminiService;
            _llamaService = llamaService;

            // Load module configurations
            _modules = _configuration.GetSection("Modules").Get<List<ModuleConfig>>() ?? new List<ModuleConfig>();
        }

        [HttpGet]
        public ActionResult<IEnumerable<ModuleConfig>> GetModules()
        {
            var result = new List<ModuleConfig>();

            foreach (var mod in _modules)
            {
                var copy = new ModuleConfig
                {
                    Name = mod.Name,
                    Icon = mod.Icon,
                    Path = mod.Path,
                    Description = mod.Description,
                    Suggestions = mod.Suggestions,
                    IsLoaded = System.IO.File.Exists(mod.Path)
                };
                result.Add(copy);
            }

            return Ok(result);
        }

        [HttpPost("chat")]
        public async Task<ActionResult<ChatResponse>> Chat([FromBody] ChatRequest request)
        {
            if (string.IsNullOrEmpty(request.ModuleName))
            {
                return BadRequest("Module name is required.");
            }

            if (string.IsNullOrEmpty(request.UserMessage))
            {
                return BadRequest("User message is required.");
            }

            // Find configured module
            var moduleConfig = _modules.FirstOrDefault(m => m.Name.Equals(request.ModuleName, StringComparison.OrdinalIgnoreCase));
            if (moduleConfig == null)
            {
                return BadRequest($"Module '{request.ModuleName}' is not configured.");
            }

            // Verify file exists
            if (!System.IO.File.Exists(moduleConfig.Path))
            {
                return BadRequest($"The manual document for '{moduleConfig.Name}' was not found at path: {moduleConfig.Path}. Please check backend configuration.");
            }

            // Extract manual content (with cache verification)
            string manualContent;
            try
            {
                var fileWriteTime = System.IO.File.GetLastWriteTime(moduleConfig.Path);
                var cacheKey = $"ManualContent_{moduleConfig.Name}";

                if (!_cache.TryGetValue(cacheKey, out (string Content, DateTime WriteTime) cached) || cached.WriteTime != fileWriteTime)
                {
                    var extractedText = DocxExtractor.ExtractText(moduleConfig.Path);
                    if (extractedText == null)
                    {
                        return BadRequest($"Failed to extract content from manual file at: {moduleConfig.Path}");
                    }

                    cached = (extractedText, fileWriteTime);
                    _cache.Set(cacheKey, cached, TimeSpan.FromDays(30)); // Cache indefinitely unless file is modified
                }

                manualContent = cached.Content;
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error reading manual file: {ex.Message}");
            }

            // Send query to Llama-3.2-1B model via LlamaService
            try
            {
                string reply;
                try
                {
                    reply = await _llamaService.AskLlamaAsync(
                        request.ApiKey,
                        moduleConfig.Name,
                        manualContent,
                        request.UserMessage,
                        request.History,
                        request.Language ?? "en"
                    );
                }
                catch (Exception llamaEx)
                {
                    // Fallback to Gemini if Llama API token is not configured or fails
                    reply = await _geminiService.AskGeminiAsync(
                        request.ApiKey,
                        moduleConfig.Name,
                        manualContent,
                        request.UserMessage,
                        request.History,
                        request.Language ?? "en"
                    );
                }

                string? audioBase64 = null;
                if (request.VoiceToVoice && !string.IsNullOrEmpty(reply))
                {
                    string tempFile = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.mp3");
                    try
                    {
                        string textToSpeak = StripMarkdown(reply);
                        
                        // Dynamically resolve generate_tts.py path
                        string scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "generate_tts.py");
                        if (!System.IO.File.Exists(scriptPath))
                        {
                            scriptPath = Path.Combine(AppContext.BaseDirectory, "generate_tts.py");
                        }
                        if (!System.IO.File.Exists(scriptPath))
                        {
                            string upPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "generate_tts.py");
                            if (System.IO.File.Exists(upPath))
                            {
                                scriptPath = Path.GetFullPath(upPath);
                            }
                        }
                        scriptPath = Path.GetFullPath(scriptPath);

                        var startInfo = new System.Diagnostics.ProcessStartInfo
                        {
                            FileName = "python",
                            Arguments = $"\"{scriptPath}\" --text \"{textToSpeak.Replace("\"", "\\\"")}\" --output \"{tempFile}\" --lang \"{request.Language ?? "en"}\"",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        };

                        using (var process = System.Diagnostics.Process.Start(startInfo))
                        {
                            if (process != null)
                            {
                                await process.WaitForExitAsync();
                                if (process.ExitCode == 0 && System.IO.File.Exists(tempFile))
                                {
                                    byte[] audioBytes = await System.IO.File.ReadAllBytesAsync(tempFile);
                                    audioBase64 = Convert.ToBase64String(audioBytes);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"TTS Exception: {ex.Message}");
                    }
                    finally
                    {
                        if (System.IO.File.Exists(tempFile))
                        {
                            try { System.IO.File.Delete(tempFile); } catch {}
                        }
                    }
                }

                return Ok(new ChatResponse { Reply = reply, AudioBase64 = audioBase64 });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private string StripMarkdown(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;
            text = text.Replace("**", "").Replace("*", "").Replace("`", "");
            text = text.Replace("- ", "").Replace("* ", "");
            return text;
        }
    }
}

