const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_KEY = "2996604001ddc6ac753ae31d0b2b1ceb";

module.exports.config = {
  name: "مولد",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Fix by ChatGPT",
  description: "توليد صورة بالذكاء الاصطناعي",
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
      "https://api.4oimageapi.io/api/v1/images/generations",
      {
        model: "gpt-4o-image",
        prompt: prompt,
        size: "1024x1024"
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const imageBase64 = res.data?.data?.[0]?.b64_json;
    if (!imageBase64)
      return api.sendMessage("❌ فشل توليد الصورة", threadID, messageID);

    const imgPath = path.join(__dirname, "cache/ai.png");
    fs.writeFileSync(imgPath, Buffer.from(imageBase64, "base64"));

    api.sendMessage(
      { attachment: fs.createReadStream(imgPath) },
      threadID,
      messageID
    );

  } catch (e) {
    console.error(e.response?.data || e.message);
    api.sendMessage("❌ خطأ من API (الرصيد أو الطلب)", threadID, messageID);
  }
};
