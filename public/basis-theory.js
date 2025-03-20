let cachedApiKey;

async function validateMerchant() {
    try {
        if (!cachedApiKey) {
            const configResponse = await axios.get('/config');
            cachedApiKey = configResponse.data.apiKey;
        }

        const options = {
            method: 'POST',
            url: 'https://api.basistheory.com/connections/apple-pay/session',
            headers: {
                'Content-Type': 'application/json',
                'BT-API-KEY': cachedApiKey
            },
            data: {
                display_name: 'Ducks R Us',
                domain: window.location.host
            }
        };

        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error('Error validating merchant:', error);
        throw error;
    }
}

async function performTransaction(event, session) {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const processPaymentUrl = baseUrl + '/processPayment'
    try {
        const details = event.payment;

        // DEMO: Write out Apple Pay Token
        const outcomeElement = document.getElementById("outcome");
        outcomeElement.value = JSON.stringify(details.token);

        const response = await axios.post(
            processPaymentUrl,
            {
                token: details.token,
                customerEmail: details.shippingContact?.emailAddress,
                billingDetails: details.billingContact,
                shippingDetails: details.shippingContact
            },
            {
                headers: { 'Access-Control-Allow-Origin': '*' }
            }
        );

        // DEMO: Write out Basit Theory Token Intent
        const intentElement = document.getElementById("token-intent");
        intentElement.value = JSON.stringify(response.data);

        session.completePayment(ApplePaySession.STATUS_SUCCESS);
    } catch (error) {
        console.error('Error performing transaction:', error);
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        throw error;
    }
}

// DEMO: Helper function called from Apple Demo script
function calculateNewTotal(couponCode) {
    return {
        "label": "Demo (Card is not charged)",
        "type": "final",
        "amount": "1.99"
    }
}