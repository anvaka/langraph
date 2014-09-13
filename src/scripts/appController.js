var templateParser = require('./templateParser');

require('an').controller(AppController);

function AppController($scope, $http, $q) {
  var wiki = require('./wikipediaClient')($http, $q);
  var foundLanguages = {};

  $scope.logMessage = 'Building wikipedia graph...';

  // todo: this should really be a graph builder, not app controller:
  wiki.getAllLanguages()
    .then(getPageContent)
    .then(parseInfoBox)
    .then(addCrossLinks)
    .then(log);

  function getPageContent(languages) {
    $scope.logMessage = 'Done. Getting page content';
    $scope.languages = languages.map(toView);
    $scope.languages.forEach(save);

    return wiki.getPages(languages.map(toPageid));

    function save(language) {
      if (!language.title) debugger;
      foundLanguages[language.title] = language;
    }
  }

  function parseInfoBox(pages) {
    pages.map(toInfoBox).forEach(saveInfobox);

    return foundLanguages;

    function saveInfobox(infoBox) {
      if (!infoBox.title) debugger;
      foundLanguages[infoBox.title].info = infoBox.info;
    }
  }

  function addCrossLinks(languages) {
    Object.keys(languages).forEach(addLinks);
    return foundLanguages;

    function addLinks(key) {
      var info = languages[key].info;
      info.parsedInfluenced.forEach(checkLinkExist);
      info.parsedInfluencedBy.forEach(checkLinkExist);
    }

    function checkLinkExist(language) {
      language.ref = foundLanguages[language.link];
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
  console.log('processing', page.title);
  var info = templateParser(page.revisions[0]['*']);
  info.parsedYear = sanitizeDates(info);
  info.parsedInfluenced = parseLanguagesList(info.influenced);
  info.parsedInfluencedBy = parseLanguagesList(info.influenced_by);

  return {
    title: page.title,
    id: page.pageid,
    info: info
  };
}

function parseLanguagesList(wikiText) {
  var result = [];
  var knownLanguages = Object.create(null);
  if (!wikiText) return result;

  var languageRegex = /\[\[(.+?)(?:\|(.+?))?\]\]/g;
  var match;

  while ((match = languageRegex.exec(wikiText))) {
    var languageLink = match[1];
    if (knownLanguages[languageLink]) continue;
    knownLanguages[languageLink] = 1;

    result.push({
      name: match[2] || languageLink,
      link: languageLink
    });
  }

  return result;
}

function sanitizeDates(infoBox) {
  return probe(infoBox.year) ||
    probe(infoBox.released) ||
    probe(infoBox.latest_release_date) ||
    probe(infoBox['latest release date']);

  function probe(year) {
    if (!year) return;
    var numericMatch = year.match(/((?:19\d\d)|(?:2\d{3}))/);
    if (numericMatch) {
      return parseInt(numericMatch[1], 10);
    }
  }
}


AppController.$inject = ['$scope', '$http', '$q'];
