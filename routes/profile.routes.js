const express = require('express');
const router = express.Router();
const user = require('../models/User.model');
const account = require('../models/Account.model')
const transaction = require('../models/Transaction.model');
const { isAuthenticated, isNotAuthenticated } = require('../middlewares/auth.middlewares');
const { findById } = require('../models/User.model');


router.get('/profile/deposit', (req, res, next) => {
    user.findById(req.session.user._id)
        .populate('accounts')
        .then(foundAccount => {
            console.log(foundAccount)
            res.render('deposit.hbs', { foundAccount: foundAccount.accounts, style: 'deposit.css' })
        })
})

router.post('/profile/deposit', (req, res, next) => {
    const addBalance = Number(req.body.deposit);
    if (addBalance >= 0) {
        account.findById(req.body.account)
            .then(foundAccount => {
                account.findByIdAndUpdate(req.body.account, {
                    balance: addBalance + foundAccount.balance
                }, { new: true })
                    .then(response => {
                        console.log(response);
                        res.redirect('/profile');
                    })
            })
            .catch(err => {
                res.render(err);
            })
    } else {
        user.findById(req.session.user._id)
            .populate('accounts')
            .then(foundAccount => {
                console.log(foundAccount)
                res.render('deposit.hbs', { foundAccount: foundAccount.accounts, errorMessage: 'asdf' })
            })
    }
})

router.get('/profile/open-account', (req, res, next) => {
    res.render('open-account.hbs', { style: 'open-account.css' })
})

router.post('/profile/open-account', (req, res, next) => {
    const currentUser = req.session.user._id;
    const myAccountName = req.body.accountName;
    const myBalance = req.body.balance;
    const myCurrency = req.body.currency;

    account.create({
        userId: currentUser,
        accountName: myAccountName,
        balance: myBalance,
        currency: myCurrency
    })
        .then(savedAccount => {
            user.findByIdAndUpdate(currentUser, { $push: { accounts: savedAccount._id } }, { new: true })
                .then(response => {
                    console.log(response);
                    res.redirect('/profile');
                })
        })
        .catch(err => console.log(err))
})

router.get('/profile/accounts/:accountId', (req, res, next) => {
    // console.log('Route parameters', req.params)
    account.findById(req.params.accountId)
        .populate({
            path: 'transaction',
            populate: {
                path: 'sendingAccount receivingAccount',
                model: 'Account',
                populate: {
                    path: 'userId',
                    model: 'User'
                }
            }
        })
        .then(foundAccount => {
            // console.log(foundAccount, 'Found account!!!!!')
            res.render('account-details.hbs', {
                _id: foundAccount._id,
                accountName: foundAccount.accountName,
                balance: foundAccount.balance,
                transactionArray: foundAccount.transaction.reverse()
            })
        })
        .catch(err => console.log(err))
})

router.get('/profile/accounts/:_id/delete', (req, res, next) => {
    const accountId = req.params._id

    account.findById(accountId)
        .populate({
            path: 'transaction',
            populate: {
                path: 'sendingAccount receivingAccount',
                model: 'Account',
                populate: {
                    path: 'userId',
                    model: 'User'
                }
            }
        })
        .then(foundAccount => {
            // console.log(foundAccount, 'Found account')
            if (foundAccount.amount == 0 || !foundAccount.transaction.length) {
                account.findByIdAndDelete(accountId)
                    .then(response => {
                        console.log(response)
                        res.redirect('/profile')
                    })
            } else {
                console.log('Can not delete this account')
                console.log(foundAccount, "found account!dfgergwsrgergerger")
                res.render('account-details.hbs', {
                    _id: foundAccount._id,
                    accountName: foundAccount.accountName,
                    balance: foundAccount.balance,
                    transactionArray: foundAccount.transaction.reverse(),
                    errorMessage: 'asdf'
                })
            }
        })

        .catch(err => console.log(err, 'this is the error'))
})

router.get('/profile/send-money', (req, res, next) => {
    res.render('send-money.hbs')
});

router.post('/profile/send-money', (req, res, next) => {
    // const currentUser = req.session.user._id;
    const sentTo = req.body.sendUsername;

    user.find()
        .then(foundUser => {
            for (let i = 0; i < foundUser.length; i++) {
                if (foundUser[i].username === sentTo) {
                    const receiver = foundUser[i]
                    res.redirect(`send-money/confirmation/${receiver._id}`)
                    return;
                }
            }
            res.render('send-money.hbs', { errorMessage: 'Username does not exist' })
        })
        .catch(err => console.log(err))
})
router.get('/profile/send-money/confirmation/:userId', (req, res, next) => {
    const currentUser = req.session.user._id;
    console.log(req.params.userId)
    user.findById(req.params.userId)
        .then(receiver => {
            user.findById(currentUser)
                .populate('accounts')
                .then(foundAccount => {
                    user.findById(receiver._id)
                        .populate('accounts')
                        .then(foundReceiverAccount => {
                            res.render('send-money-confirmation.hbs', { receiver, foundAccount: foundAccount.accounts, foundReceiverAccount: foundReceiverAccount.accounts })
                        })
                })
        })
        .catch(err => console.log(err))
});

router.post('/profile/send-money/confirmation/:userId', (req, res, next) => {
    const myBalance = req.body.amount;
    const currentAccount = req.body.accountSending;
    const receivingAccount = req.body.accountReceiving;

    if (myBalance > 0) {

        transaction.create({
            sendingAccount: currentAccount,
            receivingAccount: receivingAccount,
            amount: myBalance
        })
            .then(savedTransaction => {
                account.findById(currentAccount)
                    .then(firstAccount => {
                        if (firstAccount.balance >= myBalance) {
                            account.findById(receivingAccount)
                                .then(secondAccount => {
                                    account.findByIdAndUpdate(firstAccount._id, { $push: { transaction: savedTransaction._id }, balance: Number(firstAccount.balance) - Number(myBalance) }, { new: true })
                                        .then(response => {
                                            console.log('1st response:' + response)
                                            account.findByIdAndUpdate(secondAccount._id, { $push: { transaction: savedTransaction._id }, balance: Number(secondAccount.balance) + Number(myBalance) }, { new: true })
                                                .then(secondResponse => {
                                                    console.log('2nd response' + secondResponse)
                                                    user.findById(secondAccount.userId)
                                                        .then(foundUser => {
                                                            console.log('this is the found user: ' + foundUser)
                                                            res.render('money-sent.hbs', { savedTransaction, foundUser, myBalance })
                                                        })
                                                })
                                        })
                                })
                        } else {
                            res.render('insufficient-founds.hbs', {
                                BalanceErrorMessage: 'asdf'
                            })
                        }
                    })
            })
            .catch(err => console.log(err))
    } else {
        //     const currentUser = req.session.user._id;
        //     console.log(req.params.userId)
        //     user.findById(currentUser)
        //         .then(receiver => {
        //             user.findById(currentUser)
        //                 .populate('accounts')
        //                 .then(foundAccount => {
        //                     user.findById(receiver._id)
        //                         .populate('accounts')
        //                         .then(foundReceiverAccount => {
        res.render('send-negative.hbs', { errorMessage: 'asdf' })
        //                         })
        //                 })
        //         })

    }
})

module.exports = router;