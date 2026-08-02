import { useState, useEffect, useMemo, useRef } from "react";
import { playSound } from "../utils/sound";

export default function GameModal({ questions, onClose }) {
  // --- STATE CÀI ĐẶT (SETTINGS) ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); 
  const [maxWrongAllowed, setMaxWrongAllowed] = useState(1); 
  
  // YÊU CẦU 1: Số lượng đáp án hiển thị (Người dùng có thể nhập tùy ý)
  const [optionsCount, setOptionsCount] = useState(6);

  // --- STATE TRÒ CHƠI (GAMEPLAY) ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);

  // YÊU CẦU 3: State Zoom mức độ hiển thị (%)
  const [zoomLevel, setZoomLevel] = useState(100);

  const [questionProgress, setQuestionProgress] = useState({});
  const timerRef = useRef(null);

  const shuffledQuestions = useMemo(() => {
    return [...questions].sort(() => Math.random() - 0.5);
  }, [questions, isPlaying]);

  const currentQuestion = shuffledQuestions[currentIndex];

  const currentOptions = useMemo(() => {
    if (!currentQuestion) return [];
    
    const correctAnswer = currentQuestion.answer;
    
    const allWrongAnswers = questions
      .map(q => q.answer)
      .filter(ans => ans !== correctAnswer);

    // Dùng số lượng user nhập (nếu bỏ trống hoặc nhập vớ vẩn thì mặc định là 6)
    const validCount = Math.max(2, Number(optionsCount) || 6);

    const selectedWrongs = allWrongAnswers
      .sort(() => Math.random() - 0.5)
      .slice(0, validCount - 1);

    return [correctAnswer, ...selectedWrongs].sort(() => Math.random() - 0.5);
  }, [currentQuestion, questions, optionsCount]);

  const currentProgress = questionProgress[currentIndex] || {
    solved: false,
    isCorrect: false,
    wrongCount: 0,
    selectedWrongs: [],
  };

  const correctCount = useMemo(() => {
    return Object.values(questionProgress).filter((item) => item.isCorrect).length;
  }, [questionProgress]);

  const completedCount = useMemo(() => {
    return Object.values(questionProgress).filter((item) => item.solved).length;
  }, [questionProgress]);

  useEffect(() => {
    if (!isPlaying || isGameOver || currentProgress.solved || isReviewMode) return;

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
  }, [currentIndex, isPlaying, isGameOver, currentProgress.solved, timeLimit, isReviewMode]);

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

  function handleStartGame() {
    // Đảm bảo optionsCount hợp lệ trước khi vào game
    if (!optionsCount || optionsCount < 2) setOptionsCount(6);

    playSound("click");
    setIsPlaying(true);
    setCurrentIndex(0);
    setIsGameOver(false);
    setIsReviewMode(false);
    setZoomLevel(100); // Reset zoom khi chơi mới

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

  function handleSelectOption(option) {
    if (isGameOver || currentProgress.solved) return;
    if (currentProgress.selectedWrongs.includes(option)) return;

    if (option === currentQuestion.answer) {
      playSound("correct");
      const nextProgress = {
        ...questionProgress,
        [currentIndex]: { ...currentProgress, solved: true, isCorrect: true },
      };
      setQuestionProgress(nextProgress);
      checkGameOver(nextProgress);
    } else {
      playSound("wrong");
      const nextWrongCount = currentProgress.wrongCount + 1;
      const isFailedNow = nextWrongCount >= maxWrongAllowed;

      const nextProgress = {
        ...questionProgress,
        [currentIndex]: {
          ...currentProgress,
          wrongCount: nextWrongCount,
          selectedWrongs: [...currentProgress.selectedWrongs, option],
          solved: isFailedNow,
          isCorrect: false,
        },
      };
      setQuestionProgress(nextProgress);
      if (isFailedNow) checkGameOver(nextProgress);
    }
  }

  function checkGameOver(progress) {
    const allSolved = Object.values(progress).every((item) => item.solved);
    if (allSolved) {
      playSound("finish");
      setIsGameOver(true);
    }
  }

  function handlePrev() {
    playSound("click");
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function handleNext() {
    playSound("click");
    setCurrentIndex((prev) => Math.min(shuffledQuestions.length - 1, prev + 1));
  }
  
  const gridClass = useMemo(() => {
    const count = Number(optionsCount) || 6;
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    if (count <= 12) return "grid-cols-3 md:grid-cols-4";
    return "grid-cols-4 md:grid-cols-5"; // Hỗ trợ nếu user nhập số to hơn 12
  }, [optionsCount]);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* YÊU CẦU 2: Đổi overflow-hidden thành overflow-y-auto và scrollbar-thin để modal cuộn mượt */}
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl flex flex-col min-h-[580px] max-h-[90vh] justify-between border border-slate-100 relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        
        {!isPlaying ? (
          <div className="text-center my-auto max-w-lg mx-auto">
             <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
              <span className="text-3xl">🎯</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
              Thử Thách Nối Từ Vựng
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
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
              </div>
              
              {/* YÊU CẦU 1: Kết hợp input number với datalist để user tự nhập + gợi ý */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  🔠 Số lượng đáp án hiển thị:
                </label>
                <input
                  type="number"
                  min={2}
                  list="options-presets"
                  value={optionsCount}
                  onChange={(e) => setOptionsCount(e.target.value)}
                  placeholder="Gõ số lượng (vd: 3, 5, 8...)"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
                <datalist id="options-presets">
                  <option value="4">4 đáp án (Dễ)</option>
                  <option value="6">6 đáp án (Vừa)</option>
                  <option value="9">9 đáp án (Khó)</option>
                  <option value="12">12 đáp án (Cực khó)</option>
                </datalist>
                <p className="text-xs text-slate-400 mt-1">
                  * Có thể tự gõ số bất kỳ hoặc chọn từ danh sách gợi ý.
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
        ) : isReviewMode ? (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-extrabold text-slate-800">📋 Chi tiết bài làm</h3>
              <div className="text-sm font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
                Tổng điểm: {correctCount} / {shuffledQuestions.length}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
              {shuffledQuestions.map((q, idx) => {
                const prog = questionProgress[idx];
                const isCorrect = prog?.isCorrect;
                
                return (
                  <div key={idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full font-bold text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-800 mb-1">{q.prompt}</div>
                        {prog.wrongCount > 0 && !isCorrect && (
                          <div className="text-sm text-red-500">
                            Đã chọn sai: {prog.selectedWrongs.join(", ")} {prog.wrongCount >= maxWrongAllowed && "(Hết lượt)"}
                          </div>
                        )}
                        {!prog.isCorrect && prog.wrongCount === 0 && prog.solved && (
                          <div className="text-sm text-amber-500">Hết thời gian</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-slate-200 min-w-[200px] text-center shadow-sm">
                      <div className="text-xs text-slate-400 font-bold uppercase mb-1">Đáp án đúng</div>
                      <div className="font-semibold text-slate-700">{q.answer}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center gap-4">
              <button
                onClick={() => setIsReviewMode(false)}
                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                Quay lại tổng kết
              </button>
            </div>
          </div>
        ) : isGameOver ? (
          <div className="text-center my-auto py-8">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">
              Hoàn Thành Bài Kiểm Tra!
            </h3>
            <p className="text-slate-500 mb-6">
              Bạn đã trả lời xong toàn bộ từ vựng trong danh sách.
            </p>

            <div className="max-w-xs mx-auto bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-6 mb-8 shadow-sm">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-500 block mb-1">
                Kết Quả Đúng
              </span>
              <div className="text-5xl font-black text-indigo-700">
                {correctCount} <span className="text-2xl font-bold text-slate-400">/ {shuffledQuestions.length}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => setIsReviewMode(true)}
                className="px-6 py-3 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-semibold transition cursor-pointer"
              >
                Xem lại bài làm
              </button>
              <button
                onClick={handleStartGame}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md transition cursor-pointer"
              >
                Chơi lại
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between">
            {/* Header Toolbar */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 flex-wrap gap-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                  Câu {currentIndex + 1} / {shuffledQuestions.length}
                </span>
                <span className="text-sm font-semibold text-slate-500 hidden sm:inline">
                  Đã xong: {completedCount}/{shuffledQuestions.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* YÊU CẦU 3: Cụm điều khiển Zoom */}
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-xs text-slate-500 font-bold mr-1">🔍</span>
                  <select 
                    value={zoomLevel} 
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="text-xs font-bold bg-transparent text-slate-700 border-none outline-none cursor-pointer"
                  >
                    <option value={25}>25%</option>
                    <option value={50}>50%</option>
                    <option value={75}>75%</option>
                    <option value={100}>100%</option>
                    <option value={125}>125%</option>
                    <option value={150}>150%</option>
                    <option value={175}>175%</option>
                    <option value={200}>200%</option>
                  </select>
                </div>

                <div className="text-sm font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
                  ⭐ {correctCount} đ
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

            {/* Thanh tiến độ */}
            <div className="mb-6">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${(completedCount / shuffledQuestions.length) * 100}%` }}
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-2 px-1 max-w-full justify-start md:justify-center scrollbar-thin scrollbar-thumb-slate-200">
                {shuffledQuestions.map((_, idx) => {
                  const prog = questionProgress[idx] || {};
                  const isCurrent = idx === currentIndex;
                  let bgStyle = "bg-slate-100 text-slate-600 border-slate-200";

                  if (isCurrent) {
                    bgStyle = "ring-2 ring-indigo-500 ring-offset-2 bg-white text-indigo-600 font-bold border-indigo-300";
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

            {/* Vùng GAME PLAY CHÍNH ĐƯỢC ZOOM */}
            <div className="my-auto transition-transform origin-top" style={{ zoom: `${zoomLevel}%` }}>
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

              <div className={`grid ${gridClass} gap-3 max-h-[300px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200`}>
                {currentOptions.map((option, idx) => {
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
                      className={`p-4 rounded-2xl font-semibold text-base border transition text-center cursor-pointer flex items-center justify-center min-h-[72px] ${cardStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-6 shrink-0">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
              >
                ⬅ <span className="hidden sm:inline">Câu trước</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer bg-slate-100 rounded-lg"
              >
                Dừng & Thoát
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === shuffledQuestions.length - 1}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-900 transition cursor-pointer"
              >
                <span className="hidden sm:inline">Câu tiếp</span> ➡
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}