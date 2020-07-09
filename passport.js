const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load User model
const User = require('./User');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'username', passwordField: "lpassword"}, (username, lpassword, done) => {
            // Match User
            User.findOne({ username: username})
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'Username does not exist'});
                }

                bcrypt.compare(lpassword, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        console.log("logged in");
                        return done(null, user, { message: 'bob' });
                    } else {
                        return done(null, false, { message: 'Incorrect password'});
                    }
                });
            })
            .catch(err => console.log(err));
        })
    );

    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
      
      passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
      });
}
