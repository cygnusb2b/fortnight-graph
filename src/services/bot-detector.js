const crawlers = require('crawler-user-agents/crawler-user-agents.json');
const validator = require('validator');
const UAParser = require('ua-parser-js');

const parser = new UAParser();
const bots = crawlers.map(crawler => ({ regex: new RegExp(crawler.pattern, 'i'), url: crawler.url }));

const generic = /bot|crawler|checker|fetcher|monitor|spider|browserkit|feed|proxy|downloader|scraper/i;
const backends = /^php|^java|^python-requests|^python|^ruby|^node|^wordpress/i;

const blacklist = [
  // Opera News App Crawler
  'Mozilla/5.0 (Linux; U; Android 4.4.3;) AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 Opera News/1.0',
  // Bloomberg's disguised bot
  'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1;)',
];


/**
 * Determining bot probability, in order of precedence.
 *
 * 1. If no `ua` is provided, 80%
 * 2. If the `ua` matches a blacklisted UA, 100%
 * 3. If the `ua` matches a known bot, 100%
 * 4. If the `ua` contains a generic, crawler-like term, 90%
 * 5. If the `ua` starts with a common backend name (like PHP), 90%
 * 6. If a `ua` is present, but a browser cannot be parsed, 70%
 *
 * For all of the above, an optional whitelist of user agents should also be allowed,
 * that will prevent the detector from marking the `ua` as a bot.
 */
module.exports = {
  formatValue(v) {
    if (!v) return '';
    return validator.trim(String(v), ' /\\-_').toLowerCase();
  },

  detect(ua) {
    const data = { detected: true };

    if (!ua) {
      data.reason = 'No user agent value was provided.';
      data.weight = 0.8;
      return data;
    }

    if (blacklist.includes(ua)) {
      data.reason = 'Matched a blacklisted agent.';
      data.weight = 1;
      return data;
    }

    const bot = bots.find(b => b.regex.test(ua));
    if (bot) {
      data.reason = 'Matched a known bot pattern.';
      data.weight = 1;
      data.pattern = bot.regex.toString();
      data.value = this.formatValue(bot.regex.exec(ua).shift());
      data.url = bot.url || undefined;
      return data;
    }
    const genericMatch = ua.match(generic);
    if (genericMatch) {
      data.reason = 'Matched a common bot pattern.';
      data.weight = 0.9;
      data.pattern = generic.toString();
      data.value = this.formatValue(genericMatch.shift());
      return data;
    }

    const backendMatch = ua.match(backends);
    if (backendMatch) {
      data.reason = 'Matched a common backend pattern.';
      data.weight = 0.9;
      data.pattern = backends.toString();
      data.value = this.formatValue(backendMatch.shift());
      return data;
    }

    const { name } = parser.setUA(ua).getBrowser();
    if (!name) {
      data.reason = 'Unable to parse a browser name.';
      data.weight = 0.7;
      return data;
    }
    data.detected = false;
    return data;
  },
};
