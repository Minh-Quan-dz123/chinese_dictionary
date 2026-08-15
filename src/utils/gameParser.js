export function parseGameData(tableData) {
  const questions = [];

  if (!tableData || !Array.isArray(tableData)) return questions;

  tableData.forEach((row, index) => {
    const chineseText = row.zh !== undefined ? row.zh : row[0];
    const pinyinText = row.py !== undefined ? row.py : row[1]; // Lấy Pinyin
    const meaningText = row.vi !== undefined ? row.vi : row[2]; // Lấy toàn bộ nghĩa

    if (!chineseText || typeof chineseText !== "string") return;

    let promptText = "";
    let targetAnswer = "";

    // Kịch bản A: Format cũ có dấu ":" 
    if (chineseText.includes(":") || chineseText.includes("：")) {
      const normalized = chineseText
        .replace(/[：]/g, ":")
        .replace(/[／、,，.。]/g, "/");

      const parts = normalized.split(":");
      if (parts.length >= 2) {
        promptText = parts[0].trim();
        const rawAnswer = parts.slice(1).join(":").trim();
        targetAnswer = rawAnswer.split("/")[0].trim();
      }
    } 
    // Kịch bản B: Chuẩn mới (cột Tiếng Trung riêng, Nghĩa riêng)
    else if (meaningText && typeof meaningText === "string") {
      promptText = chineseText.trim();
      
      // Tách lấy nghĩa đầu tiên làm đáp án để chơi game
      const options = meaningText.split(/\s*[\/,\.，。;；]\s*/);
      targetAnswer = options[0].trim();
    }

    if (promptText && targetAnswer) {
      questions.push({
        id: row.id || index,
        prompt: promptText,
        answer: targetAnswer,
        pinyin: pinyinText || "",             // 🚀 Bổ sung mang Pinyin vào Game
        fullMeaning: meaningText || targetAnswer // 🚀 Bổ sung mang Toàn bộ nghĩa vào Game
      });
    }
  });

  return questions;
}