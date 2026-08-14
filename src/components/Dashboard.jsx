import { useState, useEffect } from "react";
import { getDB, saveDB, generateId } from "../store/db";

export default function Dashboard({ onOpenExcel }) {
  const [db, setDb] = useState({ topics: [], words: [] });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setDb(getDB());
  }, []);

  const handleAddTopic = () => {
    const name = prompt("Nhập tên chủ đề mới:");
    if (!name || name.trim() === "") return;

    const newTopic = { id: generateId("t"), name: name.trim() };
    const newDb = { ...db, topics: [...db.topics, newTopic] };
    
    saveDB(newDb);
    setDb(newDb);
  };

  const getWordCount = (topicId) => {
    return db.words.filter(w => w.topicId === topicId).length;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-700">📚 Các chủ đề từ vựng</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => onOpenExcel(null)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Mở Tất cả ({db.words.length} từ)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Nút Tạo Chủ Đề */}
        <div 
          onClick={handleAddTopic}
          className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 cursor-pointer hover:bg-indigo-50 transition-colors min-h-[120px]"
        >
          <span className="text-3xl mb-2">+</span>
          <span className="font-semibold">Tạo chủ đề mới</span>
        </div>

        {/* Danh sách Chủ đề */}
        {db.topics.map(topic => (
          <div key={topic.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-slate-50 relative group">
            <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1">{topic.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{getWordCount(topic.id)} từ vựng</p>
            
            <button 
              onClick={() => onOpenExcel(topic.id)}
              className="w-full py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors"
            >
              Mở chủ đề này
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}