import { describe, it, expect } from "vitest";
import {
  calculateLettersScore,
  calculateNumbersScore,
  calculateConundrumScore,
  mergeScores,
  keepBestSubmission,
  type Submission,
  type BestComparable,
} from "@/lib/game/scoring";

describe("calculateLettersScore", () => {
  it("returns empty object for empty submissions", () => {
    expect(calculateLettersScore([])).toEqual({});
  });

  it("scores a single valid submission by word length", () => {
    const submissions: Submission[] = [
      { peerId: "alice", word: "example", valid: true, length: 7 },
    ];
    expect(calculateLettersScore(submissions)).toEqual({ alice: 7 });
  });

  it("scores multiple submissions with different lengths", () => {
    const submissions: Submission[] = [
      { peerId: "alice", word: "cat", valid: true, length: 3 },
      { peerId: "bob", word: "elephant", valid: true, length: 8 },
      { peerId: "carol", word: "a", valid: true, length: 1 },
    ];
    expect(calculateLettersScore(submissions)).toEqual({
      alice: 3,
      bob: 8,
      carol: 1,
    });
  });

  it("gives 0 points for an invalid submission", () => {
    const submissions: Submission[] = [
      { peerId: "alice", word: "zzzzz", valid: false, length: 5 },
    ];
    expect(calculateLettersScore(submissions)).toEqual({ alice: 0 });
  });

  it("scores mixed valid and invalid submissions correctly", () => {
    const submissions: Submission[] = [
      { peerId: "alice", word: "valid", valid: true, length: 5 },
      { peerId: "bob", word: "nope", valid: false, length: 4 },
      { peerId: "carol", word: "longword", valid: true, length: 8 },
    ];
    expect(calculateLettersScore(submissions)).toEqual({
      alice: 5,
      bob: 0,
      carol: 8,
    });
  });

  it("gives 0 when length is missing even if valid", () => {
    const submissions: Submission[] = [
      { peerId: "alice", word: "hi", valid: true },
    ];
    expect(calculateLettersScore(submissions)).toEqual({ alice: 0 });
  });
});

describe("calculateNumbersScore", () => {
  it("returns empty object for empty submissions", () => {
    expect(calculateNumbersScore([])).toEqual({});
  });

  it("gives 10 points for an exact match (diff=0)", () => {
    const submissions: Submission[] = [
      { peerId: "alice", result: 100, diff: 0 },
    ];
    expect(calculateNumbersScore(submissions)).toEqual({ alice: 10 });
  });

  it("gives 7 points when diff is 3", () => {
    const submissions: Submission[] = [
      { peerId: "alice", result: 97, diff: 3 },
    ];
    expect(calculateNumbersScore(submissions)).toEqual({ alice: 7 });
  });

  it("gives 5 points when diff is 8", () => {
    const submissions: Submission[] = [
      { peerId: "alice", result: 92, diff: 8 },
    ];
    expect(calculateNumbersScore(submissions)).toEqual({ alice: 5 });
  });

  it("gives 0 points when diff is 20", () => {
    const submissions: Submission[] = [
      { peerId: "alice", result: 80, diff: 20 },
    ];
    expect(calculateNumbersScore(submissions)).toEqual({ alice: 0 });
  });

  it("gives 7 points at the upper boundary of the 1-5 range (diff=1, diff=5)", () => {
    const submissions: Submission[] = [
      { peerId: "a", result: 99, diff: 1 },
      { peerId: "b", result: 95, diff: 5 },
    ];
    expect(calculateNumbersScore(submissions)).toEqual({ a: 7, b: 7 });
  });

  it("gives 5 points at the boundaries of the 6-10 range (diff=6, diff=10)", () => {
    const submissions: Submission[] = [
      { peerId: "a", result: 94, diff: 6 },
      { peerId: "b", result: 90, diff: 10 },
    ];
    expect(calculateNumbersScore(submissions)).toEqual({ a: 5, b: 5 });
  });

  it("scores multiple submissions with different diffs", () => {
    const submissions: Submission[] = [
      { peerId: "alice", result: 100, diff: 0 },
      { peerId: "bob", result: 97, diff: 3 },
      { peerId: "carol", result: 92, diff: 8 },
      { peerId: "dave", result: 80, diff: 20 },
    ];
    expect(calculateNumbersScore(submissions)).toEqual({
      alice: 10,
      bob: 7,
      carol: 5,
      dave: 0,
    });
  });

  it("gives 0 when diff is undefined", () => {
    const submissions: Submission[] = [
      { peerId: "alice", result: null },
    ];
    expect(calculateNumbersScore(submissions)).toEqual({ alice: 0 });
  });
});

describe("calculateConundrumScore", () => {
  it("gives 10 to the winner and 0 to others", () => {
    const scores = calculateConundrumScore("alice", ["alice", "bob", "carol"]);
    expect(scores).toEqual({ alice: 10, bob: 0, carol: 0 });
  });

  it("gives 0 to everyone when winnerPeerId is null", () => {
    const scores = calculateConundrumScore(null, ["alice", "bob"]);
    expect(scores).toEqual({ alice: 0, bob: 0 });
  });

  it("gives 10 to the winner among multiple players", () => {
    const scores = calculateConundrumScore("carol", [
      "alice",
      "bob",
      "carol",
      "dave",
    ]);
    expect(scores).toEqual({ alice: 0, bob: 0, carol: 10, dave: 0 });
  });

  it("gives 10 when a single player is the winner", () => {
    const scores = calculateConundrumScore("alice", ["alice"]);
    expect(scores).toEqual({ alice: 10 });
  });

  it("gives 0 when there is a single player but no winner", () => {
    const scores = calculateConundrumScore(null, ["alice"]);
    expect(scores).toEqual({ alice: 0 });
  });

  it("returns empty object when allPeerIds is empty", () => {
    const scores = calculateConundrumScore("alice", []);
    expect(scores).toEqual({});
  });
});

