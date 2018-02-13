global.Promise = require('bluebird');
global.chai = require('chai');
global.request = require('supertest');
global.sinon = require('sinon');
global.expect = chai.expect;

chai.use(require('chai-as-promised'));
