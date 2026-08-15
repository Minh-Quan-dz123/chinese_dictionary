import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";

import Toolbar from "./Toolbar";
import GameModal from "./GameModal";
import { lookup } from "../dictionary/lookup";
import { exportExcel, importExcel } from "../utils/excel";
import { parseGameData } from "../utils/gameParser";

registerAllModules();

const generateId = (prefix) => prefix + "_" + Date.now() + Math.random().toString(36).substr(2, 5);

export default function Spreadsheet({ onBack }) {
  const hotRef = useRef(null);

  const [tableData, setTableData] = useState(() => {
    return Array.from({ length: 50 }, () => ({ id: generateId("w"), zh: "", py: "", vi: "", topicName: "", isSpecial: false }));
  });

  const [recentTopics, setRecentTopics] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recent_topic_names')) || [];
    } catch { return []; }
  });

  const [zoomLevel, setZoomLevel] = useState(100);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [gameQuestions, setGameQuestions] = useState([]);

  const autoPinyinRef = useRef(false);
  const autoMeaningRef = useRef(false);
  const [isAutoPinyin, setIsAutoPinyin] = useState(false);
  const [isAutoMeaning, setIsAutoMeaning] = useState(false);

  const appendRecentTopic = (newTopic) => {
    if (!newTopic || newTopic.trim() === "") return;
    const name = newTopic.trim();
    setRecentTopics(prev => {
      const updated = [name, ...prev.filter(t => t !== name)].slice(0, 10);
      localStorage.setItem('recent_topic_names', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleAutoPinyin = () => {
    const newState = !isAutoPinyin;
    setIsAutoPinyin(newState);
    autoPinyinRef.current = newState; 

    if (newState) {
      const hot = hotRef.current?.hotInstance;
      if (!hot) return;
      
      hot.batch(() => {
        for (let i = 0; i < hot.countRows(); i++) {
          if (hot.getDataAtRowProp(i, "isSpecial")) continue; 
          const zh = hot.getDataAtRowProp(i, "zh");
          const py = hot.getDataAtRowProp(i, "py");
          if (zh && zh.trim() !== "" && (!py || py.trim() === "")) {
            const res = lookup(zh.trim());
            if (res && res.pinyin) hot.setDataAtRowProp(i, "py", res.pinyin, "dictionaryAutoFill");
          }
        }
      });
    }
  };

  const toggleAutoMeaning = () => {
    const newState = !isAutoMeaning;
    setIsAutoMeaning(newState);
    autoMeaningRef.current = newState; 

    if (newState) {
      const hot = hotRef.current?.hotInstance;
      if (!hot) return;

      hot.batch(() => {
        for (let i = 0; i < hot.countRows(); i++) {
          if (hot.getDataAtRowProp(i, "isSpecial")) continue; 
          const zh = hot.getDataAtRowProp(i, "zh");
          const vi = hot.getDataAtRowProp(i, "vi");
          if (zh && zh.trim() !== "" && (!vi || vi.trim() === "")) {
            const res = lookup(zh.trim());
            if (res && res.meaning) hot.setDataAtRowProp(i, "vi", res.meaning, "dictionaryAutoFill");
          }
        }
      });
    }
  };

  const handleAfterChange = useCallback((changes, source) => {
    if (!changes || source === "loadData" || source === "dictionaryAutoFill") return;
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const rowChanges = new Map();
    changes.forEach(([row, prop, oldVal, newVal]) => {
      if (!rowChanges.has(row)) rowChanges.set(row, {});
      rowChanges.get(row)[prop] = newVal;
    });

    hot.batch(() => {
      rowChanges.forEach((propsChanged, row) => {
        if (propsChanged.hasOwnProperty("topicName") && propsChanged.topicName) {
          appendRecentTopic(propsChanged.topicName);
        }

        if (propsChanged.hasOwnProperty("zh")) {
          if (hot.getDataAtRowProp(row, "isSpecial")) return; 

          const newZh = String(propsChanged.zh || "").trim();
          const userEnteredPy = propsChanged.hasOwnProperty("py") && String(propsChanged.py || "").trim() !== "";
          const userEnteredVi = propsChanged.hasOwnProperty("vi") && String(propsChanged.vi || "").trim() !== "";

          const currentPy = String(hot.getDataAtRowProp(row, "py") || "").trim();
          const currentVi = String(hot.getDataAtRowProp(row, "vi") || "").trim();

          if (newZh) {
            const result = lookup(newZh);
            if (result) {
              if (autoPinyinRef.current && !currentPy && !userEnteredPy && result.pinyin) {
                hot.setDataAtRowProp(row, "py", result.pinyin, "dictionaryAutoFill");
              }
              if (autoMeaningRef.current && !currentVi && !userEnteredVi && result.meaning) {
                hot.setDataAtRowProp(row, "vi", result.meaning, "dictionaryAutoFill");
              }
            }
          }
        }
      });
    });
  }, []);

  const actionRenderer = (instance, td, row, col, prop, value, cellProperties) => {
    td.className = "htCenter htMiddle";
    if (value) {
      td.innerHTML = `<button class="px-3 py-1.5 w-11/12 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded text-xs font-bold cursor-pointer transition-colors shadow-inner border border-slate-200" data-action="toggle" data-row="${row}">🚫 Tắt Dịch (Đặc biệt)</button>`;
    } else {
      td.innerHTML = `<button class="px-3 py-1.5 w-11/12 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-bold cursor-pointer transition-colors shadow-sm border border-green-200" data-action="toggle" data-row="${row}">✅ Bật Tự Dịch</button>`;
    }
    return td;
  };

  const tableColumns = useMemo(() => [
    { data: "zh", type: "text", width: 160, className: "htLarge font-medium text-lg htMiddle" },
    { data: "py", type: "text", width: 200, className: "htMiddle text-base" },
    { data: "vi", type: "text", width: 350, className: "htMiddle" },
    { 
      data: "topicName", 
      type: "autocomplete", 
      strict: false,        
      source: function(query, process) {
         const recents = JSON.parse(localStorage.getItem('recent_topic_names')) || [];
         process(recents);
      }, 
      width: 150, 
      className: "htMiddle text-slate-500 font-bold" 
    },
    { data: "isSpecial", title: "Cấu hình Dòng", renderer: actionRenderer, readOnly: true, width: 150 }
  ], []);

  const handleCellClick = (event, coords, TD) => {
    if (coords.col === 4 && coords.row >= 0) { 
      const target = event.target;
      if (target.tagName === 'BUTTON' && target.getAttribute('data-action') === 'toggle') {
        const hot = hotRef.current?.hotInstance;
        if (hot) {
          const rowIndex = parseInt(target.getAttribute('data-row'), 10);
          const currentIsSpecial = hot.getDataAtRowProp(rowIndex, "isSpecial");
          const newIsSpecial = !currentIsSpecial; 
          
          hot.setDataAtRowProp(rowIndex, "isSpecial", newIsSpecial);

          if (newIsSpecial === false) {
            const zhText = hot.getDataAtRowProp(rowIndex, "zh");
            const py = hot.getDataAtRowProp(rowIndex, "py");
            const vi = hot.getDataAtRowProp(rowIndex, "vi");
            
            if (zhText && zhText.trim() !== "") {
              const result = lookup(zhText);
              if (result) {
                hot.batch(() => {
                  if (autoPinyinRef.current && result.pinyin && (!py || py.trim() === "")) {
                    hot.setDataAtRowProp(rowIndex, "py", result.pinyin, "dictionaryAutoFill");
                  }
                  if (autoMeaningRef.current && result.meaning && (!vi || vi.trim() === "")) {
                    hot.setDataAtRowProp(rowIndex, "vi", result.meaning, "dictionaryAutoFill");
                  }
                });
              }
            }
          }
        }
      }
    }
  };

  const handleAddRow = (n) => {
    const hot = hotRef.current?.hotInstance;
    if (hot) hot.alter('insert_row_below', hot.countRows(), n);
  };
  
  const handleDeleteRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (hot && hot.countRows() > 0) hot.alter('remove_row', hot.countRows() - 1, 1);
  };

  function handleExport() {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      let exportTopicName = "TuVung";
      const firstTopic = hot.getDataAtRowProp(0, "topicName");
      if (firstTopic && firstTopic.trim() !== "") {
        exportTopicName = firstTopic.trim();
        appendRecentTopic(exportTopicName);
      }
      exportExcel(hot.getSourceData(), exportTopicName);
    }
  }

  // 🚀 LOGIC MỚI: CHO PHÉP IMPORT CỘNG DỒN NHIỀU FILE
  function handleImport(file) {
    importExcel(file, (newData) => {
      const hot = hotRef.current?.hotInstance;
      const currentData = hot ? hot.getSourceData() : tableData;

      // Chuẩn hóa dữ liệu mới import
      const safeData = newData.map(row => {
        if (row.topicName) appendRecentTopic(row.topicName);
        return { ...row, id: generateId("w"), isSpecial: false };
      });

      // Lọc bỏ những dòng trắng vô nghĩa ở bảng hiện tại để tránh việc data nối bị cách quãng
      const validCurrentData = currentData.filter(row => 
        (row.zh && row.zh.trim() !== "") || 
        (row.py && row.py.trim() !== "") || 
        (row.vi && row.vi.trim() !== "") ||
        (row.topicName && row.topicName.trim() !== "")
      );

      // Gộp data cũ và mới
      let mergedData = [...validCurrentData, ...safeData];

      // Đảm bảo bảng luôn dư ra một ít dòng trống để gõ tiếp
      if (mergedData.length < 50) {
        const padding = Array.from({ length: 50 - mergedData.length }, () => ({ id: generateId("w"), zh: "", py: "", vi: "", topicName: "", isSpecial: false }));
        mergedData = [...mergedData, ...padding];
      }

      setTableData(mergedData);
    });
  }

  // 🎮 CHƠI GAME TỪ DỮ LIỆU ĐANG CÓ TRÊN BẢNG
  function handleOpenGame() {
    const hot = hotRef.current?.hotInstance;
    if (hot) hot.deselectCell();
    // Lấy nguyên xi dữ liệu đang có trên giao diện bảng hiện tại
    const currentData = hot ? hot.getSourceData() : tableData;
    const questions = parseGameData(currentData);
    
    if (questions.length === 0) { 
      alert("⚠️ Không tìm thấy từ vựng hợp lệ nào trên bảng để tạo trò chơi!"); 
      return; 
    }
    
    setGameQuestions(questions);
    setIsGameOpen(true);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
      
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between shadow-md z-10">
        <button onClick={onBack} className="text-white bg-slate-600 hover:bg-slate-500 px-4 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-2 cursor-pointer">
          ⬅ <span className="hidden sm:inline">Thoát Bảng (Quay về Trang chủ)</span>
        </button>
        <div className="text-slate-300 text-sm font-medium">Bảng tính Excel Thông minh</div>
      </div>

      <div className="p-4 flex-1 flex flex-col bg-slate-50">
        <Toolbar 
          zoom={zoomLevel} setZoom={setZoomLevel} 
          addRow={handleAddRow}
          deleteRow={handleDeleteRow}
          
          undo={() => {
            const plugin = hotRef.current?.hotInstance?.getPlugin('undoRedo');
            if (plugin && plugin.isUndoAvailable()) plugin.undo();
          }}
          redo={() => {
            const plugin = hotRef.current?.hotInstance?.getPlugin('undoRedo');
            if (plugin && plugin.isRedoAvailable()) plugin.redo();
          }}

          exportExcel={handleExport}
          importExcel={handleImport}
          onPlayGame={handleOpenGame}
          
          isAutoPinyin={isAutoPinyin}
          toggleAutoPinyin={toggleAutoPinyin}
          isAutoMeaning={isAutoMeaning}
          toggleAutoMeaning={toggleAutoMeaning}
        />

        <div className="border border-slate-300 rounded shadow-inner bg-white overflow-hidden origin-top-left transition-transform" style={{ zoom: `${zoomLevel}%` }}>
          <HotTable
            ref={hotRef} 
            data={tableData} 
            columns={tableColumns}
            colHeaders={["Chinese", "Pinyin", "Nghĩa", "Chủ đề", "Cấu Hình Dòng"]}
            rowHeaders={true} 
            width="100%" 
            height="600"
            undo={true}
            manualColumnResize={true}
            afterChange={handleAfterChange}
            afterOnCellMouseDown={handleCellClick}
            afterCreateRow={(index, amount) => {
               const hot = hotRef.current?.hotInstance;
               if (hot) {
                  for (let i = 0; i < amount; i++) hot.setDataAtRowProp(index + i, "id", generateId("w"), "loadData");
               }
            }}
            licenseKey="non-commercial-and-evaluation"
            autoRowSize={false} 
            rowHeights={48}
          />
        </div>
      </div>
      
      {isGameOpen && <GameModal questions={gameQuestions} onClose={() => setIsGameOpen(false)} />}
    </div>
  );
}