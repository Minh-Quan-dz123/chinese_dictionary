// src/store/db.js

export const DRAFT_TOPIC_ID = "t_draft";

const DEFAULT_DB = {
  topics: [{ id: DRAFT_TOPIC_ID, name: "Bản nháp (Chưa lưu)" }],
  words: []
};

export function getDB() {
  const data = localStorage.getItem("vocab_master_db");
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Đảm bảo luôn tồn tại chủ đề Bản nháp nếu lỡ bị xóa
      if (!parsed.topics.find(t => t.id === DRAFT_TOPIC_ID)) {
        parsed.topics.unshift({ id: DRAFT_TOPIC_ID, name: "Bản nháp (Chưa lưu)" });
      }
      return parsed;
    } catch (e) {
      console.error("Lỗi parse DB", e);
    }
  }
  return DEFAULT_DB;
}

export function saveDB(data) {
  localStorage.setItem("vocab_master_db", JSON.stringify(data));
}

export function generateId(prefix) {
  return prefix + "_" + Date.now() + Math.random().toString(36).substr(2, 5);
}