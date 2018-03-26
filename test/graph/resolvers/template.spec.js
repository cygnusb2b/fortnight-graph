require('../../connections');
const { graphql, setup, teardown } = require('./utils');
const TemplateRepo = require('../../../src/repositories/template');
const { CursorType } = require('../../../src/graph/custom-types');

const createTemplate = async () => {
  const results = await TemplateRepo.seed();
  return results.one();
};

const createTemplates = async (count) => {
  const results = await TemplateRepo.seed({ count });
  return results.all();
};

describe('graph/resolvers/template', function() {
  before(async function() {
    await setup();
    await TemplateRepo.remove();
  });
  after(async function() {
    await teardown();
    await TemplateRepo.remove();
  });
  describe('Query', function() {

    describe('template', function() {
      let template;
      before(async function() {
        template = await createTemplate();
      });

      const query = `
        query Template($input: ModelIdInput!) {
          template(input: $input) {
            id
            name
            html
            fallback
            createdAt
            updatedAt
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'template', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject if no record was found.', async function() {
        const id = '507f1f77bcf86cd799439011';
        const input = { id };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'template', loggedIn: true })).to.be.rejectedWith(Error, `No template record found for ID ${id}.`);
      });
      it('should return the requested template.', async function() {
        const id = template.id;
        const input = { id };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'template', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id', id);
        const data = await promise;
        expect(data).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt', 'html', 'fallback');
      });
    });

    describe('allTemplates', function() {
      let templates;
      before(async function() {
        await TemplateRepo.remove();
        templates = await createTemplates(10);
      });
      after(async function() {
        await TemplateRepo.remove();
      });
      const query = `
        query AllTemplates($pagination: PaginationInput, $sort: TemplateSortInput) {
          allTemplates(pagination: $pagination, sort: $sort) {
            totalCount
            edges {
              node {
                id
                name
                html
                fallback
                createdAt
                updatedAt
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      it('should reject when no user is logged-in.', async function() {
        await expect(graphql({ query, key: 'allTemplates', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should return five templates out of ten.', async function() {
        const pagination = { first: 5 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allTemplates', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(5);
        expect(data.pageInfo.hasNextPage).to.be.true;
        expect(data.pageInfo.endCursor).to.be.a('string');

        const last = data.edges.pop();
        expect(data.pageInfo.endCursor).to.equal(last.cursor);
      });
      it('should should not have a next page when limited by more than the total.', async function() {
        const pagination = { first: 50 };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allTemplates', variables, loggedIn: true });
        await expect(promise).to.eventually.be.an('object');
        const data = await promise;
        expect(data.totalCount).to.equal(10);
        expect(data.edges.length).to.equal(10);
        expect(data.pageInfo.hasNextPage).to.be.false;
        expect(data.pageInfo.endCursor).to.be.null;
      });
      it('should return an error when an after cursor is requested that does not exist.', async function() {
        const after = CursorType.serialize(TemplateRepo.generate().one().id);
        const pagination = { first: 5, after };
        const variables = { pagination };
        const promise = graphql({ query, key: 'allTemplates', variables, loggedIn: true });
        await expect(promise).to.be.rejectedWith(Error, `No record found for cursor '${after}'.`);
      });
    });

  });

  describe('Mutation', function() {

    describe('createTemplate', function() {
      const query = `
        mutation CreateTemplate($input: CreateTemplateInput!) {
          createTemplate(input: $input) {
            id
            name
            html
            fallback
            createdAt
            updatedAt
          }
        }
      `;

      it('should reject when no user is logged-in.', async function() {
        const payload = { name: 'Test Template', html: '<div>' };
        const input = { payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'createTemplate', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should create the template.', async function() {
        const payload = {
          name: 'Test Template',
          html: '<div {{build-container-attributes}}>{{build-beacon}}{{#tracked-link href=href}}{{/tracked-link}}</div>',
          fallback: '<section {{build-container-attributes}}>{{build-beacon}}{{#tracked-link href=url}}{{/tracked-link}}</section>' };
        const input = { payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'createTemplate', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        await expect(TemplateRepo.findById(data.id)).to.eventually.be.an('object').and.deep.include({
          name: payload.name,
          html: payload.html,
          fallback: payload.fallback
        });
      });
    });

    describe('updateTemplate', function() {
      let template;
      before(async function() {
        template = await createTemplate();
      });

      const query = `
        mutation UpdateTemplate($input: UpdateTemplateInput!) {
          updateTemplate(input: $input) {
            id
            name
            html
            fallback
            createdAt
            updatedAt
          }
        }
      `;
      const payload = {
        name: 'Updated Template Name',
        html: '<div {{build-container-attributes}}>New stuff!{{build-beacon}}{{#tracked-link href=href}}{{/tracked-link}}</div>',
        fallback: '<section {{build-container-attributes}}>Fallback! {{build-beacon}}{{#tracked-link href=url}}{{/tracked-link}}</section>'
      };

      it('should reject when no user is logged-in.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateTemplate', loggedIn: false })).to.be.rejectedWith(Error, /you must be logged-in/i);
      });
      it('should reject when the template record is not found.', async function() {
        const id = '507f1f77bcf86cd799439011'
        const input = { id, payload };
        const variables = { input };
        await expect(graphql({ query, variables, key: 'updateTemplate', loggedIn: true })).to.be.rejectedWith(Error, `Unable to update template: no record was found for ID '${id}'`);
      });
      it('should update the template.', async function() {
        const id = template.id;
        const input = { id, payload };
        const variables = { input };
        const promise = graphql({ query, variables, key: 'updateTemplate', loggedIn: true });
        await expect(promise).to.eventually.be.an('object').with.property('id');
        const data = await promise;
        expect(data.name).to.equal(payload.name);
        await expect(TemplateRepo.findById(data.id)).to.eventually.be.an('object').and.deep.include({
          name: payload.name,
          html: payload.html,
          fallback: payload.fallback
        });
      });
    });

  });
});
