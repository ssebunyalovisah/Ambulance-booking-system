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

        
}
catch(error){
    console.error("error initiating payment:", error);
    res.status(500).json({error:"internal server error"})
}
})

module.exports = router;