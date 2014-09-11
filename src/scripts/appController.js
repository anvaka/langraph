require('an').controller(AppController);

function AppController($scope, $http, $q) {
  var wiki = require('./wikipediaClient')($http, $q);
  var foundLanguages = {};

  $scope.logMessage = 'Building wikipedia graph...';

  // todo: this should really be a graph builder, not app controller:
  wiki.getAllLanguages(10)
    .then(getPageContent)
    .then(parseInfoBox)
    .then(log);

  function getPageContent(languages) {
    $scope.logMessage = 'Done. Getting page content';
    $scope.languages = languages.map(toView);
    $scope.languages.forEach(save);

    return wiki.getPages(languages.map(toPageid));

    function save(language) {
      foundLanguages[language.pageid] = language;
    }
  }


  function parseInfoBox(pages) {
    pages.map(toInfoBox).forEach(saveInfobox);

    return foundLanguages;

    function saveInfobox(infoBox) {
      foundLanguages[infoBox.id].info = infoBox.info;
    }
  }
}

function toView(language) {
  return {
    pageid: language.pageid,
    url: '//www.wikipedia.org/wiki/' + escapeWikiUrl(language.title),
    title: language.title
  };
}

function log(message) {
  console.log(message);
}

function escapeWikiUrl(name) {
  return name.replace(/\s/g, '_');
}

function toPageid(language) {
  return language.pageid;
}


function toInfoBox(page) {
  var result = {};
  var lines = page.revisions[0]['*'].split('\n');
  var infoboxLines = [];
  var info = {};
  var lastKey, lastObject;
  console.log('processing', page.title);

  var isWaitInfoBox = true;
  var isReadInfoBox = true;
  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    if (isWaitInfoBox) {
      if (line.length !== 30) continue;
      if (line.match(/^{{Infobox programming language$/i)) {
        isWaitInfoBox = false;
        isReadInfoBox = true;
      }
    } else if (isReadInfoBox) {
      if (line.match(/^}}\s*/)) break; // we are done
      var keyValueMatch = line.match(/\|\s*(.+?)\s*=(?:\s*(.+?)\s*)?$/);
      if (keyValueMatch) {
        lastObject = keyValueMatch[2];
        lastKey = keyValueMatch[1];
        info[lastKey] = lastObject;
      } else {
        console.log('warning, could not parse', line);
        if (!info[lastKey]) {
          info[lastKey] = line;
        } else {
          info[lastKey] += '\n' + line;
        }
      }
    }
  }


  return {
    title: page.title,
    id: page.pageid,
    info: info
  };
}

AppController.$inject = ['$scope', '$http', '$q'];
