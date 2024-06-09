import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql
    .createPool({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
    })
    .promise();

export async function getCourses() {
    return connection.query('SELECT * FROM courses');
}

export async function getFaculties() {
    return connection.query('SELECT * FROM facultees');
}

export async function getGroups(fac_id, course_id) {
    return connection.query('SELECT * FROM `groups` WHERE `fac_id`=? AND `course_id`=?', [
        fac_id,
        course_id,
    ]);
}
