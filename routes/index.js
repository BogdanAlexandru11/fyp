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
var ExifImage = require('exif').ExifImage;




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
        connection.query('SELECT * FROM car_data WHERE id > 340 ORDER BY id DESC', function (error, results, fields) {
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
                    gps_coord: 'N/A',
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
                        gps_coord: 'N/A',
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
                        gps_coord: 'N/A',
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
                connection.query('SELECT * FROM car_data where car_reg=? ORDER BY id DESC', [car_data.car_reg], function (error, results, fields) {
                    var destination="";
                    if (localEnv==='true'){
                         destination ='/home/alexander11/fyp/public/images/' + results[0].id + '.jpg';
                    }
                    else{
                        destination='/opt/live/my-first-app/public/images/'+ results[0].id + '.jpg';
                        // url:  'http://127.0.0.1:8355/img/'+req.body.best_uuid+'.jpg'

                    }
                    wget({
                            url:  'http://127.0.0.1:8355/img/'+req.body.best_uuid+'.jpg',
                            dest: destination,
                            timeout: 2000
                        },
                        function (error, response, body) {


                            var goog = getGPSCOORD('320.JPG').then(function (resOBJ) {
                                console.log(resOBJ);
                            });

                        // console.log(destination);
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


router.post('/ALPRDAEMONTEST', function (req, res, next) {
    res.end();
    log("ALP /");
});


function getGPSCOORD(carID){
    return new Promise((resolve, reject) => {
        var gpsDATA={
            gpsCOORD : '',
            accurateTime: ''
        };
        try {
            new ExifImage({ image : 'public/images/'+carID }, function (error, exifData) {
                if (error)
                    console.log('Error: '+error.message);
                else{
                    indices = (c, s) => s
                        .split('')
                        .reduce((a, e, i) => e === c ? a.concat(i) : a, []);

                    // var fullGPSCOORD="";
                    var exactDate=exifData.exif.CreateDate;
                    var gps=exifData.gps;
                    var GPSLat=String(gps.GPSLatitude);
                    var GPSLon=String(gps.GPSLongitude);
                    var indicesGPSLat=indices(',', String(GPSLat));
                    var indicesGPSLon=indices(',', GPSLon);

                    indices = (c, s) => s
                        .split('')
                        .reduce((a, e, i) => e === c ? a.concat(i) : a, []);

                    //getting the GPS lat coord
                    GPSLat=GPSLat.replaceAt(indicesGPSLat[0],"°");
                    GPSLat=GPSLat.replaceAt(indicesGPSLat[1],"'");
                    GPSLat=GPSLat.substr(0,GPSLat.indexOf('.')+3);
                    GPSLat=GPSLat + ' ' + gps.GPSLatitudeRef;

                    //getting the GPS lon coord
                    GPSLon=GPSLon.replaceAt(indicesGPSLon[0],"°");
                    GPSLon=GPSLon.replaceAt(indicesGPSLon[1],"'");
                    GPSLon=GPSLon.substr(0,GPSLon.indexOf('.')+3);
                    GPSLon=GPSLon + ' ' + gps.GPSLongitudeRef;

                    var fullGPSCOORD=GPSLat+ ' ' +GPSLon;
                    gpsDATA.gpsCOORD=fullGPSCOORD;
                    gpsDATA.accurateTime=exactDate;
                    // console.log(exactDate);
                    // console.log(fullGPSCOORD);
                    resolve(gpsDATA);
                }

            });
        } catch (error) {
            reject(error.message);
            console.log('Error: ' + error.message);
        }

    });
}



String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
};


module.exports = router;
