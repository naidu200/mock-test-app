const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


// MONGODB CONNECTION

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));


// SCHEMAS

const questionSchema = new mongoose.Schema({

    question:String,
    option1:String,
    option2:String,
    option3:String,
    option4:String,
    answer:String

});

const resultSchema = new mongoose.Schema({

    username:String,
    score:Number,
    total_questions:Number,
    date:{
        type:Date,
        default:Date.now
    }

});

const Question = mongoose.model(
    'Question',
    questionSchema
);

const Result = mongoose.model(
    'Result',
    resultSchema
);


// FILE UPLOAD

const storage = multer.diskStorage({

    destination:function(req,file,cb){

        cb(null,'uploads');

    },

    filename:function(req,file,cb){

        cb(
            null,
            Date.now() + '-' + file.originalname
        );

    }

});

const upload = multer({
    storage:storage
});


// ROUTES

app.get('/',(req,res)=>{

    res.sendFile(
        path.join(__dirname,'views/login.html')
    );

});

app.get('/dashboard',(req,res)=>{

    res.sendFile(
        path.join(__dirname,'views/dashboard.html')
    );

});

app.get('/test',(req,res)=>{

    res.sendFile(
        path.join(__dirname,'views/test.html')
    );

});

app.get('/result',(req,res)=>{

    res.sendFile(
        path.join(__dirname,'views/result.html')
    );

});

app.get(
    ['/admin','/admin.html'],
    (req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            'views/admin.html'
        )
    );

});


// ADD QUESTION

app.post('/add-question', async (req,res)=>{

    try{

        const newQuestion =
        new Question(req.body);

        await newQuestion.save();

        res.json({
            message:
            "Question Added Successfully"
        });

    } catch(err){

        res.json({
            message:"Error"
        });

    }

});


// CSV UPLOAD

app.post(
    '/upload-csv',
    upload.single('file'),
    async (req,res)=>{

    const results = [];

    fs.createReadStream(req.file.path)

    .pipe(csv())

    .on('data',(data)=>{

        results.push(data);

    })

    .on('end', async ()=>{

        try{

            await Question.insertMany(results);

            res.json({
                message:
                "CSV Uploaded Successfully"
            });

        } catch(err){

            res.json({
                message:
                "CSV Upload Failed"
            });

        }

    });

});


// RANDOM QUESTIONS

app.get('/api/questions', async (req,res)=>{

    try{

        const questions =
        await Question.aggregate([

            {
                $sample:{
                    size:50
                }
            }

        ]);

        res.json(questions);

    } catch(err){

        res.json([]);

    }

});


// SAVE RESULT

app.post('/save-result', async (req,res)=>{

    try{

        const result =
        new Result(req.body);

        await result.save();

        res.json({
            message:"Result Saved"
        });

    } catch(err){

        res.json({
            message:"Error"
        });

    }

});


// LEADERBOARD

app.get('/leaderboard', async (req,res)=>{

    try{

        const data =
        await Result.find()

        .sort({score:-1})

        .limit(10);

        res.json(data);

    } catch(err){

        res.json([]);

    }

});


// SERVER

const PORT =
process.env.PORT || 3000;

app.listen(PORT,()=>{

    console.log(
        `Server Running on ${PORT}`
    );

});