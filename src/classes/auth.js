class Auth {
  constructor({ user, session, err } = {}) {
    this.user = user;
    this.session = session;
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

  check() {
    if (!this.isValid()) throw new Error('You must be logged-in to access this resource.');
  }
}

module.exports = Auth;