describe("mergeScores", () => {
  it("returns empty object when both existing and round are empty", () => {
    expect(mergeScores({}, {})).toEqual({});
  });

  it("returns existing scores unchanged when round is empty", () => {
    expect(mergeScores({ alice: 10, bob: 5 }, {})).toEqual({
      alice: 10,
      bob: 5,
    });
  });

  it("returns round scores when existing is empty", () => {
    expect(mergeScores({}, { alice: 7, bob: 3 })).toEqual({
      alice: 7,
      bob: 3,
    });
  });

  it("sums scores from round into existing", () => {
    const existing = { alice: 10, bob: 5 };
    const round = { alice: 7, bob: 3 };
    expect(mergeScores(existing, round)).toEqual({ alice: 17, bob: 8 });
  });

  it("adds a new peerId from round not in existing", () => {
    const existing = { alice: 10 };
    const round = { bob: 7 };
    expect(mergeScores(existing, round)).toEqual({ alice: 10, bob: 7 });
  });

  it("leaves existing peerId unchanged when not in round", () => {
    const existing = { alice: 10, bob: 5 };
    const round = { alice: 3 };
    expect(mergeScores(existing, round)).toEqual({ alice: 13, bob: 5 });
  });

  it("merges correctly across multiple operations", () => {
    let scores = mergeScores({}, { alice: 10, bob: 7 });
    scores = mergeScores(scores, { bob: 3, carol: 5 });
    scores = mergeScores(scores, { alice: 7, carol: 5, dave: 10 });
    expect(scores).toEqual({ alice: 17, bob: 10, carol: 10, dave: 10 });
  });

  it("does not mutate the existing object", () => {
    const existing = { alice: 10 };
    const round = { alice: 5 };
    const result = mergeScores(existing, round);
    expect(existing).toEqual({ alice: 10 });
    expect(result).toEqual({ alice: 15 });
  });
});

describe("keepBestSubmission", () => {
  it("stores the submission when the store is empty", () => {
    const store = new Map<string, BestComparable>();
    const sub: BestComparable = { peerId: "alice", diff: 3, result: 97, submittedAt: 100 };
    keepBestSubmission(store, sub);
    expect(store.get("alice")).toEqual(sub);
  });

  it("keeps the more accurate numbers submission when a worse one arrives later", () => {
    const store = new Map<string, BestComparable>();
    keepBestSubmission(store, { peerId: "alice", diff: 3, result: 97, submittedAt: 100 });
    keepBestSubmission(store, { peerId: "alice", diff: 1, result: 99, submittedAt: 200 });
    keepBestSubmission(store, { peerId: "alice", diff: 5, result: 95, submittedAt: 300 });
    expect(store.get("alice")).toMatchObject({ diff: 1, result: 99 });
  });

  it("does not replace an exact match with a worse later submission", () => {
    const store = new Map<string, BestComparable>();
    keepBestSubmission(store, { peerId: "alice", diff: 0, result: 100, submittedAt: 100 });
    keepBestSubmission(store, { peerId: "alice", diff: 7, result: 93, submittedAt: 200 });
    expect(store.get("alice")).toMatchObject({ diff: 0, result: 100 });
  });

  it("keeps the longer word when a shorter one arrives later", () => {
    const store = new Map<string, BestComparable>();
    keepBestSubmission(store, { peerId: "bob", length: 4, submittedAt: 100 });
    keepBestSubmission(store, { peerId: "bob", length: 7, submittedAt: 200 });
    keepBestSubmission(store, { peerId: "bob", length: 3, submittedAt: 300 });
    expect(store.get("bob")).toMatchObject({ length: 7 });
  });

  it("keeps the earliest when diffs are equal", () => {
    const store = new Map<string, BestComparable>();
    keepBestSubmission(store, { peerId: "alice", diff: 2, result: 98, submittedAt: 100 });
    keepBestSubmission(store, { peerId: "alice", diff: 2, result: 98, submittedAt: 200 });
    expect(store.get("alice")).toMatchObject({ submittedAt: 100 });
  });

  it("tracks different players independently", () => {
    const store = new Map<string, BestComparable>();
    keepBestSubmission(store, { peerId: "alice", diff: 1, result: 99, submittedAt: 100 });
    keepBestSubmission(store, { peerId: "bob", diff: 5, result: 95, submittedAt: 100 });
    keepBestSubmission(store, { peerId: "alice", diff: 9, result: 91, submittedAt: 200 });
    expect(store.get("alice")).toMatchObject({ diff: 1 });
    expect(store.get("bob")).toMatchObject({ diff: 5 });
  });

  it("prefers a real result over a null result at equal diff", () => {
    const store = new Map<string, BestComparable>();
    keepBestSubmission(store, { peerId: "alice", diff: 2, result: null, submittedAt: 100 });
    keepBestSubmission(store, { peerId: "alice", diff: 2, result: 98, submittedAt: 200 });
    expect(store.get("alice")).toMatchObject({ result: 98 });
  });
});
