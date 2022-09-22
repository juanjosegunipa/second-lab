const express = require('express');
const morgan = require('morgan');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { isAuthenticated, isNotAuthenticated } = require('./middlewares/auth.middlewares');

mongoose.connect('mongodb://127.0.0.1/money-app-project-2')
    .then(x => console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`))
    .catch(err => {
        console.log(err);
    })

const app = express();

app.set('views', __dirname + '/views')
app.set('view engine', hbs);

app.use(
    session({
        secret: "keyboarcat",
        resave: true,
        saveUninitialized: false,
        cookie: {
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 12000000000000
        }, // ADDED code below !!!
        store: MongoStore.create({
            mongoUrl: 'mongodb://127.0.0.1/money-app-project-2'

            // ttl => time to live
            // ttl: 60 * 60 * 24 // 60sec * 60min * 24h => 1 day
        })
    })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));


const authRoutes = require('./routes/auth.routes');
app.use('/', authRoutes);

const profileRoutes = require('./routes/profile.routes');
app.use('/', profileRoutes);


app.listen(3000, () => console.log('Yo the server is running'));