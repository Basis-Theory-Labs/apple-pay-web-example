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
    // First, tokenize Apple Pay to Basis Theory Token Intent.
    const tokenizeOptions = {
        method: 'POST',
        url: basisTheoryApiUrl + '/connections/apple-pay/tokenize',
        headers: {'Content-Type': 'application/json', 'BT-API-KEY': btApiKey},
        data: {
            apple_payment_method_token: req.body.token
        }
    };
    axios.request(tokenizeOptions)
        .then(function (response) {
            // Proxy the Token Intent to payment processor....

            // For this demo, just return the token intent to browser
            res.send(response.data);
        })
        .catch(function (error) {
            res.send(error);
        });
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