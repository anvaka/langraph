require('./appController');

var ngApp = angular.module('langraph', []);

require('an').flush(ngApp);

angular.bootstrap(document, [ngApp.name]);

module.exports = ngApp;
