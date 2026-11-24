import asyncio
import argparse
import edge_tts
import sys

VOICE_MAP = {
    "mr": "mr-IN-AarohiNeural",
    "hi": "hi-IN-SwaraNeural",
    "en": "en-IN-NeerjaNeural"
}

async def main():
    parser = argparse.ArgumentParser(description="Generate TTS using edge-tts")
    parser.add_argument("--text", required=True, help="Text to convert to speech")
    parser.add_argument("--output", required=True, help="Output file path (.mp3)")
    parser.add_argument("--voice", default=None, help="Voice to use")
    parser.add_argument("--lang", default="en", help="Language code (en, mr, hi)")
    
    args = parser.parse_args()
    
    selected_voice = args.voice
    if not selected_voice:
        selected_voice = VOICE_MAP.get(args.lang.lower(), "en-IN-NeerjaNeural")

    try:
        communicate = edge_tts.Communicate(args.text, selected_voice)
        await communicate.save(args.output)
        print("Success")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
