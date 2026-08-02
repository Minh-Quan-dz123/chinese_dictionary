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

  function createRows(count = 20) {
    return Array.from({ length: count }, () => ["", "", ""]);
  }

  const [tableData, setTableData] = useState(createRows());

  // --- CẬP NHẬT: Dùng alter() của Handsontable để thêm/xóa dòng an toàn hơn ---
  function addRow(count = 10) {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      // Chèn 'count' dòng vào vị trí dưới cùng
      hot.alter('insert_row_below', hot.countRows(), count);
    }
  }

  function deleteRow() {
    const hot = hotRef.current?.hotInstance;
    if (hot && hot.countRows() > 1) {
      // Xóa 1 dòng ở vị trí cuối cùng
      hot.alter('remove_row', hot.countRows() - 1, 1);
    }
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

  function pinyinHTMLRenderer(instance, td, row, col, prop, value, cellProperties) {
    td.innerHTML = "";
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

  const [isGameOpen, setIsGameOpen] = useState(false);
  const [gameQuestions, setGameQuestions] = useState([]);

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

  // --- TÍNH NĂNG MỚI 1: Menu chuột phải (Context Menu) tiếng Việt ---
  const contextMenuSettings = {
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
  };

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
          
          // --- Bật Menu chuột phải ---
          contextMenu={contextMenuSettings}
          
          // --- TÍNH NĂNG MỚI 2 & 3: Kéo cuộn & Paste tự đẻ dòng ---
          allowInsertRow={true}     // Paste 100 dòng sẽ tự động chèn thêm 100 dòng
          allowInsertColumn={false} // Khóa cột lại, giữ nguyên đúng 3 cột
          
          fillHandle={{
            autoInsertRow: true,    // Kéo ô vuông xuống dưới cùng sẽ tự sinh dòng mới
          }}
          viewportRowRenderingOffset={20} // Render trước 20 dòng để khi kéo scroll nó mượt, ko bị khựng
          
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