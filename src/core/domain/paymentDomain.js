export function pay(){
    console.error('CONNECT TO PAYMENT GATEWAY');
    const now = new Date();

    const receipt = { 
        reference: 'test_receipt_123', 
        createdAt: now,
        amount: 1399
    };

    return receipt
}