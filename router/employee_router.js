const express = require('express')
const logger = require('../logger/my_logger')
const company_dal = require('../dals/company_dal')

const router = express.Router()

// default = /api/employees

router.get('', async (request, response) => {
    const result = await company_dal.get_all_employees()
    response.status(200).json(result.data)
})

// prefix: /api/employees/:id
router.get('/:id', async (request, response) => {
    const id = request.params.id
    const result = await company_dal.get_employee_by_id(id)
    response.status(200).json(result.data ? result.data : {})
})

router.post('', async (request, response) => {
        const new_employee = request.body
        const result = await company_dal.insert_employee(new_employee)
       if (result.status == "success") 
            response.status(201).json({ new_employee: result.data, url: `/api/employees/${result.data.id}` })
        else
            response.status(result.internal ? 500: 400).json({ status: "Failed to insert new employee", error: result.error })
})

router.put('/:id', async (request, response) => {
    const id = request.params.id
    const updated_employee = request.body
    const result = await company_dal.update_employee(id, updated_employee)

    response.status(200).json({ result: result.data ? "employee updated" : "employee not found" })
})

router.patch('/:id', async (request, response) => {
    const id = request.params.id
    const updated_employee = request.body    
    const result = await company_dal.patch_employee(id, updated_employee)

    response.status(200).json({ result: result.data ? "employee updated" : "employee not found" })
})

router.delete('/:id', async (request, response) => {
    const id = request.params.id
    const result = await company_dal.delete_employee(id)
    console.log(result);
    response.status(200).json({ result: result.data ? "employee deleted" : "employee not found" })
})

router.delete('employees-delete-table', async (request, response) => {
    const result = await company_dal.delete_table()
    response.status(200).json({ status: "table-deleted" })
})

router.post('/employees-create-table', async (request, response) => {
    //logger.debug(request)
    const result = await company_dal.create_table()
    if (result.status == "success") 
        response.status(201).json({ status: "table-created" })
    else
        response.status(result.internal? 500 : 400).json({ error: result.error })
})

router.post('/employees-create6', async (request, response) => {
    const result = await company_dal.insert_employees6()
    response.status(201).json({ result: "6 new employees created" })
})

module.exports = router