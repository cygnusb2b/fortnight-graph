global.Promise = require('bluebird');
global.chai = require('chai');
global.request = require('supertest');
global.expect = chai.expect;


chai.use(require('chai-as-promised'));
