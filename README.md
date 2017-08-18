# watson-nlu-usage

[![Build Status](https://travis-ci.org/coderigo/watson-nlu-usage.png?branch=master)](https://travis-ci.org/coderigo/watson-nlu-usage)

[![NPM](https://nodei.co/npm/watson-nlu-usage.png?downloads=true)](https://nodei.co/npm/watson-nlu-usage/)

Watson [Natural Language Understanding](https://www.ibm.com/watson/developercloud/natural-language-understanding.html) (NLU) API usage module.

The absorption of [Alchemy API](https://www.alchemyapi.com/) by [IBM Watson Developer Cloud](https://www.ibm.com/watson/developercloud/) into [Watson NLU](https://www.ibm.com/watson/developercloud/natural-language-understanding.html) means usage information no longer comes back in API response headers. This module provides a way to get usage information using IBM Bluemix APIs instead.

**UPDATE**: Watson has recently begun sending usage information in response bodies under an object aptly named `usage` with three properties `text_units, text_characters, features`. You should trust those figures above those produced by this module. This module can still be used, however, to _estimate_ and get current usage.

<!-- toc -->
- [Installation](#installation)
- [Usage](#usage)
- [Bluemix setup](#bluemix-setup)
- [API](#api)
    * [constructor](#constructor)
    * [estimateCost](#estimateCost)
    * [getUsage](#getUsage)
- [Developing](#developing)
<!-- tocstop -->

## Installation

```bash
npm install --save watson-nlu-usage
```

## Usage

```javascript
const WatsonNLUUsage = require('watson-nlu-usage');
const watsonNLUUsage = new WatsonNLUUsage({
    username: 'user.with.audit.permissions@some.email.com',
    password: 'password-for-said-user',
    organizationName: 'some-bluemix-organization',
    spaceName: 'some-bluemix-space',
    serviceName: 'some-bluemix-service',
    instanceName: 'some-watson-nlu-instance',
    plan: 'free', // default
    region: 'us-south' // default
});

// Estimate the cost of a call to Watson NLU using the free plan
watsonNLUUsage
    .estimateCost({ plan: 'free', featureCount: 2, payload: 'Some text to send to Watson NLU....' })
    .then(costEstimate => {
        // costEstimate: { plan: 'free', moneyCost: 0, itemCost: 673 }
    });

// Estimate the cost of a call to Watson NLU using the paid standard plan
watsonNLUUsage
    .estimateCost({ plan: 'standard', featureCount: 2, payload: 'Some text to send to Watson NLU....' })
    .then(costEstimate => {
        // costEstimate: { plan: 'standard', moneyCost: 625.32, itemCost: 250738 }
    });

// Get usage for the current month
watsonNLUUsage
    .getUsage()
    .then(usageStats => {
        console.log(usageStats);
        // usageStats: { itemCount: 1010, totalCost: 0.03 }
    });

// Get usage for the current month including free calls in the itemCount
watsonNLUUsage
    .getUsage({ includeFreeUsage: true })
    .then(usageStats => {
        console.log(usageStats);
        // usageStats: { itemCount: 1010, totalCost: 0.03 }
    });

// Get usage for January 2017
watsonNLUUsage
    .getUsage({ month: '2017-01' })
    .then(usageStats => {
        // usageStats: { itemCount: 1010, totalCost: 0.03 }
    });
```

## Bluemix setup

1. A Watson NLU instance. Follow their [page](https://www.ibm.com/watson/developercloud/natural-language-understanding.html) to [log into Bluemix](https://idaas.iam.ibm.com/idaas/mtfim/sps/authsvc?PolicyId=urn:ibm:security:authentication:asf:basicldapuser) and if you don't already have these, create the following: an `organization` containing a `space` containing a `service` containing a (Watson NLU) `instance`. Keep track of the names of all those components and make sure you have added a user with at least `auditor` permissions. You will need that user's credentials to get usage information.

2. You may also want to take note of the region for your organization. This module assumes `us-south` by default.

## API

##### constructor
`new WatsonNLUUsage(options) ==> watsonNLUUsage instance`

- `options.username`: Username (email address) for user with audit access to the target instance.

- `options.password`: Password for for user in `options.username`.

- `options.organizationName`: Bluemix organization name owning the target instance.

- `options.spaceName`: Bluemix space name (owned by `options.organizationName`) owning the target instance.

- `options.serviceName`: Bluemix service name (owned by `options.spaceName`) owning the target instance.

- `options.instanceName`: Bluemix instance name for the target Watson NLU instance.

- `options.plan (default: 'free')`: The Watson NLU [plan](https://www.ibm.com/watson/developercloud/natural-language-understanding.html) `options.instanceName` is on. One of `'free' | 'standard'`.

- `options.region (default: 'us-south')`: The Bluemix region to use for API calls.

##### estimateCost
Estimates the cost (in items and money) of a call to Watson NLU API. This estimate has a crude way of looking at the size of the `payload` and at worst over-estimates the cost since it does not take into account any cleaning the Watson NLU API may do to the `payload` server-side before analyzing it. It also is set to read only the first 50kb of a `payload` in keeping with the published limitations.

`.estimateCost(options) ==> Promise(costEstimate)`

- `options.payload`: Text payload for which to estimate the processing cost.

- `options.featureCount (default: 1)`: The number of features to extract from `options.payload` (e.g. concepts and entities extraction are `2` features).

- `options.plan (default: 'free')`: One of `'free' | 'standard'`. The plan to use when estimating the cost. If set to `'standard'` it will gather the current month's usage and use it to bootstrap the estimate into the right cost tiers.

- `options.includeFreeUsage (default: false)`: Include free usage calls (typically 1000 per day) in `costEstimate.itemCost`.

- `costEstimate.plan`: NLU plan used to estimate the cost of `options.payload`.

- `costEstimate.itemCost`: Estimated number of NLU items incurred for extracting `options.featureCount` features from `options.payload`.

- `costEstimate.moneyCost`: Estimated `$` cost of extracting `costEstimate.itemCost`.

##### getUsage
`.getUsage(options) ==> Promise(usageStats)`

- `options.month (default: current month, format: 'YYYY-MM' )`: Month to get `usageStats` for.

- `options.includeFreeUsage (default: true)`: Include free calls in `usageStats.totalCost`.

- `usageStats.itemCount`: The number of NLU items consumed in the month specified in `options.month`.

- `usageStats.totalCost`: The total cost for processing `usageStats.itemCount` in `options.month`.


## Developing

```javascript
npm install
npm run build
npm run test
```
