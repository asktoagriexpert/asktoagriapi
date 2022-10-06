const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const { v4: uuidv4 } = require('uuid')
const cors = require('cors')
const request = require('request');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// require('dotenv').config();

const app = express()
app.use(cors())
const port = process.env.PORT || 5000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

function unixTimestamp() {
    return Math.floor(
        Date.now() / 1000
    )
}

// MySQL

const pool = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    waitForConnections: true,
});

async function checkUserExists(mobile) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) throw err;
            connection.query("SELECT * FROM `hc_user` WHERE `mobile` = ? LIMIT 1", [mobile], (err, row) => {
                connection.release;
                if (!err) {
                    resolve(row);
                } else {
                    resolve(err);
                }
            });
        });
    });
}

async function checkDeviceExists(deviceId) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) throw err;
            connection.query("SELECT * FROM `hc_device` WHERE `deviceId` = ? LIMIT 1", [deviceId], (err, row) => {
                connection.release;
                if (!err) {
                    resolve(row);
                } else {
                    resolve(err);
                }
            });
        });
    });
}


app.post('/add/user', (req, res) => {
    pool.getConnection((err, connection) => {
        res.header("Access-Control-Allow-Origin", "*");
        if (err) throw err
        console.log(`Connected as id ${connection.threadId}`)
        const { mobile, firebaseId, defaultFcm, longitude, latitude, defaultLang } = req.body;
        const uuid = uuidv4();

        checkUserExists(mobile).then((row) => {
            if (row[0].mobile == mobile) {
                res.send({
                    "code": 400,
                    "requestId": uuidv4(),
                    "time": unixTimestamp(),
                    "message": "User already exists",
                    "result": null
                });
            }
            else {
                connection.query(
                    "INSERT INTO `hc_user`(`mobile`, `firebaseId`, `defaultFcm`, `longitude`, `latitude`, `defaultLang`) VALUES (?, ?, ?, ?, ?, ?);",
                    [
                        mobile,
                        firebaseId,
                        defaultFcm,
                        longitude,
                        latitude,
                        defaultLang
                    ], (err) => {
                        connection.release;
                        if (!err) {
                            res.send({
                                "code": 200,
                                "requestId": uuidv4(),
                                "time": unixTimestamp(),
                                "message": "User added",
                                "result": {
                                    "uuid": uuid
                                }
                            });
                        } else {
                            res.send({
                                "code": 400,
                                "requestId": uuidv4(),
                                "time": unixTimestamp(),
                                "message": "Failed to add new user",
                                "result": null
                            });
                        }
                    });
            }
        })
    });
});

app.post('/add/device', (req, res) => {
    pool.getConnection((err, connection) => {
        res.header("Access-Control-Allow-Origin", "*");
        if (err) throw err
        console.log(`Connected as id ${connection.threadId}`)
        const { userId, deviceId, defaultFcm, plateform, version, model } = req.body;
        const uuid = uuidv4();

        checkDeviceExists(deviceId).then((row) => {

            if (row.length > 0 && row[0].deviceId == deviceId) {
                res.send({
                    "code": 400,
                    "requestId": uuidv4(),
                    "time": unixTimestamp(),
                    "message": "Device already exists",
                    "result": null
                });
            }
            else {
                connection.query(
                    "INSERT INTO `hc_device`(`userId`, `deviceId`, `defaultFcm`, `plateform`, `version`, `model`) VALUES (?, ?, ?, ?, ?, ?);",
                    [
                        userId,
                        deviceId,
                        defaultFcm,
                        plateform,
                        version,
                        model
                    ], (err) => {
                        connection.release;
                        if (!err) {
                            res.send({
                                "code": 200,
                                "requestId": uuidv4(),
                                "time": unixTimestamp(),
                                "message": "Device added",
                                "result": {
                                    "deviceId": deviceId
                                }
                            });
                        } else {
                            res.send({
                                "code": 400,
                                "requestId": uuidv4(),
                                "time": unixTimestamp(),
                                "message": "Failed to add new device",
                                "result": null
                            });
                        }
                    });
            }
        })
    });
});

