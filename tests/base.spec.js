const { expect } = require('chai');
const WatsonNLUUsage = require('../dist/WatsonNLUUsage');
const nock = require('nock');
const mocks = require('./mocks');
const interceptorDefaults = require('./defaults').interceptors;

describe('constructor', () => {
    const missingParametersError = '[ watson-nlu-usage @ constructor() ] : Missing one or more required parameters: username,password,organizationName,spaceName,serviceName';
    const requiredParams = Object.keys(mocks.parameters);

    requiredParams.map(requiredParam => (
        it(`should throw an error if no ${requiredParam} provided`, () => {
            const params = JSON.parse(JSON.stringify(mocks.parameters));
            delete params[requiredParam];
            const createInstance = () => { new WatsonNLUUsage(params); };
            expect(createInstance).to.throw(missingParametersError);
        })
    ));

    it(`should create an instance if ${Object.keys(mocks.parameters).join(',')} provided`, () => {
        const watsonNLUUsage = new WatsonNLUUsage(mocks.parameters);
        expect(watsonNLUUsage).to.be.instanceof(WatsonNLUUsage);
    });
});

describe('authentication', () => {
    const watsonNLUUsage = new WatsonNLUUsage(mocks.parameters);

    beforeEach(() => {
        nock.cleanAll();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should throw an error if tries to authenticate with invalid credentials', () => {
        nock(interceptorDefaults.login.url).post('').reply(401, mocks.authFailureBody);

        return watsonNLUUsage.authenticate().catch((error) => {
            expect(error).to.be.an(
                'error',
                'Authentication failure - your login credentials are invalid'
            );
        });
    });

    it('should allow an authenticated call if credentials are valid', () => {
        nock(interceptorDefaults.login.url).post('').reply(200, mocks.authSuccessBody);

        return watsonNLUUsage.authenticate().catch((error) => {
            expect(error).to.be.an(
                'error',
                `Unable to find an organization with the name ${watsonNLUUsage.organizationName}`
            );
        });
    });
});
