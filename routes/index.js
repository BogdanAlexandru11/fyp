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
debug('booting %s', name);
require('dotenv').config()


var localEnv=process.env.LOCALENV;



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
        res.render('index', {car_data: results});
    });
});

router.post('/', function (req, res, next) {
    console.log("REQFROMOPENALPR");
    console.log(req);
    console.log("REQFROMOPENALPR")
    
    log("i got in the post req");
    // var regex = /\d{2,3}[(CW)]\d{1,6}/;
    var regex =/\d{1,3}(KK|kk|ww|WW|c|C|ce|CE|cn|CN|cw|CW|d|D|dl|DL|g|G|ke|KE|ky|KY|l|L|ld|LD|lh|LH|lk|LK|lm|LM|ls|LS|mh|MH|mn|MN|mo|MO|oy|OY|so|SO|rn|RN|tn|TN|ts|TS|w|W|wd|WD|wh|WH|wx|WX)\d{1,6}/;
    //change this to the sender lol
    if (true) {
        log("true statement");

        res.end();

        if (localEnv==='true'){
            var car_data = {
                // car_reg: req.body.best_plate.plate,
                car_reg: '12cw1484',
                date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                x_coord: 'N/A',
                y_coord: 'N/A',
                valid_permit: 'false',
                nct: ''
            };
        }
        else{
            var car_data = {
                car_reg: '07D78411',
                date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                x_coord: 'N/A',
                y_coord: 'N/A',
                valid_permit: 'false',
                nct: ''
            };
        }

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
                log(car_data.car_reg.toUpperCase());
                if (car_data.car_reg.toUpperCase().match(regex)) {
                    log("car data matches regex");

                    //TODO fix this, timing + too many connections, maybe create a pool?
                    console.log("matches regex");
                    console.log("i got in promise");

                    if(localEnv==='true'){
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
                    else{
                        let pyshell = new PythonShell('/opt/live/my-first-app/checkNct.py', {pythonPath: '/usr/bin/python'});
                        pyshell.send(car_data.car_reg);
                        log("just sent the plate to the script");
                        pyshell.on('message', function (message) {

                            // console.log("message " + message);
                            car_data.nct = message;
                            log("got data from the script " + message);
                            resolve(message);
                        });
                    }
                }
                else{
                    car_data.nct='Not applicable';
                    resolve('message');
                }
            });
        }


        async function asyncCall() {
            log("async call func");
            var result = await resolveAfter2Seconds();
            log("just after async call");
            log("result after async " +result);
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
    }
});



module.exports = router;
