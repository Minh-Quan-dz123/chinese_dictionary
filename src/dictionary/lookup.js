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

  // 2. Longest Match cho câu dài hoặc cụm từ ghép
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
      // Kiểm tra nếu ký tự này là dấu câu (/, :, ：, ...) thì đệm khoảng trắng cho đẹp
      if (/[/:：,，;；]/.test(char)) {
        pinyinParts.push(` ${char} `);
      } else if (/\s/.test(char)) {
        pinyinParts.push(" ");
      } else {
        pinyinParts.push(char);
      }
      index++;
    }
  }

  if (pinyinParts.length === 0) return null;

  // Nối các phần lại, sau đó dọn dẹp các khoảng trắng bị lặp/thừa
  const formattedPinyin = pinyinParts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    pinyin: formattedPinyin,
  };
}