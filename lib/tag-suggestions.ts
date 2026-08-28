import type { Mood } from "@/lib/domain";

const tagSignals: Array<{ tag: string; words: string[] }> = [
  { tag: "outside", words: ["sun", "sunrise", "sunset", "tree", "trees", "sky", "park", "garden", "bird", "nature", "outside"] },
  { tag: "small win", words: ["finished", "done", "complete", "completed", "finally", "accomplished", "won", "victory"] },
  { tag: "slow morning", words: ["coffee", "tea", "morning", "woke", "window", "breakfast", "sunrise"] },
  { tag: "laughter", words: ["laugh", "laughed", "laughing", "funny", "joke", "giggle", "silly"] },
  { tag: "together", words: ["friend", "friends", "family", "together", "date", "dinner", "called", "talked", "we "] },
  { tag: "kindness", words: ["kind", "kindness", "help", "helped", "held", "thank", "smile", "stranger"] },
  { tag: "movement", words: ["run", "ran", "walk", "walked", "gym", "yoga", "hike", "dance", "danced"] },
  { tag: "cozy", words: ["warm", "cozy", "blanket", "rain", "book", "candle", "quiet"] },
  { tag: "food joy", words: ["coffee", "cake", "dinner", "lunch", "breakfast", "cooked", "food", "taste"] },
  { tag: "music", words: ["song", "music", "concert", "sang", "singing", "playlist"] },
  { tag: "creative spark", words: ["paint", "painted", "draw", "drew", "wrote", "write", "made", "built", "created"] },
  { tag: "rest", words: ["rest", "rested", "nap", "slept", "sleep", "pause", "slow"] },
];

const moodDefaults: Record<Mood, string[]> = {
  sunny: ["bright spot", "small joy"],
  peaceful: ["quiet joy", "slow moment"],
  proud: ["small win", "growth"],
  connected: ["together", "kindness"],
};

export function normalizeTag(value: string) {
  return value.trim().replace(/^#+/, "").trim().replace(/\s+/g, " ").toLowerCase().slice(0, 28);
}

export function getSuggestedTags(text: string, mood: Mood, limit = 5) {
  const source = ` ${text.toLowerCase()} `;
  const scored = tagSignals
    .map(({ tag, words }, order) => ({ tag, order, score: words.reduce((total, word) => total + (source.includes(word) ? 1 : 0), 0) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(({ tag }) => tag);

  return [...new Set([...scored, ...moodDefaults[mood]])].slice(0, limit);
}
