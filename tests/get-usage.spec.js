const { expect } = require('chai');
const WatsonNLUUsage = require('../dist/WatsonNLUUsage');
const nock = require('nock');
const mocks = require('./mocks');
const interceptorDefaults = require('./defaults').interceptors;

describe('get nlu usage', () => {
    const watsonNLUUsage = new WatsonNLUUsage(mocks.parameters);

    let usageMockBody;

    beforeEach(() => {
        nock.cleanAll();
        nock(interceptorDefaults.login.url)
            .persist()
            .post(interceptorDefaults.login.path)
            .reply(200, mocks.authSuccessBody);

        nock(interceptorDefaults.organization.url)
            .persist()
            .get(interceptorDefaults.organization.path)
            .reply(200, mocks.organizationSuccessBody);

        usageMockBody = JSON.parse(JSON.stringify(mocks.organizationUsageSuccessBody));
        nock(interceptorDefaults.organizationUsage.url)
            .persist()
            .get(interceptorDefaults.organizationUsage.path)
            .reply(200, () => usageMockBody);
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should combine billable and non-billable usage', () => (
        watsonNLUUsage.getUsage().then(response => (
            expect(response).to.deep.equal({ itemCount: 1010, totalCost: 0.03 })
        ))
    ));

    it('should account for zero usage when no billing history exists', () => {
        usageMockBody.organizations[0].billable_usage.spaces = [];

        return watsonNLUUsage.getUsage({ includeFreeUsage: true }).then(response => (
            expect(response).to.deep.equal({ itemCount: 1000, totalCost: 0 })
        ));
    });
});
