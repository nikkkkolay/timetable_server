import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { format } from '@formkit/tempo';
import { pairCollector } from './helpers.js';

import {
    getCourses,
    getFaculties,
    getGroups,
    getAvailableDates,
    getSchedule,
    getRoom,
    getTeacher,
    getCurrentSchedule,
    getUpdateDate,
    getDisciplines,
} from './database.js';

const app = express();
app.use(cors());

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Расписание МАУ',
            description: 'API Расписание МАУ',
        },
        servers: ['http://localhost:8080'],
    },
    apis: ['app.js'],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /:
 *  get:
 *   description: Получить дату обновления расписания
 *   responses:
 *     '200':
 *       description: Новая дата обновления
 */
app.get('/', async (req, res) => {
    const update = await getUpdateDate();
    res.send(update[0]);
});

/**
 * @swagger
 * /courses:
 *  get:
 *   description: Получить список курсов
 *   responses:
 *     '200':
 *       description: Список курсов
 */
app.get('/courses', async (req, res) => {
    const courses = await getCourses();
    res.send(courses[0]);
});

/**
 * @swagger
 * /faculties:
 *  get:
 *   description: Получить список институтов
 *   responses:
 *     '200':
 *       description: Список институтов
 */
app.get('/faculties', async (req, res) => {
    const faculties = await getFaculties();
    res.send(faculties[0]);
});

/**
 * @swagger
 * /groups/{fac_id}/{course_id}:
 *  get:
 *   description: Получить список доступных групп
 *   parameters:
 *    - in: path
 *      name: fac_id
 *      required: true
 *      type: number
 *      minimum: 1
 *      description: id института/факультета
 *    - in: path
 *      name: course_id
 *      required: true
 *      type: number
 *      description: id курса
 *   responses:
 *     '200':
 *       description: Список доступных групп
 */
app.get('/groups/:fac_id/:course_id', async (req, res) => {
    const { fac_id, course_id } = req.params;
    const groups = await getGroups(fac_id, course_id);
    res.send(groups[0]);
});

/**
 * @swagger
 * /schedule-dates/{UID}:
 *  get:
 *   description: Получить список доступных дат
 *   parameters:
 *    - in: path
 *      name: UID
 *      required: true
 *      type: string
 *      minimum: 1
 *      description: UID группы
 *   responses:
 *     '200':
 *       description: Список доступных доступных дат
 */
app.get('/schedule-dates/:UID', async (req, res) => {
    const { UID } = req.params;
    const dates = await getAvailableDates(UID);
    const currentDates = dates[0].reduce((acc, schedule) => {
        return [...acc, format(schedule.pair_date, 'YYYY-MM-DD')];
    }, []);
    res.send(currentDates);
});

/**
 * @swagger
 * /schedule-current/{UID}:
 *  get:
 *   description: Получить расписание на текущую дату
 *   parameters:
 *    - in: path
 *      name: UID
 *      required: true
 *      type: string
 *      minimum: 1
 *      description: UID группы
 *   responses:
 *     '200':
 *       description: Расписание на текущую дату
 */
app.get('/schedule-current/:UID', async (req, res) => {
    const { UID } = req.params;
    const date = await getCurrentSchedule(UID);
    const schedule = scheduleCollector(date[0]);
    schedule.then((response) => res.send(response));
});

/**
 * @swagger
 * /schedule/{UID}/{start}/{end}:
 *  get:
 *   description: Получить расписание в диапазоне дат
 *   parameters:
 *    - in: path
 *      name: UID
 *      required: true
 *      type: string
 *      minimum: 1
 *      description: id группы
 *    - in: path
 *      name: start
 *      required: true
 *      type: string
 *      description: YYYY-MM-DD
 *    - in: path
 *      name: end
 *      required: true
 *      type: string
 *      description: YYYY-MM-DD
 *   responses:
 *     '200':
 *       description: Расписание в диапазоне дат
 */
app.get('/schedule/:UID/:start/:end/', async (req, res) => {
    const { UID, start, end } = req.params;
    const schedule = await getSchedule(UID, start, end);
    const timetable = scheduleCollector(schedule[0]);
    timetable.then((response) => res.send(response));
});

const scheduleCollector = async (schedule) => {
    const timetable = schedule.reduce(async (acc, item, index, arr) => {
        const resolvedAcc = await acc;
        const disciplines = await getDisciplines(item.disc_id);
        const room = await getRoom(item.room_id);
        const teacher = await getTeacher(item.teacher_id);

        const prev_date = arr[index - 1] ? arr[index - 1].pair_date : '';
        const pair_first = item.pair_date.toString() !== prev_date.toString();

        return [
            ...resolvedAcc,
            {
                pair: pairCollector(item.pair),
                pair_date: format(item.pair_date, 'YYYY-MM-DDTHH:mm:ssZ'),
                pair_type: item.pair_type,
                pair_first: pair_first,
                disciplines: disciplines[0][0].disc,
                room: room[0][0].room,
                teacher: teacher[0][0].teacher,
                id: index,
            },
        ];
    }, []);
    return timetable;
};

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Что-то сломалось');
});

app.listen(8080, () => console.log('Старт сервера!'));
