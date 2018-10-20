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


router.get('/', function (req, res, next) {
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
    var regex=/\d{2,3}[a-zA-Z]{1,2}\d{1,6}/;

    //change this to the sender lol
    if (req.headers.host === '46.101.52.245:3000') {
        var car_data={
            car_reg : req.body.best_plate.plate,
            date : moment().format('MMMM Do YYYY, h:mm:ss a'),
            x_coord: '"N/A"',
            y_coord : '"N/A"',
            valid_permit : 'false',
            nct : ''
        };
        // var valid_permit = "false";

            // var checkValidPermits = new Promise((resolve, reject) => {
            //     connection.query('SELECT * FROM valid_permits', function (error, results, fields) {
            //         var valid_permit = "false";
            //         for (var i = 0; i < results.length; i++) {
            //             if (results[i].car_reg === car_reg) {
            //                 valid_permit = "true";
            //             }
            //         }
            //         if (valid_permit === "true") {
            //             resolve(valid_permit);
            //         }
            //         else {
            //             reject(valid_permit);
            //         }
            //     });
            // });

            // checkValidPermits.then(function (found) {
            //
            // }).then(function (notfound) {
            //
            // }).then(function(done){
            //
            //     var insertIntoDB = new Promise((resolve, reject) => {
            //         connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord) VALUES (?,?,?,?,?)', [car_reg, date, valid_permit, x_coord, y_coord], function (err, result) {
            //             if (err) {
            //                 reject(err);
            //             }
            //             else{
            //
            //                 var mailOptions = {
            //                     from: 'alex.fyp2018@gmail.com', // sender address
            //                     to: 'abcbogdan11@gmail.com', // list of receivers
            //                     subject: 'Car park updates', // Subject line
            //                     html: 'Car withe the reg ' + car_reg + ' was found in the car park at ' + date + ' without a valid parking permit' // plain text body
            //                 };
            //
            //                 transporter.sendMail(mailOptions, function (mailerr, info) {
            //                     if (mailerr)
            //                         console.log(mailerr);
            //                 });
            //
            //                 resolve("sucess");
            //             }
            //         });
            //     });
            // });


        // const promise = doSomething();
        // const promise2 = doSomething().then(successCallback, failureCallback);

        new Promise(function(resolve, reject) {
            connection.query('SELECT * FROM valid_permits', function (error, results, fields) {
                for (var i = 0; i < results.length; i++) {
                    if (results[i].car_reg === car_data.car_reg) {
                        car_data.valid_permit='true';
                    }
                }
            });
            resolve(1); // (*)

        }).then(function(result) { // (**)
            //new result is valid permit
            if(car_data.car_reg.match(regex)){
                var nctDataPromise=getNctData(car_data.car_reg);
                nctDataPromise.then(function (nct){
                    car_data.nct=nct;
                });
            }
            console.log(result); // 1
            return 2;

        }).then(function(result) { // (***)
            connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord, nct) VALUES (?,?,?,?,?,?)', [car_data.car_reg, car_data.date, car_data.valid_permit, car_data.x_coord, car_data.y_coord, car_data.nct], function (err, result) {});

            if(car_data.valid_permit==='false'){
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

            console.log('Got the final result: ' + finalResult);
            console.log(result); // 2
            return 3;

        }).then(function(result) {
            res.end();
            console.log(result); // 4
            return 4;
        });

        // doSomething().then(function (result) {
        //     connection.query('SELECT * FROM valid_permits', function (error, results, fields) {
        //         for (var i = 0; i < results.length; i++) {
        //             if (results[i].car_reg === car_data.car_reg) {
        //                 car_data.valid_permit='true';
        //             }
        //         }
        //     });
        //     return doSomethingElse(valid_permit);
        //     })
        //     .then(function (newResult) {
        //         //new result is valid permit
        //         if(car_data.car_reg.match(regex)){
        //             var nctDataPromise=getNctData(car_data.car_reg);
        //             nctDataPromise.then(function (nct){
        //                 car_data.nct=nct;
        //             });
        //         }
        //         return doThirdThing(newResult);
        //     })
        //     .then(function (finalResult) {
        //
        //         connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord, nct) VALUES (?,?,?,?,?,?)', [car_data.car_reg, car_data.date, car_data.valid_permit, car_data.x_coord, car_data.y_coord, car_data.nct], function (err, result) {});
        //
        //         if(car_data.valid_permit==='false'){
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
        //         res.end();
        //         console.log('Got the final result: ' + finalResult);
        //     })
        //     .catch(failureCallback);


            // connection.query('SELECT * FROM car_data ORDER BY id DESC', function (error, car_results, fields) {
            //     // res.render('index', {car_data: car_results});
            // });

    }

    else {
        connection.query('SELECT * FROM car_data ORDER BY id DESC', function (error, car_results, fields) {
            // res.render('index', {car_data: car_results});
            res.end();

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
    return NctPromise = new Promise((resolve, reject) => {
        let pyshell = new PythonShell('../fyp/checkNct.py', {pythonPath: '/usr/bin/python'});
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
