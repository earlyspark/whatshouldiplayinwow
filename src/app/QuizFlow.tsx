"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { questions, QUIZ_VERSION, type QuizOption } from "@/data/questions";
import QuizBanner, { useQuizProductPool } from "@/components/QuizBanner";
import AdSenseUnit from "@/components/AdSenseUnit";
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
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const returnToStartRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const advanceLockRef = useRef(false);
  const progressRef = useRef({ started: false, index: 0, completed: false });
  const productPool = useQuizProductPool();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const saved = JSON.parse(raw) as { started?: boolean; index?: number; answers?: Answers };
          setStarted(Boolean(saved.started));
          setIndex(typeof saved.index === "number" && Number.isInteger(saved.index)
            ? Math.min(Math.max(saved.index, 0), questions.length - 1)
            : 0);
          setAnswers(saved.answers ?? {});
        }
      } catch {}
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ started, index, answers })); }
    catch {}
  }, [answers, hydrated, index, started]);

  useEffect(() => {
    if (!started && returnToStartRef.current) {
      startButtonRef.current?.focus();
      returnToStartRef.current = false;
    }
  }, [started]);

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
  const maxRank = question.maxRank ?? 3;
  const selected = answers[question.id] ?? [];
  const availableOptions = question.options;

  const setSelection = (option: QuizOption) => {
    setError("");
    const oldRank = selected.indexOf(option.id);
    const replacesQ12Selection = question.id === "q12" && (option.id === "none" || selected.includes("none"));
    if (question.type === "ranked") {
      if (oldRank >= 0) {
        setAnnouncement(`${option.label} removed from your ranking.`);
        window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-option-id="${option.id}"]`)?.focus());
      } else if (selected.length < maxRank || replacesQ12Selection) {
        setAnnouncement(`${option.label} ranked ${rankLabel(replacesQ12Selection ? 0 : selected.length)}.`);
      }
    }
    setAnswers((previous) => {
      const current = previous[question.id] ?? [];
      let next: string[];
      if (question.type === "single") {
        next = [option.id];
      } else if (current.includes(option.id)) {
        next = current.filter((id) => id !== option.id);
      } else if (question.id === "q12" && (option.id === "none" || current.includes("none"))) {
        next = [option.id];
      } else if (current.length < maxRank) {
        next = [...current, option.id];
      } else {
        return previous;
      }

      return { ...previous, [question.id]: next };
    });
  };

  const moveRank = (optionId: string, direction: -1 | 1) => {
    const from = selected.indexOf(optionId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= selected.length) return;
    const option = availableOptions.find((item) => item.id === optionId);
    setAnnouncement(`${option?.label ?? optionId} moved to ${rankLabel(to)}.`);
    setAnswers((previous) => {
      const list = [...(previous[question.id] ?? [])];
      const from = list.indexOf(optionId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= list.length) return previous;
      [list[from], list[to]] = [list[to], list[from]];
      return { ...previous, [question.id]: list };
    });
    const nextDirection = to === 0 ? 1 : to === selected.length - 1 ? -1 : direction;
    window.requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(`[data-rank-control="${optionId}:${nextDirection}"]`)?.focus(),
    );
  };

  const continueQuiz = async () => {
    if (advanceLockRef.current) return;
    if (!selected.length) {
      setError("Choose at least one answer to continue.");
      return;
    }
    advanceLockRef.current = true;
    setAdvancing(true);
    trackEvent("quiz_question_complete", {
      question_id: question.id,
      step_number: index + 1,
      choice_count: selected.length,
    });

    if (index < questions.length - 1) {
      setIndex(index + 1);
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
      if (!response.ok || !body.id || !body.receipt) {
        trackEvent("quiz_submit_error", {
          status: response.status,
          rate_limited: response.status === 429,
        });
        throw new Error(body.error ?? "Unable to create your result.");
      }
      progressRef.current = { ...progressRef.current, completed: true };
      trackEvent("quiz_complete");
      try {
        sessionStorage.setItem(`wow-forever-completion:${body.id}`, body.receipt);
        sessionStorage.setItem(`wow-forever-feedback:${body.id}`, body.receipt);
        sessionStorage.removeItem(storageKey);
      } catch {}
      router.push(`/result/${body.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create your result.");
      setSubmitting(false);
      advanceLockRef.current = false;
      setAdvancing(false);
    }
  };

  const start = () => {
    advanceLockRef.current = false;
    setAdvancing(false);
    setStarted(true);
    trackEvent("quiz_start", { quiz_version: QUIZ_VERSION });
  };

  const goBack = () => {
    if (advanceLockRef.current || submitting) return;
    if (index === 0) {
      returnToStartRef.current = true;
      setStarted(false);
      return;
    }
    advanceLockRef.current = true;
    setAdvancing(true);
    setIndex((value) => Math.max(0, value - 1));
  };

  const restartQuiz = () => {
    if (advanceLockRef.current || submitting) return;
    progressRef.current = { started: true, index: 0, completed: false };
    setIndex(0);
    setAnswers({});
    setError("");
    setAnnouncement("");
    try { sessionStorage.setItem(storageKey, JSON.stringify({ started: true, index: 0, answers: {} })); }
    catch {}
    if (index === 0) headingRef.current?.focus();
  };

  if (!started) {
    return (
      <section id="quiz" className="w-full" aria-label="Start the WoW Forever race and class quiz">
        <div className="mb-8 flex justify-center"><button ref={startButtonRef} onClick={start} className="btn focus-ring">Start the quiz</button></div>
        <QuizBanner questionIndex={-1} {...productPool} />
        <AdSenseUnit viewport="desktop" />
      </section>
    );
  }

  return (
    <section id="quiz" className="w-full" aria-label="WoW Forever race and class quiz">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="lg:hidden">
        <QuizBanner questionIndex={index} layout="sidebar" {...productPool} />
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
      <div className="t-label mb-1 text-[var(--dim)]">Question {index + 1} of {questions.length}</div>
      <div className="mb-8 flex items-center gap-3">
        <div className="h-[3px] min-w-0 flex-1 bg-[var(--line)]" role="progressbar" aria-label="Quiz progress" aria-valuetext={`Question ${index + 1} of ${questions.length}`} aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={index + 1}>
          <motion.div className="h-full bg-gradient-to-r from-[var(--plum)] to-[var(--bronze)]" animate={{ width: `${((index + 1) / questions.length) * 100}%` }} transition={{ duration: reduceMotion ? 0 : 0.35 }} />
        </div>
        <span className="t-label shrink-0 text-[var(--dim)]">{Math.round(((index + 1) / questions.length) * 100)}%</span>
        <button type="button" onClick={restartQuiz} disabled={advancing || submitting} aria-label="Restart quiz and clear all answers" title="Restart quiz" className="focus-ring flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-[var(--control-line)] text-[var(--dim)] transition hover:border-[var(--bronze)] hover:text-[var(--bone)] disabled:cursor-not-allowed disabled:opacity-35">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      <AnimatePresence mode="wait" onExitComplete={() => {
        advanceLockRef.current = false;
        setAdvancing(false);
      }}>
        <motion.div
          key={question.id}
          variants={{ entering: reduceMotion ? { opacity: 0 } : { opacity: 0, x: 32 }, visible: { opacity: 1, x: 0 }, leaving: reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 } }}
          initial="entering"
          animate="visible"
          exit="leaving"
          onAnimationComplete={(phase) => { if (phase === "visible") headingRef.current?.focus(); }}
          transition={{ duration: reduceMotion ? 0 : 0.24 }}
          className="surface p-6 sm:p-9"
        >
          <h2 ref={headingRef} tabIndex={-1} className="t-question outline-none">{question.prompt}</h2>

          <div className="mt-6 grid gap-3">
            {availableOptions.map((option) => {
              const rank = selected.indexOf(option.id);
              const active = rank >= 0;
              const canReplaceQ12Selection = question.id === "q12" && (option.id === "none" || selected.includes("none"));
              const disabled = question.type === "ranked" && selected.length >= maxRank && !active && !canReplaceQ12Selection;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-option-id={option.id}
                  disabled={disabled}
                  onClick={() => setSelection(option)}
                  aria-pressed={active}
                  aria-label={`${option.label}${question.type === "ranked" && active ? `, ranked ${rankLabel(rank)}` : ""}${disabled ? `, ranking limit of ${maxRank} reached` : ""}`}
                  aria-describedby={disabled ? "rank-limit" : undefined}
                  className={`focus-ring flex min-h-14 cursor-pointer items-center gap-4 border px-4 py-3 text-left transition ${active ? "border-[var(--bronze)] bg-[rgba(200,150,74,.1)]" : "border-[var(--control-line)] bg-[var(--raised)] hover:border-[var(--bronze)]"} disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  <span className={`t-label flex h-7 w-7 shrink-0 items-center justify-center border tracking-normal ${active ? "border-[var(--bronze)] bg-[var(--bronze)] text-[#1d1608]" : "border-[var(--control-line)] text-[var(--dim)]"}`}>
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

          {question.type === "ranked" && selected.length >= maxRank && (
            <p id="rank-limit" className="t-small mt-6 text-[var(--dim)]">You can rank up to {maxRank}. Remove a choice to pick another{question.id === "q12" ? ", or select “None of these” to clear your ranking" : ""}.</p>
          )}
          {question.type === "ranked" && selected.length > 0 && (
            <div className={`inset p-4 ${selected.length >= maxRank ? "mt-3" : "mt-6"}`} role="group" aria-label="Your current ranking">
              <p className="t-label mb-3 text-[var(--dim)]">Your ranking</p>
              <ol className="space-y-2">
                {selected.map((id, rank) => {
                  const option = availableOptions.find((item) => item.id === id);
                  if (!option) return null;
                  return (
                    <li key={id} className="flex min-h-11 items-center gap-3 bg-[var(--raised)] px-3 py-2">
                      <span className="t-label w-8 text-[var(--bronze)]">{rankLabel(rank)}</span>
                      <span className="t-small min-w-0 flex-1">{option.label}</span>
                      <button type="button" data-rank-control={`${id}:-1`} onClick={() => moveRank(id, -1)} disabled={rank === 0} className="focus-ring cursor-pointer p-2 text-[var(--dim)] hover:text-[var(--bone)] disabled:cursor-not-allowed disabled:opacity-25" aria-label={`Move ${option.label} up from ${rankLabel(rank)}`}>↑</button>
                      <button type="button" data-rank-control={`${id}:1`} onClick={() => moveRank(id, 1)} disabled={rank === selected.length - 1} className="focus-ring cursor-pointer p-2 text-[var(--dim)] hover:text-[var(--bone)] disabled:cursor-not-allowed disabled:opacity-25" aria-label={`Move ${option.label} down from ${rankLabel(rank)}`}>↓</button>
                      <button type="button" onClick={() => setSelection(option)} className="focus-ring cursor-pointer p-2 text-lg leading-none text-[var(--dim)] hover:text-[var(--bone)]" aria-label={`Remove ${option.label}`}>×</button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between gap-4">
            <button type="button" onClick={goBack} disabled={advancing || submitting} className="btn-quiet focus-ring">← Back</button>
            <button type="button" onClick={continueQuiz} disabled={advancing || submitting} className="btn focus-ring">
              {submitting ? "Finding your match…" : index === questions.length - 1 ? "Reveal my pick" : "Continue"}
            </button>
          </div>
          {error && <p role="alert" className="t-small mt-5 text-[var(--warn)]">{error}</p>}
        </motion.div>
      </AnimatePresence>
      </div>
      <div className="hidden lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:block">
        <QuizBanner questionIndex={index} layout="sidebar" {...productPool} />
        <AdSenseUnit viewport="desktop" />
      </div>
      </div>
    </section>
  );
}
