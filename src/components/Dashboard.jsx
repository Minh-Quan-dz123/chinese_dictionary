// src/components/Dashboard.jsx
import { useState, useEffect } from "react";
import { getDB, saveDB, generateId, DRAFT_TOPIC_ID } from "../store/db";
import GameModal from "./GameModal";
import { parseGameData } from "../utils/gameParser";

export default function Dashboard({ onOpenExcel }) {
  const [db, setDb] = useState({ topics: [], words: [] });
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // State cho thanh tìm kiếm

  useEffect(() => {
    setDb(getDB());
  }, []);

  const getWordCount = (topicId) => db.words.filter(w => w.topicId === topicId).length;

  // --- THAO TÁC CHỦ ĐỀ ---
  const handleAddTopic = () => {
    const name = prompt("Nhập tên chủ đề mới:");
    if (!name || name.trim() === "") return;
    const newDb = { ...db, topics: [...db.topics, { id: generateId("t"), name: name.trim() }] };
    saveDB(newDb); 
    setDb(newDb);
  };

  const handleEditTopic = (e, topic) => {
    e.stopPropagation();
    const newName = prompt("Sửa tên chủ đề:", topic.name);
    if (!newName || newName.trim() === "" || newName === topic.name) return;
    
    const newDb = {
      ...db,
      topics: db.topics.map(t => t.id === topic.id ? { ...t, name: newName.trim() } : t)
    };
    saveDB(newDb); 
    setDb(newDb);
  };

  const handleDeleteTopic = (e, topic) => {
    e.stopPropagation();
    if (topic.id === DRAFT_TOPIC_ID) {
      alert("Không thể xóa thư mục Bản nháp hệ thống!"); return;
    }
    const count = getWordCount(topic.id);
    const confirmMsg = `Bạn có chắc chắn muốn xóa chủ đề "${topic.name}"?\nSẽ có ${count} từ vựng bị xóa theo vĩnh viễn!`;
    
    if (window.confirm(confirmMsg)) {
      const newDb = {
        topics: db.topics.filter(t => t.id !== topic.id),
        words: db.words.filter(w => w.topicId !== topic.id)
      };
      saveDB(newDb); 
      setDb(newDb);
      // Xóa khỏi danh sách đang chọn (nếu có)
      setSelectedTopics(prev => prev.filter(id => id !== topic.id));
    }
  };

  // --- GAME THEO CHỦ ĐỀ ---
  const handlePlayGame = () => {
    if (selectedTopics.length === 0) {
      alert("Vui lòng tick chọn ít nhất 1 chủ đề để chơi game!"); return;
    }
    const wordsToPlay = db.words.filter(w => selectedTopics.includes(w.topicId));
    if (wordsToPlay.length === 0) {
      alert("Các chủ đề được chọn hiện không có từ vựng nào!"); return;
    }
    setIsGameOpen(true);
  };

  // --- TÌM KIẾM THÔNG MINH ---
  // Lọc ra các chủ đề có tên khớp với từ khóa, HOẶC bên trong chủ đề đó có từ vựng khớp với từ khóa
  const filteredTopics = db.topics.filter(topic => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    const matchName = topic.name.toLowerCase().includes(term);
    const matchWords = db.words.some(w => 
      w.topicId === topic.id && 
      (w.zh.toLowerCase().includes(term) || w.py.toLowerCase().includes(term) || w.vi.toLowerCase().includes(term))
    );
    
    return matchName || matchWords;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
      
      {/* KHU VỰC HEADER TỔNG QUAN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Thư viện Từ vựng</h2>
          <p className="text-slate-500 text-sm mt-1">Tổng cộng: <strong className="text-indigo-600">{db.words.length}</strong> từ vựng</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Thanh Tìm Kiếm */}
          <div className="relative flex-1 md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Tìm tiếng Trung, Pinyin, Nghĩa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <button onClick={() => onOpenExcel(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-2">
            📄 Mở Bảng Rỗng
          </button>
          
          <button onClick={handlePlayGame} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2">
            🎮 Chơi Game {selectedTopics.length > 0 && `(${selectedTopics.length})`}
          </button>
        </div>
      </div>

      {/* DANH SÁCH CHỦ ĐỀ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        
        {/* Chỉ hiện thẻ Tạo Mới khi không tìm kiếm */}
        {!searchTerm && (
          <div onClick={handleAddTopic} className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 cursor-pointer bg-slate-50 hover:bg-indigo-50 transition-all min-h-[140px]">
            <span className="text-4xl font-light mb-2">+</span>
            <span className="font-semibold">Tạo chủ đề mới</span>
          </div>
        )}

        {filteredTopics.map(topic => {
          const isSelected = selectedTopics.includes(topic.id);
          const isDraft = topic.id === DRAFT_TOPIC_ID;
          
          return (
            <div 
              key={topic.id} 
              className={`group border rounded-xl p-5 relative transition-all duration-200 flex flex-col justify-between min-h-[140px] cursor-pointer ${
                isSelected ? "border-indigo-500 bg-indigo-50/40 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
              onClick={() => setSelectedTopics(prev => prev.includes(topic.id) ? prev.filter(id => id !== topic.id) : [...prev, topic.id])}
            >
              <input type="checkbox" checked={isSelected} readOnly className="absolute top-5 right-5 w-5 h-5 cursor-pointer accent-indigo-600" />
              
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-1 pr-8 line-clamp-2">{topic.name}</h3>
                <p className={`text-sm font-medium ${isDraft && getWordCount(topic.id) > 0 ? "text-amber-500" : "text-slate-500"}`}>
                  {getWordCount(topic.id)} từ vựng
                </p>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onOpenExcel([topic.id]); }} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded transition-colors">
                  Mở Bảng
                </button>
                {!isDraft && (
                  <>
                    <button onClick={(e) => handleEditTopic(e, topic)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded transition-colors">✏️</button>
                    <button onClick={(e) => handleDeleteTopic(e, topic)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded transition-colors">🗑️</button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filteredTopics.length === 0 && searchTerm && (
          <div className="col-span-full py-10 text-center text-slate-500">
            Không tìm thấy chủ đề hoặc từ vựng nào khớp với "<strong className="text-slate-700">{searchTerm}</strong>"
          </div>
        )}
      </div>

      {/* GAME MODAL */}
      {isGameOpen && (
        <GameModal 
          questions={parseGameData(db.words.filter(w => selectedTopics.includes(w.topicId)))} 
          onClose={() => setIsGameOpen(false)} 
        />
      )}
    </div>
  );
}