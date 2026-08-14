import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";

import Toolbar from "./Toolbar";
import { lookup } from "../dictionary/lookup";
import { getDB, saveDB, generateId } from "../store/db";
import GameModal from "./GameModal";
import { parseGameData } from "../utils/gameParser";

registerAllModules();

export default function Spreadsheet({ activeTopicId, onBack }) {
  const hotRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const [db, setDb] = useState({ topics: [], words: [] });
  const [tableData, setTableData] = useState([]);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [gameQuestions, setGameQuestions] = useState([]);

  // 1. TẢI DỮ LIỆU KHI MỞ BẢNG
  useEffect(() => {
    const currentDb = getDB();
    setDb(currentDb);

    // Chuyển DB (quan hệ) thành dữ liệu dẹt (Object) cho Handsontable
    // Lọc theo chủ đề nếu người dùng không chọn "Mở tất cả"
    let filteredWords = currentDb.words;
    if (activeTopicId) {
      filteredWords = currentDb.words.filter(w => w.topicId === activeTopicId);
    }

    // Nếu bảng rỗng, tạo 20 dòng trống
    if (filteredWords.length === 0) {
      const emptyRows = Array.from({ length: 20 }, () => ({
        id: generateId("w"),
        zh: "", py: "", vi: "",
        topicName: currentDb.topics.find(t => t.id === (activeTopicId || "t_default"))?.name || ""
      }));
      setTableData(emptyRows);
    } else {
      // Gắn tên Topic vào hiển thị
      const displayData = filteredWords.map(word => {
        const topic = currentDb.topics.find(t => t.id === word.topicId);
        return { ...word, topicName: topic ? topic.name : "" };
      });
      setTableData(displayData);
    }
  }, [activeTopicId]);

  // 2. HÀM ĐỒNG BỘ: HANDSONTABLE -> DATABASE (CHỐNG LAG)
  const syncToDatabase = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const hot = hotRef.current?.hotInstance;
      if (!hot) return;

      const currentTableData = hot.getSourceData();
      const currentDb = getDB(); // Lấy DB mới nhất từ ổ cứng
      
      let updatedTopics = [...currentDb.topics];
      let updatedWords = [...currentDb.words];

      currentTableData.forEach(row => {
        // Nếu là dòng trống hoàn toàn thì bỏ qua
        if (!row.zh && !row.py && !row.vi) return;

        // Xử lý tạo chủ đề mới nếu user gõ tên lạ vào cột Dropdown
        let matchedTopic = updatedTopics.find(t => t.name === row.topicName);
        if (!matchedTopic && row.topicName) {
          matchedTopic = { id: generateId("t"), name: row.topicName };
          updatedTopics.push(matchedTopic);
        }

        const fallbackTopicId = activeTopicId || "t_default";
        const finalTopicId = matchedTopic ? matchedTopic.id : fallbackTopicId;

        // Tìm xem từ này đã có trong DB chưa
        const existingWordIndex = updatedWords.findIndex(w => w.id === row.id);

        const wordPayload = {
          id: row.id || generateId("w"),
          zh: row.zh || "",
          py: row.py || "",
          vi: row.vi || "",
          topicId: finalTopicId
        };

        if (existingWordIndex >= 0) {
          // UPDATE
          updatedWords[existingWordIndex] = wordPayload;
        } else {
          // INSERT
          updatedWords.push(wordPayload);
        }
      });

      // Lưu ngược lại ổ cứng
      saveDB({ topics: updatedTopics, words: updatedWords });
      setDb({ topics: updatedTopics, words: updatedWords }); // Update state cục bộ
    }, 1000); // Đợi 1 giây
  }, [activeTopicId]);

  // 3. HÀM AUTO-FILL THÔNG MINH (Không đè khi Paste hàng loạt)
  const handleAfterChange = useCallback((changes, source) => {
    if (!changes || source === "loadData" || source === "dictionaryAutoFill") return;

    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const updates = [];
    const rowChanges = new Map();

    // Với Object data, changes có dạng: [row, prop (tên cột), oldVal, newVal]
    changes.forEach(([row, prop, oldVal, newVal]) => {
      if (!rowChanges.has(row)) rowChanges.set(row, {});
      rowChanges.get(row)[prop] = newVal;
    });

    rowChanges.forEach((cols, row) => {
      if (cols.hasOwnProperty("zh")) {
        const chineseWord = cols.zh;
        const incomingPinyin = cols.py;
        const incomingMeaning = cols.vi;

        // Nếu user đang dán cả Pinyin hoặc Nghĩa -> KHÔNG DỊCH ĐÈ
        const isPastingCustomData = 
          (incomingPinyin !== undefined && String(incomingPinyin).trim() !== "") ||
          (incomingMeaning !== undefined && String(incomingMeaning).trim() !== "");

        if (isPastingCustomData) return;

        if (!chineseWord || String(chineseWord).trim() === "") {
          updates.push([row, "py", ""]); 
        } else {
          const result = lookup(String(chineseWord));
          if (result) {
            updates.push([row, "py", result.pinyin]);
          }
        }
      }
    });

    if (updates.length > 0) {
      hot.setDataAtCell(updates, "dictionaryAutoFill");
    }

    // Gọi đồng bộ Database
    syncToDatabase();
  }, [syncToDatabase]);

  // Thiết lập Cột cho Handsontable (Map Object Key)
  const tableColumns = useMemo(() => [
    { data: "zh", type: "text", width: 160, className: "htLarge font-medium text-lg htMiddle" },
    { data: "py", type: "text", width: 200, className: "htCenter htMiddle" },
    { data: "vi", type: "text", width: 300, className: "htMiddle" },
    { 
      data: "topicName", 
      type: "dropdown", 
      source: db.topics.map(t => t.name),
      width: 180,
      className: "htMiddle text-slate-500"
    }
  ], [db.topics]);

  function handleOpenGame() {
    const hot = hotRef.current?.hotInstance;
    if (hot) hot.deselectCell();
    const currentData = hot ? hot.getSourceData() : tableData;
    const questions = parseGameData(currentData);
    
    if (questions.length === 0) {
      alert("Không có từ vựng hợp lệ để chơi!"); return;
    }
    setGameQuestions(questions);
    setIsGameOpen(true);
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium">
          ⬅ Quay lại trang chủ
        </button>
      </div>

      <Toolbar 
        onPlayGame={handleOpenGame} 
        // addRow, undo, redo, v.v.. nếu bạn giữ file Toolbar cũ thì thêm props ở đây
      />

      <div className="border border-gray-300 rounded overflow-hidden">
        <HotTable
          ref={hotRef}
          data={tableData}
          colHeaders={["Chinese", "Pinyin", "Nghĩa tiếng Việt", "Chủ đề (Option)"]}
          rowHeaders={true}
          width="100%"
          height="600"
          columns={tableColumns}
          afterChange={handleAfterChange}
          afterRemoveRow={syncToDatabase} // Xóa dòng thì đồng bộ ngay
          afterCreateRow={(index, amount) => {
             // Tự động gen ID ngầm khi thêm dòng trống
             const hot = hotRef.current?.hotInstance;
             for(let i=0; i<amount; i++) {
                hot.setDataAtRowProp(index + i, "id", generateId("w"), "loadData");
             }
             syncToDatabase();
          }}
          licenseKey="non-commercial-and-evaluation"
          autoRowSize={false}
          autoColumnSize={false}
          rowHeights={48}
        />
      </div>

      {isGameOpen && (
        <GameModal questions={gameQuestions} onClose={() => setIsGameOpen(false)} />
      )}
    </div>
  );
}