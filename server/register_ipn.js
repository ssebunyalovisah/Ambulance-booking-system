require('dotenv').config();
const pesapalService = require("./src/services/pesapal");

async function run(){
    const token = await pesapalService.getOAuthToken();
    const result = await pesapalService.registerIPN(token);
    console.log("Your IPN ID:", result.ipn_id);
}

run();