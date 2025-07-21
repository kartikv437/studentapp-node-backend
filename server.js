const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const uploadRoutes = require('./routes/uploadRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;

const stripe = require("stripe")("sk_test_51RjIueFVHBcv9MBMTsZIZisRZgcc3siuGnBXuUw9NJHDO9hAmsKEYpsaLZnWV35XWTTL7zjeiHdFLgGHCx9Z7M1D00lR3ECrWV");

// mongo DB Connection

mongoose.Promise = global.Promise;

const mongoUrl = process.env.REACT_APP_MONGODB;
console.log(mongoUrl);
mongoose.connect(mongoUrl, {
    ssl: true,
    tls: true
}).then(() => {
    console.log("Successfully connected to the database --- " + mongoUrl);
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

app.use('/', uploadRoutes);

app.use('/', applicationRoutes);

app.use((err, req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});


app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(PORT, () => console.log(`Server running on port:${PORT}`));
