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
const slowDown = require("express-slow-down");
var lastRequestTime=new Date();
var timeDelay=2000;
const postRequestsToNCT = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 1, // allow 5 requests to go at full-speed, then...
    delayMs: 1000 // 6th request has a 100ms delay, 7th has a 200ms delay, 8th gets 300ms, etc.
});
let hour = 3600000;






router.use(session({secret: 'alex_fyp_2018', resave: false, saveUninitialized: true,}));

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
        user: 'alex.fyp2018@gmail.com',
        pass: 'Password123!@#'
    }
});


router.get('/', function (req, res, next) {
    if(req.session.user){
        connection.query('SELECT * FROM car_data ORDER BY id DESC', function (error, results, fields) {
            console.log(req.session);
            res.render('index', {car_data: results});
        });
    }
    else{
        res.render('homepage');
    }
});

router.post('/', function (req, res, next) {
    res.end();
    log("res just ended");
    // var regex = /\d{2,3}[(CW)]\d{1,6}/;
    var regex =/\d{1,3}(KK|kk|ww|WW|c|C|ce|CE|cn|CN|cw|CW|d|D|dl|DL|g|G|ke|KE|ky|KY|l|L|ld|LD|lh|LH|lk|LK|lm|LM|ls|LS|mh|MH|mn|MN|mo|MO|oy|OY|so|SO|rn|RN|tn|TN|ts|TS|w|W|wd|WD|wh|WH|wx|WX)\d{1,6}/;
    //change this to the sender lol
    if (req.body.agent_type==='alprd' || req.body.debug==='fyp_true') {
        log("alpr and debug mode true");

        res.end();
        if (localEnv==='true'){
            log("local env true");
            var car_data = {
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
                log("debug mode on");
                var car_data = {
                    car_reg: '07D78411',
                    date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                    x_coord: 'N/A',
                    y_coord: 'N/A',
                    valid_permit: 'false',
                    nct: ''
                };
            }
            else{
                log(" live feed from the drone ");
                var car_data = {
                    car_reg: req.body.best_plate.plate,
                    date: moment().format('MMMM Do YYYY, h:mm:ss a'),
                    x_coord: 'N/A',
                    y_coord: 'N/A',
                    valid_permit: 'false',
                    nct: ''
                };
            }
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
                    var thisRequestTime=new Date();
                    if(localEnv==='true'){
                        let pyshell = new PythonShell('../fyp/checkNct.py', {pythonPath: '/usr/bin/python'});
                        /////////////////////////////////////
                        if(thisRequestTime.getTime() - lastRequestTime.getTime() > 20000){
                            log("delay in first if " + timeDelay);
                            timeDelay=2000;
                        }
                        if(thisRequestTime.getTime() - lastRequestTime.getTime() > 2000){
                            log("delay in second if " + timeDelay);
                            lastRequestTime=new Date();
                            pyshell.send(car_data.car_reg);
                        }
                        else{
                            timeDelay=timeDelay+2000;
                            log("delay in else " + timeDelay);
                            setTimeout(function () {
                                pyshell.send(car_data.car_reg);
                                lastRequestTime=new Date();
                            }, timeDelay);
                        }
                        log("just sent the plate to the script");
                        pyshell.on('message', function (message) {
                            // console.log("message " + message);
                            car_data.nct = message;
                            resolve(message);
                        });
                        ///////
                    }
                    else{
                        let pyshell = new PythonShell('/opt/live/my-first-app/checkNct.py', {pythonPath: '/usr/bin/python'});
                        if(thisRequestTime.getTime() - lastRequestTime.getTime() > 20000){
                            log("delay in first if " + timeDelay);
                            timeDelay=2000;
                        }
                        if(thisRequestTime.getTime() - lastRequestTime.getTime() > 2000){
                            log("delay in second if " + timeDelay);
                            lastRequestTime=new Date();
                            pyshell.send(car_data.car_reg);
                        }
                        else{
                            timeDelay=timeDelay+2000;
                            log("delay in else " + timeDelay);
                            setTimeout(function () {
                                pyshell.send(car_data.car_reg);
                                lastRequestTime=new Date();
                            }, timeDelay);
                        }
                        log("just sent the plate to the script");
                        pyshell.on('message', function (message) {
                            // console.log("message " + message);
                            car_data.nct = message;
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

router.post('/login', function (req, res, next) {
    if(req.body.inputText==='fyp2018'){
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
    req.session.user = null;
    res.redirect('/');
});

//
// router.post('/caspertest', function (req, res, next) {
//     // const phantom = require('phantom');
//     // (async function() {
//     //     const instance = await phantom.create();
//     //     const page = await instance.createPage();
//     //     await page.on('onResourceRequested', function(requestData) {
//     //         // console.info('Requesting', requestData.url);
//     //     });
//     //
//     //     const status = await page.open('https://www.ncts.ie/1263');
//     //     const content = await page.property('content');
//     //         page.evaluate(function() {
//     //             document.getElementById('CloseCookie').click();
//     //             console.log("done");
//     //             document.getElementsByName("RegistrationID").value="12CW1484";
//     //             console.log(document.querySelectorAll(".btn"));
//     //
//     //
//     //         });
//     //     // console.log(content);
//     //
//     //     var promise = page.close();
//     //     promise.then(function (done) {
//     //         instance.exit();
//     //
//     //     });
//     // })();
//     // res.end();
//     //
//     try {
//         var Spooky = require('spooky');
//     } catch (e) {
//         // var Spooky = require('../lib/spooky');
//     }
//
//     var spooky = new Spooky({
//         child: {
//             transport: 'http'
//         },
//         casper: {
//             logLevel: 'debug',
//             verbose: true
//         }
//     }, function (err) {
//         if (err) {
//             e = new Error('Failed to initialize SpookyJS');
//             e.details = err;
//             throw e;
//         }
//
//         spooky.start(
//             'http://en.wikipedia.org/wiki/Spooky_the_Tuff_Little_Ghost');
//         spooky.then(function () {
//             this.emit('hello', 'Hello, from ' + this.evaluate(function () {
//                 return document.title;
//             }));
//         });
//         spooky.run();
//     });
//
//     spooky.on('error', function (e, stack) {
//         console.error(e);
//
//         if (stack) {
//             console.log(stack);
//         }
//     });
//
//     /*
//     // Uncomment this block to see all of the things Casper has to say.
//     // There are a lot.
//     // He has opinions.
//     spooky.on('console', function (line) {
//         console.log(line);
//     });
//     */
//
//     spooky.on('hello', function (greeting) {
//         console.log(greeting);
//     });
//
//     spooky.on('log', function (log) {
//         if (log.space === 'remote') {
//             console.log(log.message.replace(/ \- .*/, ''));
//         }
//     });
//     //
//     // // text = raw_input()
//     // if __name__ == "__main__":
//     // options = Options()
//     // options.add_argument('-headless')
//     // driver = Firefox(executable_path='geckodriver', firefox_options=options)
//     // try:
//     // driver.get('https://www.ncts.ie/1263')
//     // driver.find_element_by_xpath("//button[@id='CloseCookie']").click()
//     // driver.refresh()
//     // nctInput=driver.find_element_by_xpath("//input[@name='RegistrationID']")
//     // nctInput.clear()
//     // nctInput.send_keys(text+ Keys.ENTER )
//     // WebDriverWait(driver, 10).until(expected.presence_of_element_located((By.ID, "confirmVehicleYes")))
//     // driver.find_element_by_xpath("//input[@id='confirmVehicleYes']").send_keys(Keys.ENTER)
//     // WebDriverWait(driver, 10).until(expected.presence_of_element_located((By.ID, "tab3")))
//     // print (driver.find_element_by_xpath('//*[@id="tab3"]/form[1]/div[2]/div[1]/div[1]/table/tbody/tr[1]/td').text)
//     // except TimeoutException as ex:
//     // print 'script_crashed'
//     // isrunning = 0
//     // driver.quit()
//     // driver.quit()
//
//
// });
//
// function click(el){
//     var ev = document.createEvent("MouseEvent");
//     ev.initMouseEvent(
//         "click",
//         true /* bubble */, true /* cancelable */,
//         window, null,
//         0, 0, 0, 0, /* coordinates */
//         false, false, false, false, /* modifier keys */
//         0 /*left*/, null
//     );
//     el.dispatchEvent(ev);
// }
//
//


module.exports = router;
