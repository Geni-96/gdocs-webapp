const express = require('express');
const session = require('express-session');
const passport = require('passport');
const User = require('./models/User');
const { google } = require('googleapis');
require('./auth');

const app = express();

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}


app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: [ 'email', 'profile', 'https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/classroom.courses.readonly', 'https://www.googleapis.com/auth/classroom.coursework.students','https://www.googleapis.com/auth/classroom.coursework.me' ] }
));

app.get( '/auth/google/callback',
  passport.authenticate( 'google', {
    successRedirect: '/protected',
    failureRedirect: '/auth/google/failure'
  })
);

// app.get('/protected', isLoggedIn, (req, res) => {
//   res.send(`Hello ${req.user.displayName}`);
// });
app.get('/protected', isLoggedIn, async (req, res) => {
    // console.log(req,'printing req in protected')
    const user = await User.findById(req.user._id);
    // console.log(user,'pringting user in index')
    res.send(`Hello ${user.displayName}`);
  });

app.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.send('Goodbye!');
});

app.get('/auth/google/failure', (req, res) => {
  res.send('Failed to authenticate..');
});

app.get('/get-courses', async(req,res)=>{
  if (!req.isAuthenticated()) {
    return res.status(401).send('Unauthorized');
  }
  try{
    const result = await listCourses(req.user.accessToken);
    res.send(result);
  }catch (err) {
    res.status(500).send('Failed to fetch courses list',err);
  }
})

app.get('/insert-text', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send('Unauthorized');
  }

  const docId = '1Nmu8DzWDEPFQKzOh-mB4nbdf0feEfpBlyaDZ6Bxy4_M'; // Replace with your document ID
  const startIndex = 1;  // Choose your starting index
  const text = 'Hello, this is the new text!';

  try {
    const result = await insertTextToDocument(req.user.accessToken, docId, startIndex, text);
    res.send(result);
  } catch (err) {
    res.status(500).send('Failed to insert text');
  }
});

app.listen(5001, () => console.log('listening on port: 5001'));

async function listCourses(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const classroom = google.classroom({version: 'v1', auth});
  const res = await classroom.courses.list({
    pageSize: 10,
  });
  const courses = res.data.courses;
  if (!courses || courses.length === 0) {
    console.log('No courses found.');
    return;
  }
  console.log('Courses:');
  courses.forEach((course) => {
    console.log(`${course.name} (${course.id})`);
  });
}

async function studentCoursework(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const classroom = google.classroom({version: 'v1', auth});
  const res = await classroom.coursework.students.list({
    pageSize: 10,
  });
  const courses = res.data.courses;
  if (!courses || courses.length === 0) {
    console.log('No courses found.');
    return;
  }
  console.log('Courses:');
  courses.forEach((course) => {
    console.log(`${course.name} (${course.id})`);
  });
}

async function insertTextToDocument(accessToken, docId, startIndex, text) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });

  const requests = [
    {
      insertText: {
        location: {
          index: startIndex, // Start position in the document
        },
        text: text,
      },
    },
  ];

  try {
    const response = await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: requests,
      },
    });
    console.log('Text inserted:', response.data);
    return response.data;
  } catch (err) {
    console.error('Error inserting text:', err);
    throw new Error('Failed to insert text');
  }
}