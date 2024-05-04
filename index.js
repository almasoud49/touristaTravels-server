const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;

//Middleware
app.use(
  cors({
    origin: [
      // "http://localhost:5173",

      'https://touristatravels-d9cb9.web.app',
      'https://touristatravels-d9cb9.firebaseapp.com'
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

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
const verifyJwtToken = (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  const token = authHeader?.split(" ")[1];
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);
    req.decoded = decoded;
  } catch (err) {
    return res.status(403).send({ message: "Access Forbidden" });
  }
  next();
};

const touristaTravels = async () => {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const database = client.db("touristaTravels");
    const serviceCollection = database.collection("services");
    const reviewCollection = database.collection("reviews");
    const blogCollection = database.collection("blogs");
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
    app.post("/login", verifyJwtToken, async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //Get all  Services
    app.get("/services", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const count = await serviceCollection.estimatedDocumentCount();
      if (limit) {
        const result = await serviceCollection
          .find(query)
          .sort({ createAt: -1 })
          .limit(limit)
          .toArray();
        res.send(result);
      } else {
        const result = await serviceCollection
          .find(query)
          .sort({ createAt: -1 })
          .skip(page * size)
          .limit(size)
          .toArray();
        res.send({ count, result });
      }
    });

    //Get User Created Service
    app.get("/my-service", verifyJwtToken, async (req, res) => {
      const decoded = req.decoded;
      const uid = req.query.uid;
      const query = { createBy: uid };
      if (decoded.uid !== uid) {
        return res.status(403).send({ message: "Access Forbidden" });
      }
      const result = await serviceCollection
        .find(query)
        .sort({ createAt: -1 })
        .toArray();
      const count = await serviceCollection.countDocuments(query);
      res.send({ count, result });
    });

    //Create a service
    app.post("/services", verifyJwtToken, async (req, res) => {
      const decoded = req.decoded;
      const service = req.body;
      const uid = req.query.uid;
      if (decoded.uid !== uid) {
        return res.status(403).send({ message: "Access Forbidden" });
      }
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    //add service
    app.post("/add-service", verifyJwtToken, async (req, res) => {
      const decoded = req.decoded;
      const service = req.body;
      const uid = req.query.uid;
      if (decoded.uid !== uid) {
        return res.status(403).send({ message: "Access Forbidden" });
      }
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    //Get a  Single Service
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    //Post a review
    app.post("/review", verifyJwtToken, async (req, res) => {
      const decoded = req.decoded;
      const review = req.body;
      const uid = req.query.uid;
      if (decoded.uid !== uid) {
        return res.status(403).send({ message: "Access Forbidden" });
      }
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    //Get all review
    app.get("/reviews", async (req, res) => {
      const service_id = req.query.service_id;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = { service_id: service_id };
      const reviews = await reviewCollection
        .find(query)
        .sort({ createAt: -1 })
        .skip(page * size)
        .limit(size)
        .toArray();

      const reviewsRating = await reviewCollection.find(query).toArray();
      const count = await reviewCollection.countDocuments(query);
      const sum = reviewsRating.reduce((pre, cur) => pre + cur.user_rating, 0);
      let average = 0;
      if (!isNaN(sum / count)) {
        average = sum / count;
      }
      res.send({ count, reviews, average });
    });

    //Get Single review
    app.get("/my-review", verifyJwtToken, async (req, res) => {
      const decoded = req.decoded;
      const uid = req.query.uid;
      const query = { user_uid: uid };
      if (decoded.uid !== uid) {
        return res.status(403).send({ message: "Access Forbidden" });
      } else {
        const reviews = await reviewCollection
          .find(query)
          .sort({ createAt: -1 })
          .toArray();
        const count = await reviewCollection.countDocuments(query);
        console.log(count);
        res.send({ count, reviews });
      }
    });

    //Update review item
    app.patch("/my-review", verifyJwtToken, async (req, res) => {
      const decoded = req.decoded;
      const id = req.query.id;
      const uid = req.query.uid;
      const review = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedReview = {
        $set: review,
      };
      if (decoded.uid !== uid) {
        return res.status(403).send({ message: "Access Forbidden" });
      } else {
        const result = await reviewCollection.updateOne(filter, updatedReview);
        res.send(result);
      }
    });

    //Delete a single review
    app.delete("/my-review", verifyJwtToken, async (req, res) => {
      const decoded = req.decoded;
      const id = req.query.id;
      const uid = req.query.uid;
      const query = { _id: new ObjectId(id) };
      if (decoded.uid !== uid) {
        return res.status(403).send({ message: "Access Forbidden" });
      } else {
        const result = await reviewCollection.deleteOne(query);
        res.send(result);
      }
    });

    //Get all Testimonial
    app.get("/testimonials", async (req, res) => {
      const query = {};
      const result = await reviewCollection
        .find(query)
        .sort({ createAt: -1 })
        .limit(4)
        .toArray();
      res.send(result);
    });

    //Create blogs
    // app.post('/blogs' , async(req,res)=>{
    //   const blogsData = req.body;
    //   const result = await blogCollection.insertOne(blogsData);
    //   res.send(result);
    // });

    //get blogs data
    app.get("/blogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });

    //Get all user
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    //Add New User To Database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const option = { upsert: true };
      const query = { uid: user.uid };
      const userInDb = await userCollection.findOne(query);
      if (userInDb?.uid) {
        return;
      }
      const result = await userCollection.insertOne(user, option);
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
