const express = require("express");
const app =express()
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');

const cors =require("cors")

const port= process.env.PORT || 5000

//middle ware
app.use(cors())
app.use(express.json())


app.get('/',(req,res)=>{
    res.send('boss is ')
})

app.listen(port, ()=>{
    console.log(`server is running on ${port}`)
})


const uri = `mongodb+srv://${process.env.USER}:${process.env.KEY}@cluster0.mhxjfos.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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

    const momentUsers = client.db("moment").collection("users")
    const momentCarts = client.db("moment").collection("carts")

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {
  }
}
run().catch(console.dir);
