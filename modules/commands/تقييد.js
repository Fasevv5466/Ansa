const fs = require("fs");
const path = __dirname + "/cache/addGroup.json";

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));

module.exports.config = {
  name: "تقييد",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "Y-ANBU",
  description: "تقييد البوت (صمت تام)",
  commandCategory: "المجموعة",
  usages: "تقييد",
  cooldowns: 3
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  let list = JSON.parse(fs.readFileSync(path));

  if (list.includes(threadID)) {
    list = list.filter(id => id !== threadID);
    fs.writeFileSync(path, JSON.stringify(list, null, 2));
    return api.sendMessage("🔓 تم فك تقييد البوت", threadID, messageID);
  } else {
    list.push(threadID);
    fs.writeFileSync(path, JSON.stringify(list, null, 2));
    return api.sendMessage("🔒 تم تقييد البوت (صمت تام)", threadID, messageID);
  }
};

