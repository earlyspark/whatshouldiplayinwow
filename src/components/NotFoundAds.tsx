"use client";

import QuizBanner, { useQuizProductPool } from "@/components/QuizBanner";

export default function NotFoundAds() {
  const productPool = useQuizProductPool();
  return <QuizBanner questionIndex={-1} count={8} {...productPool} />;
}
