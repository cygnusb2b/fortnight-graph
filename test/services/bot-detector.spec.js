const BotDetector = require('../../src/services/bot-detector');
const sandbox = sinon.createSandbox();

describe('services/bot-detector', function() {
  describe('#formatValue', function() {
    [
      [undefined, ''],
      [null, ''],
      ['', ''],
      [' ', ''],
      ['Googlebot/', 'googlebot'],
      ['-\Foo-Bar_/ ', 'foo-bar'],
    ].forEach((values) => {
      it(`should trim and lower case when the value is '${values[0]}'.`, function(done) {
        expect(BotDetector.formatValue(values[0])).to.equal(values[1]);
        done();
      });
    });
  });
  describe('#detect', function() {
    beforeEach(function() {
      sandbox.spy(BotDetector, 'formatValue');
    });
    afterEach(function() {
      sandbox.restore();
    });

    ['', undefined, null].forEach((value) => {
      it(`should return true with a weight of 80% when the UA value is empty: '${value}'.`, function(done) {
        const result = BotDetector.detect(value);
        expect(result).to.be.an('object');
        expect(result.detected).to.be.true;
        expect(result.weight).to.equal(0.8);
        expect(result.reason).to.equal('No user agent value was provided.');
        done();
      });

    });
    [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Googlebot-News',
      'Googlebot-Image/1.0',
      'Googlebot-Video/1.0',
      'SAMSUNG-SGH-E250/1.0 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Browser/6.2.3.3.c.1.101 (GUI) MMP/2.0 (compatible; Googlebot-Mobile/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      '(compatible; Mediapartners-Google/2.1; +http://www.google.com/bot.html)',
      'Mediapartners-Google',
      'AdsBot-Google (+http://www.google.com/adsbot.html)',
      'AdsBot-Google-Mobile-Apps',
      'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (Windows Phone 8.1; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; Lumia 530) like Gecko (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'msnbot/2.0b (+http://search.msn.com/msnbot.htm)',
      'msnbot-media/1.1 (+http://search.msn.com/msnbot.htm)',
      'Mozilla/5.0 (compatible; adidxbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; adidxbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (Windows Phone 8.1; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; Lumia 530) like Gecko (compatible; adidxbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534+ (KHTML, like Gecko) BingPreview/1.0b',
      'Mozilla/5.0 (Windows Phone 8.1; ARM; Trident/7.0; Touch; rv:11.0; IEMobile/11.0; NOKIA; Lumia 530) like Gecko BingPreview/1.0b',
      'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
      'Mozilla/5.0 (compatible; Yahoo Link Preview; https://help.yahoo.com/kb/mail/yahoo-link-preview-SLN23615.html)',
      'DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)',
      'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
      'Mozilla/5.0 (compatible; Baiduspider-image/2.0; +http://www.baidu.com/search/spider.html)',
      'Mozilla/5.0 (compatible; Baiduspider-video/2.0; +http://www.baidu.com/search/spider.html)',
      'Mozilla/5.0 (compatible; Baiduspider-news/2.0; +http://www.baidu.com/search/spider.html)',
      'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
      'Mozilla/5.0 (compatible; YandexAccessibilityBot/3.0; +http://yandex.com/bots)',
      'Mozilla/5.0 (compatible; YandexImages/3.0; +http://yandex.com/bots)',
      'Mozilla/5.0 (compatible; YandexVideo/3.0; +http://yandex.com/bots)',
      'Mozilla/5.0 (compatible; YaDirectFetcher/1.0; Dyatel; +http://yandex.com/bots)',
      'Sogou Pic Spider/3.0( http://www.sogou.com/docs/help/webmasters.htm#07)',
      'Sogou head spider/3.0( http://www.sogou.com/docs/help/webmasters.htm#07)',
      'Sogou web spider/4.0(+http://www.sogou.com/docs/help/webmasters.htm#07)',
      'Sogou Orion spider/3.0( http://www.sogou.com/docs/help/webmasters.htm#07)',
      'Sogou-Test-Spider/4.0 (compatible; MSIE 5.5; Windows 98)',
      'Mozilla/5.0 (compatible; Exabot/3.0; +http://www.exabot.com/go/robot)',
      'facebookexternalhit/1.0 (+http://www.facebook.com/externalhit_uatext.php)',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'ia_archiver (+http://www.alexa.com/site/help/webmasters; crawler@alexa.com)',
      'Java/1.4.1_04',
      'Java/1.8.0_161',
    ].forEach((value) => {
      it(`should return true with a weight of 100% when the UA value is: '${value}'.`, function(done) {
        const result = BotDetector.detect(value);
        expect(result).to.be.an('object');
        expect(result.detected).to.be.true;
        expect(result.weight).to.equal(1);
        expect(result.reason).to.equal('Matched a known bot pattern.');
        sinon.assert.calledOnce(BotDetector.formatValue);
        done();
      });
    });

    [
      'Mozilla/5.0 (Linux; U; Android 4.4.3;) AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 Opera News/1.0',
      'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1;)',
    ].forEach((value) => {
      it(`should return true with a weight of 100% when the UA is blacklisted: '${value}'.`, function(done) {
        const result = BotDetector.detect(value);
        expect(result).to.be.an('object');
        expect(result.detected).to.be.true;
        expect(result.weight).to.equal(1);
        expect(result.reason).to.equal('Matched a blacklisted agent.');
        done();
      });
    });

    [
      'BLP_bbot/0.1',
      'Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:49.0) Gecko/20100101 Firefox/49.0 (FlipboardProxy/1.2; +http://flipboard.com/browserproxy)',
      'Symfony BrowserKit',
      'Mozilla/5.0 (compatible; citycrawler/1.1; +http://www.city-data.com/)',
      'Feedfetcher-Google; (+http://www.google.com/feedfetcher.html)',
      'watson-url-fetcher',
      'robots',
      'some scraper',
      'not a bot',
      'NewsBlur Page Fetcher - 48 subscribers - http://www.newsblur.com/site/358830/nvs-home (Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_1) AppleWebKit/534.48.3 (KHTML, like Gecko) Version/5.1 Safari/534.48.3)',
      'Xaldon WebSpider',
      'TextRazor Downloader (https://www.textrazor.com)',
      'Mozilla/5.0 (compatible;netTrekker-Link-Checker-AAMS/1.0)',
    ].forEach((value) => {
      it(`should return true with a weight of 90% when the UA value is: '${value}'.`, function(done) {
        const result = BotDetector.detect(value);
        expect(result).to.be.an('object');
        expect(result.detected).to.be.true;
        expect(result.weight).to.equal(0.9);
        expect(result.reason).to.equal('Matched a common bot pattern.');
        sinon.assert.calledOnce(BotDetector.formatValue);
        done();
      });
    });

    [
      'python-requests/2.18.4',
      'PHP/5.4',
      'Python/3.6 aiohttp/2.2.0',
      'Ruby',
      'PHP/5.5',
      'python-requests/2.12.3',
      'node-superagent/0.18.2',
      'WordPress/4.9.4; http://www.abelwomack.com',
      'WordPress/4.9.4; https://manhattanherald.com',
    ].forEach((value) => {
      it(`should return true with a weight of 90% when the UA value is: '${value}'.`, function(done) {
        const result = BotDetector.detect(value);
        expect(result).to.be.an('object');
        expect(result.detected).to.be.true;
        expect(result.weight).to.equal(0.9);
        expect(result.reason).to.equal('Matched a common backend pattern.');
        sinon.assert.calledOnce(BotDetector.formatValue);
        done();
      });
    });

    [
      'G-i-g-a-b-o-t',
      'Mozilla',
      'null',
      'axios/0.17.1',
      'Mozilla/5.0 (compatible)',
      'lua-resty-http/0.07 (Lua) ngx_lua/10000',
      'rss',
      'AngleSharp/0.9.9',
      'Chrome',
      '.NET Framework Test Client',
      'HubSpot Marketing Grader',
      'Go 1.1 package http',
      'WinHTTP',
      'CakePHP'
    ].forEach((value) => {
      it(`should return true with a weight of 70% when the UA value is: '${value}'.`, function(done) {
        const result = BotDetector.detect(value);
        expect(result).to.be.an('object');
        expect(result.detected).to.be.true;
        expect(result.weight).to.equal(0.7);
        expect(result.reason).to.equal('Unable to parse a browser name.');
        done();
      });
    });

    [
      'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36 OPR/43.0.2442.991',
      'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.63 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
      'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0',
      'Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586',
      'Mozilla/5.0 (Windows NT 6.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586',
      'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586',
      'Mozilla/5.0 (Windows NT 6.1; Win64; x64; Trident/7.0; rv:11.0) like Gecko',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
      'Mozilla/5.0 (iPad; CPU OS 10_2_1 like Mac OS X) AppleWebKit/602.4.6 (KHTML, like Gecko) Version/10.0 Mobile/14D27 Safari/602.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10240',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8',
      'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0',
      'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
      'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
      'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36 Edge/15.15063',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
      'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.65 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
      'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
      'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0',
      'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0',
      'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36 OPR/43.0.2442.991',
    ].forEach((value) => {
      it(`should return false when the UA value is: '${value}'.`, function(done) {
        expect(BotDetector.detect(value)).to.be.an('object').with.property('detected', false);
        done();
      });
    });
  });
});
