const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const weekList = require('./models/weekList')
require('dotenv').config()
userRouter = require('./routes/authRoutes')
weekListRouter = require('./routes/weeklistRoutes')

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))



//routes
app.get('/health',(req,res) => {
    res.status(200).json({
        service: 'weeklist-backend-server',
        status:'active',
        time: new Date()
    })
})


app.use('/auth',userRouter)
app.use('/weekList',weekListRouter)
//Middleware
const isRouteFound = (req,res,next)=>{
    if(!req.route){
        res.status(404).json({
            message:'route not found'
        })
    }
    else{
        next()
    }
}

app.use(isRouteFound)


const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    mongoose.connect(process.env.MONGODB_URI)
    console.log(`server running at ${PORT}`)
})