// k6 run ./load_test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const successfulOrders = new Counter('successful_orders');
const timedOutOrders = new Counter('timed_out_orders');
const failedOrders = new Counter('failed_orders');
const retriedOrders = new Counter('retried_orders');
const idempotencyHits = new Counter('idempotency_hits');
const delayedOrders = new Counter('delayed_orders');
const responseTime = new Trend('order_response_time');

export const options = {
    stages: [
        { duration: '10s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.8'],
        order_response_time: ['p(95)<10000'],
    },
};

export function setup() {
    const inventoryUrl = "http://localhost:3001/api/inventory/restock";
    const payload = JSON.stringify({ product_id: 5, quantity: 1000 });
    const params = { headers: { 'Content-Type': 'application/json' } };

    const res = http.post(inventoryUrl, payload, params);
    if (res.status === 200 || res.status === 201) {
        console.log(`[SETUP] Inventory restocked: ${JSON.stringify(res.json())}`);
    } else {
        console.error(`[SETUP] Failed to restock. Status: ${res.status}`);
    }
}

export default function () {
    const url = __ENV.ORDER_URL || "http://localhost:3000/api/orders";
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
            console.log(`[RETRY] VU ${__VU} - Key ${idempotencyKey} (Attempt ${attempts})`);
            sleep(1);
        }

        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Idempotency-Key': idempotencyKey,
            },
            timeout: '15s',
        };

        const startTime = new Date().getTime();
        let res;
        
        try {
            res = http.post(url, payload, params);
        } catch (e) {
            timedOutOrders.add(1);
            console.log(`[TIMEOUT] VU ${__VU} - Network timeout - Key: ${idempotencyKey}`);
            continue;
        }

        const duration = new Date().getTime() - startTime;
        responseTime.add(duration);

        if (duration > 5000) {
            delayedOrders.add(1);
            console.log(`[DELAYED] VU ${__VU} - ${duration}ms - Key: ${idempotencyKey} - Status: ${res.status}`);
        }

        if (res.status === 200 && res.json('message')?.includes('Idempotent')) {
            idempotencyHits.add(1);
            console.log(`[IDEMPOTENT] VU ${__VU} - Key: ${idempotencyKey}`);
        }

        if (res.status === 201 || res.status === 200) {
            check(res, {
                'status is 200/201': (r) => r.status === 200 || r.status === 201,
                'inventory updated': (r) => r.json('inventory_status') === 'SUCCESS',
            });
            successfulOrders.add(1);
            success = true;
        } else {
            if (res.status >= 500) {
                console.log(`[ERROR] VU ${__VU} - Status ${res.status} - Will retry - Key: ${idempotencyKey}`);
                if (attempts === maxAttempts) {
                    failedOrders.add(1);
                    console.log(`[FAILED] VU ${__VU} - All retries exhausted - Key: ${idempotencyKey}`);
                }
            } else {
                failedOrders.add(1);
                console.log(`[CLIENT_ERROR] VU ${__VU} - Status ${res.status} - Key: ${idempotencyKey}`);
                break;
            }
        }
    }

    sleep(1);
}

export function handleSummary(data) {
    console.log('\n========== LOAD TEST SUMMARY ==========');
    console.log(`Successful Orders: ${data.metrics.successful_orders?.values.count || 0}`);
    console.log(`Failed Orders: ${data.metrics.failed_orders?.values.count || 0}`);
    console.log(`Timed Out Orders: ${data.metrics.timed_out_orders?.values.count || 0}`);
    console.log(`Delayed Orders (>5s): ${data.metrics.delayed_orders?.values.count || 0}`);
    console.log(`Retried Orders: ${data.metrics.retried_orders?.values.count || 0}`);
    console.log(`Idempotency Hits: ${data.metrics.idempotency_hits?.values.count || 0}`);
    console.log(`Avg Response Time: ${Math.round(data.metrics.order_response_time?.values.avg || 0)}ms`);
    console.log(`P95 Response Time: ${Math.round(data.metrics.order_response_time?.values['p(95)'] || 0)}ms`);
    console.log('========================================\n');
    
    return {
        'stdout': JSON.stringify(data, null, 2),
    };
}
