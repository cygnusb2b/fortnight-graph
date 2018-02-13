const Result = require('../../src/fixtures/result');

const testObjType = (result) => {
  expect(result).to.be.an('object');
  expect(result).to.respondTo('random');
  expect(result).to.respondTo('all');
  expect(result).to.respondTo('add');
  expect(result).to.respondTo('one');
  expect(result).to.have.property('length');
  expect(result).to.have.property('models');
  expect(result.models).to.be.an('array');
  expect(result.length).to.be.a('number');
};

describe('fixtures/result', function() {
  it('should return a factory function', function(done) {
    expect(Result).to.be.a('function');
    done();
  });
  it('should return a result object', function(done) {
    testObjType(Result());
    done();
  });
  describe('#length', function() {
    it('should return the correct number of models', function(done) {
      const result = Result();
      expect(result.length).to.equal(0);
      result.add({});
      expect(result.length).to.equal(1);
      result.add({}).add({}).add({});
      expect(result.length).to.equal(4);
      result.models = [];
      expect(result.length).to.equal(0);
      done();
    });
  });
  describe('#add', function() {
    it('should return itself.', function(done) {
      const result = Result();
      testObjType(result.add({}));
      done();
    });
    it('should add a value to the model stack.', function(done) {
      const result = Result();
      const toAdd = [
        { id: 1 }, { id: 2 }, { id: 3 },
      ];
      toAdd.forEach(model => result.add(model));
      toAdd.forEach((model) => {
        expect(result.models.find(m => model.id === m.id)).to.not.be.an('undefined');
      });
      done();
    });
  });
  describe('#all', function() {
    it('should return all the models in the stack.', function(done) {
      const result = Result();
      const toAdd = [
        { id: 1 }, { id: 2 }, { id: 3 },
      ];
      toAdd.forEach(model => result.add(model));
      result.all().forEach((model) => {
        expect(result.models.find(m => model.id === m.id)).to.not.be.an('undefined');
      });
      done();
    });
  });
  describe('#random', function() {
    it('should return null when the stack is empty.', function(done) {
      const result = Result();
      expect(result.random()).to.be.null;
      done();
    });
    it('should return the same model when the stack only has one item.', function(done) {
      const result = Result();
      result.add({ id: 1 });
      for (let i = 0; i < 10; i += 1) {
        let model = result.random();
        expect(model).to.be.an('object');
        expect(model).to.have.property('id', 1);
      }
      done();
    });
    it('should return a random model within the stack.', function(done) {
      const result = Result();
      const toAdd = [
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 10 },
      ];
      toAdd.forEach(model => result.add(model));
      for (let i = 0; i < toAdd.length; i += 1) {
        let model = result.random();
        let found = toAdd.find(m => m.id === model.id);
        expect(found).to.not.be.an('undefined');
      }
      done();
    });
  });
  describe('#one', function() {
    it('should return null when the stack is empty.', function(done) {
      const result = Result();
      expect(result.one()).to.be.null;
      done();
    });
    it('should return the first model within the stack.', function(done) {
      const result = Result();
      const toAdd = [
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 10 },
      ];
      toAdd.forEach(model => result.add(model));
      expect(result.one()).to.deep.equal({ id: 1 });
      done();
    });
  });
});

module.exports = {
  testObjType,
};
