from rekordbox_pdb import Database

db = Database.from_file("/home/kestas/music/flash1-rekordbox/export.pdb")
print("Lenteles:", [a for a in dir(db) if not a.startswith("_")])

tracks = list(db.tracks)
with_key = [t for t in tracks if t.key_id]
with_bpm = [t for t in tracks if t.tempo]
print("Treku:", len(tracks))
print("Su tonacija:", len(with_key))
print("Su BPM:", len(with_bpm))

keys = list(db.keys)
print("Tonaciju irasai:", keys[:30])
