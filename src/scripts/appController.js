require('an').controller(AppController);

function AppController($scope, $http, $q) {
  log('Building wikipedia graph...');

  var graph = require('ngraph.graph')();
  var svg = require('simplesvg');

  buildGraph(graph);
  var renderer = require('ngraph.svg')(graph, {
    container: document.getElementById('graphContainer'),
    physics: {
      springLength: 160,
      springCoeff: 0.0008,
      dragCoeff: 0.05,
      gravity: -30.2,
      theta: 1,
      timeStep: 8
    }
  });
  var layout = renderer.layout;

  renderer.node(function(node) {
    var ui = svg.compile([
      "<g>",
      "<circle fill='deepskyblue' r='5px'></circle>",
      "<text fill='deepskyblue' y='-10' x='-5'>{{text}}</text>",
      "</g>"
    ].join('\n'));

    var info = node.data.info;
    var title = info.name;

    ui.dataSource({
      text: title
    });
    return ui;
  }).placeNode(function(nodeUI, pos, model) {
    var info = model.data.info;
    var x = (info.parsedYear - 1940) * 50;
    var y = pos.y;
    if (isNaN(x)) x = pos.x;

    layout.setNodePosition(model.id, x, y);
    nodeUI.attr('transform', 'translate(' + x + ',' + y + ')');
  });

  renderer.run();

  function buildGraph(graph) {
    var wiki = require('./wikipediaClient')($http, $q, log);
    var graphBuilder = require('./languageInfluenceGraphBuilder')(wiki, log);
    graphBuilder.build(graph).then(function(graph) {
      log('Done. Found ' + graph.getNodesCount() + ' languages and ' + graph.getLinksCount() + ' connections.');
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
