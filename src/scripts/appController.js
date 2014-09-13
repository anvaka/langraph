require('an').controller(AppController);

function AppController($scope, $http, $q) {
  log('Building wikipedia graph...');

  var graph = require('ngraph.graph')();
  buildGraph(graph);
  var renderer = require('ngraph.svg')(graph, {
    container: document.getElementById('graphContainer')
  });

  renderer.run();

  function buildGraph(graph) {
    var wiki = require('./wikipediaClient')($http, $q, log);
    var graphBuilder = require('./languageInfluenceGraphBuilder')(wiki, log);
    graphBuilder.build(graph).then(function(graph) {
      log('Done. Found ' + graph.getNodesCount() +  ' languages and ' + graph.getLinksCount() + ' connections.');
      var languages = [];
      graph.forEachNode(function(node) {
        if (node.data) languages.push(node.data);
      });

      $scope.languages = languages.map(toView);
    });
  }

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
