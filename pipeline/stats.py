import json
from statistics import median

rows = [r for r in json.load(open("metadata.json"))
        if r["camelot"] and r["bpm"]]


def neighbors(c):
    n, letter = int(c[:-1]), c[-1]
    other = "B" if letter == "A" else "A"
    up = n % 12 + 1
    down = (n - 2) % 12 + 1
    return {c, f"{up}{letter}", f"{down}{letter}", f"{n}{other}"}


def bpm_ok(a, b, tol=0.06):
    for x in (b, b * 2, b / 2):
        if abs(a - x) / a <= tol:
            return True
    return False


counts = []
for r in rows:
    ok = neighbors(r["camelot"])
    c = 0
    for s in rows:
        if s is not r and s["camelot"] in ok and bpm_ok(r["bpm"], s["bpm"]):
            c += 1
    counts.append(c)

counts.sort()
print("Treku:", len(rows))
print("Kandidatu mediana:", median(counts))
print("Vidurkis:", round(sum(counts) / len(counts)))
print("25% / 75%:", counts[len(counts) // 4], counts[3 * len(counts) // 4])
print("Maziau nei 5 kandidatu:", sum(1 for c in counts if c < 5))
