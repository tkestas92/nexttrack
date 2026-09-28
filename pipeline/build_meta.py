import json
import re
from collections import Counter
from rekordbox_pdb import Database

PDB = "/home/kestas/music/flash1-rekordbox/export.pdb"

NOTES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
MINOR = {8: 1, 3: 2, 10: 3, 5: 4, 0: 5, 7: 6,
         2: 7, 9: 8, 4: 9, 11: 10, 6: 11, 1: 12}
MAJOR = {11: 1, 6: 2, 1: 3, 8: 4, 3: 5, 10: 6,
         5: 7, 0: 8, 7: 9, 2: 10, 9: 11, 4: 12}


def to_camelot(name):
    name = name.strip()
    m = re.fullmatch(r"(\d{1,2})([ABab])", name)
    if m:
        return str(int(m.group(1))) + m.group(2).upper()
    m = re.fullmatch(r"([A-Ga-g])([#b]?)\s*(maj|min|major|minor|m)?", name)
    if not m:
        return None
    pc = NOTES[m.group(1).upper()]
    if m.group(2) == "#":
        pc += 1
    elif m.group(2) == "b":
        pc -= 1
    pc = pc % 12
    mode = (m.group(3) or "maj").lower()
    if mode in ("min", "minor", "m"):
        return str(MINOR[pc]) + "A"
    return str(MAJOR[pc]) + "B"


checks = {"Amin": "8A", "F#min": "11A", "Gbmin": "11A",
          "Fmaj": "7B", "A#maj": "6B", "Cm": "5A", "8A": "8A"}
for raw, expected in checks.items():
    assert to_camelot(raw) == expected, (raw, to_camelot(raw))
print("Camelot testai: OK")

db = Database.from_file(PDB)
artists = {a.id: a.name for a in db.artists}
genres = {g.id: g.name for g in db.genres}
keys = {k.id: k.name for k in db.keys}

rows = []
unknown = set()
for t in db.tracks:
    key_name = keys.get(t.key_id, "")
    cam = to_camelot(key_name) if key_name else None
    if key_name and not cam:
        unknown.add(key_name)
    rows.append({
        "path": t.file_path.lstrip("/"),
        "title": t.title,
        "artist": artists.get(t.artist_id, ""),
        "genre": genres.get(t.genre_id, ""),
        "bpm": t.tempo / 100 if t.tempo else None,
        "key_raw": key_name,
        "camelot": cam,
    })

with open("metadata.json", "w") as f:
    json.dump(rows, f, ensure_ascii=False)

print("Treku:", len(rows))
print("Su Camelot:", sum(1 for r in rows if r["camelot"]))
print("Neatpazintos tonacijos:", sorted(unknown))
print("Dazniausios:", Counter(r["camelot"] for r in rows).most_common(8))
print("Istorijos setu:", len(list(db.history_playlists)))
print("Istorijos irasu:", len(list(db.history_entries)))
