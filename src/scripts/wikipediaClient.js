module.exports = wiki;

var wikiapi = 'http://en.wikipedia.org/w/api.php';

function wiki(http, q) {
  return {
    getAllLanguages: getAllLanguages,
    getPages: getPages,
  };

  function getPages(allPages) {
    // wikipedia API supports only 50 pages at once
    var chunksOfWork = [];
    while (allPages.length) {
      var chunk = allPages.splice(0, Math.min(50, allPages.length));
      chunksOfWork.push(getPagesChunk(chunk));
    }

    return q.all(chunksOfWork).then(function(responses) {
      var all = [];

      for (var i=0; i < responses.length; ++i) {
        Object.keys(responses[i]).forEach(save(i));
      }

      return all;

      function save(i) {
        var page = responses[i];
        return function (key) {
          all.push(page[key]);
          return page[key];
        };
      }

    });
  }

  function getAllLanguages(limit) {
    return getPagesUsingTemplate('Template:Infobox_programming_language', limit);
  }

  function getPagesChunk(pageids) {
    var params = {
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      rvsection: 0,
      pageids: pageids.join('|'),
      format: 'json',
      callback: 'JSON_CALLBACK'
    };

    return http.jsonp(wikiapi, { params: params })
      .then(function(res) {
        var pages = res.data.query.pages;
        return pages;
      });
  }

  function getPagesUsingTemplate(templateTitle, limit) {
    if (typeof limit !== 'number') limit = 500;

    var totalFetched = 0;

    var params = {
      action: 'query',
      list: 'embeddedin',
      eititle: templateTitle,
      eifilterredir: 'nonredirects',
      einamespace: 0,
      eilimit: limit,
      format: 'json',
      callback: 'JSON_CALLBACK'
    };

    return get(params, []);

    function get(params, all) {
      return http.jsonp(wikiapi, {
        params: params
      }).then(getNextPage);

      function getNextPage(res) {
        if (res.status !== 200) throw new Error('Failed to download template usage for ' + templateTitle);
        var data = res.data;
        var nextPage = data['query-continue'];

        all = all.concat(data.query.embeddedin);
        totalFetched = all.length;
        if (nextPage && totalFetched < limit) {
          params.eicontinue = nextPage.embeddedin.eicontinue;
          return get(params, all);
        } else {
          return all;
        }
      }
    }
  }
}
