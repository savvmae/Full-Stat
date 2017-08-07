const express = require('express');
const path = require('path');
const route = express.Router();
const bodyParser = require('body-parser')
const passportJWT = require("passport-jwt");;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const data = require('../models/data');

route.use(bodyParser.json());
route.use(bodyParser.urlencoded());

const jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = 'icanauthenticatestuff';


route.post('/api/signup', async function (request, response) {
    if (request.body.email && request.body.password && request.body.userName) {
        var hashed = crypto.pbkdf2Sync(request.body.password, 'salt', 10, 512, 'sha512').toString('base64');
        var user = await data.users.find({ email: request.body.email });
        if (!user[0]) {
            var newUser = await data.users.create({
                userName: request.body.userName,
                email: request.body.email,
                password: hashed
            });
            var payload = { id: newUser._id, name: newUser.userName };
            var token = jwt.sign(payload, jwtOptions.secretOrKey);
            return response.json({ message: "ok", token: token });
        } else {
            return response.status(401).json({ message: "that email is already registered" });
        }
    }
    else {
        return response.status(401).json({ message: "missing information in signup form" });
    }
});


route.post('/api/login', async function (request, response) {
    if (request.body.email && request.body.password) {
        var email = request.body.email;
        var hashed = crypto.pbkdf2Sync(request.body.password, 'salt', 10, 512, 'sha512').toString('base64');
    }
    var user = await data.users.find({ email: email });
    if (!user[0]) {
        return response.status(401).json({ message: "no such user found" });
    } if (user[0].password === hashed) {
        var payload = { id: user[0]._id, name: user[0].userName };
        var token = jwt.sign(payload, jwtOptions.secretOrKey);
        return response.json({ message: "ok", token: token });
    } else {
        return response.status(401).json({ message: "passwords did not match" });
    }
});


module.exports = route;