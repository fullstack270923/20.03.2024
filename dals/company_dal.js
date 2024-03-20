const knex = require('knex')
const config = require('config')
const logger = require('../logger/my_logger')

const data_base = knex({
    client: 'pg',
    connection: {
        host: config.db_connection.host,
        user: config.db_connection.user,
        password: config.db_connection.password,
        database: config.db_connection.database
    }
})

async function get_all_employees() {
    // add try catch
    const employees = await data_base.raw("select * from company")
    employees.rows = employees.rows.map(e => {
        e.address = e.address.trimEnd();
        return e;
    })
    logger.debug(`app.get /api/employees number of records: ${employees.rows.length}`)
    return {
        status: "success",
        data: employees.rows
    }
}

async function get_employee_by_id(id) {
    const employees = await data_base.raw(`select * from company where id = ${id}`)
    employees.rows = employees.rows.map(e => {
        e.address = e.address.trimEnd();
        return e;
    })
    return {
        status: "success",
        data: employees.rows[0]
    }    
}

async function insert_employee(new_employee) {
    try {
        delete new_employee.id
        console.log(new_employee);
        const result_ids = await data_base('company').insert(new_employee).returning('id');
        console.log(result_ids[0]);

        const id = result_ids[0].id // the new id
        return { status: "success", 
                 data: { id, ...new_employee }  }
        // url: `/api/employees/${id}`
    }
    catch (e) {
        logger.error(`Error in api post /api/employee. error = ${e.message}.`)
        return {
            status: "error",
            internal: false,
            error: e.message.replaceAll("\"", "'")
        }
    }
}

async function update_employee(id, updated_employee) {
    // add try-catch
    // can fail due to duplication
    const result = await data_base.raw(`UPDATE company set name=?,age=?,address=?,salary=? where id=?`,
        [updated_employee.name, updated_employee.age, updated_employee.address ? updated_employee.address : '', updated_employee.salary, id])
    return {
        status: "success",
        data: result.rowCount
    }    
}

async function patch_employee(id, updated_employee) {
    // add try-catch to figure out if there was
    // a unique constrain error, if so the user should get error-400
    const query_arr = []
    for (let key in updated_employee) {
        query_arr.push(`${key}='${updated_employee[key]}'`)
    }

    if (query_arr.length > 0) {
            // check how many employess updated?
        const query = `UPDATE company set ${query_arr.join(', ')} where id=${id}`
        logger.debug(`app.patch employee ${query}`)
        const result = await data_base.raw(query)
        return {
            status: "success",
            data: result.rowCount
        }         
    }
    return {
        status: "success",
        data: query_arr.length
    }          
}

async function delete_employee(id) {
    const result = await data_base.raw(`DELETE from company where id=${id}`)
    console.log(result);
    return {
        status: "success",
        data: result.rowCount
    }  
}

async function delete_table() {
    // delete table
    // try catch in case table does not exist
    await data_base.raw(`DROP table company`)
    return {
        status: "success"
    }      
}

async function create_table() {
    try {
        await data_base.raw(`CREATE TABLE company (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE,` +
            `age INT NOT NULL,` +
            `address CHAR(50),` +
            `salary REAL);`);
        return {
            status: "success"
        }          
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
            //response.status(400).json({ status: "Failed to create table", error: e.message.replaceAll("\"", "'") })
            return {
                status: "error",
                internal: false,
                error: e.message.replaceAll("\"", "'")
            }              
        }
        else {
            const case_number = Math.floor(Math.random() * 1000000) + 1000000
            logger.error(`Case number (${case_number}): Error in employees-create-table. ${e.message}.`)
            return {
                status: "error",
                internal: true,
                error: `Case number (${case_number}): Error in employees-create-table. ${e.message}`
            }              
        }
    }
}

async function insert_employees6() {
    // add try-catch 
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
    return {
        status: "success"
    }
}

module.exports = {
    get_all_employees, get_employee_by_id, insert_employee,
    update_employee, patch_employee, delete_employee, delete_table,
    create_table, insert_employees6
}
