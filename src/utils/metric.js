let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;

export function incrementRequest(statusCode) {
  totalRequests++;
  if (statusCode >= 200 && statusCode <= 304) {
    successfulRequests++;
  } else if (statusCode >= 400) {
    failedRequests++;
  }
}

export function getMetrics() {
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate:
      totalRequests === 0
        ? 100
        : Number(((successfulRequests / totalRequests) * 100).toFixed(2)),
    errorRate:
      totalRequests === 0
        ? 0
        : Number(((failedRequests / totalRequests) * 100).toFixed(2)),
  };
}
