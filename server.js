const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 8080;
const fs = require('fs');
const path = require('path');
const {Agent} = require("node:https");
const axios = require('axios');

const basisTheoryApiUrl = process.env.BT_API_URL ?? 'https://api.basistheory.com';
const btApiKey = process.env.BT_API_KEY;
const domain = process.env.SUBDOMAIN + '.loca.lt'

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')))

app.get('/config', (req, res) => {
    res.json({
        apiKey: btApiKey,
        apiUrl: basisTheoryApiUrl
    });
});

app.post('/session', async (req, res) => {
    const options = {
        method: 'POST',
        url: basisTheoryApiUrl + '/connections/apple-pay/session',
        headers: {
            'Content-Type': 'application/json',
            'BT-API-KEY': btApiKey
        },
        data: {
            display_name: 'Ducks R Us',
            domain: domain
        }
    };

    const response = await axios.request(options);
    res.send(response.data);
});

app.post('/processPayment', async (req, res) => {
    try {
        // Define the first request options
        const tokenizeOptions = {
            method: 'POST',
            url: basisTheoryApiUrl + '/connections/apple-pay/tokenize',
            headers: { 'Content-Type': 'application/json', 'BT-API-KEY': btApiKey },
            data: {
                apple_payment_method_token: req.body.token
            }
        };

        // Define the second request options
        const paymentOptions = {
            method: 'POST',
            url: basisTheoryApiUrl + '/apple-pay',
            headers: { 'Content-Type': 'application/json', 'BT-API-KEY': btApiKey },
            data: {
                expires_at: '2025-12-12',
                apple_payment_data: req.body.token
            }
        };

        // Perform both requests concurrently using Promise.all
        const [tokenizeResponse, paymentResponse] = await Promise.all([
            axios.request(tokenizeOptions),
            axios.request(paymentOptions)
        ]);

        // Combine the responses into a single object and send the result
        const result = {
            tokenIntent: tokenizeResponse.data,
            applePayToken: paymentResponse.data
        };
        res.send(result);
    } catch (error) {
        // Handle any error from either of the requests
        res.status(500).send({ error: error.message });
    }
});

app.get('/notification/merchantToken/:eventId', (req, res) => {
    const { eventId } = req.params;
    console.log(`Received notification for event ID: ${eventId}`);

    // Process the event, e.g., store in database or trigger an action
    res.status(200).json({ message: `Notification received for Event ID: ${eventId}` });
});

app.listen(port, () => {
    console.log('Server running on ➡️ ', `http://localhost:${port}`);
});