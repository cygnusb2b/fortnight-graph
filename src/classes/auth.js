class Auth {
  constructor({
    user,
    session,
    portal,
    err,
  } = {}) {
    this.user = user;
    this.session = session;
    this.portal = portal;
    this.err = err;
  }

  isValid() {
    const error = this.getError();
    if (error) return false;
    return true;
  }

  getError() {
    if (this.err) return this.err instanceof Error ? this.err : new Error(this.err);
    if (!this.session || !this.user) return new Error('No user or session was found.');
    return this.session.uid !== this.user.id ? new Error('Session-user mismatch encountered.') : null;
  }

  hasRole(name) {
    if (!this.isValid()) return false;
    return this.user.role === name;
  }

  isAdmin() {
    return this.hasRole('Admin');
  }

  checkAdmin() {
    this.check();
    if (!this.isAdmin()) throw new Error('You do not have permission to access this resource.');
  }

  check() {
    if (!this.isValid()) throw new Error('You must be logged-in to access this resource.');
  }

  checkPortalAccess() {
    if (!this.portal.isValid()) {
      this.check();
    }
  }

  checkAdvertiserAccess(advertiserId) {
    if (!this.portal.canAccessAdvertiser(advertiserId)) {
      this.check();
    }
  }

  checkCampaignAccess(campaignId) {
    if (!this.portal.canAccessCampaign(campaignId)) {
      this.check();
    }
  }
}

module.exports = Auth;
