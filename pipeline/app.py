import json
from pathlib import Path
import numpy as np
import streamlit as st
from mutagen.easyid3 import EasyID3

ROOT = Path.home() / "music" / "sample"
RATINGS = Path("ratings.jsonl")


@st.cache_data
def load():
    rows = [json.loads(line) for line in open("vectors.jsonl")]
    paths = [r["path"] for r in rows]
    X = np.array([r["vec"] for r in rows], dtype=np.float32)
    names = []
    for p in paths:
        try:
            tags = EasyID3(ROOT / p)
            names.append(tags["artist"][0] + " - " + tags["title"][0])
        except Exception:
            names.append(Path(p).stem)
    return paths, X, names


def prepare(X, center):
    if center:
        X = X - X.mean(axis=0)
    return X / np.linalg.norm(X, axis=1, keepdims=True)


def rate(query, cand, version, vote):
    row = {"query": query, "cand": cand, "version": version, "vote": vote}
    with RATINGS.open("a") as f:
        f.write(json.dumps(row) + "\n")
    st.toast("Issaugota")


paths, X, names = load()
st.title("NextTrack - garso panasumo testas")

center = st.toggle("Centravimas", value=True)
version = "center" if center else "raw"

order = sorted(range(len(paths)), key=lambda i: names[i].lower())
q = st.selectbox("Trekas", order, format_func=lambda i: names[i])
if st.checkbox("Klausyti uzklausos treko"):
    st.audio(str(ROOT / paths[q]), start_time=60)

sims = prepare(X, center) @ prepare(X, center)[q]

st.subheader("Panasiausi")
for j in np.argsort(-sims)[1:11]:
    c1, c2, c3 = st.columns([6, 1, 1])
    c1.markdown(f"**{sims[j]:.2f}** &nbsp; {names[j]}")
    if c1.checkbox("Klausyti", key=f"play{q}{j}"):
        c1.audio(str(ROOT / paths[j]), start_time=60)
    if c2.button("Tinka", key=f"up{version}{q}{j}"):
        rate(paths[q], paths[j], version, 1)
    if c3.button("Netinka", key=f"down{version}{q}{j}"):
        rate(paths[q], paths[j], version, -1)
