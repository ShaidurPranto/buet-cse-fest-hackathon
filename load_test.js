// k6 run ./load_test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metrics to track specific outcomes
const successfulOrders = new Counter('successful_orders');
const timedOutOrders = new Counter('timed_out_orders');
const failedOrders = new Counter('failed_orders');
const retriedOrders = new Counter('retried_orders');
const idempotencyHits = new Counter('idempotency_hits');

export const options = {
    // Key configurations for the load test
    stages: [
        { duration: '10s', target: 10 }, // Ramp up to 10 users over 30 seconds
        { duration: '30s', target: 10 },  // Stay at 10 users for 1 minute
        { duration: '10s', target: 0 },  // Ramp down to 0 users
    ],
    thresholds: {
        http_req_failed: ['rate<0.8'], 
    },
};

export function setup() {
    // Restock inventory before starting to ensure we don't run out of stock
    const inventoryUrl = "http://localhost:3001/api/inventory/restock";
    const payload = JSON.stringify({
        product_id: 5,
        quantity: 1000
    });
    
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(inventoryUrl, payload, params);

    if (res.status === 200 || res.status === 201) {
        console.log(`[SETUP] Inventory restocked successfully (+1000 units for product 5). Response: ${JSON.stringify(res.json())}`);
    } else {
        console.error(`[SETUP] Failed to restock inventory. Status: ${res.status} Body: ${res.body}`);
    }
}

export default function () {
    const url = __ENV.ORDER_URL || "http://localhost:3000/api/orders";
    // If we retry, we MUST use the same key
    const idempotencyKey = `user-${__VU}-iter-${__ITER}-${Date.now()}`;

    const payload = JSON.stringify({
        product_id: 5,
        quantity: 1,
        user_id: 101,
    });

    let success = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!success && attempts < maxAttempts) {
        attempts++;

        if (attempts > 1) {
            retriedOrders.add(1);
            console.log(`User ${__VU} retrying request ${idempotencyKey} (Attempt ${attempts})`);
            sleep(1); // Standard backoff
        }

        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Idempotency-Key': idempotencyKey, // Sent on initial and retry attempts
            },
            // Ensure k6 doesn't timeout before the application does (app timeout is 5s)
            timeout: '15s',
        };

        let res;
        try {
            res = http.post(url, payload, params);
        } catch (e) {
            // Network level timeout or error in k6
            timedOutOrders.add(1);
            continue; // Retry
        }

        // Check if idempotent hit (Server says "already processed")
        if (res.status === 200 && res.json('message') && res.json('message').includes('Idempotent')) {
            idempotencyHits.add(1);
        }

        // Success condition: 201 (Created) or 200 (OK/Idempotent)
        if (res.status === 201 || res.status === 200) {
            check(res, {
                'status is 200/201': (r) => r.status === 200 || r.status === 201,
                'inventory updated': (r) => r.json('inventory_status') === 'SUCCESS',
            });
            successfulOrders.add(1);
            success = true;
        } else {
            // Failure condition
            // 5xx errors or explicit app timeouts -> Retry
            if (res.status >= 500) {
                if (attempts === maxAttempts) {
                    failedOrders.add(1);
                    console.log(`[FAILURE] All retries failed. Last status: ${res.status}`);
                }
            } else {
                // Client error (4xx) - do not retry
                failedOrders.add(1);
                console.log(`[FAILURE] Client error: ${res.status} ${res.body}`);
                break;
            }
        }
    }

    // Short sleep to pace the requests slightly
    sleep(1);
}
