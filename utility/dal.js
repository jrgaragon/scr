const config = require('../config');
const mongoose = require('mongoose');

const address = `mongodb://${
    config.database.address
}:${
    config.database.port
}/${
    config.database.name
}`;

const openConnection = async () => {

    mongoose.connect(address, config.mongoose);
    mongoose.connection.on('open', _ => console.log('connected'));
    mongoose.connection.on('error', err => console.error(err));

}

module.exports = openConnection;


// mongoose.connect();

// module.exports = mongoose;
