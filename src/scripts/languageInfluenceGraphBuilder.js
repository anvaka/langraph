var templateParser = require('./templateParser');

module.exports = languageInfluenceGraphBuilder;

function languageInfluenceGraphBuilder(wikiClient) {
  var foundLanguages = {};

  return {
    build: build
  };

  function build(graph) {
    return wikiClient.getAllLanguages()
      .then(getPageContent)
      .then(parseInfoBox)
      .then(addCrossLinks);
  }

  function getPageContent(languages) {
    return wikiClient.getPages(languages.map(toPageid));
  }

  function parseInfoBox(pages) {
    pages.map(toInfoBox).forEach(saveInfobox);
    return foundLanguages;

    function saveInfobox(infoBox) {
      foundLanguages[infoBox.title] = infoBox;
    }
  }

  function toInfoBox(page) {
    console.log('processing', page.title);
    var info = templateParser(page.revisions[0]['*']);
    info.parsedYear = sanitizeDates(info);
    info.parsedInfluenced = parseLanguagesList(info.influenced);
    info.parsedInfluencedBy = parseLanguagesList(info.influenced_by || info['influenced by']);

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

function toPageid(language) {
  return language.pageid;
}

function sanitizeDates(infoBox) {
  return probeYear(infoBox.year) ||
    probeYear(infoBox.released) ||
    probeYear(infoBox.latest_release_date) ||
    probeYear(infoBox['latest release date']);
}

function probeYear(year) {
  if (!year) return;
  var numericMatch = year.match(/((?:19\d\d)|(?:2\d{3}))/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }
}
