const express = require('express')
const body_parser = require('body-parser')
const path = require('path')
const cors = require('cors')
const config = require('config')
const logger = require('./logger/my_logger')
const employee_router = require('./router/employee_router')

const app = express() // creates my server

app.use(cors())

app.use(body_parser.json()) // will help to get the body of the request 

app.use(express.static(path.join('.', '/static/'))) // allows browsing to my static folder

app.use('/api/employees', employee_router)

// TO-DO:
// testing for sql methods
// join
// swagger
// testing rest api

// start
app.listen(config.server.port, () => {
    logger.info(`==== express server is up on port ${config.server.port}`);
})

