const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

//MongodbClient
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@personal.dp2qomu.mongodb.net/?retryWrites=true&w=majority&appName=personal`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//Verify JWT Token

const verifyToken = (req, res, next) => {
  const authToken = req.headers?.authorization;
  if (!authToken) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  jwt.verify(authToken, process.env.JWT_ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const touristaTravels = async () => {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const database = client.db("touristaTravels");
    const serviceCollection = database.collection("services");
    const reviewCollection = database.collection("reviews");
    const userCollection = database.collection("users");

    //JWT create
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
      res.send({ token });
    });

    //verify jwt token
    app.post("/login", verifyToken, async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //Get all  Services
    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find().toArray();
      res.send(result);
    });

    //Create a service
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    //Get a  Single Service
    app.get("/service/:id", async (req, res) => {
      const id = req.params._id;
      const result = await serviceCollection.findOne(id);
      res.send(result);
    });

    //Post a review
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    //Get all review
    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    //Get Single review
    app.get("/my-review/:id", async (req, res) => {
      const id = req.params._id;
      const result = await reviewCollection.findOne(id);
      res.send(result);
    });

    //Update review item
    app.patch("/my-review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const reviewData = req.body;
      const updatedReview = {
        $set: reviewData,
      };
      const result = await reviewCollection.updateOne(filter, updatedReview);
      res.send(result);
    });

    //Delete a single review
    app.delete("/my-review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
  }
};
touristaTravels().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to TouristaTravels!");
});

app.listen(port, () => {
  console.log(`TouristaTravels Server listening on port ${port}`);
});
