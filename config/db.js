const mongoose = require('mongoose');
require('dotenv').config({path: 'env/dev.env'});


const connect = async () => {
    try {
        await mongoose.connect(process.env.DB, {});
        console.log('Conected to db');
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

module.exports = connect;
