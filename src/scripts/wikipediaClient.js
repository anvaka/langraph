module.exports = wiki;

var wikiapi = 'http://en.wikipedia.org/w/api.php';

function wiki(http) {
  return {
    getAllLanguages: getAllLanguages
  };

  function getAllLanguages() {
    return getPagesUsingTemplate('Template:Infobox_programming_language');
  }

  function getPagesUsingTemplate(templateTitle) {
    var params = {
      action: 'query',
      list: 'embeddedin',
      eititle: templateTitle,
      eifilterredir: 'nonredirects',
      einamespace: 0,
      eilimit: 500,
      format: 'json',
      callback: 'JSON_CALLBACK'
    };

    return get(params, []);

    function get(params, all) {
      return http.jsonp(wikiapi, { params: params }).then(getNextPage);

      function getNextPage(res) {
        if (res.status !== 200) throw new Error('Failed to download template usage for ' + templateTitle);
        var data = res.data;
        var nextPage = data['query-continue'];

        all = all.concat(data.query.embeddedin);
        if (nextPage) {
          params.eicontinue = nextPage.embeddedin.eicontinue;
          return get(params, all);
        } else {
          return all;
        }
      }
    }
  }
}
