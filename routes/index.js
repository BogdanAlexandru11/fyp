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
var session = require('express-session');
var lastRequestTime=new Date();
var timeDelay=1000;
let hour = 3600000;
router.use(session({secret: 'alex_fyp_2018', resave: false, saveUninitialized: true,}));
var wget = require('node-wget');
var localEnv=process.env.LOCALENV;



var connection = mysql.createConnection({
    host: process.env.dbhost,
    user: process.env.dbuser,
    password: process.env.dbpw,
    database: process.env.dbdb
});
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.emailuser,
        pass: process.env.emailpw
    }
});


router.get('/', function (req, res, next) {
    if(req.session.user){
        connection.query('SELECT * FROM car_data ORDER BY id DESC', function (error, results, fields) {
            log("GET /");
            res.render('index', {car_data: results});
        });
    }
    else{
        res.render('homepage');
    }
});

router.post('/', function (req, res, next) {
    res.end();
    log("POST /");
});

router.post('/login', function (req, res, next) {
    if(req.body.inputText===process.env.websitepw){
        log("USER LOGGED IN");
        req.session.user='true';
        req.session.cookie.expires = new Date(Date.now() + hour);
        req.session.cookie.maxAge = hour;
        res.redirect('/');
    }
    else{
        res.redirect('/');
    }
});

router.post('/logout', function (req, res, next) {
    log("USER LOGGED OUT");
    req.session.user = null;
    res.redirect('/');
});


router.post('/alprPOST', function (req, res, next) {
    res.end();
    if((req._parsedUrl.query==="postedFromOpenAlprfyp2018")){
        // var regex = /\d{2,3}[(CW)]\d{1,6}/;
        var regex =/\d{1,3}(KK|kk|ww|WW|c|C|ce|CE|cn|CN|cw|CW|d|D|dl|DL|g|G|ke|KE|ky|KY|l|L|ld|LD|lh|LH|lk|LK|lm|LM|ls|LS|mh|MH|mn|MN|mo|MO|oy|OY|so|SO|rn|RN|tn|TN|ts|TS|w|W|wd|WD|wh|WH|wx|WX)\d{1,6}/;
        //change this to the sender lol
        if (req.body.agent_type==='alprd' || req.body.debug==='fyp_true') {
            if (localEnv==='true'){
                log("POST REQUEST ON LOCALHOST FROM POSTMAN");
                var car_data = {
                    id :'',
                    car_reg: '12cw1484',
                    date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                    x_coord: 'N/A',
                    y_coord: 'N/A',
                    valid_permit: 'false',
                    nct: ''
                };
            }
            else{
                log("local env false");
                if(req.body.debug==='fyp_true'){
                    log("");
                    var car_data = {
                        id :'',
                        car_reg: '07D78411',
                        date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                        x_coord: 'N/A',
                        y_coord: 'N/A',
                        valid_permit: 'false',
                        nct: ''
                    };
                }
                else{
                    log("LIVE FROM DRONE");
                    var car_data = {
                        id :'',
                        car_reg: req.body.best_plate.plate,
                        date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                        x_coord: 'N/A',
                        y_coord: 'N/A',
                        valid_permit: 'false',
                        nct: ''
                    };
                }
            }

            log("POST /alprPOST");
            log("****************");
            log("reg plate "+ car_data.car_reg);
            log("****************");

            function firstFunction() {
                return new Promise(resolve => {
                    connection.query('SELECT * FROM valid_permits', function (error, results, fields) {
                        for (var i = 0; i < results.length; i++) {
                            results[i].car_reg = results[i].car_reg.replace('-', '').toUpperCase();
                            car_data.car_reg = car_data.car_reg.toUpperCase();
                            if (results[i].car_reg === car_data.car_reg) {
                                car_data.valid_permit = 'true';
                                log("car with valid permit");
                            }
                        }
                    });
                    if (car_data.car_reg.toUpperCase().match(regex)) {
                        var thisRequestTime=new Date();

                        if(localEnv==='true'){
                            //localhost testing
                            let pyshell = new PythonShell('../fyp/checkNct.py', {pythonPath: '/usr/bin/python'});
                            if(thisRequestTime.getTime() - lastRequestTime.getTime() > 20000){
                                timeDelay=1000;
                            }
                            if(thisRequestTime.getTime() - lastRequestTime.getTime() > 2000){
                                lastRequestTime=new Date();
                                pyshell.send(car_data.car_reg);
                            }
                            else{
                                timeDelay=timeDelay+1000;
                                setTimeout(function () {
                                    pyshell.send(car_data.car_reg);
                                    lastRequestTime=new Date();
                                }, timeDelay);
                            }
                            log("plate sent to the script");
                            pyshell.on('message', function (message) {
                                // console.log("message " + message);
                                car_data.nct = message;
                                resolve(message);
                            });

                        }
                        else{
                            let pyshell = new PythonShell('/opt/live/my-first-app/checkNct.py', {pythonPath: '/usr/bin/python'});
                            //the script that is being called on the droplet
                            if(thisRequestTime.getTime() - lastRequestTime.getTime() > 20000){
                                timeDelay=1000;
                            }
                            if(thisRequestTime.getTime() - lastRequestTime.getTime() > 2000){
                                lastRequestTime=new Date();
                                pyshell.send(car_data.car_reg);
                            }
                            else{
                                timeDelay=timeDelay+1000;
                                setTimeout(function () {
                                    pyshell.send(car_data.car_reg);
                                    lastRequestTime=new Date();
                                }, timeDelay);
                            }
                            log("plate sent to the script");
                            pyshell.on('message', function (message) {
                                car_data.nct = message;
                                resolve(message);
                            });
                        }
                    }
                    else{
                        car_data.nct='Non irish reg plate';
                        resolve('message');
                    }
                });
            }
            async function thirdFunction(){
                var result = await firstFunction();
                connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord, nct) VALUES (?,?,?,?,?,?)', [car_data.car_reg, car_data.date, car_data.valid_permit, car_data.x_coord, car_data.y_coord, car_data.nct], function (err, result) {
                    console.log(car_data);
                    return ("car_data inserted into the db");
                });
            }

            async function secondFunction() {
                var result = await thirdFunction();
                connection.query('SELECT * FROM car_data where car_reg=? ORDER BY id DESC', ['12cw1484'], function (error, results, fields) {
                    var destination="";
                    if (localEnv==='true'){
                         destination ='/home/alexander11/fyp/public/images/' + results[0].id + '.jpg';
                    }
                    else{
                        destination='/opt/live/my-first-app/public/images/'+ results[0].id + '.jpg';

                    }
                    wget({
                            url:  'http://46.101.52.245:8355/img/'+req.body.best_uuid+'.jpg',
                            dest: destination,
                            timeout: 2000
                        },
                        function (error, response, body) {
                        console.log(destination);
                            if (error) {
                                console.log('--- error:');
                                console.log(error);            // error encountered
                            }
                        }
                    );
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
                        {
                            log("error sending the email");
                            log(mailerr);

                        }
                    });
                }
            }
            secondFunction();
        }
    }
    res.end();
});


//wget http://46.101.52.245:8355/img/R7WXYRYRFTH4449QCE2C4LIWSJ9A2CJAKG7YN552-1661429995-1541098974891.jpg




module.exports = router;
