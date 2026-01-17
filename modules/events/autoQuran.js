const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "autoQuran",
  version: "8.5.0",
  credits: "Ayman",
  hasPermssion: 2,
  description: "نظام قرآن تلقائي ذكي مع نظام مكافحة الباند المتقدم",
  commandCategory: "اسلاميات"
};

const SETTINGS = {
  minDelay: 45 * 60 * 1000, 
  maxDelay: 75 * 60 * 1000, 
  maxPerDay: 20,             
  admins: ["61577861540407"] 
};

module.exports.onLoad = async function ({ api }) {
  if (global.autoQuranStarted) return;
  global.autoQuranStarted = true;
  global.autoQuranEnabled = true;
  global.sentToday = 0;
  global.lastDay = new Date().getDate();

  // تأكد من وجود مجلد الكاش وتصفية الملفات القديمة
  const cacheDir = path.join(__dirname, "cache", "quran");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  fs.emptyDirSync(cacheDir);

  const sendQuran = async () => {
    const today = new Date().getDate();
    if (today !== global.lastDay) { global.sentToday = 0; global.lastDay = today; }

    if (!global.autoQuranEnabled || global.sentToday >= SETTINGS.maxPerDay) return scheduleNext();

    try {
      // جلب قائمة القراء
      const readersRes = await axios.get("https://www.mp3quran.net/api/v3/reciters?language=ar");
      const reciters = readersRes.data.reciters;
      const reader = reciters[Math.floor(Math.random() * reciters.length)];
      
      // جلب قائمة السور المتاحة لهذا القارئ (تصحيح مهم: السور تختلف من قارئ لآخر)
      const moshaf = reader.moshaf[0]; // اختيار المصحف الأول المتاح
      const surahsList = moshaf.surah_list.split(",");
      const randomSurahID = surahsList[Math.floor(Math.random() * surahsList.length)];
      
      // جلب اسم السورة من API السور
      const surahsRes = await axios.get("https://www.mp3quran.net/api/v3/suwar?language=ar");
      const surahInfo = surahsRes.data.suwar.find(s => s.id == randomSurahID);

      const mp3Url = `${moshaf.server}/${randomSurahID.padStart(3, '0')}.mp3`;
      const mp3Path = path.join(cacheDir, `quran_${Date.now()}.mp3`);

      // تحميل الملف
      const response = await axios({
        method: 'get',
        url: mp3Url,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(mp3Path);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stats = fs.statSync(mp3Path);
      if (stats.size > 25 * 1024 * 1024) {
        fs.unlinkSync(mp3Path);
        throw new Error("الملف كبير جداً");
      }

      const threads = await api.getThreadList(30, null, ["INBOX"]);
      let count = 0;

      for (const t of threads) {
        if (!t.isGroup || !t.isSubscribed) continue;

        try {
          await api.sendMessage({
            body: `◈ ───『 الـقُـرآنُ الـكَـرِيـم 』─── ◈\n\n📖 السورة: ${surahInfo ? surahInfo.name : "غير معروف"}\n🎙️ القارئ: ${reader.name}\n\n✨ استمع واجعل قلبك يطمئن ✨\n◈ ────────────── ◈`,
            attachment: fs.createReadStream(mp3Path)
          }, t.threadID);
          
          count++;
          const sleep = Math.floor(Math.random() * 10000) + 7000;
          await new Promise(r => setTimeout(r, sleep));

          if (count % 5 === 0) await new Promise(r => setTimeout(r, 60000)); // دقيقة راحة كل 5 إرسالات
        } catch (err) { console.log(`خطأ في الإرسال للجروب ${t.threadID}`); }
      }

      if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
      global.sentToday++;

    } catch (e) {
      console.log("AutoQuran Error:", e.message);
    }
    scheduleNext();
  };

  const scheduleNext = () => {
    const next = Math.floor(Math.random() * (SETTINGS.maxDelay - SETTINGS.minDelay)) + SETTINGS.minDelay;
    console.log(`📿 [AutoQuran] النشر القادم بعد ${(next / 60000).toFixed(1)} دقيقة`);
    setTimeout(sendQuran, next);
  };

  scheduleNext();
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  if (!SETTINGS.admins.includes(senderID)) return api.sendMessage("⚠️ عذراً أيمن، هذا الأمر تحت سيطرتك المطلقة فقط.", threadID, messageID);

  if (args[0] === "on") {
    global.autoQuranEnabled = true;
    return api.sendMessage("✅ تم تفعيل نظام النشر التلقائي للقرآن بنجاح.", threadID, messageID);
  }
  if (args[0] === "off") {
    global.autoQuranEnabled = false;
    return api.sendMessage("⛔ تم إيقاف النظام مؤقتاً بأمر المطور.", threadID, messageID);
  }

  return api.sendMessage(
    `◈ ───『 إعـدادات الـقـرآن 』─── ◈\n\n` +
    `◯ الحالة الحالية: ${global.autoQuranEnabled ? "نشط ✅" : "متوقف ⛔"}\n` +
    `◯ تم النشر اليوم: ${global.sentToday}/${SETTINGS.maxPerDay}\n\n` +
    `💡 للتحكم أرسل:\n` +
    `- autoQuran on\n` +
    `- autoQuran off\n` +
    `◈ ────────────── ◈`,
    threadID, messageID
  );
};
