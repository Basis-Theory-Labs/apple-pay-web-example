const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = process.env.PORT || 8080;
const fs = require('fs');
const path = require('path');
const {Agent} = require("node:https");
const axios = require('axios');

const basisTheoryApiUrl = 'https://api.basistheory.com';
const btApiKey = process.env.BT_API_KEY;

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')))

app.get('/config', (req, res) => {
    res.json({ apiKey: process.env.BT_API_KEY });
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

app.listen(port, () => {
    console.log('Server running on ➡️ ', `http://localhost:${port}`);
});