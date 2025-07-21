const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const uploadRoutes = require('./routes/uploadRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
const PORT = process.env.PORT || 3001;

const stripe = require("stripe")("sk_test_51RjIueFVHBcv9MBMTsZIZisRZgcc3siuGnBXuUw9NJHDO9hAmsKEYpsaLZnWV35XWTTL7zjeiHdFLgGHCx9Z7M1D00lR3ECrWV");

// Domain Hosting Account(kartik.er.vit@gmail.com) {https://app.netlify.com/projects/luminous-capybara-aded1d/deploys/687dddcd55631c0caddccfea}
// cloudinary Account (er.kartik93@gmail.com) {https://console.cloudinary.com/app/c-2057885021e4bb5c1571887d9ac4b3/assets/media_library/search?q=&view_mode=mosaic}
// Render Account (er.kartik93@gmail.com) {https://dashboard.render.com/web/srv-d1v1crer433s73f80dc0/deploys/dep-d1v1mdje5dus739cqf90}
// Stripe Account (er.kartik93@gmail.com) {https://dashboard.stripe.com/test/settings/user}
// mongo DB Connection (kartikv437@gmail.com) {https://cloud.mongodb.com/v2/6811a4298f33665f0251b2e4#/metrics/replicaSet/6811a5b3ffd707258c2c9e2e/explorer/sample_mflix/comments/find}

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
