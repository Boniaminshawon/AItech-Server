const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ihwvydu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const servicesCollection = client.db('AItech').collection('services');
        const reviewCollection = client.db('AItech').collection('reviews');
        const blogCollection = client.db('AItech').collection('blogs');


        // service related api
        app.get('/services', async (req, res) => {
            const result = await servicesCollection.find().toArray();
            res.send(result);
        })

        // blog related api

        app.get('/blogs', async (req, res) => {
            const result = await blogCollection.find().toArray();
            res.send(result);
        })

        // review related api
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('AItech is Running');
})
app.listen(port, () => {
    console.log(`AItech is running in port ${port}`)
})