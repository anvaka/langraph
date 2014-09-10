require('an').controller(AppController);

function AppController($scope, $http) {
  var wiki = require('./wikipediaClient')($http);

  $scope.logMessage = 'Building wikipedia graph...';

  wiki.getAllLanguages(10).then(function (languages) {
    $scope.logMessage = 'Done';
    $scope.languages = languages.map(toView);
  });
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
