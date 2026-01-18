const fs = require("fs");
const path = __dirname + "/cache/addGroup.json";

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));

module.exports.config = {
  name: "تقييد",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "Y-ANBU",
  description: "تقييد كروب",
  commandCategory: "المجموعة",
  usages: "تقييد",
  cooldowns: 3
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const restrictList = JSON.parse(fs.readFileSync(path));

  const isRestricted = restrictList.includes(threadID);
  if (isRestricted) {
    restrictList.splice(restrictList.indexOf(threadID), 1);
    fs.writeFileSync(path, JSON.stringify(restrictList, null, 2));
    return api.sendMessage("تم الغاء تقييد البوت", threadID, messageID);
  } else {
    restrictList.push(threadID);
    fs.writeFileSync(path, JSON.stringify(restrictList, null, 2));
    return api.sendMessage("تم تقييد البوت 🐢", threadID, messageID);
  }
};
