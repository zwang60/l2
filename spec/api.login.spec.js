var request = require('request');
var mongodb = require('mongodb');
describe('test login api', function() {
    var port = process.env.PORT || '3000';
    var host = process.env.HOST || 'localhost';
    var url = 'http://' + host + ':' + port + '/api/login';
    var parseCookie = function(response) {
        var cookie;
        response.headers['set-cookie'].forEach(function(item) {
            if (item.startsWith('connect.sid'))
                cookie = item.split(';')[0];
        });
        return cookie;
    };

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
        request.post({
            url: url,
            body: {
                usr: 'xyz',
                pwd: 'xyz'
            },
            json: true
        }, function(err, response, body) {
            console.log('login finished', err, response, body);
            expect(body).toEqual({
                usr: 'xyz'
            });
            done();
        })
    })
})
