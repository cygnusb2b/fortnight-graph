const { titleize, underscore } = require('inflection');
const moment = require('moment');
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
  async storyReportByDay(storyId, { startDate, endDate }) {
    if (!storyId) throw new Error('No story ID was provided.');
    const dateRanges = [{ startDate, endDate }];
    const dimensions = [{ name: 'ga:date' }];
    const dimensionFilterClauses = [
      { filters: [this.getStoryFilter(storyId)] },
    ];

    const request = {
      viewId: GA_VIEW_ID,
      dateRanges,
      dimensions,
      metrics: this.getStandardMetrics(),
      dimensionFilterClauses,
      includeEmptyRows: true,
      hideTotals: true,
      hideValueRanges: true,
    };
    const data = await this.sendReportRequests(request);
    return this.formatStoryByDayReport(data.reports[0]);
  },

  formatStoryByDayReport(report) {
    const { metricHeaderEntries } = report.columnHeader.metricHeader;
    const headers = metricHeaderEntries.map((header) => {
      const key = this.createKey(header.name);
      return { ...header, key };
    });
    const { rows } = report.data;
    return rows.reduce((arr, row) => {
      arr.push({
        day: moment(row.dimensions[0]).toDate(),
        metrics: row.metrics[0].values.reduce((obj, value, index) => {
          const { key } = headers[index];
          return { ...obj, [key]: Number(value) };
        }, {}),
      });
      return arr;
    }, []);
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
    const dimensionFilterClauses = [
      { filters: [this.getStoryFilter(storyId)] },
    ];

    const request = {
      viewId: GA_VIEW_ID,
      dateRanges,
      metrics: this.getStandardMetrics(),
      dimensionFilterClauses,
      includeEmptyRows: true,
      hideTotals: true,
      hideValueRanges: true,
    };
    const data = await this.sendReportRequests(request);
    return this.formatStoryReport(data.reports[0]);
  },

  formatStoryReport(report) {
    const { metricHeaderEntries } = report.columnHeader.metricHeader;
    const { rows } = report.data;
    const values = rows && rows[0] ? rows[0].metrics[0].values : [];

    return metricHeaderEntries.reduce((obj, header, index) => {
      const key = this.createKey(header.name);
      const value = Number(values[index]);
      return { ...obj, [key]: value };
    }, {});
  },

  createLabel(name) {
    return titleize(underscore(this.createKey(name)));
  },

  createKey(name) {
    return name.replace(/^ga:/, '');
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

  getStoryFilter(storyId) {
    return {
      dimensionName: 'ga:dimension2',
      operator: 'EXACT',
      expressions: [storyId],
    };
  },

  getStandardMetrics() {
    return [
      { expression: 'ga:pageviews' },
      { expression: 'ga:uniquePageviews' },
      { expression: 'ga:sessions' },
      { expression: 'ga:users' },
      { expression: 'ga:avgSessionDuration' },
      { expression: 'ga:bounceRate' },
      { expression: 'ga:timeOnPage' },
      { expression: 'ga:avgTimeOnPage' },
    ];
  },
};
