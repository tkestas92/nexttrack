import sys
sys.stdout.reconfigure(errors="backslashreplace")
import json
from pathlib import Path
from essentia.standard import MonoLoader
from essentia.standard import TensorflowPredictEffnetDiscogs

MODEL = "models/discogs_track_embeddings-effnet-bs64-1.pb"
EXTS = {".mp3", ".wav", ".aiff", ".aif", ".flac", ".m4a"}

root = Path(sys.argv[1])
out = Path("vectors.jsonl")

done = set()
if out.exists():
    for line in out.open():
        done.add(json.loads(line)["path"])

model = TensorflowPredictEffnetDiscogs(
    graphFilename=MODEL,
    output="PartitionedCall:0",
)

files = []
for p in sorted((root / "Contents").rglob("*")):
    if p.suffix.lower() in EXTS and not p.name.startswith("._"):
        files.append(p)

with out.open("a") as f:
    for i, p in enumerate(files, 1):
        key = str(p.relative_to(root))
        if key in done:
            continue
        try:
            audio = MonoLoader(filename=str(p), sampleRate=16000)()
            vec = model(audio).mean(axis=0)
            row = {"path": key, "vec": vec.round(5).tolist()}
            f.write(json.dumps(row) + "\n")
            f.flush()
            print(f"[{i}/{len(files)}] OK {key}", flush=True)
        except Exception as e:
            print(f"[{i}/{len(files)}] KLAIDA {key}: {e}", flush=True)
