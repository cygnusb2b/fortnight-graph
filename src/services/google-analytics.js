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
    const dateRanges = [this.formatDates({ startDate, endDate })];
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
    return this.formatReport(data.reports[0], {
      date: v => moment(v).toDate(),
    });
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
    const dateRanges = [this.formatDates({ startDate, endDate })];
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
    const rows = this.formatReport(data.reports[0]);
    return rows[0];
  },

  /**
   *
   * @param {string} storyId
   * @param {object} params
   * @param {string|Date} params.startDate
   * @param {string|Date} params.endDate
   */
  async storyAcquisitionReport(storyId, { startDate, endDate }) {
    if (!storyId) throw new Error('No story ID was provided.');
    const dateRanges = [this.formatDates({ startDate, endDate })];
    const dimensions = [{ name: 'ga:medium' }];
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
    return this.formatReport(data.reports[0]);
  },

  formatReport(report, formatters = {}) {
    const { columnHeader } = report;

    const dimensionEntries = (columnHeader.dimensions || [])
      .map(name => this.createKey(name));
    const metricHeaderEntries = (columnHeader.metricHeader.metricHeaderEntries || [])
      .map(o => ({ ...o, key: this.createKey(o.name) }));
    const rows = report.data.rows || [];

    return rows.reduce((arr, row) => {
      const dimensions = row.dimensions || [];
      arr.push({
        ...dimensions.reduce((obj, value, index) => {
          const key = dimensionEntries[index];
          const fn = formatters[key];
          return { ...obj, [key]: this.formatValue(value, fn) };
        }, {}),
        metrics: row.metrics[0].values.reduce((obj, value, index) => {
          const { key } = metricHeaderEntries[index];
          return { ...obj, [key]: Number(value) };
        }, {}),
      });
      return arr;
    }, []);
  },

  formatValue(value, fn) {
    if (typeof fn === 'function') return fn(value);
    return value;
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

  formatDates({ startDate, endDate }) {
    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    };
  },

  formatDate(date) {
    if (!date) return undefined;
    return moment(date).startOf('day').format('YYYY-MM-DD');
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

  getDefaultMetricValues() {
    return this.getStandardMetrics().reduce((obj, metric) => {
      const key = this.createKey(metric.expression);
      return { ...obj, [key]: 0 };
    }, {});
  },
};
