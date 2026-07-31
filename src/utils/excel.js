import * as XLSX from "xlsx";

export function exportExcel(data) {
  // Bỏ cột STT trong tiêu đề file Excel
  const headers = [["Chinese", "Pinyin", "Meaning"]];
  
  const rows = data.map((row) => [
    row[0] || "",
    row[1] || "",
    row[2] || "",
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

    // Bỏ dòng Header nếu có và format lại đủ 3 cột
    const formattedData = jsonData
      .slice(1)
      .filter((row) => row.some((cell) => cell !== "" && cell !== undefined))
      .map((row) => [
        row[0] ? String(row[0]) : "",
        row[1] ? String(row[1]) : "",
        row[2] ? String(row[2]) : "",
      ]);

    if (onCompleted && formattedData.length > 0) {
      onCompleted(formattedData);
    }
  };

  reader.readAsArrayBuffer(file);
}