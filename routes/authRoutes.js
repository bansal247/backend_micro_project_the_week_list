const express = require('express')
const router = express.Router();
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

router.post('/register',async (req,res)=>{
    try{
        //logic
        const {fullName,email,password,age,gender,mobile} = await req.body
        const encyptedPassword = await bcrypt.hash(password,10)
        let user = null
        await User.create({fullName,email,password:encyptedPassword,age,gender,mobile})
        .then(async ()=>{
            user = await User.findOne({email:email})
        })
        const jwtToken = jwt.sign(user.toJSON(),process.env.JWT_SECRET,{expiresIn:12000})
        res.status(200).json({
            // data:data,
            // token:token
            message:'User created Successfully',
            jwtToken
        })
    }
    catch(error){
        console.log(error)
        res.status(500).json({
            message:'Something went wrong. See logs'
        })
    }
})

router.post('/login',async (req,res)=>{
    try{
        const {email,password} = await req.body
        const user = await User.findOne({email:email})
        if(user){
            correctPassword = await bcrypt.compare(password,user.password)
            if(correctPassword){
                const jwtToken = jwt.sign(user.toJSON(),process.env.JWT_SECRET,{expiresIn:12000})
                res.status(200).json({
                    // data:data,
                    // token:token
                    message:'User Logged In',
                    jwtToken
                })
            }
            else{
                res.status(500).json({
                    message:'Incorrect Password'
                })
            }
            
        }
        else{
            res.status(500).json({
                message:'Incorrect Credentials'
            })
        }
        
    }
    catch(error){
        console.log(error)
        res.status(500).json({
            message:'Something went wrong. See logs'
        })
    }
})

module.exports = router