import dictionary from "./dictionary";

export async function loadDictionary() {
  if (dictionary.size > 0) return;

  console.log("Loading dictionary.json...");
  try {
    const response = await fetch("/dictionary.json");
    const data = await response.json();

    for (const [key, value] of Object.entries(data)) {
      dictionary.set(key, value);
    }
    console.log(`Loaded ${dictionary.size} words into Map.`);
  } catch (error) {
    console.error("Lỗi tải từ điển:", error);
  }
}