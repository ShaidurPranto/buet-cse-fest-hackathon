// k6 run ./load_test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metrics to track specific outcomes
const successfulOrders = new Counter('successful_orders');
const timedOutOrders = new Counter('timed_out_orders');
const failedOrders = new Counter('failed_orders');

export const options = {
    // Key configurations for the load test
    stages: [
        { duration: '30s', target: 10 }, // Ramp up to 10 users over 30 seconds
        { duration: '1m', target: 10 },  // Stay at 10 users for 1 minute
        { duration: '10s', target: 0 },  // Ramp down to 0 users
    ],
    thresholds: {
        // We expect some failures due to the 5th request latency simulation
        // So we don't fail the test on HTTP errors, but we can set thresholds if needed
        http_req_failed: ['rate<0.3'], // Allow up to 30% failure rate (since 1 in 5 is 20%)
    },
};

export default function () {
    const url = __ENV.ORDER_URL || "http://localhost:3000/api/orders";
    const payload = JSON.stringify({
        product_id: 5,
        quantity: 1,
        user_id: 101,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        // Ensure k6 doesn't timeout before the application does (app timeout is 5s)
        timeout: '15s',
    };

    const res = http.post(url, payload, params);

    // Check the response
    const isSuccess = check(res, {
        'status is 201': (r) => r.status === 201,
        'inventory updated': (r) => r.json('inventory_status') === 'SUCCESS',
    });

    const isTimeout = check(res, {
        'status is 503': (r) => r.status === 503,
        'is timeout error': (r) => r.json('inventory_status') === 'TIMEOUT',
    });

    // Record metrics
    if (isSuccess) {
        successfulOrders.add(1);
    } else if (isTimeout) {
        timedOutOrders.add(1);
        console.log(`[TIMEOUT DETECTED] Order failed due to latency. Response time: ${res.timings.duration}ms`);
    } else {
        failedOrders.add(1);
        console.log(`[FAILURE] Unexpected error: ${res.status} ${res.body}`);
    }

    // Short sleep to pace the requests slightly
    sleep(1);
}
