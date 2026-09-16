"use client";

import { useEffect } from "react";
import Script from "next/script";

type WowheadWindow = Window & {
  $WowheadPower?: { refreshLinks: (force?: boolean) => void };
};

function refreshWowheadLinks() {
  (window as WowheadWindow).$WowheadPower?.refreshLinks();
}

export default function WowheadTooltips({ resultId }: { resultId: string }) {
  useEffect(refreshWowheadLinks, [resultId]);

  return (
    <>
      <Script id="wowhead-tooltip-config" strategy="afterInteractive">
        {`window.whTooltips = { colorLinks: true, iconizeLinks: true, renameLinks: true };`}
      </Script>
      <Script src="https://wow.zamimg.com/js/tooltips.js" strategy="afterInteractive" onReady={refreshWowheadLinks} />
    </>
  );
}
