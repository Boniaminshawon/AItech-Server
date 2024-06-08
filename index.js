const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        // await client.connect();
        const servicesCollection = client.db('AItech').collection('services');
        const reviewCollection = client.db('AItech').collection('reviews');
        const blogCollection = client.db('AItech').collection('blogs');
        const userCollection = client.db('AItech').collection('users');
        const employeeWorkInfoCollection = client.db('AItech').collection('employeeWorkInfo');

        // jwt related api 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '360d' });
            res.send({ token });
        })

        // middleware
        const verifyToken = (req, res, next) => {
            // console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })

        }

        // use verify admin after verify token
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();

        }

        // use verify HR after verify token
        const verifyHr = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isHR = user?.role === 'HR';
            if (!isHR) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();

        }

        // use verify employee after verify token
        const verifyEmployee = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isEmployee = user?.role === 'Employee';
            if (!isEmployee) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();

        }

        // user related api
        app.post('/user', async (req, res) => {
            const userInfo = req.body;
            const query = { email: userInfo.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(userInfo);
            res.send(result);

        });

        // get admin
        app.get('/user/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        });


        // HR related api

        // get HR
        app.get('/user/HR/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let HR = false;
            if (user) {
                HR = user?.role === 'HR';
            }
            res.send({ HR });
        });
        // get all employee for employee list for hr
        app.get('/user/employee-list', verifyToken, verifyHr, async (req, res) => {
            // const role = req.params.role;
            // const role= 'Employee'
            const result = await userCollection.find({ role: 'Employee' }).toArray();
            // const result = await userCollection.find({ role: { $in: ['Employee', 'HR'] } }).toArray();
            res.send(result);
        })




        // employee related api

        // get employee
        app.get('/user/employee/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let employee = false;
            if (user) {
                employee = user?.role === 'Employee';
            }
            res.send({ employee });
        });

        // post employees work info
        app.post('/employee-work-info', verifyToken, verifyEmployee, async (req, res) => {
            const workInfo = req.body;
            const result = await employeeWorkInfoCollection.insertOne(workInfo);
            res.send(result);
        });

        app.get('/employee-work-info', verifyToken, verifyEmployee, async (req, res) => {

            const result = await employeeWorkInfoCollection.find().toArray();
            res.send(result);
        });


        // service related api
        app.get('/services', async (req, res) => {
            const result = await servicesCollection.find().toArray();
            res.send(result);
        })

        // blog related api

        app.get('/blogs', async (req, res) => {
            const result = await blogCollection.find().toArray();
            res.send(result);
        });
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogCollection.findOne(query);
            res.send(result);
        })

        // review related api
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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