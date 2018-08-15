const env = require('../env');
const { google, auth } = require('../connections/google');

const { isArray } = Array;
const { GA_VIEW_ID } = env;

let conn;

module.exports = {
  async connect() {
    if (!conn) {
      conn = google.analyticsreporting({
        version: 'v4',
        auth: await auth(['https://www.googleapis.com/auth/analytics']),
      });
    }
    return conn;
  },

  /**
   *
   * @param {string} storyId
   * @param {object} params
   * @param {string|Date} params.startDate
   * @param {string|Date} params.endDate
   */
  async storyReport(storyId, { startDate, endDate }) {
    if (!storyId) throw new Error('No story ID was provided.');
    const dateRanges = [{ startDate, endDate }];
    const dimensions = [{ name: 'ga:dimension2' }];
    const metrics = [
      { expression: 'ga:pageviews' },
      { expression: 'ga:uniquePageviews' },
      { expression: 'ga:sessions' },
      { expression: 'ga:users' },
      { expression: 'ga:avgSessionDuration' },
      { expression: 'ga:bounceRate' },
      { expression: 'ga:timeOnPage' },
      { expression: 'ga:avgTimeOnPage' },
    ];
    const dimensionFilterClauses = [
      {
        filters: [
          {
            dimensionName: 'ga:dimension2',
            operator: 'EXACT',
            expressions: [storyId],
          },
        ],
      },
    ];

    const request = {
      viewId: GA_VIEW_ID,
      dateRanges,
      dimensions,
      metrics,
      dimensionFilterClauses,
      includeEmptyRows: true,
      hideTotals: true,
      hideValueRanges: true,
    };
    return this.sendReportRequests(request);
  },

  /**
   *
   * @param {array|object} requests An array of report request objects, or a single object.
   */
  async sendReportRequests(requests) {
    const api = await this.connect();
    const reportRequests = isArray(requests) ? requests : [requests];
    const res = await api.reports.batchGet({
      requestBody: { reportRequests },
    });
    return res.data;
  },
};
