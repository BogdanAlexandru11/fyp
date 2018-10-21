var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var moment = require('moment');
var Promise = require('promise');
var nodemailer = require('nodemailer');
let {PythonShell} = require('python-shell');
var log = require('fancy-log');
const debug = require('debug')('my-namespace')
const name = 'my-app'
debug('booting %s', name)


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


router.get('/', function (req, res, next) {
    log.info();
    connection.query('SELECT * FROM car_data ORDER BY id DESC', function (error, results, fields) {

        // new Promise(function(resolve, reject) {
        //
        //     resolve(1); // (*)
        //
        // }).then(function(result) { // (**)
        //
        //     console.log(result); // 1
        //     return 2;
        //
        // }).then(function(result) { // (***)
        //
        //     console.log(result); // 2
        //     return 3;
        //
        // }).then(function(result) {
        //
        //     console.log(result); // 4
        //     return 4;
        // });


        res.render('index', {car_data: results});


    });
});

router.post('/', function (req, res, next) {
    log("i got in the post req");


    var regex = /\d{2,3}[a-zA-Z]{1,2}\d{1,6}/;

    //change this to the sender lol
    if (true) {
        log("true statement");

        res.end();
        var car_data = {
            // car_reg: req.body.best_plate.plate,
            car_reg: '12cw1484',
            date: moment().format('MMMM Do YYYY, h:mm:ss a'),
            x_coord: '"N/A"',
            y_coord: '"N/A"',
            valid_permit: 'false',
            nct: ''
        };


        function resolveAfter2Seconds() {
            log("resolve after 2 sec promise");

            return new Promise(resolve => {
                log("resolve after 2 sec promise - inside promise");


                connection.query('SELECT * FROM valid_permits', function (error, results, fields) {
                    log("cquery select * from val perm");
                    for (var i = 0; i < results.length; i++) {
                        results[i].car_reg = results[i].car_reg.replace('-', '').toUpperCase();
                        car_data.car_reg = car_data.car_reg.toUpperCase();
                        if (results[i].car_reg === car_data.car_reg) {
                            car_data.valid_permit = 'true';
                            log("found car with valid permit");
                        }
                    }
                });
                if (car_data.car_reg.match(regex)) {
                    log("car data matches regex");

                    //TODO fix this, timing + too many connections, maybe create a pool?
                    console.log("matches regex");
                    console.log("i got in promise");
                    let pyshell = new PythonShell('../fyp/checkNct.py', {pythonPath: '/usr/bin/python'});
                    pyshell.send(car_data.car_reg);
                    log("just sent the plate to the script");


                    pyshell.on('message', function (message) {

                        // console.log("message " + message);
                        car_data.nct = message;
                        log("got data from the script " + message);

                        resolve(message);
                    });
                }
            });
        }


        async function asyncCall() {
            log("async call func");

            var result = await resolveAfter2Seconds();
            console.log(result);
            connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord, nct) VALUES (?,?,?,?,?,?)', [car_data.car_reg, car_data.date, car_data.valid_permit, car_data.x_coord, car_data.y_coord, car_data.nct], function (err, result) {
                log("inserted data");

                console.log(car_data);
                log("inserted into the db");
            });
            if (car_data.valid_permit === 'false') {
                log("email sent");

                var mailOptions = {
                    from: 'alex.fyp2018@gmail.com', // sender address
                    to: 'abcbogdan11@gmail.com', // list of receivers
                    subject: 'Car park updates', // Subject line
                    html: 'Car withe the reg ' + car_data.car_reg + ' was found in the car park at ' + car_data.date + ' without a valid parking permit' // plain text body
                };
                transporter.sendMail(mailOptions, function (mailerr, info) {
                    if (mailerr)
                        console.log(mailerr);
                });
            }
            console.log("finally")


        }

        asyncCall();

        //
        // async function queryTheData() {
        //     connection.query('SELECT * FROM valid_permits', function (error, results, fields) {
        //         for (var i = 0; i < results.length; i++) {
        //             results[i].car_reg = results[i].car_reg.replace('-', '').toUpperCase();
        //             car_data.car_reg = car_data.car_reg.toUpperCase();
        //             if (results[i].car_reg === car_data.car_reg) {
        //                 car_data.valid_permit = 'true';
        //             }
        //         }
        //     });
        //
        //     if (car_data.car_reg.match(regex)) {
        //         //TODO fix this, timing + too many connections, maybe create a pool?
        //         console.log("matches regex");
        //         console.log("i got in promise");
        //         let pyshell = new PythonShell('../fyp/checkNct.py', {pythonPath: '/usr/bin/python'});
        //         pyshell.send(car_data.car_reg);
        //
        //         pyshell.on('message', function (message) {
        //             // console.log("message " + message);
        //             car_data.nct = message;
        //             return message;
        //         });
        //     }
        // }

        // async function insertTheData() {
        //     await queryTheData();
        //     console.log("i waited ");
        //     setTimeout(function () {
        //         connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord, nct) VALUES (?,?,?,?,?,?)', [car_data.car_reg, car_data.date, car_data.valid_permit, car_data.x_coord, car_data.y_coord, car_data.nct], function (err, result) {
        //             console.log(car_data);
        //             console.log("inserted into the db");
        //         });
        //         if (car_data.valid_permit === 'false') {
        //             var mailOptions = {
        //                 from: 'alex.fyp2018@gmail.com', // sender address
        //                 to: 'abcbogdan11@gmail.com', // list of receivers
        //                 subject: 'Car park updates', // Subject line
        //                 html: 'Car withe the reg ' + car_data.car_reg + ' was found in the car park at ' + car_data.date + ' without a valid parking permit' // plain text body
        //             };
        //             transporter.sendMail(mailOptions, function (mailerr, info) {
        //                 if (mailerr)
        //                     console.log(mailerr);
        //             });
        //         }
        //         console.log("finally")
        //     }, 15000);
        // }
        //
        // insertTheData();
    }
});


function getNctData(plate) {
    console.log("i got in getnct");
    return NctPromise = new Promise((resolve, reject) => {
        console.log("i got in promise");
        let pyshell = new PythonShell('/opt/live/my-first-app/checkNct.py', {pythonPath: '/usr/bin/python'});
        // let pyshell = new PythonShell('../fyp/checkNct.py', {pythonPath: '/usr/bin/python'});
        pyshell.send(plate);
        var new_plate;
        pyshell.on('message', function (message) {
            console.log("message " + message);
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
