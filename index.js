
// CONSTANTS
const BTC_RATE_URL = "https://api.coinbase.com/v2/exchange-rates?currency=BTC"
const FETCH_INTERVAL = 60000;

// CONFIG
const dotenv = require('dotenv');
dotenv.config();

const Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AIRTABLE_API_KEY,
});
const base = Airtable.base(process.env.BASE_ID);

const BitcoinRateSaver = require('./bitcoinRateSaver');
const rateSaver = new BitcoinRateSaver(base, FETCH_INTERVAL, BTC_RATE_URL);
rateSaver.start();