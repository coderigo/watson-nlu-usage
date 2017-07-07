import WatsonNLUUsageError from './WatsonNLUUsageError';

const defaults = require('./defaults.json');
const request = require('request-promise');

export const checkRequiredParamsSync = ({ params, paramNames, errorLabel } = {}) => {
    const missingParams = params.some(param => !param);

    if (missingParams) {
        const messagePrefix = `[ watson-nlu-usage ${errorLabel ? `@ ${errorLabel}` : ''} ] :`;
        const message = `${messagePrefix} Missing one or more required parameters: ${paramNames.join(',')}`;
        throw new WatsonNLUUsageError(message);
    }
};

export const checkRequiredParams = ({ params, paramNames, errorLabel } = {}) => (
    new Promise((resolve, reject) => {
        try {
            checkRequiredParamsSync({ params, paramNames, errorLabel });
            resolve();
        } catch (error) {
            reject(error);
        }
    })
);

export const getOrganizationIdFromName = ({ instance }) => {
    const requestOptions = {
        url: `${defaults.bluemix.apiEndpoint}/${defaults.bluemix.apiVersion}/organizations`,
        method: 'GET',
        headers: {
            Authorization: `${instance.authResponse.token_type} ${instance.authResponse.access_token}`
        },
        json: true
    };

    return request(requestOptions)
            .then((response) => {
                const organization = response.resources.find(org => (
                    org.entity.name === instance.organizationName
                ));

                if (organization) {
                    return organization.metadata.guid;
                }
                throw new WatsonNLUUsageError(
                    `Unable to find an organization with the name "${instance.organizationName}"`
                );
            });
};

export const getOrganizationMetering = ({ instance, month }) => {
    const requestOptions = {
        url: `${defaults.bluemix.usageEndpoint}/${defaults.bluemix.apiVersion}/metering/organizations/${instance.region}:${instance.organizationId}/usage/${month}`,
        method: 'GET',
        headers: {
            Authorization: `${instance.authResponse.token_type} ${instance.authResponse.access_token}`
        },
        json: true
    };
    return request(requestOptions);
};

export const estimateCost = ({ featureCount, plan, existingItemCount, payload }) => {
    // https://www.ibm.com/watson/developercloud/natural-language-understanding.html
    // TODO: improve character size guesstimate
    const payloadCharacterSize = Buffer.from(payload)
                                        .slice(0, defaults.watson.maxFileSizeKB * 1000)
                                        .toString().length;

    const callSplits = Math.ceil(payloadCharacterSize / defaults.watson.maxCharactersPerCall);
    const itemCost = featureCount * callSplits;
    let moneyCost = 0;

    if (plan !== 'free') {
        const reduceSeed = {
            sum: 0,
            accountedFor: existingItemCount,
            unaccountedFor: itemCost
        };
        moneyCost = defaults.watson.transactionTiers
                    .filter(tier => (
                        existingItemCount <= tier.to &&
                        (itemCost + existingItemCount) >= tier.from
                    ))
                    .reduce((accum, tier) => {
                        const tierItems = Math.min(reduceSeed.unaccountedFor,
                                                   tier.to - reduceSeed.accountedFor);
                        reduceSeed.sum += tierItems * tier.costPerItem;
                        reduceSeed.accountedFor += tierItems;
                        reduceSeed.unaccountedFor -= tierItems;
                        return reduceSeed;
                    }, reduceSeed)
                    .sum;
    }

    return { plan, moneyCost, itemCost };
};

export const authenticate = (instance) => {
    const requestOptions = {
        url: defaults.bluemix.authEndpoint,
        method: 'POST',
        headers: {
            Authorization: 'Basic Y2Y6',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            grant_type: 'password',
            client_id: 'node-watson-api-usage',
            username: instance.username,
            password: instance.password
        }
    };

    return request(requestOptions)
    .then(response => JSON.parse(response))
    .catch((response) => {
        throw new WatsonNLUUsageError(JSON.parse(response.error).error_description);
    });
};
