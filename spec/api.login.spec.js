var request = require('request');
var mongodb = require('mongodb');
describe('test login api', function() {
    var port = process.env.PORT || '3000';
    var host = process.env.HOST || 'localhost';
    var url = 'http://' + host + ':' + port + '/api/login';
    var parseCookie = function(response) {
        if (!response) return;
        var cookie;
        response.headers['set-cookie'].forEach(function(item) {
            if (item.startsWith('connect.sid'))
                cookie = item.split(';')[0];
        });
        return cookie;
    };


    var login = function(usr) {
        return new Promise(function(resolve, reject) {
            request.post({
                url: url,
                body: usr,
                json: true
            }, function(err, response, body) {
                login.cookie = parseCookie(response);
                if (err) reject(err);
                else resolve(body);
            })
        })
    }
    beforeEach(function(done) {
        mongodb.MongoClient
            .connect('mongodb://localhost/l2')
            .then(function(db) {
                return db.dropCollection('users')
                    .then(function() {
                        return db;
                    }, function(err) {
                        return db;
                    })
            })
            .then(function(db) {
                return db.collection('users').insertOne({
                    usr: 'xyz',
                    pwd: 'xyz'
                }).then(db.close.bind(db), db.close.bind(db))
            })
            .then(done)
            .catch(console.log.bind(console));
    });
    it('check is login return empty', function(done) {
        request(url, function(err, response, body) {
            expect(err).toBeNull();
            expect(JSON.parse(body)).toEqual({});
            expect(body).toBe('{}');
            done();
        });
    });
    it('check can login', function(done) {
        //1. post login
        //2. get cookie
        //3. get login
        login({
            usr: 'xyz',
            pwd: 'xyz'
        }).then(function(body) {
            expect(body).toEqual({
                usr: 'xyz'
            })
        }, function(err) {
            expect(err).toBeNull();
        }).then(done).catch(console.log);
    })
    it('check cannot login without pwd', function(done) {
        //1. post login
        //2. get cookie
        //3. get login
        login({
            usr: 'xyz'
        }).then(function(body) {
            expect(body).toEqual({
                msg: 'usr or pwd is required'
            });
        }, function(err) {
            expect(err).toBeNull();
        }).then(done).catch(console.log);
    })
    it('check is login after login', function(done) {
        login({
                usr: 'xyz',
                pwd: 'xyz'
            }).then(function() {
                return new Promise(function(resolve, reject) {
                    request({
                        url: url,
                        headers: {
                            cookie: request.cookie(login.cookie)
                        },
                        json: true
                    }, function(err, response, body) {
                        console.log(err, body);
                        !!err && reject(err) || resolve(body);
                    })
                })
            })
            .then(function(info){
                expect(info).toEqual({usr: 'xyz'})
                done();
            })
            .catch(done);
    })
})
