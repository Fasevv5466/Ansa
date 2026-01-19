const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_KEY = "2996604001ddc6ac753ae31d0b2b1ceb";

module.exports.config = {
  name: "su",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "توليد / تعديل صورة بالذكاء الاصطناعي",
  commandCategory: "صور",
  usages: "صورة <وصف>",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args.length)
    return api.sendMessage("✏️ اكتب وصف الصورة", threadID, messageID);

  const prompt = args.join(" ");

  api.sendMessage("⏳ جاري توليد الصورة...", threadID);

  try {
    const res = await axios.post(
      "https://api.4oimageapi.io/api/v1/gpt4o-image/generate",
      {
        prompt: prompt,
        size: "1:1"
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // حسب رد الموقع (أغلب الوقت يرجع رابط)
    const imageUrl =
      res.data?.data?.[0]?.url ||
      res.data?.imageUrl ||
      null;

    if (!imageUrl)
      return api.sendMessage("❌ فشل توليد الصورة", threadID, messageID);

    // تحميل الصورة
    const imgPath = path.join(__dirname, "cache/ai_image.png");
    const img = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, img.data);

    // إرسالها
    api.sendMessage(
      { attachment: fs.createReadStream(imgPath) },
      threadID,
      messageID
    );

  } catch (e) {
    console.error(e.response?.data || e.message);
    api.sendMessage("❌ حدث خطأ أثناء الاتصال بالـ API", threadID, messageID);
  }
};

