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

        const ammountToPay = booking.total_amount;
        
        //update the db
        const insertPaymentResult = await db.query(
            `INSERT INTO payments (booking_id, amount, status) RETURNING id`,
            [booking_id, ammountToPay, "PENDING"]
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

module.exports = router;