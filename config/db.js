const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const connectDB = async () => {
    const mongoUrl = process.env.REACT_APP_MONGODB;
    try {
        const conn = await mongoose.connect(mongoUrl, {
            ssl: true,
            tls: true
        }).then(() => {
            console.log("Successfully connected to the database --- " + mongoUrl);
        }).catch(err => {
            console.log('Could not connect to the database. Exiting now...', err);
            process.exit();
        });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;