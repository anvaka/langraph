module.exports = addTimeLineNodes;

function addTimeLineNodes(graph) {
  var years = {};

  graph.forEachNode(countYear);
  var sortedYears = Object.keys(years)
    .sort(byYear)
    .map(toSortedYears);

  // now we go year by year, visiting every language, looking which other languages
  // it has influenced. During the span of its influence we want to insert
  // special nodes in the years between. this will let us draw a straight line
  // without affecting other nodes

  sortedYears.forEach(processYear);

  function processYear(yearInfo, yearIdx) {
    var allYears = sortedYears.length;
    if (yearIdx === allYears - 1) return; // nothing here

    yearInfo.languages.forEach(addInfluenceMarkers);

    function addInfluenceMarkers(language) {
      var links = graph.getLinks(language);
      var influenceEnds = getLastInfluencedYear(links);

      for (var nextMarker = yearIdx + 1; nextMarker < allYears; nextMarker += 1) {
        var nextYear = sortedYears[nextMarker].year;
        if (nextYear >= influenceEnds) break; // this language has no influence in future

        graph.addNode(language + '|marker' + nextYear, {
          year: nextYear + (0.5 - Math.random()),
          displayX: nextYear,
          isMarker: true,
          parentId: language
        });
      }
    }
  }

  function getLastInfluencedYear(links) {
    var lastYear = 0;
    links.forEach(findLatestInfluence);
    return lastYear;

    function findLatestInfluence(link) {
      // at this point we trust data
      var year = graph.getNode(link.toId).data.info.parsedYear;
      if (year > lastYear) lastYear = year;
    }
  }

  function countYear(node) {
    var languageYear = node.data.info.parsedYear;
    var yearDescription = years[languageYear];
    if (!yearDescription) {
      yearDescription = years[languageYear] = {
        year: languageYear,
        languages: []
      };
    }

    yearDescription.languages.push(node.id);
  }

  function toSortedYears(key) {
    return years[key];
  }

  function byYear(x, y) {
    return x - y;
  }
}
