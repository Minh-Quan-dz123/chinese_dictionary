// src/utils/gameParser.js

export function parseGameData(tableData) {
  const questions = [];

  if (!tableData || !Array.isArray(tableData)) return questions;

  tableData.forEach((row, index) => {
    // 1. Tương thích cả dữ liệu Object mới (row.zh) và mảng cũ (row[0])
    const chineseText = row.zh !== undefined ? row.zh : row[0];
    const meaningText = row.vi !== undefined ? row.vi : row[2];

    if (!chineseText || typeof chineseText !== "string") return;

    let promptText = "";
    let targetAnswer = "";

    // KỊCH BẢN A: Người dùng gõ theo format cũ "CâuHỏi : ĐápÁn1 / ĐápÁn2" ở cột 1
    if (chineseText.includes(":") || chineseText.includes("：")) {
      // Chuẩn hóa dấu hai chấm và TẤT CẢ các loại dấu ngăn cách (/, ,, ., 、) thành dấu /
      const normalized = chineseText
        .replace(/[：]/g, ":")
        .replace(/[／、,，.。]/g, "/");

      const parts = normalized.split(":");
      if (parts.length >= 2) {
        promptText = parts[0].trim();
        const rawAnswer = parts.slice(1).join(":").trim();
        // Cắt theo dấu / và lấy đáp án đầu tiên
        targetAnswer = rawAnswer.split("/")[0].trim();
      }
    } 
    // KỊCH BẢN B (Chuẩn mới): Lấy Cột 1 làm Câu hỏi, Cột 3 (Nghĩa) làm Đáp án
    else if (meaningText && typeof meaningText === "string") {
      promptText = chineseText.trim();
      
      // Biểu thức chính quy (Regex) này sẽ cắt chuỗi mỗi khi gặp dấu "/", ",", ".", "，", "。"
      // Đồng thời tự dọn dẹp khoảng trắng thừa ở 2 đầu (\s*)
      const options = meaningText.split(/\s*[\/,\.，。]\s*/);
      
      // Chỉ lấy ý nghĩa đầu tiên làm đáp án đúng cho Game
      targetAnswer = options[0].trim();
    }

    // Đẩy vào mảng câu hỏi nếu lấy được cả câu hỏi lẫn đáp án
    if (promptText && targetAnswer) {
      questions.push({
        id: row.id || index, // Lấy ID ngầm của từ vựng nếu có
        prompt: promptText,
        answer: targetAnswer,
      });
    }
  });

  return questions;
}