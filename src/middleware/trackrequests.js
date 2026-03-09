// Optimized timestamp tracking with circular buffer
const MAX_TIMESTAMPS = 10000;
let requestTimestamps = [];
let timestampIndex = 0;
export { requestTimestamps };

// Optimized middleware - minimal overhead
function requestTracker(req, res, next) {
    const now = Date.now();
    
    // Circular buffer approach for better performance
    if (requestTimestamps.length < MAX_TIMESTAMPS) {
        requestTimestamps.push(now);
    } else {
        requestTimestamps[timestampIndex] = now;
        timestampIndex = (timestampIndex + 1) % MAX_TIMESTAMPS;
    }

    // Cleanup old timestamps periodically (every 100 requests)
    if (timestampIndex === 0) {
        const fiveSecondsAgo = now - 5000;
        requestTimestamps = requestTimestamps.filter(ts => ts > fiveSecondsAgo);
    }

    next();
}

export default requestTracker;
