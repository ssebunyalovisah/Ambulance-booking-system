const axios = require("axios");

class PesapalService {
    constructor() {
        this.consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        this.consumerSecret = process.env.PESAPAL_SECRET_KEY;
        this.baseUrl = process.env.PESAPAL_BASE_URL;
    }


    async getOAuthToken() {
        //request token
        try {
            const response = await axios.post(`${this.baseUrl}/api/auth/RequestAdvToken`,
                {
                    consumer_key: this.consumerKey,
                    consumer_secret: this.consumerSecret
                });

            //token comes back
            console.log("Successfully received token")
            return response.data.token;
        }
        catch (error) {
            console.error("error getting token",
                error.response ?
                    error.response.data : error.message);
            throw new Error("could not authenticate with pesapal");
        }
    }
}

module.exports = new PesapalService();
