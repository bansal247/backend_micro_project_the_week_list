const express = require('express')
const listRouter = express.Router();
const WeekList = require('../models/weekList')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')


const getTimeDifference = (date) => {
    const pastDate = new Date(date).getTime();
    const timeDifference = Date.now() - pastDate;
    return timeDifference
}

const isLoggedIn = (req, res, next) => {
    try {
        const { jwttoken } = req.headers
        const user = jwt.verify(jwttoken, process.env.JWT_SECRET)
        if (user) {
            req.email = user.email
            next()
        }
        else {
            res.status(500).json({
                message: 'You are not logged In'
            })
        }
    }
    catch (err) {
        res.status(500).json({
            message: err
        })
    }

}

const check24Hours = async (req, res, next) => {
    try {
        const { listId } = await req.body
        const weekList = await mongoose.model('WeekList').findOne({ _id: listId })
        const hours = getTimeDifference(weekList['createdAt']) / (1000 * 60 * 60)
        // console.log(hours)
        if (hours <= 24) {
            next()
        }
        else {
            res.status(500).json({
                message: `${hours} hours have been paased. So list is now locked`
            })
        }
    }
    catch (err) {
        res.status(500).json({
            message: err
        })
    }

}

const check7Days = async (req, res, next) => {
    try {
        const { listId } = await req.body
        const weekList = await mongoose.model('WeekList').findOne({ _id: listId })
        const days = getTimeDifference(weekList['createdAt']) / (1000 * 60 * 60 * 24)
        console.log(days)
        if (days <= 7) {
            next()
        }
        else {
            res.status(500).json({
                message: `${days} days have been paased. So list is now locked`
            })
        }
    }
    catch (err) {
        res.status(500).json({
            message: err
        })
    }

}

const inactiveOn7Days = async (req, res, next) => {
    try {
        const email = await req.email
        const activeWeekList = await mongoose.model('WeekList').find({ email: email, status: 'active', }).exec();
        activeWeekList.forEach(async item=>{
            const days = getTimeDifference(item['createdAt']) / (1000 * 60 * 60 * 24)
            console.log(days)
            if(days>7){
                await mongoose.model('WeekList').updateOne(
                    { _id: item['_id'] },
                    { $set: { status: 'inactive' } }
                );
            }
        })
        next()
        
    }
    catch (err) {
        res.status(500).json({
            message: err
        })
    }

}

listRouter.use(isLoggedIn)
listRouter.use(inactiveOn7Days)

//Add week list
listRouter.post('/add', async (req, res) => {
    try {
        //logic
        const { tasks } = await req.body
        const email = await req.email
        const activeWeekList = await mongoose.model('WeekList').find({ email: email, status: 'active', isCompleted: 'false', }).exec();
        if (activeWeekList.length == 2) {
            res.status(500).json({
                message: 'Can not add more than 2 active week list. Please complete a week list or wait for a weeklist to end.'
            })
        }
        else {
            const maxWeekList = await mongoose.model('WeekList').findOne({ email: email }).sort('-weekListNumber').exec();
            const weekListNumber = maxWeekList ? maxWeekList.weekListNumber + 1 : 1;


            description = []
            tasks.forEach(element => {
                description.push({
                    task: element
                })
            });
            await WeekList.create({ email, description, weekListNumber, createdAt: Date.now() })
            res.status(200).json({
                // data:data,
                // token:token
                message: 'WeekList Added Successfully',
            })
        }

    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong. See logs'
        })
    }
})
//Update description
listRouter.patch('/description/update', check24Hours, async (req, res) => {
    try {
        //logic
        const { id, newDescription } = await req.body
        const email = await req.email
        await mongoose.model('WeekList').findOneAndUpdate(
            {
                email: email,
                // _id: yourDocumentId,
                'description._id': id,
            },
            {
                $set: {
                    'description.$.task': newDescription,
                },
            },
            {
                new: true
            }
        ).then(updatedDocument => {
            if (updatedDocument) {
                // The document was found and updated
                res.status(200).json({
                    // data:data,
                    // token:token
                    message: 'Description updated Successfully',
                })
            } else {
                // No document was found that matched the filter
                res.status(500).json({
                    message: 'No document was found'
                })
            }
        })



    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong. See logs'
        })
    }
})

