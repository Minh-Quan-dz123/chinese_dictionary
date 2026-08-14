// src/components/Toolbar.jsx
import { useRef } from "react";

function Toolbar({
  addRow,
  deleteRow,
  undo,
  redo,
  exportExcel,
  importExcel,
  onPlayGame,
  // --- Props mới thêm ---
  zoom,
  setZoom,
  onLoadMoreTopic,
  availableTopics = [], // Tránh lỗi undefined nếu chưa truyền kịp
}) {
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      importExcel(file);
      e.target.value = ""; // Reset input để có thể import lại cùng 1 file nếu muốn
    }
  }

  // Khai báo class chuẩn cho các nút phụ để giao diện đồng nhất, chuyên nghiệp
  const btnOutlineClass = "px-3 py-1.5 border border-slate-300 shadow-sm bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center";

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-inner">
      
      {/* 1. Nhóm Công cụ Hiển thị (Zoom) */}
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

      {/* 2. Nhóm Chỉnh sửa dòng (Row Actions) */}
      <div className="flex items-center gap-2">
        <button className={btnOutlineClass} onClick={() => addRow(10)}>
          ➕ 10 Dòng
        </button>
        <button className={btnOutlineClass} onClick={deleteRow}>
          ➖ Xóa dòng
        </button>
      </div>

      <div className="h-6 w-[1px] bg-slate-300 mx-1 hidden md:block" />

      {/* 3. Nhóm Lịch sử (Undo/Redo) */}
      <div className="flex items-center gap-2">
        <button className={btnOutlineClass} onClick={undo} title="Hoàn tác">
          ↩️ Undo
        </button>
        <button className={btnOutlineClass} onClick={redo} title="Làm lại">
          ↪️ Redo
        </button>
      </div>

      <div className="h-6 w-[1px] bg-slate-300 mx-1 hidden md:block" />

      {/* 4. Nhóm Chức năng Nối Chủ Đề (Tính năng mới) */}
      <div className="relative flex items-center">
        <select 
          onChange={(e) => { 
            if(e.target.value) { 
              onLoadMoreTopic(e.target.value); 
              e.target.value = ""; // Xử lý xong thì reset lại select
            } 
          }}
          className="appearance-none bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 pr-8 rounded-lg text-sm font-bold hover:bg-blue-100 cursor-pointer outline-none shadow-sm transition-colors"
        >
          <option value="">➕ Nhúng thêm chủ đề...</option>
          {availableTopics.map(t => (
             <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <span className="absolute right-3 pointer-events-none text-blue-500 text-xs">▼</span>
      </div>

      <div className="flex-1" /> {/* Đẩy các nút phía sau sang sát lề phải */}

      {/* 5. Nhóm Import/Export Excel */}
      <div className="flex items-center gap-2">
        <button
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer transition-colors text-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          📂 Import Excel
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          className="hidden"
        />

        <button
          className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer transition-colors text-sm"
          onClick={exportExcel}
        >
          💾 Export Excel
        </button>
      </div>

      {/* 6. Nút Play Game (Dành cho bảng hiện tại) */}
      <button
        className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md cursor-pointer transition-all flex items-center gap-2"
        onClick={onPlayGame}
      >
        <span className="text-lg">🎮</span>
        <span>Play Game</span>
      </button>

    </div>
  );
}

export default Toolbar;