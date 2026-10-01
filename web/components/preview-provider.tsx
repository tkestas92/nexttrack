"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Phase = "idle" | "loading" | "playing" | "paused" | "error";

type PreviewContextValue = {
  activeId: number | null;
  phase: Phase;
  error: string | null;
  toggle: (id: number) => void;
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestId = useRef(0);
  const loadedId = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback(
    (next: Phase, id: number | null, message: string | null = null) => {
      phaseRef.current = next;
      setPhase(next);
      setActiveId(id);
      setError(message);
    },
    [],
  );

  const toggle = useCallback(
    (id: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (loadedId.current === id && phaseRef.current === "playing") {
        audio.pause();
        commit("paused", id);
        return;
      }

      if (loadedId.current === id && phaseRef.current === "paused") {
        void audio.play().then(
          () => commit("playing", id),
          () => commit("error", id, "Preview unavailable"),
        );
        return;
      }

      const request = ++requestId.current;
      audio.pause();
      commit("loading", id);

      void (async () => {
        try {
          const response = await fetch(`/api/preview?id=${id}`);
          const body: { preview?: unknown } = await response.json().catch(() => ({}));
          if (request !== requestId.current) return;

          if (!response.ok || typeof body.preview !== "string") {
            commit("error", id, "Preview unavailable");
            return;
          }

          audio.src = body.preview;
          loadedId.current = id;
          await audio.play();
          if (request !== requestId.current) return;
          commit("playing", id);
        } catch {
          if (request !== requestId.current) return;
          commit("error", id, "Preview unavailable");
        }
      })();
    },
    [commit],
  );

  return (
    <PreviewContext.Provider value={{ activeId, phase, error, toggle }}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        className="sr-only"
        onEnded={() => {
          loadedId.current = null;
          commit("idle", null);
        }}
      />
    </PreviewContext.Provider>
  );
}

export function usePreview(): PreviewContextValue {
  const value = useContext(PreviewContext);
  if (!value) {
    throw new Error("Preview controls must sit inside the player.");
  }
  return value;
}
