"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { track } from "@vercel/analytics";
import { questions, QUIZ_VERSION, type QuizOption } from "@/data/questions";

type Answers = Record<string, string[]>;

const storageKey = `wow-forever-quiz:${QUIZ_VERSION}`;

function rankLabel(index: number) {
  return ["1st", "2nd", "3rd"][index] ?? `${index + 1}th`;
}

export default function QuizFlow() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const saved = JSON.parse(raw) as { started?: boolean; index?: number; answers?: Answers };
          setStarted(Boolean(saved.started));
          setIndex(Math.min(Math.max(saved.index ?? 0, 0), questions.length - 1));
          setAnswers(saved.answers ?? {});
        }
      } catch { /* Ignore an unreadable draft. */ }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(storageKey, JSON.stringify({ started, index, answers }));
  }, [answers, hydrated, index, started]);

  useEffect(() => {
    if (started) headingRef.current?.focus();
  }, [index, started]);

  const question = questions[index];
  const selected = answers[question.id] ?? [];
  const faction = answers.q2?.[0];
  const availableOptions = useMemo(() => {
    if (question.id !== "q11" || (faction !== "alliance" && faction !== "horde")) return question.options;
    return question.options.filter((option) => !option.factions || option.factions.includes(faction));
  }, [faction, question]);

  const setSelection = (option: QuizOption) => {
    setError("");
    setAnswers((previous) => {
      const current = previous[question.id] ?? [];
      let next: string[];
      if (question.type === "single") {
        next = [option.id];
      } else if (current.includes(option.id)) {
        next = current.filter((id) => id !== option.id);
      } else if (current.length < 3) {
        next = [...current, option.id];
      } else {
        return previous;
      }

      const updated = { ...previous, [question.id]: next };
      if (question.id === "q2") {
        const selectedFaction = next[0];
        const validRaceIds = new Set(
          questions[10].options
            .filter((item) => !item.factions || selectedFaction === "either" || item.factions.includes(selectedFaction as "alliance" | "horde"))
            .map((item) => item.id),
        );
        if (updated.q11) updated.q11 = updated.q11.filter((id) => validRaceIds.has(id));
      }
      return updated;
    });
  };

  const moveRank = (optionId: string, direction: -1 | 1) => {
    setAnswers((previous) => {
      const list = [...(previous[question.id] ?? [])];
      const from = list.indexOf(optionId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= list.length) return previous;
      [list[from], list[to]] = [list[to], list[from]];
      return { ...previous, [question.id]: list };
    });
  };

  const continueQuiz = async () => {
    if (!selected.length) {
      setError("Choose at least one answer to continue.");
      return;
    }
    track("quiz_question_completed", { question: question.id, choices: selected.length });
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const body = await response.json();
      if (!response.ok || !body.id) throw new Error(body.error ?? "Unable to create your result.");
      track("quiz_result_created");
      sessionStorage.removeItem(storageKey);
      router.push(`/result/${body.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create your result.");
      setSubmitting(false);
    }
  };

  const start = () => {
    setStarted(true);
    track("quiz_started");
  };

  if (!started) {
    return (
      <section id="quiz" className="glass-panel mx-auto max-w-3xl rounded-[2rem] px-5 py-8 text-center sm:px-10 sm:py-12" aria-labelledby="quiz-start-title">
        <p className="eyebrow">12 questions · about 3 minutes</p>
        <h2 id="quiz-start-title" className="display-font mt-4 text-3xl sm:text-4xl">Find the character that feels like yours.</h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-[var(--muted)]">Rank what matters, follow your instincts, and get one clear recommendation with two close alternatives.</p>
        <button onClick={start} className="focus-ring mt-8 min-h-12 cursor-pointer rounded-full bg-[var(--gold)] px-8 py-3 font-bold text-[#172022] transition hover:bg-[var(--gold-bright)]">
          Start the quiz
        </button>
      </section>
    );
  }

  return (
    <section id="quiz" className="mx-auto max-w-3xl" aria-label="WoW Forever race and class quiz">
      <div className="mb-5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
        <span>Question {index + 1} of {questions.length}</span>
        <span>{Math.round(((index + 1) / questions.length) * 100)}%</span>
      </div>
      <div className="mb-7 h-1.5 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1}>
        <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--teal)] to-[var(--gold)]" animate={{ width: `${((index + 1) / questions.length) * 100}%` }} transition={{ duration: reduceMotion ? 0 : 0.35 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: reduceMotion ? 0 : 0.24 }}
          className="glass-panel rounded-[2rem] p-5 sm:p-9"
        >
          <p className="eyebrow">{question.eyebrow}</p>
          <h2 ref={headingRef} tabIndex={-1} className="display-font mt-3 text-3xl leading-tight outline-none sm:text-4xl">{question.prompt}</h2>
          {question.helper && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{question.helper}</p>}

          {question.type === "ranked" && selected.length > 0 && (
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-black/15 p-3" aria-label="Your current ranking">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Your ranking</p>
              <ol className="space-y-2">
                {selected.map((id, rank) => {
                  const option = availableOptions.find((item) => item.id === id);
                  if (!option) return null;
                  return (
                    <li key={id} className="flex min-h-11 items-center gap-3 rounded-xl bg-white/6 px-3 py-2">
                      <span className="w-8 text-sm font-bold text-[var(--gold-bright)]">{rankLabel(rank)}</span>
                      <span className="min-w-0 flex-1 text-sm">{option.label}</span>
                      <button type="button" onClick={() => moveRank(id, -1)} disabled={rank === 0} className="focus-ring cursor-pointer rounded p-2 text-sm disabled:cursor-not-allowed disabled:opacity-25" aria-label={`Move ${option.label} up`}>↑</button>
                      <button type="button" onClick={() => moveRank(id, 1)} disabled={rank === selected.length - 1} className="focus-ring cursor-pointer rounded p-2 text-sm disabled:cursor-not-allowed disabled:opacity-25" aria-label={`Move ${option.label} down`}>↓</button>
                      <button type="button" onClick={() => setSelection(option)} className="focus-ring cursor-pointer rounded p-2 text-lg text-[var(--muted)]" aria-label={`Remove ${option.label}`}>×</button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="mt-6 grid gap-3">
            {availableOptions.map((option) => {
              const rank = selected.indexOf(option.id);
              const active = rank >= 0;
              const disabled = question.type === "ranked" && selected.length >= 3 && !active;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelection(option)}
                  aria-pressed={active}
                  className={`focus-ring flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 text-left transition ${active ? "border-[var(--gold)] bg-[rgba(215,173,97,.12)]" : "border-[var(--line)] bg-white/[.025] hover:border-[rgba(100,189,186,.55)] hover:bg-white/[.05]"} disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold ${active ? "border-[var(--gold)] bg-[var(--gold)] text-[#172022]" : "border-white/20 text-[var(--muted)]"}`}>
                    {active ? (question.type === "ranked" ? rank + 1 : "✓") : ""}
                  </span>
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    {option.description && <span className="mt-0.5 block text-sm leading-5 text-[var(--muted)]">{option.description}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex items-center justify-between gap-4">
            <button type="button" onClick={() => index === 0 ? setStarted(false) : setIndex((value) => value - 1)} className="focus-ring min-h-12 cursor-pointer rounded-full px-4 text-sm font-bold text-[var(--muted)] hover:text-white">← Back</button>
            <button type="button" onClick={continueQuiz} disabled={!selected.length || submitting} className="focus-ring min-h-12 cursor-pointer rounded-full bg-[var(--gold)] px-6 py-3 font-bold text-[#172022] transition hover:bg-[var(--gold-bright)] disabled:cursor-not-allowed disabled:opacity-40">
              {submitting ? "Finding your match…" : index === questions.length - 1 ? "Reveal my pick" : "Continue"}
            </button>
          </div>
          {error && <p role="alert" className="mt-4 text-center text-sm text-[#ff9b82]">{error}</p>}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
