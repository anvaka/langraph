module.exports = parseInfoBox;

function parseInfoBox(pageContent) {
  var result = {};
  var lines = pageContent.split('\n');
  var infoboxLines = [];
  var info = {};
  var lastKey, lastObject;

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

  return info;
}
