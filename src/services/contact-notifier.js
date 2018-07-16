const sgMail = require('@sendgrid/mail');
const env = require('../env');
const emailTemplates = require('../email-templates');
const ContactRepo = require('../repositories/contact');
const AdvertiserRepo = require('../repositories/advertiser');
const accountService = require('../services/account');
const CampaignNotification = require('../models/campaign-notification');
const Campaign = require('../models/campaign');
const output = require('../output');
const { CronJob } = require('cron');

module.exports = {

  async resolveAddresses(ids) {
    const contacts = await ContactRepo.find({ _id: { $in: ids } });
    return contacts.map(contact => `${contact.givenName} ${contact.familyName} <${contact.email}>`);
  },

  /**
   * Schedules (or updates) a campaign notification
   */
  async schedule({
    type,
    campaignId,
    to,
    cc,
    subject,
    html,
    sendAt,
  }) {
    const criteria = { type, campaignId, status: { $in: ['Pending', 'Sent'] } };
    const notification = await CampaignNotification.findOne(criteria);
    if (notification) {
      notification.set({ to, cc, sendAt });
      return notification.save();
    }
    return CampaignNotification.create({
      type,
      campaignId,
      to,
      cc,
      subject,
      html,
      sendAt,
    });
  },

  init() {
    // Run every 10 minutes
    const job = new CronJob({
      cronTime: '* */10 * * * *',
      onTick: this.check,
      runOnInit: true,
      context: this,
    });
    job.start();
  },

  async check() {
    const criteria = {
      status: 'Pending',
      sendAt: { $lte: new Date() },
    };
    const count = await CampaignNotification.count(criteria);
    if (count === 0) return;

    output.write(`✉️  ✉️  ✉️   Found ${count} pending notifications.`);

    // Explicitly await in while to ensure that the findOneAndUpdate
    // completes before counting if there are more notifications to grab.

    /* eslint-disable no-await-in-loop */
    while (await CampaignNotification.count(criteria) > 0) {
      const notification = await CampaignNotification.findOneAndUpdate(criteria, { status: 'Sending' });
      this.handleNotification(notification);
    }
    /* eslint-enable no-await-in-loop */
  },

  async handleNotification(notification) {
    try {
      await this.send(notification);
      notification.set('status', 'Sent');
      output.write('✉️  ✉️  ✉️   Successfully sent a notification!');
    } catch (e) {
      notification.set('error', e);
      notification.set('status', 'Errored');
      notification.save();
      output.write('✉️  ✉️  ✉️   Error encountered sending notification!', e);
    } finally {
      notification.save();
    }
  },

  async send({
    to,
    cc,
    subject,
    html,
  }) {
    const key = env.SENDGRID_API_KEY;
    const from = env.SENDGRID_FROM;
    const bcc = await accountService.setting('bcc');

    if (!key) throw new Error('Required environment variable "SENDGRID_API_KEY" was not set.');
    if (!from) throw new Error('Required environment variable "SENDGRID_FROM" was not set.');

    const payload = {
      to,
      cc,
      bcc,
      from,
      subject,
      html,
    };

    sgMail.setApiKey(key);
    return sgMail.send(payload);
  },

  async scheduleCampaignCreated({ campaignId }) {
    const campaign = await Campaign.findById(campaignId);
    const advertiser = await AdvertiserRepo.findById(campaign.get('advertiserId'));
    const materialCollectUri = await campaign.get('vMaterialCollectUri');
    const html = await emailTemplates.render('campaign.created', { campaign, materialCollectUri });
    const subject = `A new campaign was created for ${advertiser.name}`;
    const to = await this.resolveAddresses(campaign.get('notify.external'));
    const cc = await this.resolveAddresses(campaign.get('notify.internal'));
    const sendAt = new Date();
    return this.schedule({
      type: 'Campaign Created',
      campaignId: campaign.id,
      to,
      cc,
      subject,
      html,
      sendAt,
    });
  },

  async scheduleCampaignStarted({ campaignId }) {
    const campaign = await Campaign.findOne({ _id: campaignId });
    const html = await emailTemplates.render('campaign.started', { campaign });
    const subject = `Your campaign "${campaign.name} has started!`;
    const to = await this.resolveAddresses(campaign.get('notify.external'));
    const cc = await this.resolveAddresses(campaign.get('notify.internal'));
    const sendAt = campaign.get('criteria.start');
    if (campaign.status !== 'Active' || !sendAt) return Promise.resolve();

    return this.schedule({
      type: 'Campaign Started',
      campaignId: campaign.id,
      to,
      cc,
      subject,
      html,
      sendAt,
    });
  },

  async scheduleCampaignEnded({ campaignId }) {
    const campaign = await Campaign.findOne({ _id: campaignId });
    const reportSummaryUri = await campaign.get('vReportSummaryUri');
    const reportCreativeUri = await campaign.get('vReportCreativeUri');
    const html = await emailTemplates.render('campaign.ended', { campaign, reportSummaryUri, reportCreativeUri });
    const subject = `Your campaign "${campaign.name} has ended!`;
    const to = await this.resolveAddresses(campaign.get('notify.external'));
    const cc = await this.resolveAddresses(campaign.get('notify.internal'));
    const sendAt = campaign.get('criteria.end');

    if (campaign.status !== 'Active' || !sendAt) return Promise.resolve();

    return this.schedule({
      type: 'Campaign Ended',
      campaignId: campaign.id,
      to,
      cc,
      subject,
      html,
      sendAt,
    });
  },
};
