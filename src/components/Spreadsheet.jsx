import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";

import Toolbar from "./Toolbar";
import GameModal from "./GameModal";
import { lookup } from "../dictionary/lookup";
import { getDB, saveDB, generateId, DRAFT_TOPIC_ID } from "../store/db";
import { exportExcel, importExcel } from "../utils/excel";
import { parseGameData } from "../utils/gameParser";

registerAllModules();

export default function Spreadsheet({ activeTopicIds, onBack }) {
  const hotRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // --- STATE ---
  const [db, setDb] = useState({ topics: [], words: [] });
  const [tableData, setTableData] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTopicName, setDraftTopicName] = useState("");

  const [isGameOpen, setIsGameOpen] = useState(false);
  const [gameQuestions, setGameQuestions] = useState([]);

  // 1. TẢI DỮ LIỆU KHI MỞ BẢNG
  useEffect(() => {
    const currentDb = getDB();
    setDb(currentDb);

    let filteredWords = [];
    if (activeTopicIds && activeTopicIds.length > 0) {
      filteredWords = currentDb.words.filter(w => activeTopicIds.includes(w.topicId));
    }

    if (filteredWords.length === 0) {
      setTableData(Array.from({ length: 20 }, () => ({ id: generateId("w"), zh: "", py: "", vi: "", topicName: "" })));
    } else {
      setTableData(filteredWords.map(w => ({ ...w, topicName: currentDb.topics.find(t => t.id === w.topicId)?.name || "" })));
    }
  }, [activeTopicIds]);

  // 2. ĐỒNG BỘ NGẦM (Lưu ý: Từ mới KHÔNG CHỌN Chủ đề sẽ bay vào DRAFT)
  const syncToDatabase = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const hot = hotRef.current?.hotInstance;
      if (!hot) return;

      const currentTableData = hot.getSourceData();
      const currentDb = getDB(); 
      let updatedTopics = [...currentDb.topics];
      let updatedWords = [...currentDb.words];

      currentTableData.forEach(row => {
        if (!row.zh && !row.py && !row.vi) return; 

        let finalTopicId = DRAFT_TOPIC_ID; 

        if (row.topicName && String(row.topicName).trim() !== "") {
          let matchedTopic = updatedTopics.find(t => t.name === row.topicName);
          if (!matchedTopic) {
            matchedTopic = { id: generateId("t"), name: row.topicName };
            updatedTopics.push(matchedTopic);
          }
          finalTopicId = matchedTopic.id;
        }

        const wordPayload = {
          id: row.id || generateId("w"), 
          zh: row.zh || "", 
          py: row.py || "", 
          vi: row.vi || "", 
          topicId: finalTopicId
        };

        const existingIdx = updatedWords.findIndex(w => w.id === row.id);
        if (existingIdx >= 0) updatedWords[existingIdx] = wordPayload;
        else updatedWords.push(wordPayload);
      });

      saveDB({ topics: updatedTopics, words: updatedWords });
      setDb({ topics: updatedTopics, words: updatedWords });
    }, 1000); 
  }, []);

  // 3. AUTO FILL THÔNG MINH
  const handleAfterChange = useCallback((changes, source) => {
    if (!changes || source === "loadData" || source === "dictionaryAutoFill") return;
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const updates = [];
    const rowChanges = new Map();
    changes.forEach(([row, prop, oldVal, newVal]) => {
      if (!rowChanges.has(row)) rowChanges.set(row, {});
      rowChanges.get(row)[prop] = newVal;
    });

    rowChanges.forEach((cols, row) => {
      if (cols.hasOwnProperty("zh") && !cols.py && !cols.vi) {
        if (!cols.zh) updates.push([row, "py", ""]); 
        else {
          const result = lookup(String(cols.zh));
          if (result) updates.push([row, "py", result.pinyin]);
        }
      }
    });

    if (updates.length > 0) hot.setDataAtCell(updates, "dictionaryAutoFill");
    syncToDatabase();
  }, [syncToDatabase]);

  // --- HÀM QUẢN LÝ EXCEL & GAME TẠI BẢNG ---
  function handleExport() {
    const hot = hotRef.current?.hotInstance;
    if (hot) exportExcel(hot.getSourceData());
  }

  function handleImport(file) {
    importExcel(file, (newData) => {
      // Gán thêm ID ngầm cho dữ liệu import từ ngoài vào để an toàn
      const safeData = newData.map(row => ({ ...row, id: generateId("w") }));
      setTableData(safeData);
      syncToDatabase();
    });
  }

  function handleOpenGame() {
    const hot = hotRef.current?.hotInstance;
    if (hot) hot.deselectCell();
    
    const currentData = hot ? hot.getSourceData() : tableData;
    const questions = parseGameData(currentData);

    if (questions.length === 0) {
      alert("Không tìm thấy từ vựng hợp lệ! Hãy điền Tiếng Trung và Nghĩa.");
      return;
    }
    setGameQuestions(questions);
    setIsGameOpen(true);
  }

  // --- XỬ LÝ QUAY LẠI (KIỂM TRA HỖN ĐỘN) ---
  const handleIntentionalExit = () => {
    syncToDatabase(); 
    
    setTimeout(() => {
      const freshDb = getDB();
      const hasDraftWords = freshDb.words.some(w => w.topicId === DRAFT_TOPIC_ID);

      if (hasDraftWords) {
        setShowDraftModal(true); 
      } else {
        onBack(); 
      }
    }, 1100); // Đợi debounce sync chạy xong
  };

  const handleResolveDraft = (action) => {
    const currentDb = getDB();
    let newWords = [...currentDb.words];
    let newTopics = [...currentDb.topics];

    if (action === "SAVE") {
      if (!draftTopicName.trim()) { alert("Vui lòng nhập tên chủ đề!"); return; }
      const newTopic = { id: generateId("t"), name: draftTopicName.trim() };
      newTopics.push(newTopic);
      newWords = newWords.map(w => w.topicId === DRAFT_TOPIC_ID ? { ...w, topicId: newTopic.id } : w);
    } else if (action === "DISCARD") {
      newWords = newWords.filter(w => w.topicId !== DRAFT_TOPIC_ID);
    }
    
    saveDB({ topics: newTopics, words: newWords });
    setShowDraftModal(false);
    onBack();
  };

  // --- THÊM CHỦ ĐỀ VÀO BẢNG ---
  const handleLoadMoreTopic = (topicId) => {
    const topicWords = db.words.filter(w => w.topicId === topicId);
    if (topicWords.length === 0) { alert("Chủ đề này không có từ vựng!"); return; }

    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const topicName = db.topics.find(t => t.id === topicId)?.name || "";
      const currentRows = hot.countRows();
      
      hot.alter('insert_row_below', currentRows, topicWords.length);
      
      const updates = [];
      topicWords.forEach((word, index) => {
        const r = currentRows + index;
        updates.push([r, 'id', word.id]);
        updates.push([r, 'zh', word.zh]);
        updates.push([r, 'py', word.py]);
        updates.push([r, 'vi', word.vi]);
        updates.push([r, 'topicName', topicName]);
      });
      hot.setDataAtCell(updates, 'loadData');
    }
  };

  const tableColumns = useMemo(() => [
    { data: "zh", type: "text", width: 160, className: "htLarge font-medium text-lg htMiddle" },
    { data: "py", type: "text", width: 200, className: "htCenter htMiddle" },
    { data: "vi", type: "text", width: 350, className: "htMiddle" },
    { data: "topicName", type: "dropdown", source: db.topics.filter(t => t.id !== DRAFT_TOPIC_ID).map(t => t.name), width: 180, className: "htMiddle text-slate-500 font-bold" }
  ], [db.topics]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
      
      {/* Nút Quay Lại Chuyên Nghiệp */}
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between shadow-md z-10">
        <button onClick={handleIntentionalExit} className="text-white hover:bg-slate-700 px-4 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-2">
          ⬅ <span className="hidden sm:inline">Quay lại Thư viện</span>
        </button>
        <div className="text-slate-300 text-sm font-medium">Bảng tính thông minh</div>
      </div>

      <div className="p-4 flex-1 flex flex-col bg-slate-50">
        <Toolbar 
          zoom={zoomLevel} setZoom={setZoomLevel} 
          onLoadMoreTopic={handleLoadMoreTopic}
          availableTopics={db.topics.filter(t => t.id !== DRAFT_TOPIC_ID)}
          addRow={(n) => hotRef.current?.hotInstance?.alter('insert_row_below', hotRef.current.hotInstance.countRows(), n)}
          deleteRow={() => hotRef.current?.hotInstance?.alter('remove_row', hotRef.current.hotInstance.countRows() - 1, 1)}
          undo={() => hotRef.current?.hotInstance?.undo()}
          redo={() => hotRef.current?.hotInstance?.redo()}
          exportExcel={handleExport}
          importExcel={handleImport}
          onPlayGame={handleOpenGame}
        />

        {/* Khung Zoom CSS */}
        <div className="flex-1 border border-slate-300 rounded shadow-inner bg-white overflow-hidden origin-top-left transition-transform" style={{ zoom: `${zoomLevel}%` }}>
          <HotTable
            ref={hotRef} data={tableData} columns={tableColumns}
            colHeaders={["Chinese", "Pinyin", "Nghĩa tiếng Việt", "Chủ đề (Gõ mới để tạo)"]}
            rowHeaders={true} width="100%" height="100%"
            afterChange={handleAfterChange} afterRemoveRow={syncToDatabase}
            afterCreateRow={(index, amount) => {
               for(let i=0; i<amount; i++) hotRef.current?.hotInstance?.setDataAtRowProp(index + i, "id", generateId("w"), "loadData");
               syncToDatabase();
            }}
            licenseKey="non-commercial-and-evaluation"
            autoRowSize={false} autoColumnSize={false} rowHeights={48}
          />
        </div>
      </div>

      {/* HỘP THOẠI CẢNH BÁO "BẢN NHÁP" KHI THOÁT */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-800 mb-2">⚠️ Có từ vựng chưa được lưu!</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Bạn đã tạo ra một số từ vựng mới nhưng chưa gắn cho chủ đề nào. Bạn muốn lưu chúng thành một chủ đề mới hay xóa bỏ?
            </p>
            
            <input 
              type="text" autoFocus
              placeholder="Nhập tên chủ đề mới..." 
              className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-6 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              value={draftTopicName} onChange={e => setDraftTopicName(e.target.value)}
            />

            <div className="flex flex-col gap-3">
              <button onClick={() => handleResolveDraft("SAVE")} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
                💾 Lưu thành chủ đề mới & Thoát
              </button>
              <button onClick={() => handleResolveDraft("DISCARD")} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors">
                🗑️ Không lưu (Xóa nháp) & Thoát
              </button>
              <button onClick={() => setShowDraftModal(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
                ❌ Hủy (Ở lại trang tính)
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL GAME KHI CHƠI TRONG BẢNG */}
      {isGameOpen && (
        <GameModal questions={gameQuestions} onClose={() => setIsGameOpen(false)} />
      )}
    </div>
  );
}