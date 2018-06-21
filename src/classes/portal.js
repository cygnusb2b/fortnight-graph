class Portal {
  constructor({ id, hash, campaigns }) {
    this.id = id;
    this.hash = hash;
    this.campaigns = campaigns;
  }

  isValid() {
    if (this.id && this.hash) return true;
    return false;
  }

  canAccessAdvertiser(id) {
    if (!this.isValid()) return false;
    return id === this.id;
  }

  canAccessCampaign(id) {
    if (!this.isValid()) return false;
    const campaign = this.campaigns.find(c => c.id === id);
    if (campaign) return true;
    return false;
  }
}

module.exports = Portal;
