import { useRef, useState, useCallback, useMemo } from "react";
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

// =====================================================================
// ĐIỂM TỐI ƯU 1: CACHE TOÀN CỤC HTML
// Đưa cache ra ngoài component để nó sống suốt vòng đời app, ko bị reset
// =====================================================================
const pinyinCache = new Map();

function Spreadsheet() {
  const hotRef = useRef(null);

  function createRows(count = 20) {
    return Array.from({ length: count }, () => ["", "", ""]);
  }

  const [tableData, setTableData] = useState(createRows());
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [gameQuestions, setGameQuestions] = useState([]);

  function addRow(count = 10) {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      hot.alter('insert_row_below', hot.countRows(), count);
    }
  }

  function deleteRow() {
    const hot = hotRef.current?.hotInstance;
    if (hot && hot.countRows() > 1) {
      hot.alter('remove_row', hot.countRows() - 1, 1);
    }
  }

  function undo() { hotRef.current?.hotInstance?.undo(); }
  function redo() { hotRef.current?.hotInstance?.redo(); }

  function handleExport() {
    const hot = hotRef.current?.hotInstance;
    exportExcel(hot ? hot.getData() : tableData);
  }

  function handleImport(file) {
    importExcel(file, (newData) => {
      setTableData(newData);
    });
  }

  const handleAfterChange = useCallback((changes, source) => {
    if (!changes || source === "loadData" || source === "dictionaryAutoFill")
      return;

    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const updates = [];

    changes.forEach(([row, col, oldVal, newVal]) => {
      if (col === 0 && newVal !== oldVal) {
        if (!newVal || String(newVal).trim() === "") {
          updates.push([row, 1, ""]); 
        } else {
          const result = lookup(String(newVal));
          if (result) {
            updates.push([row, 1, result.pinyin]); 
          }
        }
      }
    });

    if (updates.length > 0) {
      hot.setDataAtCell(updates, "dictionaryAutoFill");
    }
  }, []);

  // =====================================================================
  // ĐIỂM TỐI ƯU 2: CƠ CHẾ MEMOIZE KHI RENDER Ô Pinyin
  // Hàm này bị gọi HÀNG NGÀN LẦN khi user cuộn chuột (scroll). Cấm dùng vòng lặp nặng ở đây!
  // =====================================================================
  const pinyinHTMLRenderer = useCallback((instance, td, row, col, prop, value, cellProperties) => {
    td.className = "htCenter htMiddle";
    
    if (!value) {
      td.innerHTML = "";
      return td;
    }

    const chineseWord = instance.getDataAtCell(row, 0);
    const cacheKey = `${chineseWord}_${value}`;

    // LẤY TỪ CACHE RA XÀI: Chặn đứng việc tính toán Regex lặp lại
    if (pinyinCache.has(cacheKey)) {
      td.innerHTML = pinyinCache.get(cacheKey);
      return td;
    }

    const rawEntry = dictionary.get(String(chineseWord).trim());
    let generatedHTML = value; 

    // Nếu từ điển đã load và có data, tiến hành tô màu và LƯU CACHE luôn
    if (rawEntry && rawEntry.p) {
      generatedHTML = renderToneColorHTML(rawEntry.p, value);
      pinyinCache.set(cacheKey, generatedHTML);
    } 
    
    td.innerHTML = generatedHTML;
    return td;
  }, []);

  function handleOpenGame() {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      hot.deselectCell();
    }

    const currentData = hot ? hot.getData() : tableData;
    const questions = parseGameData(currentData);

    if (questions.length === 0) {
      alert("Không tìm thấy từ vựng hợp lệ! Hãy kiểm tra xem bạn đã gõ đúng dạng A：B/C/D ở cột Chinese chưa.");
      return;
    }

    setGameQuestions(questions);
    setIsGameOpen(true);
  }

  // =====================================================================
  // ĐIỂM TỐI ƯU 3: ĐÓNG BĂNG OBJECT/ARRAY CONFIG BẰNG useMemo
  // Ngăn chặn React truyền instance mới xuống gây Re-render vòng lặp
  // =====================================================================
  const contextMenuSettings = useMemo(() => ({
    items: {
      row_above: { name: "⬆️ Chèn 1 dòng lên trên" },
      row_below: { name: "⬇️ Chèn 1 dòng xuống dưới" },
      remove_row: { name: "❌ Xóa dòng hiện tại" },
      hsep1: "---------",
      copy: { name: "📋 Sao chép (Copy)" },
      cut: { name: "✂️ Cắt (Cut)" },
      undo: { name: "↩️ Hoàn tác (Undo)" },
      redo: { name: "↪️ Làm lại (Redo)" },
      hsep2: "---------",
      clear_custom: {
        name: "🧹 Xóa nội dung ô (Clear)",
        callback: function () {
          this.emptySelectedCells();
        }
      }
    }
  }), []);

  const fillHandleSettings = useMemo(() => ({
    autoInsertRow: true,
  }), []);

  const tableColumns = useMemo(() => [
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
  ], [pinyinHTMLRenderer]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <Toolbar
        addRow={addRow}
        deleteRow={deleteRow}
        undo={undo}
        redo={redo}
        exportExcel={handleExport}
        importExcel={handleImport}
        onPlayGame={handleOpenGame} 
      />

      <div className="border border-gray-300 rounded overflow-hidden">
        <HotTable
          ref={hotRef}
          data={tableData}
          colHeaders={["Chinese (Giản thể)", "Pinyin", "Nghĩa tiếng Việt"]}
          rowHeaders={true} 
          width="100%"
          height="600"
          stretchH="all"
          contextMenu={contextMenuSettings}
          allowInsertRow={true}     
          allowInsertColumn={false} 
          fillHandle={fillHandleSettings}
          viewportRowRenderingOffset={20} 
          copyPaste={true}
          manualRowResize={true}
          manualColumnResize={true}
          undo={true}
          afterChange={handleAfterChange}
          columns={tableColumns}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>

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