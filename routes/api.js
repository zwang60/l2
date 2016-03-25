var router = require('express').Router();
var promise = require('bluebird');
var dbconn = require('mongodb').MongoClient.connect('mongodb://localhost/l2');

router.get('/login', function(req, res, next) {
    var resp = {};
    if (req.session.usr) resp.usr = req.session.usr;
    res.json(resp);
});

router.post('/login', function(req, res, next) {
    var usr = req.body;
    if (!usr || !usr.usr || !usr.pwd) {
        res.json({
            msg: 'usr or pwd is required'
        });
        return;
    }

    // support signup and login
    var isSignup = !!usr.signup;
    delete usr.signup;

    //TODO, encrypt password
    dbconn
        .then(function(db) {
            //query usr from database
            return db.collection('users').find({
                usr: usr.usr
            }).toArray().then(function(usrs){
                return [usrs, db];
            });
        })
        .then(function(args) {
            var usrs = args[0], db = args[1];
            if (isSignup) {
                if (usrs.length > 0) {
                    return {
                        msg: 'duplicate username',
                    };
                }
                return db.collection('uses').insertOne(usr)
                    .then(function() {
                        return {
                            usr: usr.usr
                        };
                    });
            } else {
                if (usrs.length !== 1 || usrs[0].pwd != usr.pwd) {
                    return {
                        msg: 'invalid login info'
                    };
                }
                return {
                    usr: usr.usr
                };
            }
        })
        .then(function(info) {
            if (info.usr) {
                return new Promise(function(resolve, reject) {
                    req.session.usr = info.usr;
                    req.session.save(function(err) {
                        if (err) reject(err);
                        else resolve(info);
                    });

                })
            } else return info;
        })
    .then(res.json.bind(res)).catch(function(){
        console.err(err);
        next(err);
    });
});
module.exports = router;
