var config = require('./config.js');
var utils = require('./utils.js');
var dd193 = require('./d193.js');
var dd243 = require('./d243.js');
var wordJs = require('./word.js');

// The current endpoint uses case-sensitive language tags instead of JSON-RPC codes.
function endpointLanguage(language) {
    const variants = {
        'EN': 'en-US',
        'PT': 'pt-BR',
        'ZH-HANS': 'zh-Hans',
        'ZH-HANT': 'zh-Hant'
    };
    return variants[language] || language.toLowerCase();
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
            const wordSwitch = $option.wordSwitch;
            // 英文单词判定正则表达式
            if (wordSwitch == '1' && /^[a-zA-Z,\.\?!'\s]+$/.test(translate_text)
                && translate_text.split(/\s+/).filter(word => /^[a-zA-Z\s]+$/.test(word)).length === 1) {
                await wordJs.translate(query, source_lang, target_lang, translate_text, completion);
            }
            const url = 'https://oneshot-free.www.deepl.com/v1/translate';
            const post_data = {
                text: [translate_text],
                target_lang: endpointLanguage(target_lang)
            };
            if (source_lang !== 'auto') {
                post_data.source_lang = source_lang === 'EN' ? 'en' : endpointLanguage(source_lang);
            }
            try {
                const serv = $option.service;
                if (serv === 'alpha') {
                    await dd193.translate(query, source_lang, target_lang, translate_text, completion)
                } else if (serv === 'beta') {
                    await dd243.translate(query, source_lang, target_lang, translate_text, completion)
                }
                const resp = await $http.request({
                    method: "POST",
                    url: url,
                    header: {'Content-Type': 'application/json'},
                    body: $data.fromUTF8(JSON.stringify(post_data))
                });
                if (resp.data && resp.data.translations && resp.data.translations.length && typeof resp.data.translations[0].text === 'string') {
                    completion({
                        result: {
                            from: query.detectFrom,
                            to: query.detectTo,
                            toParagraphs: resp.data.translations[0].text.split('\n'),
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
            } catch (e) {
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
