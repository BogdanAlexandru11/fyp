var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var moment= require('moment');
var Promise = require('promise');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'fyp_user',
    password : 'fyp_password@my123!',
    database : 'fyp'
});

/* GET home page. */
router.get('/', function(req, res, next) {
    connection.query('SELECT * FROM car_data ORDER BY date DESC', function (error, results, fields) {
        res.render('index', { car_data : results });
    });
});

router.post('/', function(req, res, next) {
    var agentRegex=/^.*(?i)(OpenAlpr).*$/;
    if(req.headers.user-agent.match(agentRegex)){
        let car_reg=req.body.best_plate.plate;
        let date=moment().format('MMMM Do YYYY, h:mm:ss a');
        let x_coord="N/A";
        let y_coord="N/A";
        let valid_permit=false;

        connection.query('SELECT * FROM valid_permits', function (error, results, fields) {
            if(error){
                console.log(error);
            }
            for(var i =0; i <results.length;i++){
                if(results[i].car_reg===car_reg){
                    valid_permit=true;
                }
            }
                connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord) VALUES (?,?,?,?,?)', [car_reg,date,valid_permit,x_coord,y_coord], function (err,result) {
            });

            connection.query('SELECT * FROM car_data ORDER BY date DESC', function (error, car_results, fields) {
                if(error){
                    console.log(error);
                }
                //check here if the car is in the database, if it's not, send an email stating that it is not in the database
                res.render('index', { car_data : car_results });
            });

            //check here if the car is in the database, if it's not, send an email stating that it is not in the database
        });



    }


    // create a table with the cars that have a valid parking permit

    //then check each car againt that database, then insert the data into the car_data table


    //     connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord) VALUES (?,?,?,?,?)', [car_reg,date,valid_permit,x_coord,y_coord], function (err, result) {
    //      res.redirect('/');
    // });

    connection.query('SELECT * FROM car_data', function (error, results, fields) {
        //check here if the car is in the database, if it's not, send an email stating that it is not in the database
        res.render('index', { car_data : results });
    });
});

// router.get('/insert_into_db', function(req, res, next) {
//     console.log(req.query.insertCarRegIntoDB);
//     connection.query('INSERT INTO car_data (car_reg) VALUES (?)', [req.query.insertCarRegIntoDB], function (err, result) {
//     res.redirect('/');
//     });
// });
//
// router.get('/check_value_in_db', function(req, res, next) {
//     connection.query('SELECT * FROM car_data WHERE car_reg=?', [req.query.checkValueInDB], function (err, result) {
//         console.log(result);
//         res.redirect('/');
//     });
// });


module.exports = router;
