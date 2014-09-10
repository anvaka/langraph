require('an').controller(AppController);

function AppController($scope, $http, $q) {
  var wiki = require('./wikipediaClient')($http, $q);

  $scope.logMessage = 'Building wikipedia graph...';

  // todo: this should really be a graph builder, not app controller:
  wiki.getAllLanguages(10).then(getPageContent).then(
  function log(x) {
    console.log(x);
  });

  function getPageContent(languages) {
    $scope.logMessage = 'Done. Getting page content';
    $scope.languages = languages.map(toView);

    return wiki.getPages(languages.map(toPageid));
  }
}

function toView(language) {
  return {
    url: '//www.wikipedia.org/wiki/' + escapeWikiUrl(language.title),
    title: language.title
  };
}

function escapeWikiUrl(name) {
  return name.replace(/\s/g, '_');
}

function toPageid(language) {
  return language.pageid;
}

AppController.$inject = ['$scope', '$http', '$q'];
