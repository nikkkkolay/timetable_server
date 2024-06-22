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
    getGroup,
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
 * /groups/{group}:
 *  get:
 *   description: Получить группу по имени
 *   parameters:
 *    - in: path
 *      name: group_name
 *      required: true
 *      type: string
 *      minimum: 1
 *      description: имя группы
 *   responses:
 *     '200':
 *       description: Номер группы
 */
app.get('/groups/:group_name', async (req, res) => {
    const { group_name } = req.params;
    const group = await getGroup(group_name);
    res.send(group[0][0]);
});

/**
 * @swagger
 * /available-dates/{group_id}:
 *  get:
 *   description: Получить список доступных дат
 *   parameters:
 *    - in: path
 *      name: group_id
 *      required: true
 *      type: number
 *      minimum: 1
 *      description: id группы
 *   responses:
 *     '200':
 *       description: Список доступных доступных дат
 */
app.get('/available-dates/:group_id', async (req, res) => {
    const { group_id } = req.params;
    const dates = await getAvailableDates(group_id);
    const availableDates = dates[0].reduce((acc, item) => {
        return [...acc, format(item.pair_date, 'YYYY-MM-DD')];
    }, []);
    res.send(availableDates);
});

/**
 * @swagger
 * /current-schedule/{group_id}:
 *  get:
 *   description: Получить расписание на текущую дату
 *   parameters:
 *    - in: path
 *      name: group_id
 *      required: true
 *      type: number
 *      minimum: 1
 *      description: id группы
 *   responses:
 *     '200':
 *       description: Расписание на текущую дату
 */
app.get('/current-schedule/:group_id', async (req, res) => {
    const { group_id } = req.params;
    const date = await getCurrentSchedule(group_id);
    const timetable = timetableCollector(date[0]);
    timetable.then((response) => res.send(response));
});

/**
 * @swagger
 * /schedule/{group_id}/{start}/{end}:
 *  get:
 *   description: Получить расписание в диапазоне дат
 *   parameters:
 *    - in: path
 *      name: group_id
 *      required: true
 *      type: number
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
app.get('/schedule/:group_id/:start/:end/', async (req, res) => {
    const { group_id, start, end } = req.params;
    const schedule = await getSchedule(group_id, start, end);
    const timetable = timetableCollector(schedule[0]);
    timetable.then((response) => res.send(response));
});

const timetableCollector = async (schedule) => {
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
                pair_date: format(item.pair_date, 'D MMMM (dddd)'),
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
