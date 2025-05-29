function onApplePayButtonClicked() {

    if (!ApplePaySession) {
        return;
    }

    // Define ApplePayPaymentRequest
    const request = {
        "countryCode": "US",
        "currencyCode": "USD",
        "merchantCapabilities": [
            "supports3DS"
        ],
        "supportedNetworks": [
            "visa",
            "masterCard",
            "amex",
            "discover"
        ],
        "lineItems": [
            {
                "label": "Automatic Reload",
                "amount": "15.00",
                "paymentTiming": "automaticReload",
                "automaticReloadPaymentThresholdAmount": "5.00"
            }
        ],
        "recurringPaymentRequest": {
            "paymentDescription": "A description of the automatic reload that you provide and that appears in the payment sheet.",
            "regularBilling": {
                "label": "Subscription",
                "amount": "20.00",
                "type": "final",
                "paymentTiming": "recurring",
                "recurringPaymentStartDate": new Date("2025-06-01T00:00:00"),
                "recurringPaymentIntervalUnit": "month",
                "recurringPaymentIntervalCount": 6,
                "recurringPaymentEndDate": new Date("2029-01-01T00:00:00"),
            },
            "billingAgreement": "A localized billing agreement that the app displays to the user in the payment sheet.",
            "managementURL": cachedBtApiUrl + "/notify",
            "tokenNotificationURL": cachedBtApiUrl + "/apple-pay/" + cachedTenantId
        },
        "total": {
            "label": "Automatic Reload Demo (Card is not charged)",
            "amount": "15.00"
        }
    };

    console.log('request', request);

    // Create ApplePaySession
    const session = new ApplePaySession(3, request);

    session.onvalidatemerchant = async event => {
        // Call your own server to request a new merchant session.
        const merchantSession = await validateMerchant();
        session.completeMerchantValidation(merchantSession);
    };

    session.onpaymentmethodselected = event => {
        // Define ApplePayPaymentMethodUpdate based on the selected payment method.
        // No updates or errors are needed, pass an empty object.
        const update = {
            newTotal: {
                "label": "Demo (Card is not charged)",
                "type": "final",
                "amount": "1.99"
            }
        };
        session.completePaymentMethodSelection(update);
    };

    session.onshippingmethodselected = event => {
        // Define ApplePayShippingMethodUpdate based on the selected shipping method.
        // No updates or errors are needed, pass an empty object.
        const update = {};
        session.completeShippingMethodSelection(update);
    };

    session.onshippingcontactselected = event => {
        // Define ApplePayShippingContactUpdate based on the selected shipping contact.
        const update = {};
        session.completeShippingContactSelection(update);
    };

    session.onpaymentauthorized = event => {
        const token = event.payment.token;
        console.log('token', token);
        console.log('merchantTokenIdentifier', token.merchantTokenIdentifier);
        performTransaction(event, session);
    };

    session.oncouponcodechanged = event => {
        // Define ApplePayCouponCodeUpdate
        const newTotal = calculateNewTotal(event.couponCode);
        const newLineItems = calculateNewLineItems(event.couponCode);
        const newShippingMethods = calculateNewShippingMethods(event.couponCode);
        const errors = calculateErrors(event.couponCode);

        session.completeCouponCodeChange({
            newTotal: newTotal,
            newLineItems: newLineItems,
            newShippingMethods: newShippingMethods,
            errors: errors,
        });
    };

    session.oncancel = event => {
        // Payment canceled by WebKit
    };

    session.begin();
}