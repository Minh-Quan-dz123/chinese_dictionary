import { useState } from "react";
import useDictionary from "./hooks/useDictionary";
import Spreadsheet from "./components/Spreadsheet";
import Dashboard from "./components/Dashboard"; // Ta sẽ tạo file này ở bước 4

function App() {
  const isDictReady = useDictionary();
  const [currentScreen, setCurrentScreen] = useState("dashboard"); // 'dashboard' | 'excel'
  const [activeTopicId, setActiveTopicId] = useState(null); // null = Load tất cả

  // Hàm để Mở bảng Excel
  const handleOpenExcel = (topicId = null) => {
    setActiveTopicId(topicId);
    setCurrentScreen("excel");
  };

  // Hàm để Quay lại trang chủ
  const handleBackToDashboard = () => {
    setCurrentScreen("dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Quản Lý Từ Vựng Tiếng Trung
            </h1>
            <p className="text-sm text-slate-500">
              Hệ thống lưu trữ tự động • Hỗ trợ tự động điền Pinyin
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
          {currentScreen === "dashboard" ? (
            <Dashboard onOpenExcel={handleOpenExcel} />
          ) : (
            <Spreadsheet 
              activeTopicId={activeTopicId} 
              onBack={handleBackToDashboard} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;