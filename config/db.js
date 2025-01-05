const mongoose = require('mongoose');

async function connect(databaseUrl) {
    try {
        await mongoose.connect(databaseUrl);
        console.log(`Connect to database successfully!!!`);
    } catch (error) {
        console.log(`Connect to database fail!!!`);
    }
}

module.exports = { connect };