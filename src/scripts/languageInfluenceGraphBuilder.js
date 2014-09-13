var templateParser = require('./templateParser');

module.exports = languageInfluenceGraphBuilder;

function languageInfluenceGraphBuilder(wikiClient, log) {
  return {
    build: build
  };

  function build(graph) {
    return wikiClient.getAllLanguages()
      .then(getPageContent)
      .then(parseInfoBox)
      .then(addCrossLinks);

    function getPageContent(languages) {
      return wikiClient.getPages(languages.map(toPageid));
    }

    function parseInfoBox(pages) {
      pages.map(toInfoBox).forEach(addNode);
      return graph;

      function addNode(infoBox) {
        graph.addNode(infoBox.title, infoBox);
      }
    }

    function toInfoBox(page) {
      log('Processing' + page.title);

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

  function addCrossLinks(graph) {
    graph.forEachNode(addLinks);
    return graph;

    function addLinks(node) {
      var info = node.data.info;
      if (!node.data) {
        // Probably page does not contain programming language infobox.
        return;
      }

      info.parsedInfluenced.forEach(function (other) { addLink(node.id, other.link); });
      info.parsedInfluencedBy.forEach(function (other) { addLink(other.link, node.id); });

      function addLink(from, to) {
        var fromNode = graph.getNode(from);
        var toNode = graph.getNode(to);

        if (!fromNode) {
          console.log("Language is not found in the list: ", from);
        }

        if (!toNode) {
          console.log("Language is not found in the list: ", to);
        }

        // todo: potentially we can find pages which are missing edges here:
        // e.g. A -- [influenced] -> B, but B -- [missing influenced by] --> A.
        if (!graph.hasLink(from, to)) {
          graph.addLink(from, to);
        }
      }
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
