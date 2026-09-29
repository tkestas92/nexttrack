"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { trackLabel } from "@/lib/format";
import type { Track } from "@/lib/types";

type Item = {
  index: number;
  label: string;
  haystack: string;
};

const LIMIT = 50;
const TRY_COUNT = 12;
const TRY_KEYS = ["8A", "1B", "5A", "10B", "3A", "7B", "12A", "4B", "9A", "2B", "6A", "11B"];

function bpmBand(bpm: number | null): string {
  if (bpm == null) return "unknown";
  if (bpm < 100) return "slow";
  if (bpm < 118) return "mid";
  if (bpm < 128) return "house";
  return "fast";
}

function pickTryThese(tracks: Track[], items: Item[]): Item[] {
  const byIndex = new Map(items.map((item) => [item.index, item]));
  const used = new Set<number>();
  const usedGenre = new Set<string>();
  const usedBand = new Set<string>();
  const picked: Item[] = [];

  function take(index: number) {
    const item = byIndex.get(index);
    const track = tracks[index];
    if (!item || !track) return;
    used.add(index);
    const genre = track.genre.trim();
    if (genre) usedGenre.add(genre);
    usedBand.add(bpmBand(track.bpm));
    picked.push(item);
  }

  for (const key of TRY_KEYS) {
    if (picked.length === TRY_COUNT) break;
    let best = -1;
    let bestScore = -1;
    for (let index = 0; index < tracks.length; index += 1) {
      const track = tracks[index];
      if (track.camelot !== key || used.has(index) || typeof track.deezer !== "number") continue;
      const genre = track.genre.trim();
      let score = 0;
      if (genre && !usedGenre.has(genre)) score += 2;
      if (!usedBand.has(bpmBand(track.bpm))) score += 1;
      if (score > bestScore) {
        best = index;
        bestScore = score;
      }
    }
    if (best >= 0) take(best);
  }

  if (picked.length < TRY_COUNT) {
    const step = Math.max(1, Math.floor(tracks.length / TRY_COUNT));
    for (let start = 0; picked.length < TRY_COUNT && start < tracks.length; start += 1) {
      const index = (start * step) % tracks.length;
      const track = tracks[index];
      if (used.has(index) || typeof track.deezer !== "number" || !byIndex.has(index)) continue;
      take(index);
    }
  }

  return picked;
}

export function TrackSearch({
  tracks,
  selected,
  onSelect,
}: {
  tracks: Track[];
  selected: number | null;
  onSelect: (index: number) => void;
}) {
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [activeQuery, setActiveQuery] = useState("");

  const items = useMemo<Item[]>(() => {
    return tracks
      .map((track, index) => {
        const label = trackLabel(track);
        return { index, label, haystack: label.toLocaleLowerCase() };
      })
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  }, [tracks]);

  const selectedLabel = selected == null ? "" : trackLabel(tracks[selected]);
  const shown = editing ? draft : selectedLabel;
  const query = editing ? draft.trim().toLocaleLowerCase() : "";

  const { results, matchCount, suggestions } = useMemo(() => {
    if (!query) {
      const suggested = pickTryThese(tracks, items);
      return { results: suggested, matchCount: suggested.length, suggestions: true };
    }
    const matches: Item[] = [];
    let total = 0;
    for (const item of items) {
      if (!item.haystack.includes(query)) continue;
      total += 1;
      if (matches.length < LIMIT) matches.push(item);
    }
    return { results: matches, matchCount: total, suggestions: false };
  }, [items, query, tracks]);

  if (query !== activeQuery) {
    setActiveQuery(query);
    setActive(0);
  }

  useEffect(() => {
    const list = listRef.current;
    if (!list || !open) return;
    const option = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!option) return;
    const listRect = list.getBoundingClientRect();
    const optionRect = option.getBoundingClientRect();
    const follower = option.nextElementSibling;
    const followBottom =
      follower instanceof HTMLElement && follower.getAttribute("role") !== "option"
        ? follower.getBoundingClientRect().bottom
        : optionRect.bottom;
    if (optionRect.top < listRect.top) {
      list.scrollTop -= listRect.top - optionRect.top;
    } else if (followBottom > listRect.bottom) {
      list.scrollTop += followBottom - listRect.bottom;
    }
  }, [active, open, results]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(item: Item) {
    onSelect(item.index);
    setEditing(false);
    setDraft("");
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      if (results.length === 0) return;
      setActive((current) => Math.min(current + (open ? 1 : 0), results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(Math.max(results.length - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = results[active];
      if (open && item) choose(item);
      else setOpen(true);
    } else if (event.key === "Escape") {
      setOpen(false);
      setEditing(false);
      setDraft("");
    }
  }

  const activeId =
    open && results[active] ? `${listId}-${results[active].index}` : undefined;

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor="track-search" className="mb-2 block text-sm text-muted">
        Track
      </label>
      <input
        id="track-search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        spellCheck={false}
        placeholder="Search artist or title"
        value={shown}
        onChange={(event) => {
          setEditing(true);
          setDraft(event.target.value);
          setOpen(true);
        }}
        onFocus={(event) => {
          setOpen(true);
          event.currentTarget.select();
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-line bg-panel-2 px-4 py-3 text-base text-cream outline-none placeholder:text-muted/70"
      />
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Tracks"
          className="absolute z-20 mt-2 max-h-[60vh] w-full overflow-y-auto rounded-lg border border-line bg-panel py-1 shadow-2xl shadow-black/40"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">No tracks match that search.</li>
          ) : (
            <>
              {suggestions ? (
                <li className="px-4 pt-2 pb-1 text-sm text-muted">Try these</li>
              ) : null}
              {results.map((item, index) => {
                const isActive = index === active;
                return (
                  <li
                    key={item.index}
                    id={`${listId}-${item.index}`}
                    role="option"
                    aria-selected={item.index === selected}
                    data-active={isActive ? "true" : "false"}
                    onMouseEnter={() => setActive(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(item)}
                    className={`cursor-pointer px-4 py-2.5 text-sm break-words ${
                      isActive ? "bg-gold text-gold-ink" : "text-cream"
                    }`}
                  >
                    {item.label}
                  </li>
                );
              })}
              {matchCount > results.length ? (
                <li className="px-4 py-2.5 text-sm text-muted">
                  Showing {results.length} of {matchCount} matches - keep typing to narrow down
                </li>
              ) : null}
            </>
          )}
        </ul>
      ) : null}
    </div>
  );
}
