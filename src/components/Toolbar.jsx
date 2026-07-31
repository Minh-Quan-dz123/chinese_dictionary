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
}) {
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      importExcel(file);
      e.target.value = ""; // Reset input để có thể import lại cùng 1 file nếu muốn
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Thêm / Xóa dòng */}
      <button
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-sm cursor-pointer transition-colors"
        onClick={() => addRow(10)}
      >
        + 10 Dòng
      </button>

      <button
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded shadow-sm cursor-pointer transition-colors"
        onClick={deleteRow}
      >
        - Dòng cuối
      </button>

      <div className="h-6 w-[1px] bg-gray-300 mx-1" />

      {/* Undo / Redo */}
      <button
        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded shadow-sm cursor-pointer transition-colors"
        onClick={undo}
      >
        Undo
      </button>

      <button
        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded shadow-sm cursor-pointer transition-colors"
        onClick={redo}
      >
        Redo
      </button>

      <div className="h-6 w-[1px] bg-gray-300 mx-1" />

      {/* Import / Export Excel */}
      <button
        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow-sm cursor-pointer transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        Import Excel
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />

      <button
        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded shadow-sm cursor-pointer transition-colors"
        onClick={exportExcel}
      >
        Export Excel
      </button>

      <div className="h-6 w-[1px] bg-gray-300 mx-1" />

      {/* Nút Play Game - Nổi bật hơn để dễ bấm */}
      <button
        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded shadow-md cursor-pointer transition-all flex items-center gap-1.5 ml-auto sm:ml-0"
        onClick={onPlayGame}
      >
        <span>🎮</span>
        <span>Play Game</span>
      </button>
    </div>
  );
}

export default Toolbar;