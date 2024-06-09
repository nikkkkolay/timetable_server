import express from 'express';
import { getCourses, getFaculties, getGroups } from './database.js';

const app = express();

app.get('/', (req, res) => {
    res.send('Сервер работает!');
});

app.get('/courses', async (req, res) => {
    const courses = await getCourses();
    res.send(courses[0]);
});

app.get('/faculties', async (req, res) => {
    const faculties = await getFaculties();
    res.send(faculties[0]);
});

app.get('/groups/fac_id=:fac_id/course_id=:course_id', async (req, res) => {
    const { fac_id, course_id } = req.params;
    const groups = await getGroups(fac_id, course_id);
    res.send(groups[0]);
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Что-то сломалось');
});

app.listen(8080, () => console.log('Старт сервера!'));
