import json
import unicodedata
from pathlib import Path
import numpy as np


def norm(p):
    return unicodedata.normalize("NFC", p)


vecs = {}
for line in open("vectors.jsonl"):
    try:
        r = json.loads(line)
    except json.JSONDecodeError:
        continue
    vecs[norm(r["path"])] = r["vec"]

meta = {norm(m["path"]): m for m in json.load(open("metadata.json"))}
dz_file = Path("deezer.json")
deezer = json.loads(dz_file.read_text()) if dz_file.exists() else {}

tracks, rows = [], []
missing = 0
for path, vec in vecs.items():
    m = meta.get(path)
    if not m:
        missing += 1
        continue
    dz = deezer.get(m["artist"] + " | " + m["title"])
    tracks.append({
        "artist": m["artist"],
        "title": m["title"],
        "genre": m["genre"],
        "bpm": m["bpm"],
        "camelot": m["camelot"],
        "deezer": dz["id"] if dz else None,
    })
    rows.append(vec)

X = np.array(rows, dtype=np.float32)
X = X - X.mean(axis=0)
X = X / np.linalg.norm(X, axis=1, keepdims=True)
X.astype("<f2").tofile("vectors.bin")

with open("tracks.json", "w") as f:
    json.dump({"dim": X.shape[1], "tracks": tracks}, f, ensure_ascii=False)

print("Treku:", len(tracks))
print("Be metaduomenu:", missing)
print("Su Deezer istrauka:", sum(1 for t in tracks if t["deezer"]))
print("vectors.bin MB:", round(X.size * 2 / 1e6, 1))
