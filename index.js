require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lpruzxq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });


        /**
        * API Naming convention
        * app.get("/booking") //get all bookings in this Collection or get more then one
        * app.get("/booking/:id") // get a specific booking
        * app.post("/booking") // add new booking
        * app.patch("/booking/:id") //update specific booking
        * app.delete("/booking/:id") // delete specific one booking
       */

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, data: booking.data, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
        });


        app.get('/available', async (req, res) => {
            const date = req.query.date;

            //step 1: get al service
            const services = await serviceCollection.find().toArray();

            //step 2: get the booking of that day 
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            //step 3: for each service, find all booking for that service
            services.forEach(service => {
                const serviceBookings = bookings.filter(book => book.treatment === service.name);
                const bookedSlots = serviceBookings.map(book => book.slot);
                const available = service.slots.filter(slot => !bookedSlots.includes(slot));
                service.slots = available;
            })


            res.send(services);

        })




    }
    finally {

    }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send('Hello from Doctor Portal!')
})

app.listen(port, () => {
    console.log(`Doctors app listening on port ${port}`)
})