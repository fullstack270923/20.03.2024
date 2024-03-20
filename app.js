
const knex = require('knex')
const express = require('express')
const body_parser = require('body-parser')
const path = require('path')
const cors = require('cors')
const config = require('config')
const logger = require('./logger/my_logger')

const app = express() // creates my server

app.use(cors())

app.use(body_parser.json()) // will help to get the body of the request 

app.use(express.static(path.join('.', '/static/'))) // allows browsing to my static folder

// const loggerMiddleware = (request, response, next) => {
//     logger.info(`${request.method} ${request.url}`)
//     response.on('finish', () => {
//         // Now you might log something more useful about the response, like its status code.
//         logger.info(`Response sent with status code: ${response.statusCode} ${response.body}`);
//     });
//     next();
// }

// app.use(loggerMiddleware)

// app.get('/getall.html',  async (request, response) => {
//     response.sendFile(path.join(__dirname, '/static/get_all.html'))
// })

app.get('/api/employees', async (request, response) => {
    const employees = await data_base.raw("select * from company")
    employees.rows = employees.rows.map(e => {
        e.address = e.address.trimEnd();
        return e;
    })
    logger.debug(`app.get /api/employees number of records: ${employees.rows.length}`)
    response.status(200).json(employees.rows)
})

app.get('/api/employees/:id', async (request, response) => {
    // add try catch
    // if /:id is zero or not a number then return 400 with the error
    // also log.error the error
    // hint: typeof value === 'number' && !isNaN(value);
    const id = request.params.id
    const employees = await data_base.raw(`select * from company where id = ${id}`)
    employees.rows = employees.rows.map(e => {
        e.address = e.address.trimEnd();
        return e;
    })
    response.status(200).json(employees.rows)
})

app.post('/api/employees', async (request, response) => {
    try {
        const new_employee = request.body
        // await data_base.raw(`INSERT INTO company (name,age,address,salary) VALUES (?, ?, ?, ?);`,
        //     [new_employee.name, new_employee.age, new_employee.address, new_employee.age])
        delete new_employee.id
        console.log(new_employee);
        const result_ids = await data_base('company').insert(new_employee).returning('id');
        console.log(result_ids[0]);

        const id = result_ids[0].id
        response.status(201).json({ new: { id, ...new_employee}, url: `/api/employees/${id}` })
        // ...new_employee ==>   name: "Paul!", age: 32, address: "California!", salary: 20000
        // {...new_employee} ==>  { name: "Paul!", age: 32, address: "California!", salary: 20000 }
        // {id: result_ids[0].id, ...new_employee} ==>  
        //            { id: 14, name: "Paul!", age: 32, address: "California!", salary: 20000 }
        // /api/employees/8
    }
    catch (e) {
        logger.error(`Error in api post /api/employee. error = ${e.message}.`)
        response.status(400).json({ status: "Failed to insert new employee", error: e.message.replaceAll("\"", "'") })
    }
})

app.put('/api/employees/:id', async (request, response) => {
    const id = request.params.id
    const updated_employee = request.body
    const result = await data_base.raw(`UPDATE company set name=?,age=?,address=?,salary=? where id=?`,
        [updated_employee.name, updated_employee.age, updated_employee.address ? updated_employee.address : '', updated_employee.salary, id])
    response.status(200).json({ result: result.rowCount ? "employee updated" : "employee not found" })
})

app.patch('/api/employees/:id', async (request, response) => {
    const id = request.params.id
    // const { name ,address, salary, age } = request.body
    const query = []
    for (key in request.body) {
        query.push(`${key}='${request.body[key]}'`)
    }

    // easy way
    //const updated_employee = request.body
    //const employee_db = await data_base.raw(`select * from company where id = ${id}`)
    //const result = await data_base.raw(`UPDATE company set name=?,age=?,address=?,salary=? where id=?`,
    //[updated_employee.name ? updated_employee.name : employee_db.name, 
    //updated_employee.age, updated_employee.address ? updated_employee.address : '', updated_employee.salary, id])    

    // name? query.push(`name='${name}'`) : null
    // address? query.push(`address='${address}'`) : null
    // salary? query.push(`salary=${salary}`) : null
    // age? query.push(`age=${age}`) : null

    if (query.length > 0) {
        const query = `UPDATE company set ${query.join(', ')} where id=${id}`
        logger.debug(`app.patch employee ${query}`)
        await data_base.raw(query)
        response.status(200).json({ result: "employee patched" })
        return
    }
    response.status(200).json({ result: "empty employee" })
})

app.delete('/api/employees/:id', async (request, response) => {
    const id = request.params.id
    const result = await data_base.raw(`DELETE from company where id=${id}`)
    console.log(result);
    response.status(200).json({ result: result.rowCount ? "employee deleted" : "employee not found" })
})

app.delete('/api/employees-delete-table', async (request, response) => {
    // delete table
    await data_base.raw(`DROP table company`)
    response.status(200).json({ status: "table-deleted" })
})

app.post('/api/employees-create-table', async (request, response) => {
    try {
        logger.debug(request)
        await data_base.raw(`CREATE TABLE company (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE,` +
            `age INT NOT NULL,` +
            `address CHAR(50),` +
            `salary REAL);`);
        response.status(201).json({ status: "table-created" })
    }
    catch (e) {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('en', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Use 24-hour clock
        });
        const formattedDate = formatter.format(date).replace(/,/, '');
        console.log(`${formattedDate}.${date.getMilliseconds().toString().padStart(3, '0')} Error in employees-create-table. error = ${e} `);
        if (e.message.includes('already exists')) {
            logger.error(`Error in employees-create-table. error = ${e.message}.`)
            response.status(400).json({ status: "Failed to create table", error: e.message.replaceAll("\"", "'") })
        }
        else {
            const case_number = Math.floor(Math.random() * 1000000) + 1000000
            logger.error(`Case number (${case_number}): Error in employees-create-table. ${e.message}.`)
            response.status(500).json({
                status: "Failed to create table", error: `Internal error. please contact support ${case_number}`,
                time: Date()
            })
        }
    }
})

app.post('/api/employees-create6', async (request, response) => {
    `INSERT INTO company (name,age,address,salary)
    VALUES ('Paul', 32, 'California', 20000.00);
    INSERT INTO company (name,age,address,salary)
    VALUES ('Allen', 25, 'Texas', 15000.00);
    INSERT INTO company (name,age,address,salary)
    VALUES ('Teddy', 23, 'Norway', 20000.00);
    INSERT INTO company (name,age,address,salary)
    VALUES ('Mark', 25, 'Rich-Mond ', 65000.00);
    INSERT INTO company (name,age,address,salary)
    VALUES ('David', 27, 'Texas', 85000.00);
    INSERT INTO company (name,age,address,salary)
    VALUES ('Kim', 22, 'South-Hall', 45000.00);`
        .replaceAll('\n    ', '')
        .split(';')
        .filter(query => query)
        .forEach(async query => { await data_base.raw(query + ';') })
    response.status(201).json({ result: "6 new employees created" })
})

// start
app.listen(config.server.port, () => {
    logger.info(`==== express server is up on port ${config.server.port}`);
})

const data_base = knex({
    client: 'pg',
    connection: {
        host: config.db_connection.host,
        user: config.db_connection.user,
        password: config.db_connection.password,
        database: config.db_connection.database
    }
})


