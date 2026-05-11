const db = require('./src/config/db.js');
const controller = require('./src/controllers/ambulance_controller.js');

async function test() {
    const req = {
        body: {
            ambulance_number: 'TEST-' + Math.random(),
            driver_id: null,
            gps_capable: true
        },
        user: {
            company_id: 1,
            role: 'super_admin'
        }
    };

    const res = {
        status: function(code) {
            console.log('Status set to:', code);
            return this;
        },
        json: function(data) {
            console.log('Response JSON:', data);
        }
    };

    await controller.registerAmbulance(req, res);
}

test();
