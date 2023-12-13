const mongoose = require('mongoose')

const weekListSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
    },
    weekListNumber:{
        type: Number,
        default:0, 
    },
    createdAt:{
        type: Date,
        default:Date.now()
    },
    description:[
        {
            task:{
                type:String,
                required: true
            },
            isCompleted:{
                type:Boolean,
                required: true,
                default:false
            },
            markedChangedAt:{
                type:Date,
                default:null
            }
        }
    ],
    status:{
        type:String,
        enum:['active','inactive'],
        default:'active'
    },
    isCompleted:{
        type:Boolean,
        default:false
    },
});

// weekListSchema.pre('save', async function (next) {
//     const doc = this;
//     if (!doc.isNew) {
//         // If the document is not new, do nothing
//         return next();
//     }

//     try {
//         // Find the maximum weekListNumber and increment by 1
//         const maxWeekList = await mongoose.model('WeekList').findOne().sort('-weekListNumber').exec();
//         doc.weekListNumber = maxWeekList ? maxWeekList.weekListNumber + 1 : 1;
//         next();
//     } catch (err) {
//         next(err);
//     }
// });


module.exports = mongoose.model("WeekList",weekListSchema)
