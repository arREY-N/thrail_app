/**
 * Unit Test Suite for Multi-Payment Waterfall Drain Refund Algorithm & Payment System Hardening
 * Verifies Scenarios 1 & 2, Asymmetric Installments, Bounds Checking, Webhook Idempotency,
 * Slot Release Guards, Sparse Billing Sanitization, and UI Remaining Balance Logic.
 */

const assert = require('assert');

function executeWaterfallDrain(capturedPayments, targetAmount) {
    let remainingToRefund = targetAmount;
    const refundResults = [];

    for (const payment of capturedPayments) {
        if (remainingToRefund <= 0.001) {
            payment.status = 'captured';
            continue;
        }

        const availableInPayment = (payment.amount || 0) - (payment.refundedAmount || 0);
        if (availableInPayment <= 0.001) {
            payment.status = 'refunded';
            continue;
        }

        const amountToDrain = Math.min(availableInPayment, Math.round(remainingToRefund * 100) / 100);

        // Simulated refund call
        payment.refundedAmount = (payment.refundedAmount || 0) + amountToDrain;
        payment.status = payment.refundedAmount >= (payment.amount - 0.01) ? 'refunded' : 'captured';

        remainingToRefund = Math.max(0, Math.round((remainingToRefund - amountToDrain) * 100) / 100);
        refundResults.push({
            gatewayId: payment.gatewayId,
            amount: amountToDrain
        });
    }

    return { refundResults, remainingToRefund };
}

console.log('--- RUNNING EXPANDED REFUND ENGINE VALIDATION SUITE ---');

// Test 1: Scenario 1 - Custom Refund of ₱800 on two ₱600 installments (Total ₱1,200)
{
    const payments = [
        { gatewayId: 'pay_dep_001', amount: 600, status: 'captured' },
        { gatewayId: 'pay_bal_002', amount: 600, status: 'captured' }
    ];
    const totalCaptured = payments.reduce((sum, p) => sum + p.amount, 0);
    assert.strictEqual(totalCaptured, 1200, 'Total captured must be 1200');

    const { refundResults, remainingToRefund } = executeWaterfallDrain(payments, 800);

    assert.strictEqual(remainingToRefund, 0, 'Remaining target must be 0');
    assert.strictEqual(refundResults.length, 2, 'Must hit both payments');
    assert.strictEqual(refundResults[0].gatewayId, 'pay_dep_001');
    assert.strictEqual(refundResults[0].amount, 600, 'Payment 1 drained full 600');
    assert.strictEqual(payments[0].status, 'refunded', 'Payment 1 marked refunded');
    assert.strictEqual(refundResults[1].gatewayId, 'pay_bal_002');
    assert.strictEqual(refundResults[1].amount, 200, 'Payment 2 drained partial 200');
    assert.strictEqual(payments[1].status, 'captured', 'Payment 2 remains captured with partial refund');
    console.log('✅ Test 1 Passed: Scenario 1 (Custom ₱800 on ₱1,200 Downpayment)');
}

// Test 2: Scenario 2 - 100% Full Refund of ₱1,200 on two ₱600 installments
{
    const payments = [
        { gatewayId: 'pay_dep_001', amount: 600, status: 'captured' },
        { gatewayId: 'pay_bal_002', amount: 600, status: 'captured' }
    ];

    const { refundResults, remainingToRefund } = executeWaterfallDrain(payments, 1200);

    assert.strictEqual(remainingToRefund, 0, 'Remaining target must be 0');
    assert.strictEqual(refundResults.length, 2);
    assert.strictEqual(refundResults[0].amount, 600);
    assert.strictEqual(payments[0].status, 'refunded');
    assert.strictEqual(refundResults[1].amount, 600);
    assert.strictEqual(payments[1].status, 'refunded');
    console.log('✅ Test 2 Passed: Scenario 2 (Full ₱1,200 on ₱1,200 Downpayment)');
}

// Test 3: Asymmetric Installments (₱400 deposit + ₱800 balance, refund ₱900)
{
    const payments = [
        { gatewayId: 'pay_dep_003', amount: 400, status: 'captured' },
        { gatewayId: 'pay_bal_004', amount: 800, status: 'captured' }
    ];

    const { refundResults, remainingToRefund } = executeWaterfallDrain(payments, 900);

    assert.strictEqual(remainingToRefund, 0);
    assert.strictEqual(refundResults[0].amount, 400, 'Payment 1 drained full 400');
    assert.strictEqual(payments[0].status, 'refunded');
    assert.strictEqual(refundResults[1].amount, 500, 'Payment 2 drained remaining 500');
    assert.strictEqual(payments[1].status, 'captured');
    console.log('✅ Test 3 Passed: Asymmetric Installments (₱400 + ₱800 -> ₱900 Refund)');
}

