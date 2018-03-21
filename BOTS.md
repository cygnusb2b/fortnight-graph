# Bots

## Request Types

## Overview of all Events
```js
db.getCollection('analytics-events').aggregate([
  {
    // Date will track data after load headers and blacklisting were applied.
    $match: { 'bot.detected': false, d: { $gt: ISODate('2018-03-21 02:23:45.867Z') } },
  },
  {
    $group: {
      _id: '$e',
      n: { $sum: 1 },
    },
  },
  {
    $sort: { n: -1 },
  },
]);
```

## Detection and Weighting
Bots are initially detected via the `User-Agent` request header. An agent will be flagged as a bot when one of these conditions are met (processed in-order):
1. No value was provided with the request. A weight of `0.8` is applied.
2. The value matches a blacklisted agent. A weight of `1.0` is applied.
3. The value matches a known bot match pattern (e.g. GoogleBot). A weight of `1` is applied.
4. The value contains a generic, crawler like term (e.g 'bot' or 'spider'). A weight of `0.9` is applied.
5. The value starts with a common backend programing language (e.g. 'php' or 'java'). A weight of `0.9` is applied.
6. The value cannot be parsed into a common browser name (e.g. 'Chrome' or 'Firefox'). A weight of `0.7` is applied.

## Referrer
When clicking (i.e. sending a `click` event), bots will _won't_ send a `Referer` header.

### Data for Click Events
| Bot Weight | Total Events | No Referrer | %     |
|------------|--------------|-------------|-------|
| 1.0        | 1,447        | 1,446       | 99.9% |
| 0.9        | 4,196        | 4,079       | 97.2% |
| 0.8        | N/A          | N/A         | N/A   |
| 0.7        | 1            | 1           | 100%  |

Here's the query for the above table:
```js
db.getCollection('analytics-events').aggregate([
  {
    $match: { e: 'click', 'bot.detected': true, d: { $gt: ISODate('2018-03-21 02:23:45.867Z') } },
  },
  {
    $group: {
      _id: { ref: '$ref', weight: '$bot.weight' },
      n: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      hasReferrer: { $ne: [{ $ifNull: ['$_id.ref', '--NO-REFERRER--'] }, '--NO-REFERRER--'] },
      weight: '$_id.weight',
      n: 1,
    },
  },
  {
    $group: {
      _id: { hasReferrer: '$hasReferrer', weight: '$weight' },
      n: { $sum: '$n' },
    },
  },
  {
    $group: {
      _id: '$_id.weight',
      counts: { $push: { hasReferrer: '$_id.hasReferrer', n: '$n' } },
      total: { $sum: '$n' },
    },
  },
  { $sort: { _id: -1 } },
]);
```
-------
The followng aggegration query can be executed to analyze bots that are sending a `Referer` with a click event.
It's _possible_ these could be legitimate clicks, however it's more likely that the bot is passing a Referer through.
```js
db.getCollection('analytics-events').aggregate([
  {
    $match: {
      e: 'click',
      'bot.detected': true,
      ref: { $exists: true },
      d: { $gt: ISODate('2018-03-21 02:23:45.867Z') },
    },
  },
  {
    $group: {
      _id: {
        weight: '$bot.weight',
        ua: '$ua.ua',
      },
      n: { $sum: 1 },
    },
  },
  {
    $group: {
      _id: '$_id.weight',
      agents: { $push: { name: '$_id.ua', n: '$n' } },
      n: { $sum: '$n' },
    },
  },
  {
    $sort: { n: -1 },
  },
]);
```

### Reverse Look
In addition, when looking at _non-bot_ `click` events, the `Referer` is almost _always_ sent. In fact, when it isn't, deeper analysis will likely show that the particular agent is actually a bot _masking_ itself as a legitimate agent.

