export type TrackPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    trackEvent?: (name: string, payload?: TrackPayload) => void;
  }
}

type QueuedEvent = { name: string; payload?: TrackPayload };

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function flush(): void {
  if (typeof window === "undefined") return;
  const fn = window.trackEvent;
  if (typeof fn !== "function") return;
  while (queue.length > 0) {
    const { name, payload } = queue.shift()!;
    try {
      fn(name, payload);
    } catch {
      // tracking must never break gameplay
    }
  }
  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = setInterval(flush, 300);
}

export function trackEvent(name: string, payload?: TrackPayload): void {
  if (typeof window === "undefined") return;
  queue.push({ name, payload });
  scheduleFlush();
  flush();
}
