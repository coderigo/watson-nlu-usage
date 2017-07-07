import moment from 'moment';
import WatsonNLUUsageError from './WatsonNLUUsageError';
import {
        authenticate,
        checkRequiredParams,
        checkRequiredParamsSync,
        estimateCost,
        getOrganizationIdFromName,
        getOrganizationMetering
    } from './utils';

const defaults = require('./defaults.json');

module.exports = class WatsonNLUUsage {
    constructor({ plan = defaults.watson.plan, region = defaults.bluemix.region,
        username, password, organizationName, spaceName, serviceName, instanceName } = {}) {
        checkRequiredParamsSync({
            params: [username, password, organizationName, spaceName, serviceName, instanceName],
            paramNames: ['username', 'password', 'organizationName', 'spaceName', 'serviceName', 'instanceName'],
            errorLabel: 'constructor()'
        });

        [this.username, this.password, this.plan,
            this.region, this.organizationName, this.spaceName,
            this.serviceName, this.instanceName] =
        [username, password, plan,
            region, organizationName, spaceName,
            serviceName, instanceName];
    }

    authenticate() {
        const instance = this;
        return authenticate(instance)
                .then((authResponse) => {
                    instance.authResponse = authResponse;
                })
                .catch((error) => {
                    throw new WatsonNLUUsageError(error.message);
                });
    }

    estimateCost({ featureCount = 1, plan = 'free', includeFreeUsage = false, payload } = {}) {
        const instance = this;

        return checkRequiredParams({
            params: [payload],
            paramNames: ['payload'],
            errorLabel: 'estimateCost()'
        })
        .then(() => instance.getUsage({ includeFreeUsage }))
        .then(usage => (
            estimateCost({
                featureCount,
                plan,
                existingItemCount: usage.itemCount,
                payload
            })
        ))
        .catch((error) => {
            throw new WatsonNLUUsageError(error.message);
        });
    }

    getUsage({ month = moment().utc().format('YYYY-MM'), includeFreeUsage = true } = {}) {
        const instance = this;
        const params = { instance, month };

        return instance
                .authenticate()
                .then(() => getOrganizationIdFromName(params))
                .then((organizationId) => {
                    instance.organizationId = organizationId;
                    return getOrganizationMetering(params);
                })
                .then((response) => {
                    const organization = response.organizations.find(org => (
                        org.name === instance.organizationName
                    ));
                    const hasNoReportedUsageForMonth = (typeof organization === 'undefined');
                    const seedUsage = { itemCount: 0, totalCost: 0 };
                    let usage;

                    if (hasNoReportedUsageForMonth) {
                        usage = seedUsage;
                    } else {
                        const usageClasses = includeFreeUsage ? ['non_billable_usage', 'billable_usage'] : ['billable_usage'];
                        usage = usageClasses.map((usageClass) => {
                            const space = organization[usageClass].spaces.find(qSpace => (
                                qSpace.name === instance.spaceName
                            ));
                            if (!space) {
                                return { quantity: 0, cost: 0 };
                            }
                            const service = space.services.find(qService => (
                                qService.name === instance.serviceName
                            ));
                            const nluInstance = service.instances.find(qNLUInstance => (
                                qNLUInstance.name === instance.instanceName
                            ));
                            const nluInstanceUsage = nluInstance.usage.find(usageEntry => (
                                usageEntry.unitId === 'ITEMS_PER_MONTH'
                            ));
                            return {
                                quantity: nluInstanceUsage.quantity,
                                cost: nluInstanceUsage.cost
                            };
                        })
                        .reduce((accum, usageClass) => {
                            seedUsage.itemCount += usageClass.quantity;
                            seedUsage.totalCost += usageClass.cost;
                            return seedUsage;
                        }, seedUsage);
                    }

                    return usage;
                })
                .catch((error) => {
                    throw new WatsonNLUUsageError(error.message);
                });
    }
};
