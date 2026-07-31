import Spreadsheet from "./components/Spreadsheet";
import useDictionary from "./hooks/useDictionary";

function App() {
  const isDictReady = useDictionary();

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Excel Từ Vựng Tiếng Trung
            </h1>
            <p className="text-sm text-slate-500">
              Nhập chữ Hán giản thể — Pinyin và nghĩa tiếng Việt tự động cập nhật
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                isDictReady ? "bg-green-500" : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="text-sm font-medium text-slate-600">
              {isDictReady ? "Từ điển sẵn sàng" : "Đang tải từ điển..."}
            </span>
          </div>
        </header>

        <main>
          <Spreadsheet />
        </main>
      </div>
    </div>
  );
}

export default App;