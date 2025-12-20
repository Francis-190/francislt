const cds = require('@sap/cds');
const cors = require('cors');
const proxy = require('@sap/cds-odata-v2-adapter-proxy'); 

cds.on('bootstrap', (app) => {

    const corsOptions = {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    };

    console.log(corsOptions);

    app.use(cors(corsOptions));

    app.use(proxy()); 
});

module.exports = cds.server;
