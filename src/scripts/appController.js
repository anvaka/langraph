require('an').controller(AppController);

function AppController($scope, $http, $q) {
  log('Building wikipedia graph...');

  var graph = require('ngraph.graph')();
  var svg = require('simplesvg');

  buildGraph(graph);
  var renderer = require('ngraph.svg')(graph, {
    container: document.getElementById('graphContainer'),
    physics: {
      springLength: 300,
      springCoeff: 0.0008,
      dragCoeff: 0.1,
      gravity: -150.2,
      theta: 0.8,
      timeStep: 4
    }
  });

  var layout = renderer.layout;
  window.layout = layout;

  function getX(year) {
    return (year - 1950) * 100;
  }

  renderer.node(function(node) {
    var data = node.data;
    var ui;

    if (node.data.isMarker) {
      ui = svg.compile([
        "<g>",
        "<circle fill='red' r='2px'></circle>",
        "</g>"
      ].join('\n'));
    } else {
      ui = svg.compile([
        "<g>",
        "<circle fill='deepskyblue' r='5px'></circle>",
        "<text fill='#ddd' y='-10' x='-5'>{{text}}</text>",
        "</g>"
      ].join('\n'));

      var info = node.data.info;
      var title = info.name || node.data.title;

      ui.dataSource({
        text: title
      });
    }
    return ui;
  }).placeNode(function(nodeUI, pos, model) {
    var x, y;
    if (model.data.isMarker) {
      var parentPos = model.data.pos;
      if (!parentPos) {
        parentPos = model.data.pos = layout.getNodePosition(model.data.parentId);
      }

      y = parentPos.y;
      x = getX(model.data.year);
      displayX = getX(model.data.displayX);
      layout.setNodePosition(model.id, x, y);

      nodeUI.attr('transform', 'translate(' + displayX + ',' + y + ')');
    } else {
      var info = model.data.info;
      x = getX(info.layoutYear);
      y = pos.y;
      if (isNaN(x)) x = pos.x;

      layout.setNodePosition(model.id, x, y);

      displayX = getX(info.parsedYear);
      nodeUI.attr('transform', 'translate(' + displayX + ',' + y + ')');
    }
  });

  renderer.link(function(linkUI, pos) {
    return svg("line").attr("stroke", "#eee");
  });

  renderer.run();

  function buildGraph(graph) {
    var wiki = require('./wikipediaClient')($http, $q, log);
    var addTimeLineNodes = require('./timelineNodes');
    var graphBuilder = require('./languageInfluenceGraphBuilder')(wiki, log);

    graphBuilder.build(graph).then(function(graph) {
      log('Done. Found ' + graph.getNodesCount() + ' languages and ' + graph.getLinksCount() + ' connections.');
      addTimeLineNodes(graph);
    });
  }

  function log(message) {
    console.log(message);
    $scope.logMessage = message;
  }
}

function escapeWikiUrl(name) {
  return name.replace(/\s/g, '_');
}

AppController.$inject = ['$scope', '$http', '$q'];