app.post('/add/session', (req, res) => {
    pool.getConnection((err, connection) => {
        res.header("Access-Control-Allow-Origin", "*");
        if (err) throw err
        console.log(`Connected as id ${connection.threadId}`)
        const { userId, deviceId, token } = req.body;
        const uuid = uuidv4();

        connection.query(
            "INSERT INTO `hc_session`(`userId`, `deviceId`, `token`, `ip`) VALUES (?, ?, ?, ?);",
            [
                userId,
                deviceId,
                token,
                req.ip
            ], (err) => {
                connection.release;
                if (!err) {
                    res.send({
                        "code": 200,
                        "requestId": uuidv4(),
                        "time": unixTimestamp(),
                        "message": "Session added",
                        "result": {
                            "token": token
                        }
                    });
                } else {
                    res.send({
                        "code": 400,
                        "requestId": uuidv4(),
                        "time": unixTimestamp(),
                        "message": "Failed to add new session",
                        "result": null
                    });
                }
            });
    });
});

app.post('/add/category', (req, res) => {
    pool.getConnection((err, connection) => {
        res.header("Access-Control-Allow-Origin", "*");
        if (err) throw err
        console.log(`Connected as id ${connection.threadId}`)
        const { title, parent } = req.body;
        const uuid = uuidv4();

        connection.query(
            "INSERT INTO `hc_category`(`title`, `parent`) VALUES (?, ?);",
            [
                title,
                parent
            ], (err) => {
                connection.release;
                if (!err) {
                    res.send({
                        "code": 200,
                        "requestId": uuidv4(),
                        "time": unixTimestamp(),
                        "message": "Category added",
                        "result": {
                            "category": title
                        }
                    });
                } else {
                    res.send({
                        "code": 400,
                        "requestId": uuidv4(),
                        "time": unixTimestamp(),
                        "message": "Failed to add new category",
                        "result": null
                    });
                }
            });
    });
});

app.post('/add/crops', (req, res) => {
    pool.getConnection((err, connection) => {
        res.header("Access-Control-Allow-Origin", "*");
        if (err) throw err
        console.log(`Connected as id ${connection.threadId}`)
        const { title, type, image, region } = req.body;
        const uuid = uuidv4();

        connection.query(
            "INSERT INTO `hc_crops`(`title`, `type`, `image`, `region`) VALUES (?, ?, ?, ?);",
            [
                title,
                type,
                image,
                region
            ], (err) => {
                connection.release;
                if (!err) {
                    res.send({
                        "code": 200,
                        "requestId": uuidv4(),
                        "time": unixTimestamp(),
                        "message": "Crops added",
                        "result": {
                            "name": title
                        }
                    });
                } else {
                    res.send({
                        "code": 400,
                        "requestId": uuidv4(),
                        "time": unixTimestamp(),
                        "message": "Failed to add new crops",
                        "result": null
                    });
                }
            });
    });
});

app.post('/get/region', (req, res) => {
    const { pincode } = req.body;
        var options = {
            'method': 'GET',
            'url': `http://www.postalpincode.in/api/pincode/${pincode}`,
            'headers': {
            }
        };

        request(options, function (error, response) {
            if (!error) {
                res.send({
                    "code": 200,
                    "requestId": uuidv4(),
                    "time": unixTimestamp(),
                    "message": "Region retrived",
                    "result": JSON.parse(response.body)
                });
            } else {
                res.send({
                    "code": 400,
                    "requestId": uuidv4(),
                    "time": unixTimestamp(),
                    "message": "Failed to get region",
                    "result": null
                });
            }
        });
});


app.post('/get/crops', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    pool.getConnection((err, connection) => {
        if (err) throw err;
        console.log(`Connected as id ${connection.threadId}`);
        const { region } = req.body;

        connection.query("SELECT * from `hc_crops` WHERE `region` = ? LIMIT 18", [region], (err, row) => {
            connection.release;
            if (!err) {
                res.send({
                    "code": 200,
                    "requestId": uuidv4(),
                    "time": unixTimestamp(),
                    "message": "Media retrived",
                    "result": {
                        "crops": row
                    }
                });
            } else {
                console.log(err);
                res.send({
                    "code": 400,
                    "requestId": uuidv4(),
                    "time": unixTimestamp(),
                    "message": "Failed to retrive crops",
                    "result": null
                });
            }
        })
    })
})

app.post('/shutdown', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) throw err
        console.log(`Connected as id ${connection.threadId}`)
        const { password } = req.body;

        if (password == process.env.PASSWORD) {
            console.log("Shutting down server");
            res.send({
                "code": 200,
                "requestId": uuidv4(),
                "time": unixTimestamp(),
                "message": "Shutting down server",
                "result": null,
            });
            process.exit();
        }
    })
})

app.listen(port, () => { console.log(`Listing on port ${port}`); })

// if (process.env.NODE_ENV == "production") {
//     app.listen(() => { console.log(`Listing on port ${port}`); })
// } else {
//     app.listen(port, () => { console.log(`Listing on port ${port}`); })
// }