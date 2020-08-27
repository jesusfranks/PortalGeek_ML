const express = require('express');
const app = express();
const exhbs = require('express-handlebars');
const path = require('path');
const helmet = require('helmet');
const session = require('cookie-session');
const multer = require('multer');
const { job, rTokenJob }  = require('./utils/cronjob'); 

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/pictures'),
  filename: (req, file, cb) => cb(null, Date.now() + file.originalname)
});

const upload = multer({ storage });

//Settings
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exhbs({
  defaultLayout: 'main',
  layoutsDir: path.join(app.get('views'), 'layouts'),
  partialsDir: path.join(app.get('views'), 'partials'),
  extname: '.hbs',
  helpers: require('./lib/handlebars')
}));
app.set('view engine', '.hbs');

app.use(helmet());
app.use(session({
  name: 'session',
  keys: ['bd7126f457237e4aab0d47124ce4aac2', '9009def68579d15d871a5bf346422839'],
  cookie: {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 60 * 1000 * 2) // 2 horas
  },
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

//Routes
app.use(require('./routes'));
app.use(require('./routes/postOne'));
app.use(require('./routes/postEverything'));

//Cronjob
job.start();
rTokenJob.start()

module.exports = app;