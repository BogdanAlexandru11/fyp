var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var moment = require('moment');
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
    if(req.headers.host==='46.101.52.245:3000'){
        var car_reg=req.body.best_plate.plate;
        var date=moment().format('MMMM Do YYYY, h:mm:ss a');
        var x_coord="N/A";
        var y_coord="N/A";
        var valid_permit="false";

        connection.query('SELECT * FROM valid_permits', function (error, results, fields) {
            for(var i =0; i <results.length;i++){
                if(results[i].car_reg===car_reg){
                    valid_permit="true";
                }
            }
        connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord) VALUES (?,?,?,?,?)', [car_reg,date,valid_permit,x_coord,y_coord], function (err,result) {
            if(err){
                console.log(err);
            }

            var send = require('gmail-send')({
                user: 'alex.fyp2018@gmail.com',
                // user: credentials.user,                  // Your GMail account used to send emails
                pass: 'Password123!@#',
                // pass: credentials.pass,                  // Application-specific password
                to:   'abcbogdan11@gmail.com',
                subject: 'Car park updates',
                text:    'Car withe the reg '+ car_reg + ' was found in the car park at '+date+' without a valid parking permit',         // Plain text
                //html:    '<b>html text</b>'            // HTML
            });
        });
        connection.query('SELECT * FROM car_data ORDER BY date DESC', function (error, car_results, fields) {
                res.render('index', { car_data : car_results });
            });
        });
    }
    else{
        connection.query('SELECT * FROM car_data ORDER BY date DESC', function (error, car_results, fields) {
            res.render('index', { car_data : car_results });
        });
    }
});

module.exports = router;
