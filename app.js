const express = require('express');
const wakeUpDyno = require("./wakeDyno");
const DYNO_URL = "https://snake-expressapp.herokuapp.com/"
const mongoose = require('mongoose')
const db = 'mongodb+srv://steven7214:steven7214@cluster0.ybekr.mongodb.net/<dbname>?retryWrites=true&w=majority';
const path = require('path');
const bycrypt = require('bcryptjs');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');

require('./passport')(passport);

// Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// User model
var User = require('./User');

var app = express();
app.use(express.static(path.resolve(__dirname)));
// app.use(expressLayouts);
app.use(express.urlencoded( { extended: false }));
app.set('view engine', 'ejs');
app.set('views', './')

// express session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}));

// Passport middlware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global VArs
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

var PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    wakeUpDyno(DYNO_URL);
});

app.get('/', function (req, res) {
    res.render("index");
})

app.post('/update', function(req,res) {
    let username = req.body.username;
    let score = req.body.score;
    console.log("yes",username,score)
    User.updateOne({username:username},{score: score},
        function (err, res) {
            if (err) throw err;
            console.log("score updated");
        });
        User.findOne({username: username})
            .then(user => {
                if (user) {
                   console.log(user.score);
                } else {
                 console.log("user not found");
            }
        });
});

app.post('/login', function (req, res,next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            req.flash('error', info.message);
            res.redirect('/');
        } else {
            res.render('index', { user: user });
            req.session.user = user;
            console.log(req.session.user);
        }
    })(req,res,next);
});

app.get('/logout', (req,res) => {
    req.logout();
    res.redirect('/');
});

app.post('/register', function (req, res) {
    let { username, spassword1, spassword2 } = req.body;
    let errors = [];

    // check for spaces
    if (/\s/.test(username)) {
        errors.push({ msg: "Username cannot contain spaces" });
    }
    // check required fields
    if (!username || !spassword1 || !spassword2) {
        errors.push({ msg: "Missing fields"});
    }
    // check passwords match
    if (spassword1 != spassword2) {
        errors.push({ msg: "Passwords do not match"});
    }
     // Check password length
     if (spassword1.length < 6) {
         errors.push({ msg: "Password must include at least 6 characters"});
     }

     if (errors.length > 0) {
         let signup = true;
         res.render("index", {
            signup,
            errors
         });
     } else {
         User.findOne({username: username})
            .then(user => {
                if (user) {
                    errors.push({ msg: 'Username already exists'});
                    res.render("index", {
                        signup: true,
                        errors
                     });
                     console.log("user exists")
                } else {
                    // validation passed
                    let newUser = new User({
                        username: username,
                        password: spassword1,
                    });

                    // hash password
                    bycrypt.genSalt(10, (err, salt) => 
                        bycrypt.hash(newUser.password, salt, (err,hash) => {
                            if (err) throw err;
                            newUser.password = hash;
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', "You are now registered and can login");
                                    res.redirect('/');
                                })
                                .catch(err => console.log(err));
                    }))
                }
            });
     }
});

