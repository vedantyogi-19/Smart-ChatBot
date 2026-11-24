using System.Collections.Generic;

namespace SmartChatbot.Api.Models
{
    public class ModuleConfig
    {
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Suggestions { get; set; } = new();
        public bool IsLoaded { get; set; }
    }

    public class ChatRequest
    {
        public string ModuleName { get; set; } = string.Empty;
        public string UserMessage { get; set; } = string.Empty;
        public List<ChatMessage> History { get; set; } = new();
        public string? ApiKey { get; set; }
        public bool VoiceToVoice { get; set; }
        public string Language { get; set; } = "en"; // "en", "mr", "hi"
    }

    public class ChatResponse
    {
        public string Reply { get; set; } = string.Empty;
        public string? AudioBase64 { get; set; }
    }

    public class ChatMessage
    {
        public string Role { get; set; } = string.Empty; // "user" or "assistant"
        public string Content { get; set; } = string.Empty;
    }
}
