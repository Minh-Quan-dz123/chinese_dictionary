import * as XLSX from "xlsx";

export function exportExcel(data) {
  // Thêm cột Chủ đề vào file xuất ra
  const headers = [["Chinese", "Pinyin", "Meaning", "Topic"]];
  
  const rows = data.map((row) => [
    row.zh || "",
    row.py || "",
    row.vi || "",
    row.topicName || ""
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Dictionary");
  XLSX.writeFile(workbook, "TuVungTiengTrung.xlsx");
}

export function importExcel(file, onCompleted) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read thành mảng 2 chiều
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Ép kiểu mảng 2 chiều về dạng Object để Handsontable đọc được
    const formattedData = jsonData
      .slice(1)
      .filter((row) => row.some((cell) => cell !== "" && cell !== undefined))
      .map((row) => ({
        zh: row[0] ? String(row[0]) : "",
        py: row[1] ? String(row[1]) : "",
        vi: row[2] ? String(row[2]) : "",
        topicName: row[3] ? String(row[3]) : "", // Load lại chủ đề nếu có
      }));

    if (onCompleted && formattedData.length > 0) {
      onCompleted(formattedData);
    }
  };

  reader.readAsArrayBuffer(file);
}