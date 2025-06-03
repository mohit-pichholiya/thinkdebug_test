const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./route'); // your existing routes
const path = require('path');

app.use(cors());


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, 'public/images')));


app.use('/', router);

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/thinkdebug');
  console.log("MongoDB connected");
}

main().catch(err => console.log(err));

app.listen(8081, () => {
  console.log("Server started on http://localhost:8081");
});
