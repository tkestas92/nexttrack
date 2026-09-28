"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { trackLabel } from "@/lib/format";
import type { Track } from "@/lib/types";

type Item = {
  index: number;
  label: string;
  haystack: string;
};

const LIMIT = 40;

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

  const results = useMemo(() => {
    const matches: Item[] = [];
    for (const item of items) {
      if (!query || item.haystack.includes(query)) matches.push(item);
      if (matches.length === LIMIT) break;
    }
    return matches;
  }, [items, query]);

  if (query !== activeQuery) {
    setActiveQuery(query);
    setActive(0);
  }

  useEffect(() => {
    const list = listRef.current;
    if (!list || !open) return;
    const option = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!option) return;
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
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
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-line bg-panel py-1 shadow-2xl shadow-black/40"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">No tracks match that search.</li>
          ) : (
            results.map((item, index) => {
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
                  className={`cursor-pointer px-4 py-2.5 text-sm ${
                    isActive ? "bg-gold text-gold-ink" : "text-cream"
                  }`}
                >
                  {item.label}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
