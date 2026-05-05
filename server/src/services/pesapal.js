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

    async submitOrder(token, paymentData) {
    try{
        const payload = {
            Id: paymentData.internalPaymentId,
            currency: "UGX",
            amount: paymentData.amount,
            description: paymentdata.description,
            callback_url: "http://localhost:5173/payment-status",//one that react will go to, after payment is done  
            notification_id:process.env.PESAPAL_NOTIFICATION_URL, 
                 billing_address: {
                    email_address: "[EMAIL_ADDRESS]", // Pesapal requires an email
                    phone_number: paymentData.phone,
                    country_code: "UG", 
                    first_name: paymentData.name,
                    middle_name: "",
                    last_name: ""
                }         
        }

        const response = await axios.post(`${this.baseUrl}/api/Transactions/SubmitOrderRequest`, payload, {
            headers: {
                Authorization:`Bearer ${token}`
            }
        }
    )
        return response.data;
    }
    catch(error){
        console.error("error submitting order:",
        error.response?error.response.data: error.message);
        throw new Error("failed to submit order to pesapal")
    }
}

}


module.exports = new PesapalService();
