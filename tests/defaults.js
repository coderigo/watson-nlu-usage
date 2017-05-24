const defaults = require('../src/defaults.json');

const extendedDefaults = JSON.parse(JSON.stringify(defaults));

extendedDefaults.interceptors = {
    login: {
        url: defaults.bluemix.authEndpoint,
        path: ''
    },
    organization: {
        url: `${defaults.bluemix.apiEndpoint}/${defaults.bluemix.apiVersion}`,
        path: '/organizations'
    },
    organizationUsage: {
        url: defaults.bluemix.usageEndpoint,
        path: new RegExp(/\/metering\/organizations.+\/usage\/.+/)
    }
};

module.exports = extendedDefaults;
