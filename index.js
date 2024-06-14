const express = require("express");
const app = express()
const jwt = require('jsonwebtoken');
// const stripe= require("stripe")(process.env.STRIP_SECRET_KEY)
const stripe= require("stripe")('sk_test_51PR6TsCftkOm46GBp9UTNJdYlDBRQQeWnAXJtibTbA5jHwXHc22uEkR3JpIFsKCBVwfCcmIlIK2Xm4lpq271aRi800oAVrDwcb')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const cors = require("cors")

const port = process.env.PORT || 5000

//middle ware
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
  res.send('boss is ')
})

app.listen(port, () => {
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
    const momentPremiumMembers = client.db("moment").collection("premium-member")
    const momentsucess_story = client.db("moment").collection("sucess_story")
    const momentBio_Data = client.db("moment").collection("biodata")
    const momentContact_req = client.db("moment").collection("contact_req")
    const momentFav_list = client.db("moment").collection("fav_list")



    // -------------------------------------------JWT
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACESS_TOKEN, { expiresIn: '1h' })
      res.send({ token })
    })


    // --------------------------------------------middleware for jwt--user
    const verifyToken = (req, res, next) => {
      const header = req.headers.authorization
      // console.log("inside verifyToken",header);
      if (!header) {
        return res.status(401).send({ message: 'forbidder access' })
      }
      const token = header.split(' ')[1]
      // console.log("inside verify token",token)
      jwt.verify(token, process.env.ACESS_TOKEN, (err, decoded) => {
        // console.log("decoded",decoded)
        if (err) {
          return res.status(401).send({ message: 'forbidder access' })

        }
        req.decoded = decoded
        next()
      })
    }
    // --------------------------------middleware for verify Admin---
    // --use verify admin after verify the token 
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const user = await momentUsers.findOne(query)
      const isAdmin = user?.role === 'admin'
      if (!isAdmin) {
        return res.status(401).send({ message: 'forbidden access' })
      }
      next()
    }
    // const verifyPreium = async (req, res, next) => {
    //   const email = req.decoded.email
    //   const query = { email: email }
    //   const user = await momentUsers.findOne(query)
    //   const isPremium = user?.usertype === 'premium'
    //   if (!isPremium) {
    //     return res.status(401).send({ message: 'forbidden access' })
    //   }
    //   next()
    // }

// --------------------------------------------------------------------------users
app.patch('/users/admin/:id',verifyToken,verifyAdmin, async(req,res)=>{
  const userId= req.params.id;
  const query= {_id :new ObjectId (userId)}
  const updateDoc = {
    $set: {
     role:"admin"
    },
  };
  const result= await momentUsers.updateOne(query,updateDoc)
  res.send(result)
})
app.patch('/users/premium/:id',verifyToken,verifyAdmin, async(req,res)=>{
  const userId= req.params.id;
  const query= {_id :new ObjectId (userId)}
  const updateDoc = {
    $set: {
      usertype:"premium"
    },
  };
  const result= await momentUsers.updateOne(query,updateDoc)
  res.send(result)
})

app.delete('/users/:id',verifyToken,verifyAdmin, async(req,res)=>{
  const userId= req.params.id;
  const query= {_id :new ObjectId (userId)}
  const result= await momentUsers.deleteOne(query)
  res.send(result)

})

app.get ('/users',verifyToken,verifyAdmin, async(req,res)=>{
  const result=await momentUsers.find().toArray()
  res.send(result)
})

app.get('/users/admin/:email',verifyToken,async(req,res)=>{
const email=req.params.email;
const emaiil=req.decoded.email;
query= {email:email}
const user= await momentUsers.findOne(query)
let admin=false
if(user){
  admin = user?.role === 'admin'
}
res.send({admin})
})
app.get('/users/premium/:email',verifyToken,verifyAdmin, async(req,res)=>{
const email=req.params.email;
const emaiil=req.decoded.email;
if(email !== emaiil){
  return res.send(403).send({message:'unauthorized user'})
}
const query= {email:email}
const user= await momentUsers.findOne(query)
let premium=false
if(user){
  premium = user?.usertype === 'premium'
}
res.send({premium})
})

app.post('/users',async(req,res)=>{
  const user = req.body
  const query= {email: user.email}
  const existingUser= await momentUsers.findOne(query) 
  if(existingUser){
    return res.send({message:'email already exist', insertedID: null})
  }
  const result = await momentUsers.insertOne(user)
  res.send(result)
})
// ----------------------------Payment--------------
app.post("/create-payment-intent", async (req, res) => {
  const { price } = req.body;
  const amount =parseInt(price*100)
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: [
      "card",
      "link"
    ],
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
  
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});
// -----------------------req-contact------------------------------
app.post('/contact-req',async(req,res)=>{
  const info = req.body
  const result = await momentContact_req.insertOne(info)
  res.send(result)
})
app.get('/contact-req', async(req,res)=>{
  const result = await momentContact_req.find().toArray()
  res.send(result)
})
app.patch('/contact-req/pending/:id',verifyToken,verifyAdmin, async(req,res)=>{
  const reqId= req.params.id;
  const query= {_id :new ObjectId (reqId)}
  console.log(reqId)
  const updateDoc = {
    $set: {
      state:"settled"
    },
  };
  const result= await momentContact_req.updateOne(query,updateDoc)
  res.send(result)
})
// ----------------premium members--sucess-story--biodata-----------------------------------------------------------
app.get('/premium', async(req,res)=>{
  const result = await momentPremiumMembers.find().toArray()
  res.send(result)
})
app.get('/sucess_story', async(req,res)=>{
  const result = await momentsucess_story.find().toArray()
  res.send(result)
})
app.get('/biodata', async(req,res)=>{
  const result = await momentBio_Data.find().toArray()
  res.send(result)
})
// app.get('/biodata/:_id', async(req,res)=>{
//   const userId= req.params._id
//   const query= {_id: new ObjectId (userId)}
//   const result = await momentBio_Data.findOne(query).toArray()
//   res.send(result)
// })
// -----------for Image------
app.post('/contact-req',async(req,res)=>{
  const info = req.body
  const result = await momentContact_req.insertOne(info)
  res.send(result)
})
// -----------for FAv-List------
app.post('/fav-list',async(req,res)=>{
  const info = req.body
  const query=info.biodataId
  const existingUser= await momentFav_list.findOne(query) 
  if(existingUser){
    return res.send({message:' already added to favorite List', insertedID: null})
  }
  const result = await momentFav_list.insertOne(info)
  res.send(result)
})
app.get('/fav-list', async(req,res)=>{
  const result = await momentFav_list.find().toArray()
  res.send(result)
})


console.log(process.env.STRIP_SECRET_KEY)
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  finally {
  }
}
run().catch(console.dir);
