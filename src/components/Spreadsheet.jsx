import { useRef, useState, useCallback } from "react";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";

import Toolbar from "./Toolbar";
import { exportExcel, importExcel } from "../utils/excel";
import { lookup } from "../dictionary/lookup";
import { renderToneColorHTML } from "../utils/tone";
import dictionary from "../dictionary/dictionary";
import GameModal from "./GameModal";
import { parseGameData } from "../utils/gameParser";

registerAllModules();

function Spreadsheet() {
  const hotRef = useRef(null);

  // Xóa cột STT -> Mỗi dòng giờ chỉ còn 3 phần tử: [Chinese, Pinyin, Meaning]
  function createRows(count = 20) {
    return Array.from({ length: count }, () => ["", "", ""]);
  }

  const [tableData, setTableData] = useState(createRows());

  function addRow(count = 10) {
    setTableData((old) => {
      const newRows = Array.from({ length: count }, () => ["", "", ""]);
      return [...old, ...newRows];
    });
  }

  function deleteRow() {
    setTableData((old) => {
      if (old.length <= 1) return old;
      return old.slice(0, -1);
    });
  }

  function undo() {
    hotRef.current?.hotInstance?.undo();
  }

  function redo() {
    hotRef.current?.hotInstance?.redo();
  }

  function handleExport() {
    const hot = hotRef.current?.hotInstance;
    exportExcel(hot ? hot.getData() : tableData);
  }

  function handleImport(file) {
    importExcel(file, (newData) => {
      setTableData(newData);
    });
  }

  // Hook xử lý khi người dùng gõ/paste vào bảng
  const handleAfterChange = useCallback((changes, source) => {
    if (!changes || source === "loadData" || source === "dictionaryAutoFill")
      return;

    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const updates = [];

    changes.forEach(([row, col, oldVal, newVal]) => {
      // Index cột 0 là "Chinese (Giản thể)"
      if (col === 0 && newVal !== oldVal) {
        if (!newVal || String(newVal).trim() === "") {
          updates.push([row, 1, ""]); // Xóa Pinyin (cột 1) khi xóa chữ Hán
        } else {
          const result = lookup(String(newVal));
          if (result) {
            updates.push([row, 1, result.pinyin]); // Chỉ tự động cập nhật Pinyin (cột 1)
          }
        }
      }
    });

    if (updates.length > 0) {
      hot.setDataAtCell(updates, "dictionaryAutoFill");
    }
  }, []);

  // Renderer cho Pinyin (Tô màu theo thanh điệu bằng HTML)
  function pinyinHTMLRenderer(instance, td, row, col, prop, value, cellProperties) {
    td.innerHTML = "";
    // Lấy chữ Hán ở cột 0
    const chineseWord = instance.getDataAtCell(row, 0);
    const rawEntry = dictionary.get(String(chineseWord).trim());

    if (value && rawEntry && rawEntry.p) {
      td.innerHTML = renderToneColorHTML(rawEntry.p, value);
    } else {
      td.innerText = value || "";
    }
    td.className = "htCenter htMiddle";
    return td;
  }

  // 2. Thêm state quản lý Game Modal & Danh sách câu hỏi
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [gameQuestions, setGameQuestions] = useState([]);

  // 3. Hàm kích hoạt nút Play Game
  function handleOpenGame() {
    const hot = hotRef.current?.hotInstance;
    
    // Bắt buộc bỏ chọn ô hiện tại để Handsontable LƯU NGAY chữ mày vừa gõ
    if (hot) {
      hot.deselectCell();
    }

    // Lấy dữ liệu mới nhất sau khi đã lưu ô
    const currentData = hot ? hot.getData() : tableData;
    const questions = parseGameData(currentData);

    if (questions.length === 0) {
      alert("Không tìm thấy từ vựng hợp lệ! Hãy kiểm tra xem bạn đã gõ đúng dạng A：B/C/D ở cột Chinese chưa.");
      return;
    }

    setGameQuestions(questions);
    setIsGameOpen(true);
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <Toolbar
        addRow={addRow}
        deleteRow={deleteRow}
        undo={undo}
        redo={redo}
        exportExcel={handleExport}
        importExcel={handleImport}
        onPlayGame={handleOpenGame} // <-- 4. Truyền prop xuống Toolbar
      />

      <div className="border border-gray-300 rounded overflow-hidden">
        <HotTable
          ref={hotRef}
          data={tableData}
          colHeaders={["Chinese (Giản thể)", "Pinyin", "Nghĩa tiếng Việt"]}
          rowHeaders={true} // Vẫn giữ số thứ tự dòng mặc định của bảng
          width="100%"
          height="600"
          stretchH="all"
          contextMenu={true}
          copyPaste={true}
          manualRowResize={true}
          manualColumnResize={true}
          undo={true}
          afterChange={handleAfterChange}
          columns={[
            {
              type: "text",
              className: "htLarge font-medium text-lg htMiddle",
              width: 160,
            },
            {
              renderer: pinyinHTMLRenderer,
              width: 200,
            },
            {
              type: "text",
              className: "htMiddle",
              width: 350,
            },
          ]}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>

      {/* 5. Hiển thị GameModal khi bật */}
      {isGameOpen && (
        <GameModal
          questions={gameQuestions}
          onClose={() => setIsGameOpen(false)}
        />
      )}
    </div>
  );
}

export default Spreadsheet;