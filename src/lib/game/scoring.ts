export type Submission = {
  peerId: string;
  word?: string;
  valid?: boolean;
  length?: number;
  result?: number | null;
  diff?: number;
};

export function calculateLettersScore(submissions: Submission[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const s of submissions) {
    scores[s.peerId] = s.valid && s.length ? s.length : 0;
  }
  return scores;
}

export function calculateNumbersScore(submissions: Submission[]): Record<string, number> {
  function diffPoints(diff: number): number {
    if (diff === 0) return 10;
    if (diff <= 5) return 7;
    if (diff <= 10) return 5;
    return 0;
  }
  const scores: Record<string, number> = {};
  for (const s of submissions) {
    scores[s.peerId] = s.diff !== undefined ? diffPoints(s.diff) : 0;
  }
  return scores;
}

export function calculateConundrumScore(winnerPeerId: string | null, allPeerIds: string[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const pid of allPeerIds) {
    scores[pid] = pid === winnerPeerId ? 10 : 0;
  }
  return scores;
}

export function mergeScores(existing: Record<string, number>, round: Record<string, number>): Record<string, number> {
  const merged = { ...existing };
  for (const [pid, points] of Object.entries(round)) {
    merged[pid] = (merged[pid] ?? 0) + points;
  }
  return merged;
}

export type BestComparable = {
  peerId: string;
  diff?: number;
  length?: number;
  result?: number | null;
  submittedAt: number;
};

export function isBetterSubmission(candidate: BestComparable, existing: BestComparable | undefined): boolean {
  if (!existing) return true;
  const candDiff = candidate.diff ?? Infinity;
  const existDiff = existing.diff ?? Infinity;
  if (candDiff !== existDiff) return candDiff < existDiff;
  const candLen = candidate.length ?? -Infinity;
  const existLen = existing.length ?? -Infinity;
  if (candLen !== existLen) return candLen > existLen;
  if (candidate.result !== existing.result) {
    return candidate.result !== null && existing.result === null;
  }
  return candidate.submittedAt < existing.submittedAt;
}

export function keepBestSubmission(
  store: Map<string, BestComparable>,
  submission: BestComparable,
): BestComparable {
  const existing = store.get(submission.peerId);
  const best = isBetterSubmission(submission, existing) ? submission : existing;
  if (!best) {
    store.set(submission.peerId, submission);
    return submission;
  }
  store.set(submission.peerId, best);
  return best;
}
