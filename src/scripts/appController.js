require('an').controller(AppController);

function AppController($scope, $http, $q) {
  var wiki = require('./wikipediaClient')($http, $q);
  $scope.logMessage = 'Building wikipedia graph...';

  var graphBuilder = require('./languageInfluenceGraphBuilder')(wiki);
  var graph = {}; // <--- should be instance of ngraph
  graphBuilder.build(graph).then(function(result) {
    $scope.logMessage = 'Done. Getting page content';
    $scope.languages = Object.keys(result).map(toValue).map(toView);

    function toValue(key) {
      return result[key];
    }
  }).then(log);

}

function toView(language) {
  return {
    pageid: language.pageid,
    url: '//www.wikipedia.org/wiki/' + escapeWikiUrl(language.title),
    title: language.title,
    info: language.info
  };
}

function log(message) {
  console.log(message);
}

function escapeWikiUrl(name) {
  return name.replace(/\s/g, '_');
}

AppController.$inject = ['$scope', '$http', '$q'];
