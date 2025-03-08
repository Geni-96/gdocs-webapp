require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('./models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:5001/auth/google/callback",
  passReqToCallback: true,
},
async (request, accessToken, refreshToken, profile, done) => {
    try {
      console.log(profile.id,'profileid')
      let user = await User.findOne({ googleId: `${profile.id}` });
      if (!user) {
        // Create new user if not found
        user = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          accessToken,
          refreshToken,
        });
        await user.save();
        
      } else {
        // Update tokens if user already exists
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});