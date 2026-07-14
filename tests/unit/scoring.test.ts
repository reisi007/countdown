import { describe, it, expect } from "vitest";
import {
  calculateLettersScore,
  calculateNumbersScore,
  calculateConundrumScore,
  mergeScores,
  type Submission,
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
