const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_KEY = "2996604001ddc6ac753ae31d0b2b1ceb";

module.exports.config = {
  name: "تعديل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "تعديل صورة بالذكاء الاصطناعي",
  commandCategory: "صور",
  usages: "تعديل <وصف>",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  if (!args.length)
    return api.sendMessage("✏️ اكتب وصف التعديل", threadID, messageID);

  // جلب رابط الصورة
  let imageUrl = null;

  if (messageReply && messageReply.attachments.length > 0) {
    imageUrl = messageReply.attachments[0].url;
  }

  if (!imageUrl)
    return api.sendMessage(
      "📸 ردّ على صورة واكتب التعديل\nمثال:\nتعديل اجعلها كرتونية",
      threadID,
      messageID
    );

  const prompt = args.join(" ");
  api.sendMessage("⏳ جاري تعديل الصورة...", threadID);

  try {
    const res = await axios.post(
      "https://api.4oimageapi.io/api/v1/gpt4o-image/edit",
      {
        image_url: imageUrl,
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

    const editedUrl =
      res.data?.data?.[0]?.url ||
      res.data?.imageUrl ||
      null;

    if (!editedUrl)
      return api.sendMessage("❌ فشل تعديل الصورة", threadID, messageID);

    const imgPath = path.join(__dirname, "cache/edit.png");
    const img = await axios.get(editedUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, img.data);

    api.sendMessage(
      { attachment: fs.createReadStream(imgPath) },
      threadID,
      messageID
    );

  } catch (e) {
    console.error(e.response?.data || e.message);
    api.sendMessage("❌ حدث خطأ أثناء تعديل الصورة", threadID, messageID);
  }
};

