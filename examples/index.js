var Logulus = require('../index.js');
var logulus = Logulus.create(module.id);

console.log(logulus.logger.transports['logulus-file']);