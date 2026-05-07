const axios = require("axios");

class PesapalService {
    constructor() {
        this.consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        this.consumerSecret = process.env.PESAPAL_SECRET_KEY;
        this.baseUrl = process.env.PESAPAL_BASE_URL;
        this.backendUrl = process.env.BACKEND_URL;
        this.frontendUrl = process.env.FRONTEND_URL;            
    }


    async getOAuthToken() {
        //request token
        try {
            const response = await axios.post(`${this.baseUrl}/api/Auth/RequestToken`,
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
            id: paymentData.internalPaymentId.toString(),
            currency: "UGX",
            amount: paymentData.amount,
            description: paymentData.description,
            callback_url: "http://localhost:5173/payment-status",//one that react will go to, after payment is done  
            notification_id:process.env.PESAPAL_IPN_ID || "dummy-ipn-id", 
                 billing_address: {
                    email_address: "test@example.com", // Pesapal requires an email
                    phone_number: paymentData.phone,
                    country_code: "UG", 
                    first_name: paymentData.name,
                    middle_name: "",
                    last_name: "",
                    line_1: "Kampala Road",
                    city: "Kampala",
                    state: "Central",
                    postal_code: "00000",
                    zip_code: "00000"
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

async registerIPN(token){
    try{
        const response = await axios.post(`${this.baseUrl}/api/URLSetup/RegisterIPN`,
            {
                url: `${process.env.BACKEND_URL}/api/payments/webhook`,
                ipn_notification_type: "POST"
            },
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        )
        return response.data;
    }
    catch(error){
        console.error("error registering ipn",
            error.response?error.response.data: error.message);
        throw new Error("could not register ipn")
    }
}

async getTransactionStatus(token, trackingId){
    try{
        //get status
        const response = await axios.get(`${this.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        )
        return response.data;
    }
    catch(error){
        console.error("could not get the status:",
            error.response?error.response.data:error.message
        );
        throw new Error("Could not verify transaction status");

    }

}
}


module.exports = new PesapalService();
