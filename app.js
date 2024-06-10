import express from 'express';
import {
    getCourses,
    getFaculties,
    getGroups,
    getAvailableDates,
    getSchedule,
    getLesson,
    getRoom,
    getTeacher,
} from './database.js';

const app = express();

app.get('/', async (req, res) => {
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

app.get('/schedule/group_id=:group_id', async (req, res) => {
    const { group_id } = req.params;
    const dates = await getAvailableDates(group_id);
    res.send(dates[0]);
});

app.get('/schedule/group_id=:group_id/start=:start/end=:end/', async (req, res) => {
    const { group_id, start, end } = req.params;

    const schedule = await getSchedule(group_id, start, end);
    if (schedule[0].length) {
        const tibtable = schedule[0].reduce(async (acc, item) => {
            const resolvedAcc = await acc;
            const lesson = await getLesson(item.lesson_id);
            const room = await getRoom(item.room_id);
            const teacher = await getTeacher(item.teacher_id);

            return [
                ...resolvedAcc,
                {
                    pair_date: item.pair_date,
                    pair: item.pair,
                    day_of_week: item.day_of_week,
                    lesson: lesson[0][0].lesson,
                    pair_type: item.pair_type,
                    room: room[0][0].room,
                    teacher: teacher[0][0].teacher,
                },
            ];
        }, []);

        tibtable.then((responce) => res.send(responce));
    } else {
        res.send('Ошибка получения данных расписания');
    }
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Что-то сломалось');
});

app.listen(8080, () => console.log('Старт сервера!'));
