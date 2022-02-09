const express = require("express");
const path = require('path')
const mysql = require("mysql");
const dotenv = require("dotenv");
const bodyParser = require('body-parser');
const {Script} = require("vm");
const fileUpload = require('express-fileupload')

dotenv.config({
  path: './.env'
});


const app = express();

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));


// Parse URL encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({
  extended: false
}));

app.use(bodyParser.urlencoded({ extended: true })); 

app.use(express.json());

app.use(fileUpload());

app.set('view engine', 'hbs')

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("MySQL connected.")
  }
})


// Routes
app.use('/', require('./routes/pages.js'));
app.use('/auth', require('./routes/auth.js'))


app.listen(5000, () => {
  console.log("Server running on port 5000");
});

