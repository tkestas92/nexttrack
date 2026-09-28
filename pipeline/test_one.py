import json
import sys
from essentia.standard import MonoLoader
from essentia.standard import TensorflowPredictEffnetDiscogs

MODEL = "models/discogs_track_embeddings-effnet-bs64-1"

meta = json.load(open(MODEL + ".json"))
outputs = meta["schema"]["outputs"]
output = ""
for o in outputs:
    if o.get("output_purpose") == "embeddings":
        output = o["name"]

loader = MonoLoader(filename=sys.argv[1], sampleRate=16000)
audio = loader()

model = TensorflowPredictEffnetDiscogs(
    graphFilename=MODEL + ".pb",
    output="PartitionedCall:0",
)
emb = model(audio)
vec = emb.mean(axis=0)

print("Trukme (s):", round(len(audio) / 16000))
print("Embeddingu matrica:", emb.shape)
print("Treko vektorius:", vec.shape)
