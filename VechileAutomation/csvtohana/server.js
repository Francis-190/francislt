const cds = require('@sap/cds');

cds.on('bootstrap', app => {
  const bodyParser = require('body-parser');

  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));
  app.use(bodyParser.text({ limit: '20mb' }));
});

module.exports = cds.server;
