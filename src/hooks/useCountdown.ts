import { useEffect, useMemo, useState } from "react";

export interface Countdown {
  isActive: boolean;
  label: string;
  msRemaining: number;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function useCountdown(targetIso?: string | null): Countdown {
  const targetMs = useMemo(() => {
    if (!targetIso) return null;
    const ms = new Date(targetIso).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [targetIso]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetMs) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (!targetMs) {
    return { isActive: false, label: "", msRemaining: 0 };
  }

  const msRemaining = Math.max(0, targetMs - now);
  const isActive = msRemaining > 0;

  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const label = days > 0
    ? `${days}d ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
    : `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;

  return { isActive, label, msRemaining };
}
