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

export async function getUpdateDate() {
    return connection.query('SELECT * FROM ddate');
}

export async function getCourses() {
    return connection.query('SELECT * FROM courses');
}

export async function getFaculties() {
    return connection.query('SELECT * FROM facultees');
}

export async function getGroups(fac_id, course_id) {
    return connection.query('SELECT * FROM `groups` WHERE fac_id=? AND course_id=?', [
        fac_id,
        course_id,
    ]);
}

export async function getAvailableDates(UID) {
    return connection.query('SELECT * FROM schedule WHERE UID_g = ?', [UID]);
}

export async function getCurrentSchedule(UID) {
    return connection.query('SELECT  * FROM schedule WHERE UID_g = ? AND pair_date = CURDATE()', [
        UID,
    ]);
}

export async function getSchedule(UID, start, end) {
    return connection.query(
        'SELECT * FROM schedule WHERE UID_g = ? AND pair_date BETWEEN ? AND ?',
        [UID, start, end],
    );
}

export async function getDisciplines(disc_id) {
    return connection.query('SELECT * FROM disciplines WHERE disc_id=?', [disc_id]);
}

export async function getRoom(room_id) {
    return connection.query('SELECT * FROM rooms WHERE room_id=?', [room_id]);
}

export async function getTeacher(teacher_id) {
    return connection.query('SELECT * FROM teachers WHERE teacher_id=?', [teacher_id]);
}
