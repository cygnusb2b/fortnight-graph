const Auth = require('../../src/classes/auth');

const simpleAuth = new Auth();

const errs = [new Error('foo'), true, 'Some error text.'];
const badSessionsUsers = [
  ['', ''],
  [false, undefined],
  [null, ''],
  [true, false],
  [false, true],
  [{}, ''],
  ['', {}],
];
const mismatches = [
  [{ uid: 1 }, { id: '' }],
  [{ uid: 1 }, { id: '1' }],
  [{ uid: null }, { id: undefined }],
];

describe('classes/auth', function() {
  describe('#getError', function() {
    it('should respond to the function.', function() {
      expect(simpleAuth).to.respondsTo('getError');
    });
    it('should return an Error value when an error has been set.', function(done) {
      const auth = new Auth();
      errs.forEach((err) => {
        auth.err = err;
        expect(auth.getError()).to.be.an.instanceof(Error);
      });
      done();
    });
    it('should return an Error value when a session or user is not present.', function(done) {
      const auth = new Auth();
      badSessionsUsers.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        expect(auth.getError()).to.be.an.instanceof(Error);
      });
      done();
    });
    it('should return an Error value when a a user-session mismatch is present.', function(done) {
      const auth = new Auth();
      mismatches.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        expect(auth.getError()).to.be.an.instanceof(Error);
      });
      done();
    });
    it('should return null when no error conditions have been found.', function(done) {
      const auth = new Auth({
        user: { id: 1 },
        session: { uid: 1 },
      });
      expect(auth.getError()).to.be.null;
      done();
    });
  });
  describe('#isValid', function() {
    it('should respond to the function', function() {
      expect(simpleAuth).to.respondsTo('isValid');
    });
    it('should return false when an error condition is found.', function(done) {
      const auth = new Auth();
      errs.forEach((err) => {
        auth.err = err;
        expect(auth.isValid()).to.be.false;
      });
      auth.err = '';

      badSessionsUsers.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        expect(auth.isValid()).to.be.false;
      });

      mismatches.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        expect(auth.isValid()).to.be.false;
      });

      done();
    });
    it('should return true when no error conditions have been found.', function(done) {
      const auth = new Auth({
        user: { id: 1 },
        session: { uid: 1 },
      });
      expect(auth.isValid()).to.be.true;
      done();
    });
  });
  describe('#hasRole', function() {
    it('should respond to the function', function() {
      expect(simpleAuth).to.respondsTo('hasRole');
    });
    it('should always return false when an error condition is found.', function(done) {
      const auth = new Auth({ user: { role: 'foo' } });

      errs.forEach((err) => {
        auth.err = err;
        expect(auth.hasRole('foo')).to.be.false;
      });
      auth.err = '';

      badSessionsUsers.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        expect(auth.hasRole('foo')).to.be.false;
      });

      mismatches.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        auth.user.role = 'foo';
        expect(auth.hasRole('foo')).to.be.false;
      });
      done();
    });
    it('should return true when the role is set.', function(done) {
      const auth = new Auth({
        user: { id: 1, role: 'foo' },
        session: { uid: 1 },
      });
      expect(auth.hasRole('foo')).to.be.true;
      ['Foo', 'bar', '', '  '].forEach((role) => {
        auth.user.role = role;
        expect(auth.hasRole(role)).to.be.true
      })
      done();
    });
  });
  describe('#isAdmin', function() {
    it('should respond to the function', function() {
      expect(simpleAuth).to.respondsTo('isAdmin');
    });
    it('should always return false when an error condition is found.', function(done) {
      const auth = new Auth({ user: { role: 'Admin' } });

      errs.forEach((err) => {
        auth.err = err;
        expect(auth.isAdmin()).to.be.false;
      });
      auth.err = '';

      badSessionsUsers.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        expect(auth.isAdmin()).to.be.false;
      });

      mismatches.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        auth.user.role = 'Admin';
        expect(auth.isAdmin()).to.be.false;
      });

      auth.user = { id: 1, role: 'admin' };
      auth.session = { uid: 1 };
      expect(auth.isAdmin()).to.be.false;
      done();
    });
    it('should return true when role is set to Admin.', function(done) {
      const auth = new Auth({
        user: { id: 1, role: 'Admin' },
        session: { uid: 1 },
      });
      expect(auth.isAdmin()).to.be.true;
      done();
    });
  });
  describe('#check', function() {
    it('should respond to the function.', function() {
      expect(simpleAuth).to.respondsTo('check');
    });
    it('should throw an Error value when an error has been set.', function(done) {
      const auth = new Auth();
      errs.forEach((err) => {
        auth.err = err;
        expect(auth.check.bind(auth)).to.throw(Error);
      });
      done();
    });
    it('should throw an Error value when a session or user is not present.', function(done) {
      const auth = new Auth();
      badSessionsUsers.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        expect(auth.check.bind(auth)).to.throw(Error, 'You must be logged-in to access this resource.');
      });
      done();
    });
    it('should throw an Error value when a a user-session mismatch is present.', function(done) {
      const auth = new Auth();
      mismatches.forEach((args) => {
        auth.session = args[0];
        auth.user = args[1];
        expect(auth.check.bind(auth)).to.throw(Error, 'You must be logged-in to access this resource.');
      });
      done();
    });
    it('should return undefined (and not throw) when no error conditions have been found.', function(done) {
      const auth = new Auth({
        user: { id: 1 },
        session: { uid: 1 },
      });
      expect(auth.check.bind(auth)).to.not.throw();
      expect(auth.check()).to.be.undefined;
      done();
    });
  });
});
