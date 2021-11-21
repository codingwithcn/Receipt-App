const sqlite3 = require('sqlite3').verbose();
var fs = require('fs');
const path = require('path');
const db_file_loc = path.resolve(process.resourcesPath, "client.db")

let currentDate = {
    pad2: function(n) {
        return (n < 10 ? '0' : '') + n;
    },

    get_date: function(){
        var date = new Date();
        var month = this.pad2(date.getMonth()+1);
        var day =  this.pad2(date.getDate())
        var year =  date.getFullYear();
        return month + "/" + day + "/" + year;
    }
}

/**
 * Checks if table exist in database, if it does not, 
 * it creates it
 */
const table_exist = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS Receipt (
        "id"	INTEGER NOT NULL,
        "name"	TEXT,
        "amount"	TEXT,
        "date"	TEXT,
        PRIMARY KEY("id" AUTOINCREMENT)
    );
    `
    let db = new sqlite3.Database(db_file_loc, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    db.run(sql)
    db.close()
}

/**
 * Checks if database exist, if it does not it creates it
 * Then it checks if table exist, if it does notit creates it
 */
const does_db_exit_if_not_create = () =>{
    // open the database 
    console.log(db_file_loc)
    if (fs.existsSync(db_file_loc)){
        table_exist()
    }else {
        fs.open(db_file_loc, 'w', function (err, 
            file) {
            if (err) throw err;
            console.log('Saved!');
        });
        table_exist()
    }
}

/**
 * Inserts new Receipt into client database
 * 
 * @param {string} name of person you want stored in db
 * @param {string} amount of money person payed you want stored in db
 * @param {Function} callback calls after the function is done running
 */
const new_reciept = (name, amount, callback) => {
    let db = new sqlite3.Database(db_file_loc, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    db.run(`insert into Receipt (name, amount, date) values (?,?,?)`, [name, amount, currentDate.get_date()], (err)=>{
        if (err){
            console.log("WE ARE IN CREATE Receipt")
            console.log(err.message);
        }
    })
    db.close();
    callback();
}

const get_reciepts = (callback, query=null) => {
    let db = new sqlite3.Database(db_file_loc, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    let sql;
    if (query != null){
        sql = query;
    }else {
        sql = "select * from Receipt";
    }
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        callback(rows)
    });
    db.close();
}

const updateReciepts = (column, value, id) => {
    let db = new sqlite3.Database(db_file_loc, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

    let sql =  `update Receipt set ${column} =? where id=${id}`

    db.run(sql, [value], function(err){
        console.log(err) 
    });
    db.close()
}

const deleteReciepts = (id) => {
    let db = new sqlite3.Database(db_file_loc, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

    let sql =  `delete from Receipt where id=${id}`

    db.run(sql, [], function(err){
        console.log(err) 
    });
    db.close()
}

module.exports = {
    does_db_exit_if_not_create: does_db_exit_if_not_create,
    new_reciept: new_reciept,
    get_reciepts: get_reciepts,
    updateReciepts: updateReciepts,
    deleteReciepts: deleteReciepts
}