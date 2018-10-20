var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var moment = require('moment');
var Promise = require('promise');
var nodemailer = require('nodemailer');
let {PythonShell} = require('python-shell');


var connection = mysql.createConnection({
    host: 'localhost',
    user: 'fyp_user',
    password: 'fyp_password@my123!',
    database: 'fyp'
});
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'alex.fyp2018@gmail.com',
        pass: 'Password123!@#'
    }
});


/* GET home page. */
router.get('/', function (req, res, next) {
    connection.query('SELECT * FROM car_data ORDER BY id DESC', function (error, results, fields) {

        var nctDataPromise = getNctData('07oy2033');
        nctDataPromise.then(function (succ) {
            console.log(succ);
        }).then(function (err) {
            // console.log(err);
        }).then(function (test) {
        });

        res.render('index', {car_data: results});


    });
});

router.post('/', function (req, res, next) {
    //change this to the sender lol
    if (req.headers.host === '46.101.52.245:3000') {
        var car_reg = req.body.best_plate.plate;
        var date = moment().format('MMMM Do YYYY, h:mm:ss a');
        var x_coord = "N/A";
        var y_coord = "N/A";
        var valid_permit = "false";
        connection.query('SELECT * FROM valid_permits', function (error, results, fields) {

            // return checkValidPermits = new Promise((found, notfound) => {
            //     for (var i = 0; i < results.length; i++) {
            //         if (results[i].car_reg === car_reg) {
            //             valid_permit = "true";
            //         }
            //     }
            //
            //
            //
            // });

            for (var i = 0; i < results.length; i++) {
                if (results[i].car_reg === car_reg) {
                    valid_permit = "true";
                }
            }
            connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord) VALUES (?,?,?,?,?)', [car_reg, date, valid_permit, x_coord, y_coord], function (err, result) {
                if (err) {
                    console.log(err);
                }
                var mailOptions = {
                    from: 'alex.fyp2018@gmail.com', // sender address
                    to: 'abcbogdan11@gmail.com', // list of receivers
                    subject: 'Car park updates', // Subject line
                    html: 'Car withe the reg ' + car_reg + ' was found in the car park at ' + date + ' without a valid parking permit' // plain text body
                };

                transporter.sendMail(mailOptions, function (mailerr, info) {
                    if (mailerr)
                        console.log(mailerr);
                });
            });
            connection.query('SELECT * FROM car_data ORDER BY id DESC', function (error, car_results, fields) {
                res.render('index', {car_data: car_results});
            });
        });
    }
    else {
        connection.query('SELECT * FROM car_data ORDER BY id DESC', function (error, car_results, fields) {
            res.render('index', {car_data: car_results});
        });
    }
});

// function getNctData(plate){
//     let pyshell = new PythonShell('/home/alexander11/fyp/checkNct.py', { pythonPath :'/usr/bin/python'});
//     pyshell.send(plate);
//     var new_plate;
//
//     pyshell.on('message', function (message) {
//         new_plate=message;
//         console.log(message);
//     });
//     pyshell.end(function (err,code,signal) {
//         if (err) throw err;
//     });
//     return new_plate;
// }


function getNctData(plate) {
    return promise1 = new Promise((resolve, reject) => {
        let pyshell = new PythonShell('/home/alexander11/fyp/checkNct.py', {pythonPath: '/usr/bin/python'});
        pyshell.send(plate);
        var new_plate;

        pyshell.on('message', function (message) {
            new_plate = message;
            resolve(message);
        });
        pyshell.end(function (err, code, signal) {
            if (err) {
                reject(err);
            }
        });
    });
}


module.exports = router;
