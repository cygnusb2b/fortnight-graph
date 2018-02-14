require('../connections');
const Request = require('../../src/models/request');
const RequestRepo = require('../../src/repositories/request');
const { testRequiredField } = require('../utils');

const generateRequest = async () => {
  const results = await RequestRepo.seed();
  return results.one();
};

describe('schema/advertiser', function() {
  before(function() {
    return Request.remove();
  });
  after(function() {
    return Request.remove();
  });
  it('should successfully save.', async function() {
    await expect(generateRequest()).to.be.fulfilled;
  });

  describe('#_id', function() {
    let request;
    beforeEach(async function() {
      request = await generateRequest();
    });
    const uuids = [
      ['dd11b295-619f-4fbd-8d7a-13b1690cbbad', 'dd11b295-619f-4fbd-8d7a-13b1690cbbad'],
      ['dd11b295619f4fbd8d7a13b1690cbbad', 'dd11b295-619f-4fbd-8d7a-13b1690cbbad'],
    ];
    uuids.forEach((pairs) => {
      it(`should properly set a UUID string value of '${pairs[0]}'.`, function(done) {
        request.set('_id', pairs[0]);
        expect(request.get('_id')).to.equal(pairs[1]);
        expect(request.id).to.equal(pairs[1]);
        done();
      });
    });

  });

  describe('#d', function() {
    let request;
    beforeEach(async function() {
      request = await generateRequest();
    });
    const values = [null, undefined];
    values.forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Request, request, 'd', value);
      });
    });
  });

  describe('#pid', function() {
    let request;
    beforeEach(async function() {
      request = await generateRequest();
    });
    const values = [null, undefined];
    values.forEach((value) => {
      it(`should be required and be rejected when the value is '${value}'`, function() {
        return testRequiredField(Request, request, 'pid', value);
      });
    });
  });
});
