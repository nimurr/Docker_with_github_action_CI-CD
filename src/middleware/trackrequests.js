// Store timestamps of requests
let requestTimestamps = [];
export { requestTimestamps };

// Middleware to track requests
function requestTracker(req, res, next) {
    const now = Date.now();

    // Save current request time
    requestTimestamps.push(now);

    // Keep only last 5 seconds requests
    requestTimestamps = requestTimestamps.filter(
        (timestamp) => now - timestamp <= 5000
    );

    next();
}

export default requestTracker;