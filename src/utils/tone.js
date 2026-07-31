const TONE_COLORS = {
  1: "text-red-600 font-semibold",
  2: "text-amber-600 font-semibold",
  3: "text-green-600 font-semibold",
  4: "text-blue-600 font-semibold",
  5: "text-gray-500",
};

export function renderToneColorHTML(rawPinyin, markedPinyin) {
  if (!rawPinyin || !markedPinyin) return "";

  const rawWords = rawPinyin.split(" ");
  const markedWords = markedPinyin.split(" ");

  return markedWords
    .map((word, idx) => {
      const raw = rawWords[idx] || "";
      const toneMatch = raw.match(/[1-5]$/);
      const tone = toneMatch ? toneMatch[0] : "5";
      const colorClass = TONE_COLORS[tone] || TONE_COLORS[5];

      return `<span class="${colorClass}">${word}</span>`;
    })
    .join(" ");
}