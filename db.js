const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mock_test_db'
});

connection.connect((err) => {
    if(err){
        console.log("Database Error");
    } else {
        console.log("MySQL Connected");
    }
});

module.exports = connection;