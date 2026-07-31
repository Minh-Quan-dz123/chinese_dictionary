// src/components/GameModal.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { playSound } from "../utils/sound";

export default function GameModal({ questions, onClose }) {
  // --- STATE CÀI ĐẶT (SETTINGS) ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); // Giây mỗi câu
  const [maxWrongAllowed, setMaxWrongAllowed] = useState(1); // Cho phép sai tối đa N lần

  // --- STATE TRÒ CHƠI (GAMEPLAY) ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isGameOver, setIsGameOver] = useState(false);

  // Lưu trạng thái từng câu: { solved: boolean, isCorrect: boolean, wrongCount: number, selectedWrongs: string[] }
  const [questionProgress, setQuestionProgress] = useState({});

  const timerRef = useRef(null);

  // --- 1. TRỘN NGẪU NHIÊN THỨ TỰ CÂU HỎI MỖI KHI BẮT ĐẦU CHƠI ---
  const shuffledQuestions = useMemo(() => {
    return [...questions].sort(() => Math.random() - 0.5);
  }, [questions, isPlaying]);

  // --- 2. TRỘN NGẪU NHIÊN DANH SÁCH ĐÁP ÁN (BẢNG CHỌN) ---
  const allOptions = useMemo(() => {
    const options = shuffledQuestions.map((q) => q.answer);
    return [...options].sort(() => Math.random() - 0.5);
  }, [shuffledQuestions]);

  const currentQuestion = shuffledQuestions[currentIndex];
  const currentProgress = questionProgress[currentIndex] || {
    solved: false,
    isCorrect: false,
    wrongCount: 0,
    selectedWrongs: [],
  };

  // --- TÍNH ĐIỂM: SỐ CÂU ĐÚNG / TỔNG SỐ CÂU ---
  const correctCount = useMemo(() => {
    return Object.values(questionProgress).filter((item) => item.isCorrect).length;
  }, [questionProgress]);

  // --- TÍNH SỐ CÂU ĐÃ HOÀN THÀNH ---
  const completedCount = useMemo(() => {
    return Object.values(questionProgress).filter((item) => item.solved).length;
  }, [questionProgress]);

  // --- HỆ THỐNG ĐẾM NGƯỢC THỜI GIAN ---
  useEffect(() => {
    if (!isPlaying || isGameOver || currentProgress.solved) return;

    setTimeLeft(timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isPlaying, isGameOver, currentProgress.solved, timeLimit]);

  // Khi hết giờ một câu: Chốt là sai
  function handleTimeOut() {
    playSound("wrong");
    setQuestionProgress((prev) => ({
      ...prev,
      [currentIndex]: {
        ...currentProgress,
        solved: true,
        isCorrect: false,
      },
    }));
  }

  // BẮT ĐẦU CHƠI (HOẶC CHƠI LẠI)
  function handleStartGame() {
    playSound("click");
    setIsPlaying(true);
    setCurrentIndex(0);
    setIsGameOver(false);

    // Khởi tạo progress trống cho tất cả các câu đã được xáo trộn
    const initialProgress = {};
    shuffledQuestions.forEach((_, idx) => {
      initialProgress[idx] = {
        solved: false,
        isCorrect: false,
        wrongCount: 0,
        selectedWrongs: [],
      };
    });
    setQuestionProgress(initialProgress);
  }

  // CHỌN ĐÁP ÁN
  function handleSelectOption(option) {
    if (isGameOver || currentProgress.solved) return;
    if (currentProgress.selectedWrongs.includes(option)) return;

    if (option === currentQuestion.answer) {
      // ---> CHỌN ĐÚNG
      playSound("correct");

      const nextProgress = {
        ...questionProgress,
        [currentIndex]: {
          ...currentProgress,
          solved: true,
          isCorrect: true,
        },
      };

      setQuestionProgress(nextProgress);

      // Kiểm tra xem đã làm hết tất cả các câu chưa
      const allSolved = Object.values(nextProgress).every((item) => item.solved);
      if (allSolved) {
        playSound("finish");
        setIsGameOver(true);
      }
    } else {
      // ---> CHỌN SAI
      playSound("wrong");
      const nextWrongCount = currentProgress.wrongCount + 1;
      const isFailedNow = nextWrongCount >= maxWrongAllowed;

      const nextProgress = {
        ...questionProgress,
        [currentIndex]: {
          ...currentProgress,
          wrongCount: nextWrongCount,
          selectedWrongs: [...currentProgress.selectedWrongs, option],
          solved: isFailedNow, // Nếu sai vượt quá lượt cho phép thì chốt là sai và khóa câu này lại
          isCorrect: false,
        },
      };

      setQuestionProgress(nextProgress);

      // Nếu câu này sai hết lượt, kiểm tra kết thúc game
      if (isFailedNow) {
        const allSolved = Object.values(nextProgress).every((item) => item.solved);
        if (allSolved) {
          playSound("finish");
          setIsGameOver(true);
        }
      }
    }
  }

  // ĐIỀU HƯỚNG CÂU HỎI
  function handlePrev() {
    playSound("click");
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function handleNext() {
    playSound("click");
    setCurrentIndex((prev) => Math.min(shuffledQuestions.length - 1, prev + 1));
  }

  return (
    /* Sử dụng z-[9999] để CHẮC CHẮN đè lên tất cả header của Handsontable Excel */
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl flex flex-col min-h-[580px] justify-between border border-slate-100 relative overflow-hidden">
        
        {/* --- MÀN HÌNH CÀI ĐẶT TRƯỚC KHI CHƠI --- */}
        {!isPlaying ? (
          <div className="text-center my-auto max-w-lg mx-auto">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
              <span className="text-3xl">🎯</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
              Thử Thách Nối Từ Vựng
            </h2>
            <p className="text-slate-500 mb-8 text-sm">
              Đã nhận diện <strong className="text-indigo-600 font-bold">{questions.length}</strong> từ vựng hợp lệ trong bảng.
            </p>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 mb-8 space-y-4 text-left shadow-inner">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ⏱️ Thời gian cho mỗi câu (giây):
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ❌ Số lần chọn sai tối đa mỗi câu (N ≥ 1):
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxWrongAllowed}
                  onChange={(e) => setMaxWrongAllowed(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
                <p className="text-xs text-slate-400 mt-1">
                  * Nếu chọn sai quá số lần này hoặc hết giờ, câu hỏi sẽ được tính là sai.
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-slate-300 font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Quay lại bảng
              </button>
              <button
                onClick={handleStartGame}
                className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition cursor-pointer"
              >
                Bắt đầu chơi ngay
              </button>
            </div>
          </div>
        ) : isGameOver ? (
          /* --- MÀN HÌNH TỔNG KẾT (GAME OVER) --- */
          <div className="text-center my-auto py-8">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">
              Hoàn Thành Bài Kiểm Tra!
            </h3>
            <p className="text-slate-500 mb-6">
              Bạn đã trả lời xong toàn bộ từ vựng trong danh sách.
            </p>

            {/* Thẻ hiển thị Điểm = Số câu đúng / Tổng số câu */}
            <div className="max-w-xs mx-auto bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-6 mb-8 shadow-sm">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-500 block mb-1">
                Kết Quả Đúng
              </span>
              <div className="text-5xl font-black text-indigo-700">
                {correctCount} <span className="text-2xl font-bold text-slate-400">/ {shuffledQuestions.length}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                Quay lại bảng
              </button>
              <button
                onClick={handleStartGame}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md transition cursor-pointer"
              >
                Chơi lại lần nữa
              </button>
            </div>
          </div>
        ) : (
          /* --- MÀN HÌNH CHƠI GAME CHÍNH --- */
          <div className="flex flex-col h-full justify-between">
            
            {/* 1. Header: Điểm số & Trạng thái câu hiện tại */}
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                    Câu {currentIndex + 1} / {shuffledQuestions.length}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    Đã xong: {completedCount}/{shuffledQuestions.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Hiển thị Điểm đơn giản: Đúng / Tổng */}
                  <div className="text-sm font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
                    ⭐ Đúng: {correctCount} / {shuffledQuestions.length}
                  </div>
                  {!currentProgress.solved && (
                    <div className={`text-sm font-extrabold px-3 py-1.5 rounded-lg transition-colors ${
                      timeLeft <= 5 ? "bg-red-100 text-red-600 animate-pulse" : "bg-amber-100 text-amber-800"
                    }`}>
                      ⏱️ {timeLeft}s
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Thanh điều hướng số câu hỏi (Tối ưu cho cả 1000 câu) */}
              <div className="mb-6">
                {/* Thanh tiến độ tổng quan (Progress Bar) */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${(completedCount / shuffledQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Danh sách nút số câu: Dùng max-w và overflow-x-auto để cuộn ngang mượt mà */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 px-1 max-w-full justify-start md:justify-center scrollbar-thin scrollbar-thumb-slate-200">
                  {shuffledQuestions.map((_, idx) => {
                    const prog = questionProgress[idx] || {};
                    const isCurrent = idx === currentIndex;
                    let bgStyle = "bg-slate-100 text-slate-600 border-slate-200";

                    if (isCurrent) {
                      bgStyle =
                        "ring-2 ring-indigo-500 ring-offset-2 bg-white text-indigo-600 font-bold border-indigo-300";
                    } else if (prog.solved) {
                      bgStyle = prog.isCorrect
                        ? "bg-green-100 text-green-700 border-green-300 font-bold"
                        : "bg-red-100 text-red-700 border-red-300 font-bold";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          playSound("click");
                          setCurrentIndex(idx);
                        }}
                        className={`w-9 h-9 rounded-xl border text-xs shrink-0 flex items-center justify-center transition cursor-pointer ${bgStyle}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Trung tâm: Chữ chính & Bảng đáp án */}
            <div className="my-auto">
              <div className="text-center mb-8">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">
                  {currentProgress.solved
                    ? currentProgress.isCorrect
                      ? "✅ ĐÃ TRẢ LỜI CHÍNH XÁC"
                      : "❌ ĐÃ HẾT LƯỢT HOẶC HẾT GIỜ"
                    : "HÃY CHỌN CỤM TỪ GHÉP ĐÚNG VỚI CHỮ CHÍNH:"}
                </span>

                <div className={`text-5xl font-black inline-block px-10 py-5 rounded-3xl border shadow-sm transition-all ${
                  currentProgress.solved
                    ? currentProgress.isCorrect
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}>
                  {currentQuestion.prompt}
                </div>
              </div>

              {/* Lưới đáp án */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[240px] overflow-y-auto p-1">
                {allOptions.map((option, idx) => {
                  const isWrong = currentProgress.selectedWrongs.includes(option);
                  const isCorrect = currentProgress.solved && option === currentQuestion.answer;
                  const isDisabled = currentProgress.solved || isWrong;

                  let cardStyle = "bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 shadow-sm";

                  if (isCorrect) {
                    cardStyle = "bg-green-500 border-green-600 text-white font-bold shadow-md";
                  } else if (isWrong) {
                    cardStyle = "bg-red-50 border-red-200 text-red-400 line-through cursor-not-allowed opacity-60";
                  } else if (currentProgress.solved) {
                    cardStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-50 cursor-not-allowed";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isDisabled}
                      onClick={() => handleSelectOption(option)}
                      className={`p-4 rounded-2xl font-semibold text-base border transition text-center cursor-pointer ${cardStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Footer: Nút điều hướng Câu trước / Câu tiếp */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-6">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
              >
                ⬅ Câu trước
              </button>

              <button
                onClick={onClose}
                className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                Dừng & Thoát
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === shuffledQuestions.length - 1}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition cursor-pointer"
              >
                Câu tiếp ➡
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}