const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));



// MYSQL CONNECTION

const db = mysql.createConnection({

    host:'localhost',
    user:'root',
    password:'',
    database:'mock_test_db'

});

db.connect((err)=>{

    if(err){

        console.log(err);

    } else {

        console.log("MySQL Connected");

    }

});



// MULTER STORAGE

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
        path.join(
            __dirname,
            'views/login.html'
        )
    );

});



app.get('/register.html',(req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            'views/register.html'
        )
    );

});



app.get('/dashboard',(req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            'views/dashboard.html'
        )
    );

});



app.get('/test',(req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            'views/test.html'
        )
    );

});



app.get('/result',(req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            'views/result.html'
        )
    );

});



app.get('/admin',(req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            'views/admin.html'
        )
    );

});



// REGISTER API

app.post('/register',(req,res)=>{

    const {

        username,
        email,
        password

    } = req.body;

    const sql = `

        INSERT INTO users
        (
            username,
            email,
            password
        )

        VALUES (?,?,?)

    `;

    db.query(

        sql,

        [
            username,
            email,
            password
        ],

        (err,result)=>{

            if(err){

                console.log(err);

                res.json({
                    message:"Register Failed"
                });

            } else {

                res.json({
                    message:"Registration Successful"
                });

            }

        }

    );

});



// LOGIN API

app.post('/login',(req,res)=>{

    const {

        email,
        password

    } = req.body;

    const sql = `

        SELECT *

        FROM users

        WHERE email=?
        AND password=?

    `;

    db.query(

        sql,

        [
            email,
            password
        ],

        (err,result)=>{

            if(err){

                console.log(err);

                res.json({
                    success:false
                });

            } else {

                if(result.length > 0){

                    res.json({

                        success:true,

                        username:
                        result[0].username

                    });

                } else {

                    res.json({
                        success:false
                    });

                }

            }

        }

    );

});



// ADD QUESTION API

app.post('/add-question',(req,res)=>{

    const {

        question,
        option1,
        option2,
        option3,
        option4,
        answer

    } = req.body;

    const sql = `

        INSERT INTO questions
        (
            question,
            option1,
            option2,
            option3,
            option4,
            answer
        )

        VALUES (?,?,?,?,?,?)

    `;

    db.query(

        sql,

        [

            question,
            option1,
            option2,
            option3,
            option4,
            answer

        ],

        (err,result)=>{

            if(err){

                console.log(err);

                res.json({
                    message:"Database Error"
                });

            } else {

                res.json({
                    message:"Question Added Successfully"
                });

            }

        }

    );

});



// CSV UPLOAD

app.post(
    '/upload-csv',
    upload.single('file'),
    (req,res)=>{

    const results = [];

    fs.createReadStream(req.file.path)

    .pipe(csv())

    .on('data',(data)=>{

        results.push(data);

    })

    .on('end',()=>{

        results.forEach((row)=>{

            const sql = `

                INSERT INTO questions
                (
                    question,
                    option1,
                    option2,
                    option3,
                    option4,
                    answer
                )

                VALUES (?,?,?,?,?,?)

            `;

            db.query(

                sql,

                [

                    row.question,
                    row.option1,
                    row.option2,
                    row.option3,
                    row.option4,
                    row.answer

                ]

            );

        });

        res.json({

            message:
            'CSV Uploaded Successfully'

        });

    });

});



// GET RANDOM QUESTIONS

app.get('/api/questions',(req,res)=>{

    const sql = `

        SELECT *

        FROM questions

        ORDER BY RAND()

        LIMIT 50

    `;

    db.query(sql,(err,result)=>{

        if(err){

            res.json(err);

        } else {

            res.json(result);

        }

    });

});



// SAVE RESULT

app.post('/save-result',(req,res)=>{

    const {

        username,
        score,
        total_questions

    } = req.body;

    const sql = `

        INSERT INTO results
        (
            username,
            score,
            total_questions
        )

        VALUES (?,?,?)

    `;

    db.query(

        sql,

        [

            username,
            score,
            total_questions

        ],

        (err,result)=>{

            if(err){

                res.json(err);

            } else {

                res.json({
                    message:"Result Saved"
                });

            }

        }

    );

});



// LEADERBOARD API

app.get('/leaderboard',(req,res)=>{

    const sql = `

        SELECT *

        FROM results

        ORDER BY score DESC

        LIMIT 10

    `;

    db.query(sql,(err,result)=>{

        if(err){

            res.json(err);

        } else {

            res.json(result);

        }

    });

});



// SERVER

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{

    console.log(`Server Running on ${PORT}`);

});