const mysql2 = require('mysql2');

const con = mysql2.createPool({
    host : 'host1.dvgroup.co.in',
    user : 'hell12_PaviCIS',
    password  : 'PaviCIS123',
    database : 'hell12_PaviCIS'
})
// const con = mysql2.createPool({
//     host:'localhost',
//     user : 'root',
//     password : 'Mysql@123',
//     database : 'ChatAppDB',
//     multipleStatements : true
// })

module.exports = con;