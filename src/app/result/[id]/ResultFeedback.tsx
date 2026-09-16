"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { emptyResultVotes, type FeedbackPosition, type FeedbackVote, type ResultVotes } from "@/lib/feedback-types";

interface FeedbackContextValue {
  receipt: string | null;
  votes: ResultVotes;
  loading: boolean;
  loadError: boolean;
  pending: FeedbackPosition | null;
  messages: Partial<Record<FeedbackPosition, string>>;
  rate: (position: FeedbackPosition, vote: FeedbackVote) => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function ResultFeedbackProvider({ id, children }: { id: string; children: ReactNode }) {
  const [receipt, setReceipt] = useState<string | null>(null);
  const [votes, setVotes] = useState<ResultVotes>(emptyResultVotes);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState<FeedbackPosition | null>(null);
  const [messages, setMessages] = useState<Partial<Record<FeedbackPosition, string>>>({});

  useEffect(() => {
    const controller = new AbortController();
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(`wow-forever-feedback:${id}`); }
    catch { /* Session storage is optional; shared pages still render. */ }
    if (!saved) {
      const frame = requestAnimationFrame(() => setLoading(false));
      return () => { controller.abort(); cancelAnimationFrame(frame); };
    }
    const creatorReceipt = saved;
    const frame = requestAnimationFrame(() => setReceipt(creatorReceipt));
    fetch(`/api/results/${id}/feedback`, {
      headers: { Authorization: `Bearer ${creatorReceipt}` },
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        try { sessionStorage.removeItem(`wow-forever-feedback:${id}`); } catch { /* Ignore. */ }
        setReceipt(null);
        return;
      }
      if (!response.ok) throw new Error("Unable to load ratings.");
      const data = await response.json() as { votes: ResultVotes };
      setVotes(data.votes);
    }).catch((error) => {
      if (error?.name !== "AbortError") setLoadError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => { controller.abort(); cancelAnimationFrame(frame); };
  }, [id]);

  const rate = async (position: FeedbackPosition, vote: FeedbackVote) => {
    if (!receipt || loading || loadError || pending || votes[position] === vote) return;
    setPending(position);
    setMessages((current) => ({ ...current, [position]: "" }));
    try {
      const response = await fetch(`/api/results/${id}/feedback`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${receipt}` },
        body: JSON.stringify({ position, vote }),
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          try { sessionStorage.removeItem(`wow-forever-feedback:${id}`); } catch { /* Ignore. */ }
          setReceipt(null);
          return;
        }
        throw new Error(response.status === 429 ? "Too many rating changes. Try again later." : "Could not save your rating. Please try again.");
      }
      setVotes((current) => ({ ...current, [position]: vote }));
    } catch (error) {
      setMessages((current) => ({ ...current, [position]: error instanceof Error ? error.message : "Could not save your rating. Please try again." }));
    } finally {
      setPending(null);
    }
  };

  return (
    <FeedbackContext.Provider value={{ receipt, votes, loading, loadError, pending, messages, rate }}>
      {children}
    </FeedbackContext.Provider>
  );
}

function ThumbIcon({ down }: { down: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={down ? "rotate-180" : undefined}>
      <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Z" />
      <path d="M7 10 11 3a2 2 0 0 1 3.7 1.5L14 8h5.1a3 3 0 0 1 2.9 3.7l-1.8 7A3 3 0 0 1 17.3 21H7" />
    </svg>
  );
}

export function ResultFeedback({ position, name }: { position: FeedbackPosition; name: string }) {
  const context = useContext(FeedbackContext);
  if (!context?.receipt) return null;
  const { votes, loading, loadError, pending, messages, rate } = context;
  const errorMessage = loadError ? "Ratings are unavailable right now. Refresh to try again." : messages[position];
  return (
    <div className="mt-6 border-t border-[var(--line)] pt-5" role="group" aria-label={`Rate ${name}`}>
      <p className="t-small text-[var(--dim)]">
        Was this a good match?
        {errorMessage && <span role="status" aria-live="polite" className="ml-2 text-[var(--warn)]">{errorMessage}</span>}
      </p>
      <div className="mt-2 flex gap-2">
        {(["up", "down"] as const).map((vote) => (
          <button
            key={vote}
            type="button"
            aria-label={`${vote === "up" ? "Like" : "Dislike"} ${name}`}
            aria-pressed={votes[position] === vote}
            disabled={loading || loadError || pending !== null}
            onClick={() => void rate(position, vote)}
            className={`focus-ring flex min-h-11 min-w-11 cursor-pointer items-center justify-center border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${votes[position] === vote ? "border-[var(--bronze)] bg-[rgba(200,150,74,.15)] text-[var(--bronze)]" : "border-[var(--control-line)] text-[var(--dim)] hover:border-[var(--bronze)] hover:text-[var(--bone)]"}`}
          >
            <ThumbIcon down={vote === "down"} />
          </button>
        ))}
      </div>
    </div>
  );
}
