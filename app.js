import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.listen(8080, () => console.log('Старт сервера'));

const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Есть контакт!');
});

connection.query('SELECT * FROM `groups`', function (error, results, fields) {
    if (error) throw error;
    console.log('The solution is: ', results[0]);
});

connection.end();
