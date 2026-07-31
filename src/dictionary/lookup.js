import dictionary from "./dictionary";
import { convertNumberedToMarked } from "./pinyin";

export function lookup(text) {
  if (!text || typeof text !== "string") return null;
  const input = text.trim();
  if (!input) return null;

  // 1. Tìm chính xác 1 từ / cụm từ
  if (dictionary.has(input)) {
    const entry = dictionary.get(input);
    return {
      pinyin: convertNumberedToMarked(entry.p),
    };
  }

  // 2. Longest Match cho câu dài hoặc cụm từ ghép (Chỉ lấy Pinyin)
  let index = 0;
  const pinyinParts = [];

  while (index < input.length) {
    let matched = false;
    for (let len = Math.min(10, input.length - index); len > 0; len--) {
      const sub = input.substr(index, len);
      if (dictionary.has(sub)) {
        const entry = dictionary.get(sub);
        pinyinParts.push(convertNumberedToMarked(entry.p));
        index += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const char = input[index];
      pinyinParts.push(char);
      index++;
    }
  }

  if (pinyinParts.length === 0) return null;

  return {
    pinyin: pinyinParts.join(" "),
  };
}