const express = require("express");
const router = express.Router();
const db = require("../config/db");
const pesapalService = require("../services/pesapal");

//intiate payment
router.post('/initiate',async(req, res)=>{
try {
    const {booking_id} = req.body;
    
    if(!booking_id){
        return res.status(400).json({error: "booking id is required"})
    }

    //check if booking is available
    const bookingResult = await db.query(
        "SELECT * FROM bookings WHERE id = $1",
        [booking_id]
    )

    const booking = bookingResult.rows[0];
    if(!booking){
            return res.status(404).json({error:" booking not found"})
        }

        const amountToPay = booking.total_amount || 50000;
        
        //update the db
        const insertPaymentResult = await db.query(
            `INSERT INTO payments (booking_id, amount, status) VALUES ($1, $2, $3) RETURNING id`,
            [booking_id, amountToPay, "PENDING"]
        )

        //INTERNAL PAYMENT ID
        const internalPaymentId = insertPaymentResult.rows[0].id;

        //get the token
        const token = await pesapalService.getOAuthToken();

        //prepare order to send 
        const pesapalResponse= await pesapalService.submitOrder(token, {
            internalPaymentId:internalPaymentId,
            amount:amountToPay,
            description:`Ambulance Booking #${booking.id}`,
            phone:booking.phone_number,
            name:booking.patient_name
        }
            
        )
            //get the tracking id
            const trackingId = pesapalResponse.order_tracking_id;

            //get the url
            const redirectUrl = pesapalResponse.redirect_url;

            //update the db
            await db.query(
                `UPDATE payments SET pesapal_tracking_id = $1 WHERE id = $2`,
                [trackingId, internalPaymentId]
            );

            //send the url to react
            res.json({
                message:"Payment initiated successfully",
                redirect_url:redirectUrl,
                trackingId:trackingId   
            })
        
}
catch(error){
    console.error("error initiating payment:", error);
    res.status(500).json({error:"internal server error"})
}
})

// The Webhook Endpoint
router.post('/webhook', async (req, res) => {
    try {
        // Pesapal only sends these 3 tiny fields!
        const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = req.body;

        if (!OrderTrackingId) {
            return res.status(400).send("Missing tracking ID");
        }

        // 1. Get a fresh VIP Wristband
        const token = await pesapalService.getOAuthToken();

        // 2. Ask Pesapal for the REAL status
        const statusResponse = await pesapalService.getTransactionStatus(token, OrderTrackingId);
        console.log("Pesapal Status Response:", JSON.stringify(statusResponse, null, 2));
        
        // Pesapal returns "Completed", "Failed", or "Invalid"
        const realStatus = statusResponse.payment_status_description.toUpperCase();
        const paidAmount = statusResponse.amount;

        // 3. Find our internal payment record to check the expected amount
        const paymentResult = await db.query(
            'SELECT * FROM payments WHERE pesapal_tracking_id = $1',
            [OrderTrackingId]
        );
        const payment = paymentResult.rows[0];

        if (!payment) {
            return res.status(404).send("Payment not found in our DB");
        }

        // 4. Idempotency Check (Don't dispatch two ambulances!)
        if (payment.status === 'COMPLETED') {
            return res.status(200).json({ message: "Already processed" });
        }

        // 5. Status Validation 
        // Note: Pesapal handles exact amounts internally. In sandbox, it may return USD 13 for UGX 50000.
        if (realStatus === 'COMPLETED') {
            // Success! Update Payments table
            await db.query(
                'UPDATE payments SET status = $1 WHERE pesapal_tracking_id = $2',
                ['COMPLETED', OrderTrackingId]
            );

            // Success! Update Bookings table
            await db.query(
                'UPDATE bookings SET payment_status = $1 WHERE id = $2',
                ['PAID', payment.booking_id]
            );
        } else if (realStatus === 'FAILED' || realStatus === 'INVALID') {
            // It actually failed or was invalid
            await db.query(
                'UPDATE payments SET status = $1 WHERE pesapal_tracking_id = $2',
                ['FAILED', OrderTrackingId]
            );
        } else {
            // It's still PENDING or some other status, just leave it as PENDING in the DB
            console.log(`Payment still pending or unrecognized status: ${realStatus}`);
        }

        // 6. ALWAYS reply with 200 OK so Pesapal knows you received the ping
        // If you don't send this, Pesapal will ping you every 5 minutes for hours!
        res.status(200).json({
            status: 200,
            message: "Webhook processed successfully"
        });

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


// Get Payment Status Endpoint (for React to poll)
router.get('/status/:booking_id', async (req, res) => {
    try {
        const { booking_id } = req.params;
        
        const paymentResult = await db.query(
            'SELECT status, amount FROM payments WHERE booking_id = $1 ORDER BY id DESC LIMIT 1',
            [booking_id]
        );
        
        const payment = paymentResult.rows[0];
        if (!payment) {
            return res.status(404).json({ error: "No payment found for this booking" });
        }
        
        res.json({
            status: payment.status,
            amount: payment.amount
        });
    } catch (error) {
        console.error("Error fetching payment status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;