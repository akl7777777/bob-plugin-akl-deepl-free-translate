var config = require('./config.js');
var utils = require('./utils.js');

// 入参格式:
// {"jsonrpc":"2.0","method" : "LMT_handle_texts","id":125090001,"params":{"texts":[{"text":"You trusted all proxies, this is NOT safe. We recommend you to set a value.","requestAlternatives":3}],"splitting":"newlines","lang":{"source_lang_user_selected":"EN","target_lang":"ZH"},"timestamp":1676555144560}}
// 出参格式:
// {"rawData":{},"data":{"jsonrpc":"2.0","id":194187000,"result":{"texts":[{"text":"参数","alternatives":[{"text":"Params"},{"text":"参数表"},{"text":"参量"}]}],"lang":"EN","lang_is_confident":false,"detectedLanguages":{"SK":0.011904,"ZH":0.005038,"unsupported":0.505983,"PT":0.040255,"PL":0.020479,"SL":0.024711999999999994,"DE":0.02167,"RO":0.013807,"ES":0.016012,"TR":0.027060000000000008,"NB":0.022891,"ET":0.016899,"EL":0.001863,"FI":0.016634,"SV":0.030546,"FR":0.017381,"NL":0.022213,"HU":0.017405,"CS":0.014604000000000002,"EN":0.037805,"DA":0.013585999999999997,"IT":0.024718,"JA":0.0064249999999999976,"BG":0.002212,"LT":0.023487,"ID":0.012715,"UK":0.001442,"KO":0.001697,"RU":0.004128,"LV":0.024428}}}

function initData(source_lang, target_lang) {
  return {
    jsonrpc: '2.0',
    method: 'LMT_handle_texts',
    params: {
      splitting: 'newlines',
      lang: {
        source_lang_user_selected: source_lang,
        target_lang: target_lang
      }
    }
  };
}

function getICount(translate_text) {
  return translate_text.split('i').length - 1;
}

function getRandomNumber() {
  const rand = Math.floor(Math.random() * 99999) + 100000;
  return rand * 1000;
}

function getTimeStamp(iCount) {
  const ts = Date.now();
  if (iCount !== 0) {
    iCount = iCount + 1;
    return ts - (ts % iCount) + iCount;
  } else {
    return ts;
  }
}

function supportLanguages() {
  return config.supportedLanguages.map(([standardLang]) => standardLang);
}

function translate(query, completion) {
  (async () => {
    const targetLanguage = utils.langMap.get(query.detectTo);
    const sourceLanguage = utils.langMap.get(query.detectFrom);
    if (!targetLanguage) {
      const err = new Error();
      Object.assign(err, {
        _type: 'unsupportLanguage',
        _message: '不支持该语种',
      });
      throw err;
    }
    const source_lang = sourceLanguage || 'ZH';
    const target_lang = targetLanguage || 'EN';
    const translate_text = query.text || '';
    if (translate_text !== '') {
      const url = 'https://www2.deepl.com/jsonrpc';
      let id = getRandomNumber()
      const post_data = initData(source_lang, target_lang);
      const text = {
        text: translate_text,
        requestAlternatives: 3
      };
      post_data.id = id;
      post_data.params.texts = [text];
      post_data.params.timestamp = getTimeStamp(getICount(translate_text));
      let post_str = JSON.stringify(post_data);
      if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
        post_str = post_str.replace('"method":"', '"method" : "');
      } else {
        post_str = post_str.replace('"method":"', '"method": "');
      }
      try {
        $http.request({
          method: "POST",
          url: url,
          header: { 'Content-Type': 'application/json' },
          body: $data.fromUTF8(post_str),
          handler: function (resp) {
            if (resp.data && resp.data.result && resp.data.result.texts && resp.data.result.texts.length) {
              completion({
                result: {
                  from: query.detectFrom,
                  to: query.detectTo,
                  toParagraphs: resp.data.result.texts[0].text.split('\n'),
                },
              });
            } else {
              const errMsg = resp.data ? JSON.stringify(resp.data) : '未知错误'
              completion({
                error: {
                  type: 'unknown',
                  message: errMsg,
                  addtion: errMsg,
                },
              });
            }
          }
        });
      }
      catch (e) {
        Object.assign(e, {
          _type: 'network',
          _message: '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
      }
    }
  })().catch((err) => {
    completion({
      error: {
        type: err._type || 'unknown',
        message: err._message || '未知错误',
        addtion: err._addtion,
      },
    });
  });
}

exports.supportLanguages = supportLanguages;
exports.translate = translate;