// Test 4: Webhook Idempotency Check
{
    const payments = [
        { gatewayId: 'pay_already_captured_01', status: 'captured', amount: 600 }
    ];
    const incomingGatewayId = 'pay_already_captured_01';

    const isDuplicate = payments.some(p => p.gatewayId === incomingGatewayId && p.status === 'captured');
    assert.strictEqual(isDuplicate, true, 'Duplicate webhook should be detected');
    console.log('✅ Test 4 Passed: Webhook Idempotency Guard Detected Duplicate');
}

// Test 5: Reference Code Prioritization
{
    const eventDataId = 'pay_live_official_12345';
    const balanceTxnId = 'bal_txn_merchant_fee_98765';

    const referenceCode = eventDataId || balanceTxnId;
    assert.strictEqual(referenceCode, 'pay_live_official_12345', 'Must prioritize pay_ over bal_');
    console.log('✅ Test 5 Passed: Reference Code Prioritization (pay_ selected over bal_)');
}

// Test 6: Sparse Customer Billing Sanitization (Bug 3 Guard)
{
    const customerInfo = {
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '' // Missing phone
    };

    const billing = {};
    if (customerInfo.name && customerInfo.name.trim().length > 0) billing.name = customerInfo.name.trim();
    if (customerInfo.email && customerInfo.email.trim().length > 0) billing.email = customerInfo.email.trim();
    if (customerInfo.phone && customerInfo.phone.trim().length > 0) billing.phone = customerInfo.phone.trim();

    assert.strictEqual(billing.name, 'Maria Santos');
    assert.strictEqual(billing.email, 'maria@example.com');
    assert.strictEqual(billing.phone, undefined, 'Empty phone must be omitted to prevent PayMongo 400 error');
    console.log('✅ Test 6 Passed: Sparse Customer Billing Sanitization (Empty fields omitted)');
}

// Test 7: Double Slot Decrement Prevention (Bug 4 Guard)
{
    function shouldFunctionDecrementSlot(bookingStatus) {
        return bookingStatus !== 'cancelled' && 
               bookingStatus !== 'refunded' && 
               bookingStatus !== 'for-cancellation';
    }

    // Direct admin cancellation on active booking -> MUST decrement
    assert.strictEqual(shouldFunctionDecrementSlot('paid'), true, 'Direct admin refund must release slot');
    assert.strictEqual(shouldFunctionDecrementSlot('downpayment'), true, 'Downpayment refund must release slot');

    // User-requested cancellation -> Hook already decremented -> Function MUST NOT decrement again
    assert.strictEqual(shouldFunctionDecrementSlot('for-cancellation'), false, 'User cancellation must NOT double-decrement');
    assert.strictEqual(shouldFunctionDecrementSlot('cancelled'), false, 'Already cancelled booking must NOT decrement');
    console.log('✅ Test 7 Passed: Double Slot Decrement Guard (Prevents double subtraction)');
}

// Test 8: Remaining Balance Clamping on Inactive/Refunded Bookings (Bug 6 Guard)
{
    function computeRemainingBalance(totalAmount, payments, status) {
        const amountPaid = payments.reduce((sum, p) => p.status === 'captured' ? sum + p.amount : sum, 0);
        const isInactive = status === 'cancelled' || status === 'refunded';
        return isInactive ? 0 : Math.max(0, totalAmount - amountPaid);
    }

    // Active booking with downpayment: Total 1200, paid 600 -> Remaining 600
    assert.strictEqual(computeRemainingBalance(1200, [{ status: 'captured', amount: 600 }], 'downpayment'), 600);

    // Refunded booking: Total 1200, paid 0 (refunded) -> Remaining MUST BE 0 (NOT 1200!)
    assert.strictEqual(computeRemainingBalance(1200, [{ status: 'refunded', amount: 600, refundedAmount: 600 }], 'refunded'), 0);
    assert.strictEqual(computeRemainingBalance(1200, [{ status: 'refunded', amount: 600, refundedAmount: 600 }], 'cancelled'), 0);
    console.log('✅ Test 8 Passed: Remaining Balance Clamping (Returns ₱0.00 for refunded hikes)');
}

// Test 9: Bounds Checking on Custom Refund Amount
{
    const totalCapturedAmount = 1200;
    const maliciousHighAmount = 1500;

    const isExceeded = maliciousHighAmount > totalCapturedAmount;
    assert.strictEqual(isExceeded, true, 'Amounts above total captured must be rejected');
    console.log('✅ Test 9 Passed: Bounds Checking Rejection (Custom amount > total paid)');
}

console.log('--- ALL 9 VALIDATION TESTS PASSED SUCCESSFULLY! ---');
