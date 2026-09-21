"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type AdPlacement } from "@/lib/gtag";

interface CreatorVideoLinkProps {
  href: string;
  itemId: string;
  placement: AdPlacement;
  title: string;
  videoBase: string;
}

export default function CreatorVideoLink({ href, itemId, placement, title, videoBase }: CreatorVideoLinkProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // React sets muted as a property after mount, so assert it before play() or
    // the autoplay policy rejects the promise.
    video.muted = true;
    const play = () => { void video.play().catch(() => {}); };
    play();
    video.addEventListener("canplay", play);
    return () => video.removeEventListener("canplay", play);
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("ad_click", {
        placement,
        destination_host: "etsy.com",
        item_id: itemId,
        creative_type: "video",
      })}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      className="focus-ring group flex min-w-0 flex-col gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[.04]"
    >
      <video
        ref={videoRef}
        // muted + playsInline are required or mobile Safari refuses inline playback.
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={`${videoBase}-poster.webp`}
        aria-hidden="true"
        className="mx-auto aspect-[3/4] w-full max-w-[11rem] rounded-lg bg-white/90 object-contain p-2"
      >
        <source src={`${videoBase}.webm`} type="video/webm" />
        <source src={`${videoBase}.mp4`} type="video/mp4" />
      </video>
      <span className="t-small line-clamp-3 text-[var(--dim)] group-hover:text-[var(--bone)]">{title}</span>
    </a>
  );
}
