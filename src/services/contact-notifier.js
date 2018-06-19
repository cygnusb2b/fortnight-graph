const sgMail = require('@sendgrid/mail');
const env = require('../env');
const emailTemplates = require('../email-templates');
const ContactRepo = require('../repositories/contact');
const AdvertiserRepo = require('../repositories/advertiser');
const accountService = require('../services/account');

module.exports = {

  async resolveAddresses(ids) {
    const contacts = await ContactRepo.find({ _id: { $in: ids } });
    return contacts.map(contact => `${contact.givenName} ${contact.familyName} <${contact.email}>`);
  },

  async send({ to, subject, html }) {
    const key = env.SENDGRID_API_KEY;
    const from = env.SENDGRID_FROM;
    const bcc = await accountService.setting('bcc');

    if (!key) throw new Error('Required environment variable "SENDGRID_API_KEY" was not set.');
    if (!from) throw new Error('Required environment variable "SENDGRID_FROM" was not set.');

    const payload = {
      to,
      bcc,
      from,
      subject,
      html,
    };

    sgMail.setApiKey(key);
    return sgMail.send(payload);
  },

  async sendInternalCampaignCreated({ campaign }) {
    const html = await emailTemplates.render('internal/campaign.created', { campaign });
    const advertiser = await AdvertiserRepo.findById(campaign.get('advertiserId'));
    const subject = `A new campaign was created for ${advertiser.name}`;
    const to = await this.resolveAddresses(campaign.get('notify.internal'));
    return this.send({ to, subject, html });
  },

  async sendExternalCampaignCreated({ campaign }) {
    const html = await emailTemplates.render('external/campaign.created', { campaign });
    const subject = 'A new campaign was created!';
    const to = await this.resolveAddresses(campaign.get('notify.external'));
    return this.send({ to, subject, html });
  },
};
