"use client";

import { useEffect } from "react";

export default function ResultCompletion({ id }: { id: string }) {
  useEffect(() => {
    const key = `wow-forever-completion:${id}`;
    const receipt = sessionStorage.getItem(key);
    if (!receipt) return;
    const controller = new AbortController();
    fetch(`/api/results/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receipt }),
      signal: controller.signal,
    }).then((response) => {
      if (response.ok) sessionStorage.removeItem(key);
    }).catch(() => { /* Keep the receipt so a reload can retry. */ });
    return () => controller.abort();
  }, [id]);

  return null;
}
