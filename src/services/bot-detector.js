const crawlers = require('crawler-user-agents/crawler-user-agents.json');

const bots = crawlers.map(crawler => ({ regex: new RegExp(crawler.pattern), url: crawler.url }));

module.exports = {
  detect(ua) {
    const data = { detected: false };
    if (!ua) return data;
    const bot = bots.find(b => b.regex.test(ua));
    if (!bot) return data;
    data.detected = true;
    data.pattern = bot.regex.toString();
    data.value = bot.regex.exec(ua).shift();
    data.url = bot.url || undefined;
    return data;
  },
};
