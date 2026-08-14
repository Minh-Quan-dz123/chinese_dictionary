// Khởi tạo dữ liệu mặc định nếu người dùng mới vào web lần đầu
const DEFAULT_DB = {
  topics: [{ id: "t_default", name: "Chưa phân loại" }],
  words: []
};

// Lấy dữ liệu từ bộ nhớ
export function getDB() {
  const data = localStorage.getItem("vocab_master_db");
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Lỗi parse DB", e);
    }
  }
  return DEFAULT_DB;
}

// Lưu dữ liệu vào bộ nhớ
export function saveDB(data) {
  localStorage.setItem("vocab_master_db", JSON.stringify(data));
}

// Hàm tạo ID ngẫu nhiên không trùng lặp
export function generateId(prefix) {
  return prefix + "_" + Date.now() + Math.random().toString(36).substr(2, 5);
}