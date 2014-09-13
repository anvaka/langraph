require('an').controller(AppController);

function AppController($scope, $http, $q) {
  log('Building wikipedia graph...');

  var graph = require('ngraph.graph')();
  var svg = require('simplesvg');

  buildGraph(graph);
  var renderer = require('ngraph.svg')(graph, {
    container: document.getElementById('graphContainer'),
    physics: {
      springLength: 260,
      springCoeff: 0.0008,
      dragCoeff: 0.01,
      gravity: -50.2,
      theta: 0.8,
      timeStep: 4
    }
  });

  var layout = renderer.layout;

  graph.on('changed', function(changes) {
    changes.forEach(function(change) {
      if (change.changeType === 'add' && change.node) {
        setInitialPosition(change.node);
      }
    });
  });

  function setInitialPosition(node) {
    var year = node && node.data && node.data.info && node.data.info.parsedYear;
    if (year) {
      layout.setNodePosition(node.id, getX(year), 50 - Math.random() * 100);
    }
  }

  function getX(year) {
    return (year - 1950) * 100;
  }

  renderer.node(function(node) {
    var ui = svg.compile([
      "<g>",
      "<circle fill='deepskyblue' r='5px'></circle>",
      "<text fill='#ddd' y='-10' x='-5'>{{text}}</text>",
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
    var x = getX(info.parsedYear);

    var y = pos.y;
    if (isNaN(x)) x = pos.x;

    layout.setNodePosition(model.id, x, y);
    nodeUI.attr('transform', 'translate(' + x + ',' + y + ')');
  });

  renderer.link(function(linkUI, pos) {
    return svg("line").attr("stroke", "#eee");
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
