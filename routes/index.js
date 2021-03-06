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



//connection the the mysql
//credentials are being stored in a .env file
var connection = mysql.createConnection({
    host: process.env.dbhost,
    user: process.env.dbuser,
    password: process.env.dbpw,
    database: process.env.dbdb
});
//npm package used to send the email
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.emailuser,
        pass: process.env.emailpw
    }
});

// the '/' route represents the "http://46.101.52.245:3000", and it uses cookies to keep the user logged in
router.get('/', function (req, res, next) {
    //if the uses is logged in i.e if the user inserted the right password, redirect them to the index page
    if(req.session.user){
        //prints only the cars which have an id greater than 340, for the homepage not to be too long
        connection.query('SELECT * FROM car_data WHERE id > 340 ORDER BY id DESC', function (error, results, fields) {
            log("GET /");
            res.render('index', {car_data: results});
        });
    }
        //otherwise the user is not logged in, therefore they will be redirected to the homepage of the application
    else{
        res.render('homepage');
    }
});

router.post('/', function (req, res, next) {
    res.end();
    log("POST /");
});

//handles the login on the application
router.post('/login', function (req, res, next) {
    if(req.body.inputText===process.env.websitepw){
        log("USER LOGGED IN");
        req.session.user='true';
        //the cookie expires in 30 minutes
        req.session.cookie.expires = new Date(Date.now() + hour);
        req.session.cookie.maxAge = hour;
        res.redirect('/');
    }
    else{
        res.redirect('/');
    }
});
//user logs out therefore the cookie will became null
router.post('/logout', function (req, res, next) {
    log("USER LOGGED OUT");
    req.session.user = null;
    res.redirect('/');
});

