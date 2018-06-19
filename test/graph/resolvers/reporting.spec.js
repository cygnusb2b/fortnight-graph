// require('../../connections');
// const { graphql, setup, teardown } = require('./utils');
// const AnalyticsEvent = require('../../../src/models/analytics/event');
// const CampaignRepo = require('../../../src/repositories/campaign');
// const CreativeRepo = require('../../../src/repositories/campaign/creative');
// const PlacementRepo = require('../../../src/repositories/placement');
// const moment = require('moment');
// const uuidv4 = require('uuid/v4');

// const createCampaign = async (start, end) => {
//   const results = await CampaignRepo.seed();
//   const campaign = results.one();
//   campaign.set('criteria.start', start);
//   campaign.set('criteria.end', end);
//   return campaign.save();
// };

// const createPlacement = async () => {
//   const results = await PlacementRepo.seed();
//   return results.one();
// };

// const dateBetween = (s, e) => moment(Math.random() * (e - s) + s);

// const createCampaignAndSummaryData = async (viewCount, clickCount, useEnd = true) => {
//   const start = moment('2018-01-01');
//   const end = moment(start).add(1, 'week');
//   const campaign = await createCampaign(start, useEnd ? end : null);
//   const placement = await createPlacement();

//   const views = [];
//   for (let i = 0; i < viewCount; i++) {
//     views.push({
//       cid: campaign.id,
//       e: 'view-js',
//       d: dateBetween(start.valueOf(), end.valueOf()).toDate(),
//       pid: placement.id,
//       uuid: uuidv4(),
//     })
//   }
//   await AnalyticsEvent.create(views);

//   const clicks = [];
//   for (let i = 0; i < clickCount; i++) {
//     clicks.push({
//       cid: campaign.id,
//       e: 'click-js',
//       d: dateBetween(start.valueOf(), end.valueOf()).toDate(),
//       pid: placement.id,
//       uuid: uuidv4(),
//     })
//   }
//   await AnalyticsEvent.create(clicks);

//   return campaign;
// };

// const createCampaignAndBreakdownData = async (viewCount, clickCount, useEnd = true) => {
//   const start = moment('2018-01-01');
//   const end = moment(start).add(1, 'week');
//   let campaign = await createCampaign(start, useEnd ? end : null);
//   const placement = await createPlacement();
//   const cid = campaign.id;
//   const creativePayload = { title: 'Title', teaser: 'Teaser', image: null }
//   await CreativeRepo.createFor(cid, creativePayload);
//   campaign = await CampaignRepo.findById(cid);

//   const views = [];
//   for (let i = 0; i < viewCount; i++) {
//     views.push({
//       cid: cid,
//       e: 'view-js',
//       d: dateBetween(start.valueOf(), end.valueOf()).toDate(),
//       pid: placement.id,
//       cre: campaign.creatives[0].id,
//       uuid: uuidv4(),
//     })
//   }
//   await AnalyticsEvent.create(views);

//   const clicks = [];
//   for (let i = 0; i < clickCount; i++) {
//     clicks.push({
//       cid: cid,
//       e: 'click-js',
//       d: dateBetween(start.valueOf(), end.valueOf()).toDate(),
//       pid: placement.id,
//       cre: campaign.creatives[0].id,
//       uuid: uuidv4(),
//     })
//   }
//   await AnalyticsEvent.create(clicks);

//   return campaign;
// };

// describe('graph/resolvers/reporting', function() {
//   before(async function() {
//     await setup();
//     await AnalyticsEvent.remove();
//   });
//   after(async function() {
//     await teardown();
//     await AnalyticsEvent.remove();
//   });
//   describe('Query', function() {

//     describe('reportCampaignSummary', function() {
//       const viewCount = 100;
//       const clickCount = 10;
//       beforeEach(async function() {
//         await AnalyticsEvent.remove();
//         await CampaignRepo.remove();
//         await PlacementRepo.remove();
//       });
//       afterEach(async function() {
//         await AnalyticsEvent.remove();
//         await CampaignRepo.remove();
//         await PlacementRepo.remove();
//       })

