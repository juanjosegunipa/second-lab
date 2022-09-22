const express = require('express');
const router = express.Router();
const user = require('../models/User.model');
const bcryptjs = require('bcryptjs');
const { isAuthenticated, isNotAuthenticated } = require('../middlewares/auth.middlewares');
const { Router } = require('express');
// const User = require('../models/User.model');


router.get('/', (req, res, next) => {
    res.render('index.hbs');
});

router.get('/signup', (req, res, next) => {
    res.render('signup.hbs');
});

router.post('/signup', (req, res, next) => {
    const myName = req.body.name;
    const myLastName = req.body.lastName;
    const myUsername = req.body.username;
    const myPassword = req.body.password;
    const myBalance = req.body.balance;

    const encryptedPassword = bcryptjs.hashSync(myPassword);

    user.create({
        name: myName,
        lastName: myLastName,
        username: myUsername,
        password: encryptedPassword,
    })
        .then(savedUser => {
            console.log(savedUser);
            res.redirect('/login')
        })
        .catch(err => {
            res.render('signup.hbs', { errorMessage: 'Username already exists' });
        })
});

router.get('/login', isNotAuthenticated, (req, res, next) => {
    res.render('login.hbs')
});

router.post('/login', (req, res, next) => {
    const myUsername = req.body.username;
    const myPassword = req.body.password;

    user.findOne({
        username: myUsername
    })
        .then(foundUser => {
            if (!foundUser) {
                res.render('login.hbs', { errorMessage: 'Username or password incorrect' });
                return;
            }

            const validPassword = bcryptjs.compareSync(myPassword, foundUser.password)

            if (!validPassword) {
                res.render('login.hbs', { errorMessage: 'Username or password incorrect' });
                return;
            }

            req.session.user = foundUser;

            res.redirect('/profile');

            // res.render('profile.hbs', { name: foundUser.name })
        })
        .catch(err => {
            res.send(err)
        })
});

router.get('/profile', isAuthenticated, (req, res, next) => {
    // console.log(req.session)
    user.findById(req.session.user._id)
        .populate('accounts')
        .then(foundUser => {
            // console.log('found user with populated transactions: ', foundUser)
            res.render('profile.hbs', {
                name: foundUser.name,
                balance: foundUser.balance,
                myNewAccountArray: foundUser.accounts
            })
        })
        .catch(err => res.send(err))
})

router.get('/logout', (req, res, next) => {
    res.cookie('connect.sid', '', { maxAge: 1 });
    res.redirect('/')
})

module.exports = router;