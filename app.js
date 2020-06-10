const express = require('express');
const mongoose = require('mongoose');
const router = require('./api/index');

var cors = require('cors');

const db = mongoose.connect('mongodb+srv://admin:qwe321qwe@cluster0-2ezxg.mongodb.net/test?retryWrites=true&w=majority',{useNewUrlParser: true,useUnifiedTopology: true})

const app = express();
const obj = {origin: '*'};

app.use(cors(obj));
app.use(express.json());
app.use(router);
app.listen(5000, () => {
    console.log('server runs on the port 5000');
});

