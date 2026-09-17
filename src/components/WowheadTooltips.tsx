"use client";

import { useEffect } from "react";

type WowheadWindow = Window & {
  $WowheadPower?: { refreshLinks: (force?: boolean) => void };
  whTooltips?: { colorLinks: boolean; iconizeLinks: boolean; renameLinks: boolean };
};

const SCRIPT_ID = "wowhead-tooltips-script";

export default function WowheadTooltips({ resultId }: { resultId: string }) {
  useEffect(() => {
    const wowheadWindow = window as WowheadWindow;
    wowheadWindow.whTooltips = { colorLinks: true, iconizeLinks: true, renameLinks: true };

    const refresh = () => wowheadWindow.$WowheadPower?.refreshLinks();
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://wow.zamimg.com/js/tooltips.js";
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", refresh);
    refresh();

    return () => script?.removeEventListener("load", refresh);
  }, [resultId]);

  return null;
}
