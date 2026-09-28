import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

OUT = Path("deezer.json")
cache = json.loads(OUT.read_text()) if OUT.exists() else {}


def clean(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = s.encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[\(\[].*?[\)\]]", " ", s)
    s = re.sub(r"\b(feat|ft)\.?\s.*", " ", s)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return " ".join(s.split())


def main_artist(artist):
    parts = re.split(r",|&| x | feat\.? | ft\.? ", artist or "", flags=re.I)
    return parts[0].strip()


def sim(a, b):
    return SequenceMatcher(None, a, b).ratio()


def search(q):
    url = "https://api.deezer.com/search?" + urllib.parse.urlencode(
        {"q": q, "limit": 10})
    for _ in range(5):
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                data = json.load(r)
        except Exception:
            time.sleep(3)
            continue
        if "error" in data:
            time.sleep(5)
            continue
        time.sleep(0.12)
        return data.get("data", [])
    return []


def best(artist, title, results):
    t, a, m = clean(title), clean(artist), clean(main_artist(artist))
    top, top_score = None, 0.0
    for r in results:
        ts = sim(t, clean(r.get("title", "")))
        ra = clean(r.get("artist", {}).get("name", ""))
        as_ = 1.0 if ra and ra in a else sim(ra, m)
        score = 0.7 * ts + 0.3 * as_
        if ts >= 0.8 and as_ >= 0.6 and score > top_score:
            top, top_score = r, score
    return top, top_score


meta = json.load(open("metadata.json"))
todo = [m for m in meta if m["artist"] + " | " + m["title"] not in cache]
print("Liko suderinti:", len(todo), flush=True)

for i, m in enumerate(todo, 1):
    key = m["artist"] + " | " + m["title"]
    base = clean(m["title"])
    artist = main_artist(m["artist"])
    results = search(f'artist:"{artist}" track:"{base}"')
    hit, score = best(m["artist"], m["title"], results)
    if not hit:
        hit, score = best(m["artist"], m["title"], search(artist + " " + base))
    cache[key] = {"id": hit["id"], "score": round(score, 3)} if hit else None
    if i % 50 == 0:
        OUT.write_text(json.dumps(cache, ensure_ascii=False))
        found = sum(1 for v in cache.values() if v)
        print(f"[{i}/{len(todo)}] rasta {found}/{len(cache)}", flush=True)

OUT.write_text(json.dumps(cache, ensure_ascii=False))
found = sum(1 for v in cache.values() if v)
print(f"Baigta. Rasta {found} is {len(cache)} ({100 * found // len(cache)}%)")
