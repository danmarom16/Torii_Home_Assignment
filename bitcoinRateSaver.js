const axios = require("axios");

class BitcoinRateSaver {

    /**
     *
     * @param base is the Airtable base table.
     * @param fetchingInterval - BTC fetching request interval.
     * @param fetchingUrl - URL endpoint that we fetch BTC rate from.
     */
    constructor(base, fetchingInterval, fetchingUrl) {
        this.unsentRates = [];
        this.base = base;
        this.fetchingInterval = fetchingInterval;
        this.fetchingUrl = fetchingUrl;
    }

    // ------- AIRTABLE FUNCTIONS ---------
    /**
     * Responsible to send a single (rate, time) record to the airtable.
     *
     * @param rate - current rate of the BTC.
     * @param time - time of this rate.
     */
    async sendSingleRecord (rate, time) {
        try {
            await this.base("BTC Table").create([
                {
                    fields: {
                        Time: time,
                        Rates: parseFloat(rate),
                    }
                }
            ])
            console.log("Successfully send to airtable");
        } catch (error) {
            throw error;
        }
    }

    /**
     * Sends all locally save records that yet to be sent to the Airtable. After doing so, it empties this list.
     */
    async sendLocallySavedRatesToAirtable() {
        console.log(`Attempting to send ${this.unsentRates.length} unsent rates to Airtable.`);
        for (const element of this.unsentRates) {
            try{
                await this.sendSingleRecord(element.rate, element.time);
            } catch (error) {
                console.log(`Error sending record ${element} to Airtable`, error);
            }
        }
        this.unsentRates = [];
    }

    /**
     * Responsible for handling the sending logic to the Airtable. Trigger locally saved records to be send first, and
     * then proceed with saving the current record.
     *
     * @param rate - current rate of BTC.
     * @param time - - time of this rate.
     */
    async sendToAirtable(rate, time) {
        if (this.unsentRates.length > 0) {
            try {
                await this.sendLocallySavedRatesToAirtable();
            } catch (error) {
                console.log("Was not able to send locally save rates to Airtable", error);
            }
        }
        try {
            await this.sendSingleRecord(rate, time);
            console.log(`Successfully send ${rate}-${time} to airtable`);
        }catch(error) {
            throw error;
        }
    }

    /**
     * Saves rate and time locally.
     *
     * @param rate - current rate of BTC.
     * @param time - - time of this rate.
     */
    saveRateLocally(rate, time) {
        this.unsentRates.push({"rate": rate, "time": time});
        console.log("Saved rate locally");
    }

    /**
     * Responsible for fetching current rate of BTC.
     * @returns {Promise<*>}
     */
    async fetchBitcoinRates() {
        try{
            const response = await axios.get(this.fetchingUrl);
            return response.data.data.rates.USD;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Triggers BTC rate fetching, assign the current time and send it to the Airtable. In case of an error, saves
     * the record locally to not lose any BTC data.
     */
    async fetchAndSave() {
        try {
            const rate = await this.fetchBitcoinRates();
            const time = new Date().toLocaleString('en-US');
            try{
                await this.sendToAirtable(rate, time);
            } catch (error) {
                console.log("Error during airtable saving",error);
                this.saveRateLocally(rate, time);
            }

        } catch (error) {
            console.log("Error during rate fetching",error);
            throw error;
        }
    }

    /**
     * Trigger fetchAndSave every BTC fetching request interval.
     */
    start() {
        setInterval(() => this.fetchAndSave(), this.fetchingInterval);
    }

}

module.exports = BitcoinRateSaver;