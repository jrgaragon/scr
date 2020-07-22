module.exports = {
    database: {
        address: 'localhost',
        port: 27017,
        name: 'scrapper'
    },
    mongoose: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    },
    server: {
        port: 3000
    }
};


