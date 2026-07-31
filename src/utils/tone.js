const TONE_COLORS = {
  1: "text-red-600 font-semibold",
  2: "text-amber-600 font-semibold",
  3: "text-green-600 font-semibold",
  4: "text-blue-600 font-semibold",
  5: "text-gray-500",
};

export function renderToneColorHTML(rawPinyin, markedPinyin) {
  if (!rawPinyin || !markedPinyin) return "";

  // Tách rawPinyin (từ gốc trong từ điển CC-CEDICT luôn có dấu cách giữa các âm tiết: "zhen3 duan4")
  const rawWords = rawPinyin.split(/\s+/).filter(Boolean);
  let rawIndex = 0;

  // Tách cụm pinyin hiển thị theo khoảng trắng (tách các từ hoặc dấu phân cách)
  const tokens = markedPinyin.split(" ");

  return tokens
    .map((token) => {
      // Nếu là dấu phân cách (/ : ： ...) thì giữ nguyên không tô màu
      if (/^[/:：,，;；\s]+$/.test(token)) {
        return token;
      }

      // Regex tách một cụm Pinyin liền nhau thành các âm tiết đơn (dựa theo nguyên âm/phụ âm tiếng Trung)
      // Giúp tách "zhěnduàn" -> ["zhěn", "duàn"] để tô màu từng âm tiết
      const syllableRegex = /([bcdfghjklmnpqrstwxyz]*(?:[a-eio-uǖ-ǜ]+[nrmg]*|r)(?:ng|n)?)/gi;
      const syllables = token.match(syllableRegex) || [token];

      return syllables
        .map((syl) => {
          const raw = rawWords[rawIndex] || "";
          rawIndex++;
          const toneMatch = raw.match(/[1-5]$/);
          const tone = toneMatch ? toneMatch[0] : "5";
          const colorClass = TONE_COLORS[tone] || TONE_COLORS[5];

          return `<span class="${colorClass}">${syl}</span>`;
        })
        .join(""); // Các âm tiết trong cùng 1 từ dính liền nhau (không có dấu cách)
    })
    .join(" "); // Các từ khác nhau hoặc dấu phân cách cách nhau bởi dấu cách
}