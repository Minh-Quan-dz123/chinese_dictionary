const PINYIN_TONES = {
  a: ["ā", "á", "ǎ", "à", "a"],
  e: ["ē", "é", "ě", "è", "e"],
  i: ["ī", "í", "ǐ", "ì", "i"],
  o: ["ō", "ó", "ǒ", "ò", "o"],
  u: ["ū", "ú", "ǔ", "ù", "u"],
  v: ["ǖ", "ǘ", "ǚ", "ǜ", "ü"],
  u: ["ǖ", "ǘ", "ǚ", "ǜ", "ü"], // Cho trường hợp u: -> ü
};

export function convertNumberedToMarked(rawPinyin) {
  if (!rawPinyin) return "";
  
  return rawPinyin
    .split(" ")
    .map((syllable) => {
      const match = syllable.match(/([a-zA-Zv:]+)([1-5]?)/);
      if (!match) return syllable;

      let [, letters, toneStr] = match;
      const tone = toneStr ? parseInt(toneStr, 10) - 1 : 4;
      if (tone === 4 || tone < 0) return letters.replace(/v|u:/g, "ü");

      letters = letters.toLowerCase().replace(/v|u:/g, "v");

      // Quy tắc đặt dấu Pinyin: a -> o -> e -> i/u (chữ nào đứng sau)
      for (const vowel of ["a", "o", "e"]) {
        if (letters.includes(vowel)) {
          return letters.replace(vowel, PINYIN_TONES[vowel][tone]);
        }
      }
      if (letters.includes("iu")) {
        return letters.replace("u", PINYIN_TONES["u"][tone]);
      }
      if (letters.includes("ui")) {
        return letters.replace("i", PINYIN_TONES["i"][tone]);
      }
      for (const vowel of ["i", "u", "v"]) {
        if (letters.includes(vowel)) {
          return letters.replace(vowel, PINYIN_TONES[vowel][tone]);
        }
      }
      return letters;
    })
    .join(" ");
}