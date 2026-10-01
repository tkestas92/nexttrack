# NextTrack

NextTrack helps a DJ choose the next track. Matching musical key and tempo still leaves hundreds of candidates. This project ranks those candidates by how the records actually sound, using embeddings computed once from a private Rekordbox library and compared in the browser.

## Problem

Harmonic mixing is necessary and not sufficient. In a library of 3,582 tracks, a typical track still has about 620 others that agree on Camelot key and BPM (including half-time and double-time). DJs then pick from memory: which of those 620 has the right timbre, drums, and mood. NextTrack does that last step with audio embeddings, without putting the music online.

## Approach

Audio never leaves the machine that owns it. A Python pipeline reads a Rekordbox USB export, embeds each track, and writes two files. The website loads those files and ranks candidates locally.

```mermaid
flowchart TD
  usb[Rekordbox USB export]
  audio[Audio files, local only]
  pdb[export.pdb]
  analyze[analyze.py Essentia Discogs-EffNet]
  heads[heads.py mood heads, second audio pass]
  meta[build_meta.py BPM and Camelot]
  match[deezer_match.py Deezer track ids]
  embed[512-d embeddings]
  export[export.py mean-center and L2-normalize]
  files[tracks.json and vectors.bin]
  browser[Next.js app in the browser]
  filter[Camelot and BPM filter]
  rank[Dot-product ranking]
  ui[Top 10]
  api["GET /api/preview"]
  deezer[Deezer API]

  usb --> audio
  usb --> pdb
  audio --> analyze
  analyze --> embed
  audio --> heads
  heads --> export
  pdb --> meta
  meta --> match
  embed --> export
  meta --> export
  match --> export
  export --> files
  files --> browser
  browser --> filter
  filter --> rank
  rank --> ui
  ui -->|play, on click| api
  api --> deezer
```

Each track becomes one 512-dimensional Discogs-EffNet embedding. The export mean-centers the matrix and L2-normalizes every row, so similarity is a dot product. The browser decodes the float16 matrix once, drops tracks that fail the Camelot intent or the BPM tolerance, and sorts what remains.

The only server call is optional. If a track has a Deezer id, pressing play asks `/api/preview` for a short preview URL. The app does not host, proxy, or store audio. Tracks without an id, and previews Deezer cannot serve, show that in the play-button slot.

## Radar

Each track can also carry six mood axes: relaxed, party, aggressive, happy, sad, and vocal. They come from Essentia classification heads on the Discogs-EffNet embeddings (`pipeline/heads.py`). `heads.py` needs a second pass over the audio. The site shows each axis as a percentile relative to this library, and labels the chart as a model estimate, not a probability.

The selected track draws one radar. Compare on a suggestion overlays that track and the suggestion, then one line says why they sit together: which axes are within 12 points, and which axis differs most.

## Tech stack

| Piece | Choice |
| --- | --- |
| Embeddings | Essentia TensorFlow, Discogs-EffNet |
| Library metadata | Rekordbox `export.pdb` via `rekordbox-pdb`, plus Mutagen in the private Streamlit tool |
| Preview ids | Deezer search API, matched offline |
| Web app | Next.js 16, React 19, TypeScript, Tailwind CSS 4, App Router |
| Tests | Vitest, for Camelot neighbors, BPM compatibility, ranking, radar comparison, and preview state |
| Hosting | Railway. Set the root directory to `web`. Build `npm run build`, start `npm start`. No Docker image. |

## Run the web app

```bash
cd web
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The page loads `web/public/data/tracks.json` and `web/public/data/vectors.bin` in the browser.

Production, including on Railway:

```bash
cd web
npm install
npm run build
npm start
```

`next start` listens on `PORT`.

## Run the pipeline

Scripts live in `pipeline/` and expect to be run from that directory. They read and write local files. Do not commit models, audio, `vectors.jsonl`, `metadata.json`, or `deezer.json`.

```bash
cd pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

1. Put the Essentia Discogs-EffNet track-embedding model at `pipeline/models/discogs_track_embeddings-effnet-bs64-1.pb`. The model is not in this repo.
2. Point a Rekordbox USB export at the analyzer. It reads audio under `<usb>/Contents` and appends `vectors.jsonl`:

   ```bash
   python analyze.py /path/to/rekordbox-usb
   ```

3. `heads.py` makes a second pass over the same audio. It runs Essentia classification heads on the Discogs-EffNet embeddings and produces the six radar axes (relaxed, party, aggressive, happy, sad, vocal).
4. `build_meta.py` reads `export.pdb` and writes `metadata.json` (artist, title, genre, BPM, Camelot). The database path is the `PDB` constant at the top of that script.
5. Match Deezer track ids. This calls the Deezer search API and writes `deezer.json`:

   ```bash
   python deezer_match.py
   ```

6. Build the files the website loads:

   ```bash
   python export.py
   cp tracks.json vectors.bin ../web/public/data/
   ```

`similar.py` is a small command-line probe over `vectors.jsonl`. `app.py` is a private Streamlit tool for listening to local files and rating neighbors. It is not the public app, and it expects audio on disk.

```bash
streamlit run app.py
```

## Demo

Live demo: https://demo-nexttrack.kantrybes.lt

![NextTrack](docs/screenshot.png)

## Limitations and next steps

- Deezer previews cover about 78% of tracks (2,806 of 3,582). Tracks without an id show “No preview available”.
- Deezer previews are often the start of the track, not a mixable section.
- The embedding measures timbre and style. It does not know the room, the crowd, or where a track sits in a set.
- Next step: score the ranker against 305 real DJ sets from Rekordbox history, and see how often a track that was actually played next lands in the top 10.

## Credits and licenses

- Embeddings use Essentia and the Discogs-EffNet model from the Music Technology Group at Universitat Pompeu Fabra. The Essentia models are [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). That license is non-commercial: keep NextTrack non-commercial unless the model terms change.
- Short previews and track links come from the [Deezer API](https://developers.deezer.com/). The site does not redistribute audio.
- Camelot key and BPM come from the owner's Rekordbox export. The music itself is not part of this repository.
- `rekordbox-pdb` is [fragmede/rekordbox-pdb](https://github.com/fragmede/rekordbox-pdb).