//       const query = `
//         query ReportCampaignSummary($input: CampaignHashInput!) {
//           reportCampaignSummary(input: $input) {
//             views
//             clicks
//             ctr
//             days {
//               date
//               views
//               clicks
//             }
//           }
//         }

//       `;
//       it('should reject if no record was found.', async function() {
//         const hash = '507f1f77bcf86cd799439011';
//         const input = { hash };
//         const variables = { input };
//         await expect(graphql({ query, variables, key: 'reportCampaignSummary', loggedIn: false })).to.be.rejectedWith(Error, `No campaign record found for hash '${hash}'`);
//       });
//       it('should return the expected campaign data.', async function() {
//         const campaign = await createCampaignAndSummaryData(viewCount, clickCount);
//         const hash = campaign.hash;
//         const input = { hash };
//         const variables = { input };
//         const promise = graphql({ query, variables, key: 'reportCampaignSummary', loggedIn: false });
//         await expect(promise).to.eventually.be.an('object').with.property('views', viewCount);
//         const data = await promise;
//         expect(data).to.have.all.keys('views', 'clicks', 'ctr', 'days');
//         expect(data.days.length).to.equal(8);
//       });
//       it('should work for non-terminating campaigns.', async function() {
//         const campaign = await createCampaignAndSummaryData(viewCount, clickCount, false);
//         const hash = campaign.hash;
//         const input = { hash };
//         const variables = { input };
//         const promise = graphql({ query, variables, key: 'reportCampaignSummary', loggedIn: false });
//         await expect(promise).to.eventually.be.an('object').with.property('views', viewCount);
//         const data = await promise;
//         const days = moment().diff(moment('2018-01-01'), 'days') + 1;
//         expect(data).to.have.all.keys('views', 'clicks', 'ctr', 'days');
//         expect(data.days.length).to.equal(days);
//       });
//     });
//     describe('reportCampaignCreativeBreakdown', function() {
//       const viewCount = 100;
//       const clickCount = 10;
//       const ctr = viewCount / clickCount;
//       beforeEach(async function() {
//         await AnalyticsEvent.remove();
//         await CampaignRepo.remove();
//         await PlacementRepo.remove();
//       });
//       afterEach(async function() {
//         await AnalyticsEvent.remove();
//         await CampaignRepo.remove();
//         await PlacementRepo.remove();
//       })

//       const query = `
//         query ReportCampaignCreativeBreakdown($input: CampaignHashInput!) {
//           reportCampaignCreativeBreakdown(input: $input) {
//             views
//             clicks
//             ctr
//             creatives  {
//               id
//               title
//               teaser
//               views
//               clicks
//               ctr
//               days {
//                 date
//                 views
//                 clicks
//                 ctr
//               }
//             }
//           }
//         }

//       `;
//       it('should reject if no record was found.', async function() {
//         const hash = '507f1f77bcf86cd799439011';
//         const input = { hash };
//         const variables = { input };
//         await expect(graphql({ query, variables, key: 'reportCampaignCreativeBreakdown', loggedIn: false })).to.be.rejectedWith(Error, `No campaign record found for hash '${hash}'`);
//       });
//       it('should return the expected campaign creative data.', async function() {
//         const campaign = await createCampaignAndBreakdownData(viewCount, clickCount);
//         const hash = campaign.hash;
//         const input = { hash };
//         const variables = { input };
//         const promise = graphql({ query, variables, key: 'reportCampaignCreativeBreakdown', loggedIn: false });
//         await expect(promise).to.eventually.be.an('object').with.property('views', viewCount);
//         const data = await promise;
//         expect(data).to.have.all.keys('views', 'clicks', 'ctr', 'creatives');
//       });
//       it('should work for non-terminating campaigns.', async function() {
//         const campaign = await createCampaignAndBreakdownData(viewCount, clickCount, false);
//         const hash = campaign.hash;
//         const input = { hash };
//         const variables = { input };
//         const promise = graphql({ query, variables, key: 'reportCampaignCreativeBreakdown', loggedIn: false });
//         await expect(promise).to.eventually.be.an('object').with.property('views', viewCount);
//         const data = await promise;
//         expect(data).to.have.all.keys('views', 'clicks', 'ctr', 'creatives');
//       });
//     });
//   });
// });
