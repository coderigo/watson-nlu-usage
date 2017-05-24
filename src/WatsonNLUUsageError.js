const WatsonNLUUsageError = class WatsonNLUUsageError extends Error {
    constructor(...args) {
        super(...args);
        Error.captureStackTrace(this, WatsonNLUUsageError);
    }
};


export default WatsonNLUUsageError;