//the post request received from OpenALPR
router.post('/alprPOST', function (req, res, next) {
    //using res.end(), so the response ends
    res.end();
    if((req._parsedUrl.query==="postedFromOpenAlprfyp2018")){
        //the endpoint is /postedFromOpenAlprfyp2018 therefore it will enter in this if statemtn
        //the reg plate is being stripped to be verify whether it is an irish reg plate
        var regex =/\d{1,3}(KK|kk|ww|WW|c|C|ce|CE|cn|CN|cw|CW|d|D|dl|DL|g|G|ke|KE|ky|KY|l|L|ld|LD|lh|LH|lk|LK|lm|LM|ls|LS|mh|MH|mn|MN|mo|MO|oy|OY|so|SO|rn|RN|tn|TN|ts|TS|w|W|wd|WD|wh|WH|wx|WX)\d{1,6}/;

        if (req.body.agent_type==='alprd' || req.body.debug==='fyp_true') {
            //the following code block is being used for local development, i.e the drone doesnt have to be on in order to work on the code
            if (localEnv==='true'){
                //the post requests sent by POSTMAN
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
                //post requests done by POSTMAN but on the server
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
                    //the live data being received from the drone
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

            //the following functions handle the python script workflow
            //the following JS blocks were converted into syncronous code
            function firstFunction() {
                return new Promise(resolve => {
                    //the reg plate received is checked to verify whether it is in the valid permits database
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
                        //the script is being called on the local environment
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
                            //the script is being called on the server i.e used by the drone
                            let pyshell = new PythonShell('/opt/live/my-first-app/checkNct.py', {pythonPath: '/usr/bin/python'});
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
                                //the resulting NCT expiry date will be stored in the "message" variable
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
                //this function waits for the "firstfunction" to finish and send the data before it is being ran
                var result = await firstFunction();
                connection.query('INSERT INTO car_data (car_reg, date, valid_permit, gps_coord, nct, car_make, car_body, car_colour) VALUES (?,?,?,?,?,?,?,?)', [car_data.car_reg, car_data.date, car_data.valid_permit, car_data.gps_coord, car_data.nct, req.body.vehicle.make_model[0].name, req.body.vehicle.body_type[0].name, req.body.vehicle.color[0].name], function (err, result) {
                    //data being inserted into the database
                    if (err)
                        console.log(err);
                    console.log(car_data);
                    return ("car_data inserted into the db");
                });
            }

            async function secondFunction() {
                var result = await thirdFunction();
                //function that handles the emails being sent and the GPS coordinates
                connection.query('SELECT * FROM car_data where date=?', [car_data.date], function (errorrr, results, fields) {
                    console.log(results[0]);
                    //the id will be results[0].id;
                    console.log("car id is " +results[0].id);
                    //as the gps coordinates functionality wasn't finished, I hardcoded them
                    const carId=results[0].id;
                    const latitude="53.34888941592108";
                    const longitude="-7.0455235477066065";
                    const altitude="11.1";
                    const gpsCOORDs=latitude.substr(0,10) + " " + longitude.substr(0,10);


                    connection.query('update car_data set gps_coord = ?, altitude =? where id=?;',[gpsCOORDs,altitude,carId], function (errorrr, results, fields) {
                        //the data is being updated into the database based on the id of the plate recognition
                        console.log("errror here " + errorrr);
                        log("gps coord were updated");
                    });

                    


                    // connection.query('SELECT * FROM drone_telemetry', function (error, results, fields) {
                    //     for(var i =0;i<results.length;i++){
                    //         // log(results[i].timestamp);
                    //         var droneTelemetryDate=moment(results[i].timestamp,"MMMM Do YYYY, h:mm:s a");
                    //         //where mydate is the date when the car was detected
                    //         if(mydate.diff(droneTelemetryDate, "seconds")<5){
                    //             // set here the x and y co ords
                    //             const altitude=results[i].altitude;
                    //             const gpsCOORDs=results[i].latitude.substr(0,5) + " " + results[i].longitude.substr(0,5);
                    //             connection.query('UPDATE car_data set gps_coord=?, where id=?', [gpsCOORDs,carId], function (errorrr, results, fields) {
                    //                 log("gps coord were updated");
                    //             });
                
                    //         }
                    //     }
                    // });

                }); 

                //the images are being downloaded from the openalpr agent
                //and they're being stored in the /my-first-app/public/images./
                //they're being stored having the name the id of the recognition

                connection.query('SELECT * FROM car_data where car_reg=? ORDER BY id DESC', [car_data.car_reg], function (errorrr, results, fields) {
                    if(errorrr)
                        console.log(errorrr);
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
                    );
                });
                //if the car doesnt have a valid parking permit
                //an email is being sent to the admin
                if (car_data.valid_permit === 'false') {
                    log("email sent");
                    var mailOptions = {
                        //TODO add more information to the email, even the picture
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

//the GPS data received from the Android Application created
router.post('/GPSDATA', function (req, res, next) {
    res.end();
    log(req.body);
    const timestamp=moment().format('MMMM Do YYYY, h:mm:ss a');
    if(req.body.latitude && req.body.longitude && req.body.altitude){
        connection.query('INSERT INTO drone_telemetry (latitude, longitude, altitude, timestamp) VALUES (?,?,?,?)', [req.body.latitude, req.body.longitude, req.body.altitude, timestamp], function (err, result) {
            if (err) {
                console.log(err);
            }
            else{
                log("data inserted");
            }
        });
    }
});


//obsolete code for getting the gps data from exif

// function getGPSCOORD(carID){
//     return new Promise((resolve, reject) => {
//         var gpsDATA={
//             gpsCOORD : '',
//             accurateTime: ''
//         };
//         try {
//             new ExifImage({ image : 'public/images/'+carID }, function (error, exifData) {
//                 if (error)
//                     console.log('Error: '+error.message);
//                 else{
//                     indices = (c, s) => s
//                         .split('')
//                         .reduce((a, e, i) => e === c ? a.concat(i) : a, []);

//                     // var fullGPSCOORD="";
//                     var exactDate=exifData.exif.CreateDate;
//                     var gps=exifData.gps;
//                     var GPSLat=String(gps.GPSLatitude);
//                     var GPSLon=String(gps.GPSLongitude);
//                     var indicesGPSLat=indices(',', String(GPSLat));
//                     var indicesGPSLon=indices(',', GPSLon);

//                     indices = (c, s) => s
//                         .split('')
//                         .reduce((a, e, i) => e === c ? a.concat(i) : a, []);

//                     //getting the GPS lat coord
//                     GPSLat=GPSLat.replaceAt(indicesGPSLat[0],"°");
//                     GPSLat=GPSLat.replaceAt(indicesGPSLat[1],"'");
//                     GPSLat=GPSLat.substr(0,GPSLat.indexOf('.')+3);
//                     GPSLat=GPSLat + '" ' + gps.GPSLatitudeRef;

//                     //getting the GPS lon coord
//                     GPSLon=GPSLon.replaceAt(indicesGPSLon[0],"°");
//                     GPSLon=GPSLon.replaceAt(indicesGPSLon[1],"'");
//                     GPSLon=GPSLon.substr(0,GPSLon.indexOf('.')+3);
//                     GPSLon=GPSLon + '" ' + gps.GPSLongitudeRef;

//                     var fullGPSCOORD=GPSLat+ ' ' +GPSLon;
//                     gpsDATA.gpsCOORD=fullGPSCOORD;
//                     gpsDATA.accurateTime=exactDate;
//                     // console.log(exactDate);
//                     // console.log(fullGPSCOORD);
//                     resolve(gpsDATA);
//                 }

//             });
//         } catch (error) {
//             reject(error.message);
//             console.log('Error: ' + error.message);
//         }

//     });
// }


//function to replace the character at a given index in a string
String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
};

// router.post('/test', function (req, res, next) {
//     //December 9th 2018, 4:01:49 pm
//     // const mydate=moment('December 9th 2018, 4:01:49 pm').format();

//     // var date = moment("December 9th 2018, 4:01:49 pm","MMMM Do YYYY, h:mm:s a");   
//     var mydate=car_data.date;
//     //there will be a moment which is now ...and that one needs to be searched in the table drone_telemetry
   
//     connection.query('SELECT * FROM drone_telemetry', function (error, results, fields) {
//         for(var i =0;i<results.length;i++){
//             // log(results[i].timestamp);
//             var droneTelemetryDate=moment(results[i].timestamp,"MMMM Do YYYY, h:mm:s a");
//             //where mydate is the date when the car was detected
//             if(mydate.diff(droneTelemetryDate, "seconds")<5){
//                 // set here the x and y co ords
//                 const altitude=results[i].altitude;
//                 const gpsCOORDs=results[i].latitude.substr(0,5) + " " + results[i].longitude.substr(0,5);
//                 connection.query('UPDATE car_data set gps_coord=?, where id=?', [gpsCOORDs,results[0].id], function (errorrr, results, fields) {
//                     log("gps coord were updated");
//                 });

//             }
//         }
//     });
//     res.end();
// });

//handles the return to home on the 404 page
router.post('/home', function (req, res, next) {
    if(req.session.user === null){
        res.render('/homepage');
    }
    else{
        res.redirect('/');
    }
});




module.exports = router;
