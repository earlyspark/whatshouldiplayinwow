"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { questions, QUIZ_VERSION, type QuizOption } from "@/data/questions";
import QuizBanner from "@/components/QuizBanner";
import { trackEvent } from "@/lib/gtag";

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
  const progressRef = useRef({ started: false, index: 0, completed: false });

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

  useEffect(() => {
    progressRef.current = { ...progressRef.current, started, index };
  }, [index, started]);

  // Report where someone stopped. pagehide is used over beforeunload because
  // mobile browsers frequently skip beforeunload when backgrounding a tab.
  useEffect(() => {
    const reportAbandonment = () => {
      const { started: begun, index: step, completed } = progressRef.current;
      if (!begun || completed) return;
      trackEvent("quiz_abandon", {
        step_number: step + 1,
        question_id: questions[step].id,
        questions_total: questions.length,
      });
    };
    window.addEventListener("pagehide", reportAbandonment);
    return () => window.removeEventListener("pagehide", reportAbandonment);
  }, []);

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
    trackEvent("quiz_question_complete", {
      question_id: question.id,
      step_number: index + 1,
      choice_count: selected.length,
    });

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
      if (!response.ok || !body.id) {
        trackEvent("quiz_submit_error", {
          status: response.status,
          rate_limited: response.status === 429,
        });
        throw new Error(body.error ?? "Unable to create your result.");
      }
      progressRef.current = { ...progressRef.current, completed: true };
      trackEvent("quiz_complete", { result_id: body.id });
      sessionStorage.removeItem(storageKey);
      router.push(`/result/${body.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create your result.");
      setSubmitting(false);
    }
  };

  const start = () => {
    setStarted(true);
    trackEvent("quiz_start", { quiz_version: QUIZ_VERSION });
  };

  if (!started) {
    return (
      <section id="quiz" className="flex w-full justify-center" aria-label="Start the WoW Forever race and class quiz">
        <button onClick={start} className="btn focus-ring">Start the quiz</button>
      </section>
    );
  }

  return (
    <section id="quiz" className="w-full" aria-label="WoW Forever race and class quiz">
      <div className="t-label mb-3 flex items-center justify-between text-[var(--dim)]">
        <span>Question {index + 1} of {questions.length}</span>
        <span>{Math.round(((index + 1) / questions.length) * 100)}%</span>
      </div>
      <div className="mb-8 h-[3px] bg-[var(--line)]" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1}>
        <motion.div className="h-full bg-gradient-to-r from-[var(--plum)] to-[var(--bronze)]" animate={{ width: `${((index + 1) / questions.length) * 100}%` }} transition={{ duration: reduceMotion ? 0 : 0.35 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: reduceMotion ? 0 : 0.24 }}
          className="surface p-6 sm:p-9"
        >
          <p className="t-label text-[var(--bronze)]">{question.eyebrow}</p>
          <h2 ref={headingRef} tabIndex={-1} className="t-question mt-3 outline-none">{question.prompt}</h2>
          {question.helper && <p className="t-small mt-3 text-[var(--dim)]">{question.helper}</p>}

          {question.type === "ranked" && selected.length > 0 && (
            <div className="inset mt-6 p-4" aria-label="Your current ranking">
              <p className="t-label mb-3 text-[var(--dim)]">Your ranking</p>
              <ol className="space-y-2">
                {selected.map((id, rank) => {
                  const option = availableOptions.find((item) => item.id === id);
                  if (!option) return null;
                  return (
                    <li key={id} className="flex min-h-11 items-center gap-3 bg-[var(--raised)] px-3 py-2">
                      <span className="t-label w-8 text-[var(--bronze)]">{rankLabel(rank)}</span>
                      <span className="t-small min-w-0 flex-1">{option.label}</span>
                      <button type="button" onClick={() => moveRank(id, -1)} disabled={rank === 0} className="focus-ring cursor-pointer p-2 text-[var(--dim)] hover:text-[var(--bone)] disabled:cursor-not-allowed disabled:opacity-25" aria-label={`Move ${option.label} up`}>↑</button>
                      <button type="button" onClick={() => moveRank(id, 1)} disabled={rank === selected.length - 1} className="focus-ring cursor-pointer p-2 text-[var(--dim)] hover:text-[var(--bone)] disabled:cursor-not-allowed disabled:opacity-25" aria-label={`Move ${option.label} down`}>↓</button>
                      <button type="button" onClick={() => setSelection(option)} className="focus-ring cursor-pointer p-2 text-lg leading-none text-[var(--dim)] hover:text-[var(--bone)]" aria-label={`Remove ${option.label}`}>×</button>
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
                  className={`focus-ring flex min-h-14 cursor-pointer items-center gap-4 border px-4 py-3 text-left transition ${active ? "border-[var(--bronze)] bg-[rgba(200,150,74,.1)]" : "border-[var(--line)] bg-[var(--raised)] hover:border-[var(--bronze-dim)]"} disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  <span className={`t-label flex h-7 w-7 shrink-0 items-center justify-center border tracking-normal ${active ? "border-[var(--bronze)] bg-[var(--bronze)] text-[#1d1608]" : "border-[var(--line)] text-[var(--dim)]"}`}>
                    {active ? (question.type === "ranked" ? rank + 1 : "✓") : ""}
                  </span>
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    {option.description && <span className="t-small mt-0.5 block text-[var(--dim)]">{option.description}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex items-center justify-between gap-4">
            <button type="button" onClick={() => index === 0 ? setStarted(false) : setIndex((value) => value - 1)} className="btn-quiet focus-ring">← Back</button>
            <button type="button" onClick={continueQuiz} disabled={!selected.length || submitting} className="btn focus-ring">
              {submitting ? "Finding your match…" : index === questions.length - 1 ? "Reveal my pick" : "Continue"}
            </button>
          </div>
          {error && <p role="alert" className="t-small mt-5 text-[var(--warn)]">{error}</p>}
        </motion.div>
      </AnimatePresence>
      <QuizBanner questionIndex={index} />
    </section>
  );
}
