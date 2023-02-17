var config = require('./config.js');

const langMap = new Map(config.supportedLanguages);
const langMapReverse = new Map(config.supportedLanguages.map(([standardLang, lang]) => [lang, standardLang]));

exports.langMap = langMap;
exports.langMapReverse = langMapReverse;
