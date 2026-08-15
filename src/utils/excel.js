import * as XLSX from "xlsx";

export function exportExcel(data, topicName) {
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
  
  // Xử lý tên file động
  const safeName = topicName ? topicName.replace(/[<>:"/\\|?*]+/g, "") : "TuVung";
  XLSX.writeFile(workbook, `${safeName}.xlsx`);
}

export function importExcel(file, onCompleted) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (!jsonData || jsonData.length < 2) return;

    const headers = jsonData[0].map(h => (h || "").toString().toLowerCase());

    let zhIdx = headers.findIndex(h => h.includes("trung") || h.includes("chinese") || h.includes("zh") || h.includes("hán"));
    let pyIdx = headers.findIndex(h => h.includes("phiên âm") || h.includes("phien am") || h.includes("pinyin") || h.includes("py"));
    let viIdx = headers.findIndex(h => h.includes("nghĩa") || h.includes("nghia") || h.includes("tiếng việt") || h.includes("tieng viet") || h.includes("vi"));
    let topicIdx = headers.findIndex(h => h.includes("chủ đề") || h.includes("chu de") || h.includes("topic"));

    if (zhIdx === -1 && pyIdx === -1 && viIdx === -1) {
      if (headers.length === 4) {
        zhIdx = 0; pyIdx = 1; viIdx = 2; topicIdx = 3;
      } else if (headers.length >= 2) {
        const hasSTT = headers[0].includes("stt");
        zhIdx = hasSTT ? 1 : 0;
        pyIdx = hasSTT ? 2 : 1;
        viIdx = hasSTT ? 3 : 2;
      }
    }

    const formattedData = jsonData
      .slice(1)
      .filter((row) => row.some((cell) => cell !== "" && cell !== undefined))
      .map((row) => ({
        zh: zhIdx !== -1 && row[zhIdx] ? String(row[zhIdx]) : "",
        py: pyIdx !== -1 && row[pyIdx] ? String(row[pyIdx]) : "",
        vi: viIdx !== -1 && row[viIdx] ? String(row[viIdx]) : "",
        topicName: topicIdx !== -1 && row[topicIdx] ? String(row[topicIdx]) : "",
      }));

    if (onCompleted && formattedData.length > 0) {
      onCompleted(formattedData);
    }
  };

  reader.readAsArrayBuffer(file);
}