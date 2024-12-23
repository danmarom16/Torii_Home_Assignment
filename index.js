
// Load dotenv to fetch secret API key
const dotenv = require('dotenv');
dotenv.config();

// Init axios
const axios = require("axios");

// Init airtable
const Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AIRTABLE_API_KEY,
});
const base = Airtable.base(process.env.BASE_ID);


async function fetchBitcoinRates() {
    try{
        const response = await axios.get("https://api.coinbase.com/v2/exchange-rates?currency=BTC");
        return response.data.data.rates.USD;
    } catch (e) {
        console.log(e);
    }
}

async function sendToAirtable(rates, time) {
    try {
        await base("BTC Table").create([
            {
                fields: {
                    Time: time,
                    Rates: parseFloat(rates),
                }
            }
        ])
        console.log("Successfully send to airtable");
    } catch (e) {
        console.log(e);
    }
}

async function fetchAndSave() {
    try {
        const rate = await fetchBitcoinRates();
        const time = new Date().toLocaleString('en-US');
        await sendToAirtable(rate, time);
    } catch (e) {
        console.log(e);
        throw e;
    }
}
setInterval(fetchAndSave, 1000);