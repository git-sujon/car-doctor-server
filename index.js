const express = require('express')
const cors= require('cors')
require ('dotenv').config()

const jwt= require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000


const app= express()
// Middleware 
app.use(cors())
app.use(express.json())







const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.prabmlk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async() => {
    try {
        
        const servicesCollection= client.db('CarDoctorDB').collection('servicesCollection')
        const orderCollection =  client.db('CarDoctorDB').collection('orderCollection')

        // JWT Verify 
        const jwtVerify = (req, res, next) => {
            const authHeader= req.headers.authorization

            if(!authHeader) {
                return res.status(401).send({message: "Unauthorized Access"})
            }
            const token = authHeader.split(' ')[1]

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode)=> {
               
                if(err) {
                    return res.status(401).send({message: "ubAuthorized Access"})
                }
                req.decode =decode;
                next()
            })

        }




        // JWT TOken 
        app.post('/jwt', (req, res) => {
          
            const user= req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
            res.send({token})

        })

        // read from mongoDB to server

        app.get('/services', async(req, res) => {
            
            const sorting = req.query.order === 'LowToHigh' ? -1 : 1
            const searchValue= req.query.search
            console.log(searchValue)
            let query= {}
            if(searchValue.length) {
                query= {
                    $text:
                      {
                        $search: searchValue 
                      }
                }
            }
            const cursor = servicesCollection.find(query).sort ({price : sorting})
            const result=await cursor.toArray()
            res.send(result)
        })


        app.get('/services/:id', async(req, res)=> {
            const id= req.params.id
            const query = {_id: ObjectId(id)}
            const result =await servicesCollection.findOne(query);
            // console.log(result)
            res.send(result)

        })


        // customer order write

        app.post('/orders', async(req, res) => {
            const order =req.body
            const result = await orderCollection.insertOne(order)
      
            res.send(result)

        })

        // customer order read
        app.get('/orders', jwtVerify  , async(req, res)=> {
            const decode= req.decode

           if(decode.email !== req.query.email) {
            return res.status(403).send({message: "unauthorized Access"})
           }

            let query = {}
            if(req.query.email){
                
                query={
                    email: req.query.email
                }
            }
           
            const result = await orderCollection.find(query).toArray()
            res.send(result)
    
        })

        // delete customer order 
        app.delete('/orders/:id',async (req, res) => {
            const id =req.params.id
            const query= {_id: ObjectId(id)}
            const result= await orderCollection.deleteOne(query)
            res.send(result)
        })

        // update customer order 
        app.patch('/orders/:id', async(req, res) => {
            const id = req.params.id
            const status= req.body
            const query = {_id: ObjectId(id)}
            const updateDoc = {
                $set: {
                    status: status
                }
            }    

            const result = await orderCollection.updateOne(query, updateDoc)
            res.send(result)
        })



    }

    finally{

    }
}

run().catch(err => console.log(err))











app.get('/', (req, res) => {
    res.send("Server is Running")
})

app.listen(port, ()=>{
    console.log(`${port} port`)
})