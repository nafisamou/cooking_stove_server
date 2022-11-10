const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle wares:
app.use(cors());
app.use(express.json());

// const colors = require("colors");
// colors.setTheme({
//   silly: "rainbow",
//   input: "grey",
//   verbose: "cyan",
//   prompt: "grey",
//   info: "green",
//   data: "grey",
//   help: "cyan",
//   warn: "yellow",
//   debug: "blue",
//   error: "red",
// });

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.grwbbr0.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

/* Jwt token */

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client.db("cloudKitchen").collection("services");
    const reviewCollection = client.db("cloudKitchen").collection("reviews");

    /* Jwt token create */

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10d",
      });
      res.send({ token });
    });

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });
    app.get("/servicesAll", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    app.get("/specialServicesAll", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(4).toArray();
      res.send(services);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });
    /* ----------Create------------ */
    app.post("/reviews", verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log("inside reviews", decoded);
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "Unauthorized access" });
      }

      let query = {};
      if (req.query?.email) {
        query = {
          email: req.query.email,
        };
        const cursor = reviewCollection.find(query);
        const reviews = await cursor.toArray();
        res.send(reviews);
      }
    });

    app.get("/allReview", async (req, res) => {
      id = req.query.service;
      console.log(id);
      let query = { service: id };

      const cursor = reviewCollection.find(query);
      const review = await cursor.toArray();
      res.send(review);
    });
    /* ------Update------------- */
     app.put("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = req.body;
      const options = { upsert: true };
      const updateReview = {
        $set: {
          customer: review.name,

          // email: review.email,
          // image: review.image,

          message: review.feedback,
        },
      };
      const result = await reviewCollection.updateOne(
        query,
        updateReview,
        options
      );
      res.send(result);
    }); 

      app.patch("/reviews/:id",verifyJWT, async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status,
        },
      };
      const result = await reviewCollection.updateOne(query, updateDoc);
      res.send(result);
    });






 
    /* --------Delete------------- */
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  } finally {
  }
}

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Cloud kitchen server is running");
});

app.listen(port, () => {
  client.connect((err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Connected to MongoDB");
    }
  });
  console.log(`Cloud Kitchen server is running on ${port}`);
});
