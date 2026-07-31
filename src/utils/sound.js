// src/utils/sound.js

const sounds = {
  click: new Audio("/sounds/click.mp3"),
  correct: new Audio("/sounds/correct.mp3"),
  wrong: new Audio("/sounds/wrong.mp3"),
  finish: new Audio("/sounds/finish.mp3"),
};

export function playSound(name) {
  const audio = sounds[name];
  if (audio) {
    audio.currentTime = 0; // Reset về 0 để có thể click liên tục không bị mất âm
    audio.play().catch(() => {
      // Tránh lỗi trình duyệt chặn autoplay khi user chưa tương tác
    });
  }
}