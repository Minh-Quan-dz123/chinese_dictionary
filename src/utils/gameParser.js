// src/utils/gameParser.js

export function parseGameData(tableData) {
  const questions = [];

  if (!tableData || !Array.isArray(tableData)) return questions;

  tableData.forEach((row, index) => {
    // Cột 0 là cột Chinese (Giản thể)
    const rawText = row[0];
    if (!rawText || typeof rawText !== "string") return;

    // 1. Chuẩn hóa tất cả các loại dấu : và / (cả nửa chiều rộng lẫn toàn chiều rộng tiếng Trung)
    const normalized = rawText
      .replace(/[：]/g, ":")
      .replace(/[／、]/g, "/");

    // 2. Tách từ chính và cụm từ phụ theo dấu ":"
    const parts = normalized.split(":");
    if (parts.length >= 2) {
      const promptText = parts[0].trim();
      // Gộp lại phòng trường hợp user gõ nhiều dấu : trong đáp án
      const targetAnswer = parts.slice(1).join(":").trim();

      if (promptText && targetAnswer) {
        questions.push({
          id: index,
          prompt: promptText,
          answer: targetAnswer,
        });
      }
    }
  });

  return questions;
}