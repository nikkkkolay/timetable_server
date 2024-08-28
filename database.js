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

export async function getAvailableDates(UID, UID_mg = null) {
    let query = 'SELECT DISTINCT pair_date FROM schedule WHERE UID_g = ?';
    const params = [UID];

    if (UID_mg) {
        query += ' OR UID_g = ?';
        params.push(UID_mg);
    }

    return connection.query(query, params);
}

export async function getCurrentSchedule(UID, UID_mg = null) {
    let query = 'SELECT * FROM schedule WHERE (UID_g = ?';
    const params = [UID];

    if (UID_mg) {
        query += ' OR UID_g = ?';
        params.push(UID_mg);
    }

    query += ') AND pair_date = CURDATE()';

    return connection.query(query, params);
}

export async function getSchedule(UID, UID_mg = null, start, end) {
    let query = 'SELECT * FROM schedule WHERE (UID_g = ?';
    const params = [UID];

    if (UID_mg) {
        query += ' OR UID_g = ?';
        params.push(UID_mg);
    }

    query += ') AND pair_date BETWEEN ? AND ?';
    params.push(start, end);

    return connection.query(query, params);
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
