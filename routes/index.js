var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var moment= require('moment');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'fyp_user',
    password : 'fyp_password@my123!',
    database : 'fyp'
});

/* GET home page. */
router.get('/', function(req, res, next) {
    connection.query('SELECT * FROM car_data ORDER BY date DESC', function (error, results, fields) {
        if(error){
            console.log(error);
        }
        //check here if the car is in the database, if it's not, send an email stating that it is not in the database
        res.render('index', { car_data : results });
    });
});

router.post('/', function(req, res, next) {
    // console.log("REQREQREQREQREQREQREQREQREQREQREQREQ");
    // console.log(req);
    // console.log("REQREQREQREQREQREQREQREQREQREQREQREQ");
    //
    // console.log("RESRESRESRESRESRESRESRESRESRESRESRES");
    // console.log(res);
    // console.log("RESRESRESRESRESRESRESRESRESRESRESRES");
    // insert data here

    //check if the request is coming in from openalpr then

    let val1="openalpr";
    if(val1==="openalpr2"){
        // car_reg varchar(255),
        //     date varchar(255),
        //     valid_permit varchar(255),
        //     x_coord varchar(255),
        //     y_coord varchar(255),

    let car_reg="car_reg1"; // get it from the post req
    let date=moment().format('MMMM Do YYYY, h:mm:ss a');
    let valid_permid=false;

    let x_coord="N/A";
    let y_coord="N/A";

    //     connection.query('INSERT INTO car_data (car_reg, date, valid_permit, x_coord, y_coord) VALUES (?,?,?,?,?)', [car_reg,date,valid_permit,x_coord,y_coord], function (err, result) {
    //      res.redirect('/');
    // });

        console.log(car_reg);
        console.log(date);
        console.log(valid_permid);
        console.log(x_coord);
        console.log(y_coord);
    }



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
