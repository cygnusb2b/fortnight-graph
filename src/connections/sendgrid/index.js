const sgMail = require('@sendgrid/mail');
const emailTemplates = require('../../email-templates');
const ContactRepo = require('../../repositories/contact');
const AdvertiserRepo = require('../../repositories/advertiser');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const resolveAddresses = async (ids) => {
  const contacts = await ContactRepo.find({ _id: { $in: ids } });
  return contacts.map(contact => `${contact.givenName} ${contact.familyName} <${contact.email}>`);
};

const send = ({ to, subject, html }) => {
  const from = process.env.SENDGRID_FROM || 'Fortnight Ad Platform <noreply@fortnight.as3.io>';
  const bcc = process.env.SENDGRID_BCC || 'emailactivity@southcomm.com';
  const payload = {
    to,
    bcc,
    from,
    subject,
    html,
  };

  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'test') {
    return sgMail.send(payload);
  }
  return Promise.resolve(payload);
};

module.exports = {

  async sendInternalCampaignCreated({ campaign }) {
    const type = 'internal';
    const key = 'campaign.created';
    const html = emailTemplates.render(type, key, { campaign });
    const advertiser = await AdvertiserRepo.findById(campaign.get('advertiserId'));
    const subject = `[Fortnight] A new campaign was created for ${advertiser.name}`;
    const to = await resolveAddresses(campaign.get('notify.internal'));
    return send({ to, subject, html });
  },

  async sendExternalCampaignCreated({ campaign }) {
    const type = 'external';
    const key = 'campaign.created';
    const html = emailTemplates.render(type, key, { campaign });
    const subject = `[Fortnight] A new campaign was created!`;
    const to = await resolveAddresses(campaign.get('notify.external'));
    return send({ to, subject, html });
  },
};
