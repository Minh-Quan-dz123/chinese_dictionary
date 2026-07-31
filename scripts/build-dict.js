import fs from "fs";
import path from "path";
import readline from "readline";
import https from "https";
import zlib from "zlib";

const OUTPUT_PATH = path.resolve("public/dictionary.json");
const CEDICT_URL = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz";

function fetchCedict(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "NodeJS/Dictionary-Builder" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchCedict(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} from ${url}`));
      }
      const gunzip = zlib.createGunzip();
      resolve(res.pipe(gunzip));
    }).on("error", reject);
  });
}

async function buildDictionary() {
  console.log("⏳ Đang tải bộ từ điển CC-CEDICT từ MDBG (khoảng 3MB)...");

  if (!fs.existsSync("public")) {
    fs.mkdirSync("public", { recursive: true });
  }

  try {
    const stream = await fetchCedict(CEDICT_URL);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    // Dùng Map() giúp tra cứu và chèn từ khóa nhanh hơn Object{} gấp nhiều lần trong vòng lặp lớn
    const dictMap = new Map();

    console.log("⏳ Đang xử lý Pinyin và nghĩa cho chữ GIẢN THỂ (Chế độ Turbo)...");

    for await (const line of rl) {
      if (line.charCodeAt(0) === 35 || !line.trim()) continue; // Kiểm tra nhanh ký tự '#' bằng mã ASCII

      // Cấu trúc CEDICT: [Phồn] [Giản] [pin1 yin1] /meaning 1/meaning 2/
      const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/);
      if (match) {
        const simp = match[2];

        // Kiểm tra TRƯỚC: Nếu từ Giản thể này chưa có trong Map thì mới xử lý nghĩa
        if (!dictMap.has(simp)) {
          const pinyin = match[3];
          const meaningRaw = match[4];

          // Làm sạch nghĩa tiếng Anh
          const cleanMeaning = meaningRaw
            .split("/")
            .filter((m) => !m.startsWith("CL:"))
            .join("; ");

          dictMap.set(simp, {
            p: pinyin,
            m: cleanMeaning,
          });
        }
      }
    }

    // Chuyển Map thành Object tĩnh để lưu ra file JSON
    const dict = Object.fromEntries(dictMap);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dict));
    console.log("--------------------------------------------------");
    console.log(`✅ HOÀN TẤT TỪ ĐIỂN GIẢN THỂ:`);
    console.log(`   - Tổng số từ Giản thể : ${dictMap.size} từ`);
    console.log("--------------------------------------------------");
    console.log("🚀 Giờ mày chỉ cần gõ lệnh: npm run dev");
  } catch (err) {
    console.error("❌ Lỗi build từ điển:", err.message);
  }
}

buildDictionary();