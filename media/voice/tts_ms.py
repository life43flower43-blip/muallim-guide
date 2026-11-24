# التعليق الصوتي بصوت مايكروسوفت العربي المجاني (edge-tts): ملف لكل جملة مشكولة
import asyncio, json, os
import edge_tts

here = os.path.dirname(__file__)
VOICE = os.environ.get("VOICE", "ar-SA-ZariyahNeural")

async def main():
    for name, text in json.load(open(os.path.join(here, "lines-ms.json"), encoding="utf-8")):
        await edge_tts.Communicate(text, VOICE, rate="+4%").save(os.path.join(here, f"ms_{name}.mp3"))
        print(name, "تم")

asyncio.run(main())
