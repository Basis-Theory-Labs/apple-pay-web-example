let cachedApiKey;
let cachedBtApiUrl;

async function initialize() {
    if (!cachedApiKey) {
        const configResponse = await axios.get('/config');
        cachedApiKey = configResponse.data.apiKey;
        cachedBtApiUrl = configResponse.data.apiUrl ?? "https://api.basistheory.com";

        // Get the badge elements
        const productionBadge = document.getElementById("badge-production");
        const developmentBadge = document.getElementById("badge-development");
        const localBadge = document.getElementById("badge-local");

        // Check the URL and toggle visibility
        if (cachedBtApiUrl === "https://api.basistheory.com") {
            productionBadge.style.display = "inline-block"; // Show the production badge
            developmentBadge.style.display = "none"; // Hide the development badge
            localBadge.style.display = "none"; // Hide the local badge
        } else if (cachedBtApiUrl === "https://api.flock-dev.com") {
            productionBadge.style.display = "none"; // Hide the production badge
            developmentBadge.style.display = "inline-block"; // Show the development badge
            localBadge.style.display = "none"; // Hide the local badge
        } else if (cachedBtApiUrl === "http://localhost:5090") {
            productionBadge.style.display = "none"; // Hide the production badge
            developmentBadge.style.display = "none"; // Hide the development badge
            localBadge.style.display = "inline-block"; // Show the local badge
        }
    }
}

async function validateMerchant() {
    try {
        const options = {
            method: 'POST',
            url: 'https://' + window.location.host + '/session',
            headers: {
                'Content-Type': 'application/json'
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

        // DEMO: Write out Basis Theory Token Intent
        const intentElement = document.getElementById("token-intent");
        intentElement.value = JSON.stringify(response.data.tokenIntent, null, 2);

        // DEMO: Write out Basis Theory Apple Pay token
        const tokenElement = document.getElementById("apple-pay-token");
        tokenElement.value = JSON.stringify(response.data.applePayToken, null, 2);

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