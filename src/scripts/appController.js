require('an').controller(AppController);

function AppController($scope, $http, $q) {
  var wiki = require('./wikipediaClient')($http, $q, log);
  log('Building wikipedia graph...');

  var graphBuilder = require('./languageInfluenceGraphBuilder')(wiki, log);
  var graph = {}; // <--- should be instance of ngraph
  graphBuilder.build(graph).then(function(result) {
    log('Done');
    $scope.languages = Object.keys(result).map(toValue).map(toView);

    function toValue(key) {
      return result[key];
    }
  });

  function log(message) {
    console.log(message);
    $scope.logMessage = message;
  }
}

function toView(language) {
  return {
    pageid: language.pageid,
    url: '//www.wikipedia.org/wiki/' + escapeWikiUrl(language.title),
    title: language.title,
    info: language.info
  };
}

function escapeWikiUrl(name) {
  return name.replace(/\s/g, '_');
}

AppController.$inject = ['$scope', '$http', '$q'];
