const express = require('express')
const body_parser = require('body-parser')
const path = require('path')
const cors = require('cors')
const config = require('config')
const logger = require('./logger/my_logger')
const company_dal = require('./dals/company_dal')

const app = express() // creates my server

app.use(cors())

app.use(body_parser.json()) // will help to get the body of the request 

app.use(express.static(path.join('.', '/static/'))) // allows browsing to my static folder

app.get('/api/employees', async (request, response) => {
    const result = await company_dal.get_all_employees()
    response.status(200).json(result.data)
})

app.get('/api/employees/:id', async (request, response) => {
    const id = request.params.id
    const result = await company_dal.get_employee_by_id(id)
    response.status(200).json(result.data ? result.data : {})
})

app.post('/api/employees', async (request, response) => {
        const new_employee = request.body
        const result = await company_dal.insert_employee(new_employee)
       if (result.status == "success") 
            response.status(201).json({ new_employee: result.data, url: `/api/employees/${result.data.id}` })
        else
            response.status(result.internal ? 500: 400).json({ status: "Failed to insert new employee", error: result.error })
})

app.put('/api/employees/:id', async (request, response) => {
    const id = request.params.id
    const updated_employee = request.body
    const result = await company_dal.update_employee(id, updated_employee)

    response.status(200).json({ result: result.data ? "employee updated" : "employee not found" })
})

app.patch('/api/employees/:id', async (request, response) => {
    const id = request.params.id
    const updated_employee = request.body    
    const result = await company_dal.patch_employee(id, updated_employee)

    response.status(200).json({ result: result.data ? "employee updated" : "employee not found" })
})

app.delete('/api/employees/:id', async (request, response) => {
    const id = request.params.id
    const result = await company_dal.delete_employee(id)
    console.log(result);
    response.status(200).json({ result: result.data ? "employee deleted" : "employee not found" })
})

app.delete('/api/employees-delete-table', async (request, response) => {
    const result = await company_dal.delete_table()
    response.status(200).json({ status: "table-deleted" })
})

app.post('/api/employees-create-table', async (request, response) => {
    //logger.debug(request)
    const result = await company_dal.create_table()
    if (result.status == "success") 
        response.status(201).json({ status: "table-created" })
    else
        response.status(result.internal? 500 : 400).json({ error: result.error })
})

app.post('/api/employees-create6', async (request, response) => {
    const result = await company_dal.insert_employees6()
    response.status(201).json({ result: "6 new employees created" })
})

// start
app.listen(config.server.port, () => {
    logger.info(`==== express server is up on port ${config.server.port}`);
})

