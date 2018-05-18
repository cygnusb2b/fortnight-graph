const sgMail = require('@sendgrid/mail');
const emailTemplates = require('../email-templates');
const ContactRepo = require('../repositories/contact');
const AdvertiserRepo = require('../repositories/advertiser');

const resolveAddresses = async (ids) => {
  const contacts = await ContactRepo.find({ _id: { $in: ids } });
  return contacts.map(contact => `${contact.givenName} ${contact.familyName} <${contact.email}>`);
};

const send = ({ to, subject, html }) => {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM;
  const bcc = process.env.SENDGRID_BCC;

  if (!key) throw new Error('Required environment variable "SENDGRID_API_KEY" was not set.');
  if (!from) throw new Error('Required environment variable "SENDGRID_FROM" was not set.');

  const payload = {
    to,
    bcc,
    from,
    subject,
    html,
  };

  /* istanbul ignore if */
  if (process.env.NODE_ENV === 'test') return Promise.resolve(payload);

  sgMail.setApiKey(key);
  return sgMail.send(payload);
};

module.exports = {

  async sendInternalCampaignCreated({ campaign }) {
    const html = emailTemplates.render('internal/campaign.created', { campaign });
    const advertiser = await AdvertiserRepo.findById(campaign.get('advertiserId'));
    const subject = `A new campaign was created for ${advertiser.name}`;
    const to = await resolveAddresses(campaign.get('notify.internal'));
    return send({ to, subject, html });
  },

  async sendExternalCampaignCreated({ campaign }) {
    const html = emailTemplates.render('external/campaign.created', { campaign });
    const subject = 'A new campaign was created!';
    const to = await resolveAddresses(campaign.get('notify.external'));
    return send({ to, subject, html });
  },
};