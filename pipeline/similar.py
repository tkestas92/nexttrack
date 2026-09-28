import sys
import json
import numpy as np

rows = [json.loads(line) for line in open("vectors.jsonl")]
paths = [r["path"] for r in rows]
X = np.array([r["vec"] for r in rows], dtype=np.float32)
if "--center" in sys.argv:
    X = X - X.mean(axis=0)
X = X / np.linalg.norm(X, axis=1, keepdims=True)

query = sys.argv[1].lower()
matches = [i for i, p in enumerate(paths) if query in p.lower()]
if not matches:
    print("Nerasta:", query)
    sys.exit()

i = matches[0]
print("Uzklausa:", paths[i])
print()
sims = X @ X[i]
for j in np.argsort(-sims)[1:11]:
    print(f"{sims[j]:.3f}  {paths[j]}")
