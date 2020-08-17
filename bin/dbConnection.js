const mysql = require('mysql');
const {promisify} = require('util');
require('dotenv').config();

const { HOST, USER, PW, DB1, HOST2, USER2, PW2, DB2 } = process.env;
const database = {
  host: HOST,
  user: USER,
  password: PW,
  database: DB1
}
const database2 = {
    host: HOST2,
    user: USER2,
    password: PW2,
    database: DB2
  }
const pool = mysql.createPool(database);
const pool2 = mysql.createPool(database2);

pool.getConnection( (err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('DATABASE CONNECTION WAS CLOSED');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('DATABASE HAS TO MANY CONNECTIONS');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('DATABASE CONNECTION WAS REFUSED');
        }
    }
    if (connection) {
        connection.release();
    }
    console.log('DB is Connected')
    return;
});

pool2.getConnection( (err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('DATABASE CONNECTION WAS CLOSED');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('DATABASE HAS TO MANY CONNECTIONS');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('DATABASE CONNECTION WAS REFUSED');
        }
    }
    if (connection) {
        connection.release();
    }
    console.log('DB2 is Connected')
    return;
});

//promisify Pool Querys
pool.query = promisify(pool.query);
pool2.query = promisify(pool2.query);

module.exports = { 
    pool,
    pool2
};