//description mark true
listRouter.patch('/description/mark', check7Days, async (req, res) => {
    try {
        //logic
        const { id, mark, listId } = await req.body
        const weekList = await mongoose.model('WeekList').findById(listId);
        if (weekList['isCompleted'] == true) {
            res.status(200).json({
                // data:data,
                // token:token
                message: 'Week list is completed hence locked',
            })
            return
        }
        await mongoose.model('WeekList').findOneAndUpdate(
            {
                _id: listId,
                // _id: yourDocumentId,
                'description._id': id,
            },
            {
                $set: {
                    'description.$.isCompleted': mark,
                    'description.$.markedChangedAt': Date.now(),
                },
            },
            {
                new: true
            }
        ).then(async updatedDocument => {
            if (updatedDocument) {
                // The document was found and updated
                let isCompleted = true
                updatedDocument['description'].forEach(des => {
                    if (des['isCompleted'] === false) {
                        isCompleted = false
                    }
                })
                await mongoose.model('WeekList').updateOne(
                    { _id: listId },
                    { $set: { isCompleted: isCompleted } }
                );

                res.status(200).json({
                    // data:data,
                    // token:token
                    message: 'Mark updated Successfully',
                })
            } else {
                // No document was found that matched the filter
                res.status(500).json({
                    message: 'No document was found'
                })
            }
        })



    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong. See logs'
        })
    }
})

//Delete description
listRouter.delete('/description/delete', check24Hours, async (req, res) => {
    try {
        //logic
        const { id } = await req.body
        const email = await req.email
        await mongoose.model('WeekList').findOneAndUpdate(
            {
                email: email,
            },
            {
                $pull: {
                    description: { _id: id }, // Use $pull to remove the specified element from the array
                },
            },
            {
                new: true
            }
        ).then(updatedDocument => {
            if (updatedDocument) {
                // The document was found and updated
                res.status(200).json({
                    // data:data,
                    // token:token
                    message: 'Description Deleted Successfully',
                })
            } else {
                // No document was found that matched the filter
                res.status(500).json({
                    message: 'No document was found'
                })
            }
        })


    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong. See logs'
        })
    }
})
//Delete WeekList
listRouter.delete('/delete', check24Hours, async (req, res) => {
    try {
        //logic
        const { listId } = await req.body
        const email = await req.email
        await mongoose.model('WeekList').findByIdAndDelete(
            {
                _id: listId,
            },
        )
        res.status(200).json({
            message: 'WeekList Deleted Successfully',
        })

    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong. See logs'
        })
    }
})

//Get All Weeklist
listRouter.get('/all', async (req, res) => {
    try {
        //logic
        const email = await req.email
        const WeekList = await mongoose.model('WeekList').find({ email: email }).exec();
        let data_to_send = []
        WeekList.forEach(item => {
            let timeDifference = getTimeDifference(item['createdAt'])
            timeDifference = (1000 * 60 * 60 * 24 * 7) - timeDifference
            const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

            const timeLeft = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`
            data = {
                weekListNumber: item['weekListNumber'],
                id: item['_id'],
                timeLeft: timeLeft,
                createdAt: item['createdAt']
            }
            data_to_send.push(data)
        })
        res.status(200).json({
            list: data_to_send,
        })


    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong. See logs'
        })
    }
})

//Feed api
listRouter.get('/feed', async (req, res) => {
    try {
        //logic
        const WeekList = await mongoose.model('WeekList').find({ status: 'active',isCompleted:false }).exec();
        
        res.status(200).json({
            list: WeekList,
        })


    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong. See logs'
        })
    }
})

//Get Weeklist by id
listRouter.get('/:id', async (req, res) => {
    try {
        //logic
        const WeekList = await mongoose.model('WeekList').findOne({ weekListNumber: parseInt(req.params.id) }).exec();
        res.status(200).json({
            list: WeekList,
        })


    }
    catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong. See logs'
        })
    }
})



module.exports = listRouter