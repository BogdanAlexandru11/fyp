var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'fyp_user',
    password : 'fyp_password@my123!',
    database : 'fyp'
});

/* GET home page. */
router.get('/', function(req, res, next) {
    connection.query('SELECT * FROM car_data', function (error, results, fields) {
        //check here if the car is in the database, if it's not, send an email stating that it is not in the database
        res.render('index', { car_data : results });
    });
});

router.post('/', function(req, res, next) {
    console.log("REQREQREQREQREQREQREQREQREQREQREQREQ");
    console.log(req);
    console.log("REQREQREQREQREQREQREQREQREQREQREQREQ");

    console.log("RESRESRESRESRESRESRESRESRESRESRESRES");
    console.log(res);
    console.log("RESRESRESRESRESRESRESRESRESRESRESRES");
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
