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
    try {
        const update = await getUpdateDate();
        res.send(update[0]);
    } catch (error) {
        res.status(500).send({ error: 'Ошибка получения даты обновления' });
        console.log('Ошибка получения даты обновления', error);
    }
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
    try {
        const courses = await getCourses();
        res.send(courses[0]);
    } catch (error) {
        res.status(500).send({ error: 'Ошибка получения курсов' });
        console.log('Ошибка получения курсов', error);
    }
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
    try {
        const faculties = await getFaculties();
        res.send(faculties[0]);
    } catch (error) {
        res.status(500).send({ error: 'Ошибка получения факультетов' });
        console.log('Ошибка получения факультетов', error);
    }
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
    try {
        const groups = await getGroups(fac_id, course_id);
        res.send(groups[0]);
    } catch (error) {
        res.status(500).send({ error: 'Ошибка получения групп' });
        console.log('Ошибка получения групп', error);
    }
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
 *       description: Список доступных дат
 */
app.get('/schedule-dates/:UID', async (req, res) => {
    const { UID } = req.params;
    const { UID_mg } = req.query;

    try {
        const dates = await getAvailableDates(UID, UID_mg);
        const currentDates = dates[0].reduce((acc, schedule) => {
            return [...acc, format(schedule.pair_date, 'YYYY-MM-DD')];
        }, []);
        res.send(currentDates);
    } catch (error) {
        res.status(500).send({ error: 'Ошибка получения доступных дат' });
        console.error('Ошибка получения доступных дат:', error);
    }
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
    const { UID_mg } = req.query;

    try {
        const date = await getCurrentSchedule(UID, UID_mg);
        const schedule = await scheduleCollector(date[0]);
        res.send(schedule);
    } catch (error) {
        res.status(500).send({ error: 'Ошибка получения расписания на текущую дату' });
        console.log('Ошибка получения расписания на текущую дату', error);
    }
});

/**
 * @swagger
 * /schedule/{start}/{end}/{UID}:
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
app.get('/schedule/:start/:end/:UID', async (req, res) => {
    const { start, end, UID } = req.params;
    const { UID_mg } = req.query;

    try {
        const schedule = await getSchedule(UID, UID_mg, start, end);
        const timetable = await scheduleCollector(schedule[0]);
        res.send(timetable);
    } catch (error) {
        res.status(500).send({ error: 'Ошибка получения расписания в диапазоне дат' });
        console.error('Ошибка получения расписания в диапазоне дат:', error);
    }
});

// Функция для сбора расписания
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

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Что-то сломалось' });
});

app.listen(8080, () => console.log('Старт сервера!'));