This query will load all `click` events where a bot was not detected, but a `Referer` was not sent.
```js
db.getCollection('analytics-events').aggregate([
  {
    $match: {
      e: 'click',
      'bot.detected': false,
      ref: { $exists: false },
      ip: { $exists: true },
      d: { $gt: ISODate('2018-03-21 02:23:45.867Z') }
    },
  },
  {
    $group: {
      _id: {
        ua: '$ua.ua',
      },
      n: { $sum: 1 },
      ips: { $addToSet: '$ip' },
    },
  },
  {
    $group: {
      _id: null,
      agents: { $push: { name: '$_id.ua', n: '$n', ips: '$ips' } },
      n: { $sum: '$n' },
    },
  },
]);
```
Some of these may be legitimate (though it's doubtful). Where problems tend to occur is when a single user agent starts generating _many_ clicks, usually from _many_ IPs in the same range (e.g. Bloomberg), or from the same location (e.g. Germany or Nigeria). For example, it was determined that the following user agent, will looking legitimate, was actually a Bloomberg bot, based on the lack of a `Referer`, the large click volume, and the large IP address range (which is owned by Bloomberg LP).
```json
{
  "name": "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1;)",
  "n": 1786.0,
  "ips": [
    "69.191.211.215",
    "69.191.249.221",
    "69.191.211.218",
    "69.191.211.212",
    "69.191.211.216",
    "69.191.211.213",
    "69.191.211.201",
    "69.191.249.201",
    "69.191.249.214",
    "69.191.249.207",
    "69.191.211.206",
    "69.191.249.215",
    "69.191.249.218",
    "69.191.249.202",
    "69.191.249.212",
    "69.191.249.217",
    "69.191.249.210",
    "69.191.249.216",
    "69.191.249.220",
    "69.191.211.204",
    "69.191.249.206",
    "69.191.249.211",
    "69.191.249.213",
    "69.191.211.203",
    "69.191.211.217",
    "69.191.211.219",
    "69.191.211.207",
    "69.191.211.210",
    "69.191.249.219",
    "69.191.211.211",
    "69.191.211.202",
    "69.191.211.214"
  ]
}
```
We also know that there are more Bloomberg IPs that are generating false `request` events (and possibly loads). Bloomberg's IP regex:
`/^((69\.187\.(16|17|18|19|20|21|22|23|24|25|26|27|31)\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])))|((69\.191\.(176|177|178|179|180|181|182|183|192|193|194|195|198|199|200|204|205|206|207|208|209|210|211|212|214|216|220|226|229|230|231|233|240|241|242|243|244|245|247|248|249|250|251|252|253|254|255)\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])))$/`

Sometimes, however, a single agent may only utilize one IP, but generate large click volumes, as seen here:
```json
{
  "name" : "Mozilla/5.0 (Linux; U; Android 4.4.3;) AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30 Opera News/1.0",
  "n" : 2142.0,
  "ips" : [
      "107.167.122.77"
  ]
}
```
This turned out to be an Opera News mobile app bot.

Other examples tend to be server backends, as the IPs normally resolve to AWS or other hosting companies, primarily foreign.


## Report by Browser Major Verson
```js
(function(db) {
  const lines = [];
  lines.push('"Browser","Version","Requests","Loads","Views","Clicks"');

  db.getCollection('analytics-events').aggregate([
    {
      // Date will track data after load headers and blacklisting were applied.
      $match: { 'bot.detected': false, d: { $gt: ISODate('2018-03-21 02:23:45.867Z') } },
    },
    {
      $group: {
        _id: {
          event: '$e',
          browser: '$ua.browser.name',
          version: '$ua.browser.major',
        },
        n: { $sum: 1 },
      },
    },

    {
      $group: {
        _id: {
          browser: '$_id.browser',
          version: '$_id.version',
        },
        events: { $push: { name: '$_id.event', n: '$n' } },
      },
    },
    {
      $project: {
        _id: 0,
        browser: '$_id.browser',
        version: '$_id.version',
        events: 1,
      },
    },
    {
      $sort: {
        browser: 1,
        version: -1,
      },
    },
  ], { collation: { locale: 'en_US', numericOrdering: true } }).forEach((row) => {
    const counts = row.events.reduce((agg, event) => {
      agg[event.name] = event.n;
      return agg;
    }, {});
    lines.push(`"${row.browser}","${row.version}",${counts.request || 0},${counts.load || 0},${counts.view || 0},${counts.click || 0}`);
  });
  const csv = lines.join('\n');
  print(csv);
})(db);
```

### Excluding Versions
```js
(function(db) {
  const lines = [];
  lines.push('"Browser","Version","Requests","Loads","Views","Clicks"');

  const supported = [
    { name: 'Chrome', from: '50' },
    { name: 'Edge', from: '12' },
    { name: 'Firefox', from: '50' },
    { name: 'GSA', from: '1' },
    { name: 'IE', from: '11' },
    { name: 'Mobile Safari', from: '7' },
    { name: 'Opera', from: '40' },
    { name: 'Safari', from: '7' },
    { name: 'Samsung Browser', from: '1' },
    { name: 'Silk', from: '60' },
    { name: 'Vivaldi', from: '1' },
    { name: 'UCBrowser', from: '10' },
    { name: 'QQBrowser', from: '8' },
  ];

  const $or = supported.map((browser) => {
    return { 'ua.browser.name': browser.name, 'ua.browser.major': { $gte: browser.from } };
  });

  db.getCollection('analytics-events').aggregate([
    {
      // Date will track data after load headers and blacklisting were applied.
      $match: {
        'bot.detected': false,
        d: { $gt: ISODate('2018-03-21 02:23:45.867Z') },
        $or,
      },
    },
    {
      $group: {
        _id: {
          event: '$e',
          browser: '$ua.browser.name',
          version: '$ua.browser.major',
        },
        n: { $sum: 1 },
      },
    },

    {
      $group: {
        _id: {
          browser: '$_id.browser',
          version: '$_id.version',
        },
        events: { $push: { name: '$_id.event', n: '$n' } },
      },
    },
    {
      $project: {
        _id: 0,
        browser: '$_id.browser',
        version: '$_id.version',
        events: 1,
      },
    },
    {
      $sort: {
        browser: 1,
        version: -1,
      },
    },
  ], { collation: { locale: 'en_US', numericOrdering: true } }).forEach((row) => {
    const counts = row.events.reduce((agg, event) => {
      agg[event.name] = event.n;
      return agg;
    }, {});
    lines.push(`"${row.browser}","${row.version}",${counts.request || 0},${counts.load || 0},${counts.view || 0},${counts.click || 0}`);
  });
  const csv = lines.join('\n');
  print(csv);
})(db);
```

```js
(function(db) {
  const supported = [
    { name: 'Chrome', from: '50' },
    { name: 'Edge', from: '12' },
    { name: 'Firefox', from: '50' },
    { name: 'GSA', from: '1' },
    { name: 'IE', from: '11' },
    { name: 'Mobile Safari', from: '7' },
    { name: 'Opera', from: '40' },
    { name: 'Safari', from: '7' },
    { name: 'Samsung Browser', from: '1' },
    { name: 'Silk', from: '60' },
    { name: 'Vivaldi', from: '1' },
    { name: 'UCBrowser', from: '10' },
    { name: 'QQBrowser', from: '8' },
  ];

  const $or = supported.map((browser) => {
    return { 'ua.browser.name': browser.name, 'ua.browser.major': { $gte: browser.from } };
  });

  const results = db.getCollection('analytics-events').aggregate([
    {
      // Date will track data after load headers and blacklisting were applied.
      $match: { 'bot.detected': false, d: { $gt: ISODate('2018-03-21 02:23:45.867Z') }, $or },
    },
    {
      $group: {
        _id: '$e',
        n: { $sum: 1 },
      },
    },
    {
      $sort: { n: -1 },
    },
  ]).toArray();
  print(results);
})(db);
```


```js
db.getCollection('analytics-events').aggregate([
  {
    $match: {
      e: 'click',
      'bot.detected': false,
      ref: { $exists: true },
      d: { $gt: ISODate('2018-03-21 02:23:45.867Z') },
    },
  },
  {
    $group: {
      _id: null,
      n: { $sum: 1 },
    },
  },
]);
```

```js
(function(db) {
  const lines = [];
  lines.push('"Publisher ID","Publisher","Placement ID","Placement","Day","Requests","Loads","Views","Clicks"');

  db.getCollection('analytics-events').aggregate([
    {
      // Date will track data after load headers and blacklisting were applied.
      $match: { 'bot.detected': false, d: { $gt: ISODate('2018-03-21 02:23:45.867Z') } },
    },
    {
      $group: {
        _id: {
          event: '$e',
          pid: '$pid',
          day: { $dateToString: { format: '%Y-%m-%d', date: '$d' } },
        },
        n: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: {
          pid: '$_id.pid',
          day: '$_id.day',
        },
        events: { $push: { name: '$_id.event', n: '$n' } },
      },
    },
    {
      $lookup: {
        from: 'placements',
        localField: '_id.pid',
        foreignField: '_id',
        as: '_id.placement',
      },
    },
    {
      $unwind: '$_id.placement',
    },
    {
      $lookup: {
        from: 'publishers',
        localField: '_id.placement.publisherId',
        foreignField: '_id',
        as: '_id.placement.publisher',
      },
    },
    {
      $unwind: '$_id.placement.publisher',
    },
    {
      $project: {
        _id: 0,
        publisherId: '$_id.placement.publisher._id',
        publisher: '$_id.placement.publisher.name',
        placementId: '$_id.placement._id',
        placement: '$_id.placement.name',
        day: '$_id.day',
        count: '$n',
        events: '$events',
      },
    },
    {
      $sort: {
        date: -1,
        publisher: 1,
        placement: 1,
      },
    }
  ]).forEach((row) => {
    const counts = row.events.reduce((agg, event) => {
      agg[event.name] = event.n;
      return agg;
    }, {});
    lines.push(`"${row.publisherId.valueOf()}","${row.publisher}","${row.placementId.valueOf()}","${row.placement}","${row.day}",${counts.request || 0},${counts.load || 0},${counts.view || 0},${counts.click || 0}`);
  });
  const csv = lines.join('\n');
  print(csv);
})(db);
```
