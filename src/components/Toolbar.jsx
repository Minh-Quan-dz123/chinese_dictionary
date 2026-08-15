import { useRef, useState } from "react";

function Toolbar({
  addRow,
  deleteRow,
  undo,
  redo,
  exportExcel,
  importExcel,
  onPlayGame,
  zoom,
  setZoom,
  isAutoPinyin,
  toggleAutoPinyin,
  isAutoMeaning,
  toggleAutoMeaning
}) {
  const fileInputRef = useRef(null);
  
  // STATE ĐỂ BẬT/TẮT MODAL HƯỚNG DẪN IMPORT
  const [showImportModal, setShowImportModal] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      importExcel(file);
      e.target.value = ""; 
    }
  }

  const btnOutlineClass = "px-3 py-1.5 border border-slate-300 shadow-sm bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1";

  return (
    <>
      <div className="flex flex-col gap-3 mb-4 bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-inner">
        
        {/* KHU VỰC TOOLBAR CHÍNH */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2 py-1.5 shadow-sm">
            <span className="text-slate-500 text-sm mr-1 font-bold">🔍</span>
            <select 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))} 
              className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value={80}>Nhỏ (80%)</option>
              <option value={100}>Chuẩn (100%)</option>
              <option value={120}>Lớn (120%)</option>
              <option value={150}>Khổng lồ (150%)</option>
            </select>
          </div>

          <div className="h-6 w-[1px] bg-slate-300 mx-1 hidden md:block" />

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleAutoPinyin}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer border ${
                isAutoPinyin 
                  ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-600" 
                  : "bg-slate-200 hover:bg-slate-300 text-slate-600 border-slate-300"
              }`}
            >
              🗣️ Pinyin All: {isAutoPinyin ? "BẬT" : "TẮT"}
            </button>

            <button 
              onClick={toggleAutoMeaning}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer border ${
                isAutoMeaning 
                  ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-600" 
                  : "bg-slate-200 hover:bg-slate-300 text-slate-600 border-slate-300"
              }`}
            >
              📚 Nghĩa All: {isAutoMeaning ? "BẬT" : "TẮT"}
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-300 mx-1 hidden md:block" />

          <div className="flex items-center gap-2">
            <button className={btnOutlineClass} onClick={() => addRow(10)}>➕ 10 Dòng</button>
            <button className={btnOutlineClass} onClick={deleteRow}>➖ Xóa</button>
            <button className={btnOutlineClass} onClick={undo} title="Hoàn tác (Ctrl+Z)">↩️ Undo</button>
            <button className={btnOutlineClass} onClick={redo} title="Làm lại (Ctrl+Y)">↪️ Redo</button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button 
              className="px-4 py-1.5 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer transition-colors text-sm flex items-center gap-1" 
              onClick={() => setShowImportModal(true)}
            >
              📂 Import Data
            </button>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />

            <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer transition-colors text-sm flex items-center gap-1" onClick={exportExcel}>
              💾 Export Excel
            </button>

            {/* 🚀 NÚT CHƠI GAME ĐÃ ĐƯỢC THÊM LẠI Ở ĐÂY */}
            <button 
              className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md cursor-pointer transition-all flex items-center gap-2 ml-2" 
              onClick={onPlayGame}
            >
              <span className="text-lg">🎮</span>
              <span>Chơi Game Ngay</span>
            </button>
          </div>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📥</span> Hướng dẫn Import Excel
            </h3>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-sm text-slate-700 leading-relaxed">
              <p className="mb-3">Hệ thống sẽ tự động nhận diện dữ liệu nếu dòng tiêu đề (Header) file Excel của bạn chứa các từ khóa sau:</p>
              <ul className="space-y-2 mb-3">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Cột Tiếng Trung: <strong className="text-indigo-600">Trung, Chinese, Hán, zh</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Cột Phiên âm: <strong className="text-indigo-600">Pinyin, Phiên âm, py</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Cột Ý nghĩa: <strong className="text-indigo-600">Nghĩa, Tiếng Việt, vi</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Cột Chủ đề: <strong className="text-indigo-600">Chủ đề, Topic</strong></span>
                </li>
              </ul>
              <p className="text-xs text-amber-600 italic">
                * Mẹo: Các cột không cần sắp xếp đúng thứ tự, có thể chèn thêm cột STT thoải mái.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowImportModal(false)} 
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Hủy (Cancel)
              </button>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  fileInputRef.current?.click(); 
                }} 
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span className="text-xl font-bold">+</span> Chọn File Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Toolbar;