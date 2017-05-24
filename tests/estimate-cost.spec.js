const { expect } = require('chai');
const WatsonNLUUsage = require('../dist/WatsonNLUUsage');
const Chance = require('chance');
const nock = require('nock');
const mocks = require('./mocks');
const interceptorDefaults = require('./defaults').interceptors;

const chance = new Chance();

describe('cost estimation', () => {
    const watsonNLUUsage = new WatsonNLUUsage(mocks.parameters);
    let usageMockBody;

    beforeEach(() => {
        nock.cleanAll();
        nock(interceptorDefaults.login.url)
            .persist()
            .post('')
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

    it('should return an error if no payload supplied', () => (
        watsonNLUUsage.estimateCost().catch((error) => {
            expect(error).to.be.an('error',
                                   '[ watson-nlu-usage @ estimateCost() ] : Missing one or more required parameters: payload');
        })
    ));

    it('should account for multiple features in transaction estimate', () => (
        watsonNLUUsage.estimateCost({
            featureCount: 2,
            payload: chance.word()
        })
        .then(costEstimate => (
            expect(costEstimate).to.deep.equal({ plan: 'free', moneyCost: 0, itemCost: 2 })
        ))
    ));

    it('should account for payloads larger than the 10,000 characters/feature limit', () => (
        watsonNLUUsage.estimateCost({
            featureCount: 2,
            payload: chance.word({ length: 10001 })
        })
        .then(costEstimate => (
            expect(costEstimate).to.deep.equal({ plan: 'free', moneyCost: 0, itemCost: 4 })
        ))
    ));

    it('should account for paid plans', () => (
        watsonNLUUsage.estimateCost({
            plan: 'standard',
            featureCount: 2,
            payload: chance.word()
        })
        .then(costEstimate => (
            expect(costEstimate).to.deep.equal({ plan: 'standard', moneyCost: 0.003 * 2, itemCost: 2 })
        ))
    ));

    it('should attribute cost spanning multiple paid plan tiers', () => {
        usageMockBody.organizations[0]
                    .billable_usage
                    .spaces[0]
                    .services[0]
                    .instances[0]
                    .usage[0]
                    .quantity = 249999;
        usageMockBody.organizations[0]
                    .billable_usage
                    .spaces[0]
                    .services[0]
                    .instances[0]
                    .usage[0]
                    .cost = 0.003 * 249999;

        return watsonNLUUsage.estimateCost({
            plan: 'standard',
            featureCount: 2,
            payload: chance.word()
        })
        .then(costEstimate => (
            expect(costEstimate).to.deep.equal({
                plan: 'standard',
                moneyCost: 0.003 + 0.001,
                itemCost: 2
            })
        ));
    });

    it('should attribute cost including last open ended tier', () => {
        usageMockBody.organizations[0]
                    .billable_usage
                    .spaces[0]
                    .services[0]
                    .instances[0]
                    .usage[0]
                    .quantity = 4999999;
        usageMockBody.organizations[0]
                    .billable_usage
                    .spaces[0]
                    .services[0]
                    .instances[0]
                    .usage[0]
                    .cost = 0;

        return watsonNLUUsage.estimateCost({
            plan: 'standard',
            featureCount: 2,
            payload: chance.word()
        })
        .then(costEstimate => (
            expect(costEstimate).to.deep.equal({
                plan: 'standard',
                moneyCost: 0.001 + 0.0002,
                itemCost: 2
            })
        ));
    });
});
