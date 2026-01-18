module.exports = function ({ api, models, Users, Threads, Currencies }) {
  const fs = require("fs");
  const path = require("path");
  const stringSimilarity = require("string-similarity"),
    escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    logger = require("../../utils/log.js");
  const moment = require("moment-timezone");

  return async function ({ event }) {
    const dateNow = Date.now();
    const time = moment.tz("Asia/Manila").format("HH:mm:ss DD/MM/YYYY");
    const { PREFIX, ADMINBOT, DeveloperMode } = global.config;

    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands } = global.client;

    let { body, senderID, threadID, messageID } = event;
    senderID = String(senderID);
    threadID = String(threadID);

    /* =======================
       🔒 نظام التقييد (صمت تام)
       ======================= */
    const restrictPath = path.join(__dirname, "../../script/commands/cache/addGroup.json");
    let restrictList = [];
    try {
      restrictList = JSON.parse(fs.readFileSync(restrictPath));
    } catch {
      restrictList = [];
    }

    if (restrictList.includes(threadID)) {
      const info = threadInfo.get(threadID) || await Threads.getInfo(threadID);
      const isAdmin = info.adminIDs.some(e => e.id == senderID);
      const isDev = ADMINBOT.includes(senderID);

      if (!isAdmin && !isDev) return; // ❌ صمت كامل
    }
    /* ======================= */

    if (!body) return;

    const threadSetting = threadData.get(threadID) || {};
    const prefix = threadSetting.PREFIX || PREFIX;
    const prefixRegex = new RegExp(`^(<@!?${senderID}>|${escapeRegex(prefix)})\\s*`);
    const [matchedPrefix] = body.match(prefixRegex) || [null];
    if (!matchedPrefix) return;

    const args = body.slice(matchedPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    let command = commands.get(commandName);

    if (threadBanned.has(threadID) && !ADMINBOT.includes(senderID)) return;
    if (userBanned.has(senderID) && !ADMINBOT.includes(senderID)) return;

    if (!command) {
      const allCmd = [...commands.keys()];
      const check = stringSimilarity.findBestMatch(commandName, allCmd);
      if (check.bestMatch.rating >= 0.8)
        command = commands.get(check.bestMatch.target);
      else
        return;
    }

    let permssion = 0;
    const info = threadInfo.get(threadID) || await Threads.getInfo(threadID);
    if (ADMINBOT.includes(senderID)) permssion = 2;
    else if (info.adminIDs.some(e => e.id == senderID)) permssion = 1;

    if (command.config.hasPermssion > permssion) return;

    try {
      command.run({
        api,
        event,
        args,
        models,
        Users,
        Threads,
        Currencies,
        permssion
      });

      if (DeveloperMode) {
        logger(`[DEV] ${commandName} | ${senderID} | ${threadID}`, "DEV");
      }
    } catch (e) {
      api.sendMessage(`❌ خطأ:\n${e}`, threadID, messageID);
    }
  };
};

