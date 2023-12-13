const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    fullName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type:String,
        required: true,
    },
    age:{
        type:Number,
        max:110,
        min:1
    },
    gender:{
        type:String,
        enum:['M','F']
    },
    mobile:{
        type:String,
        maxLength:10,
        minLength:10,
        unique:true
    }
});

module.exports = mongoose.model("User",userSchema)
