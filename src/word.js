var xin = require('./nodejs.xiyueta.min.js')

async function translate(query, source_lang, target_lang, translate_text, completion) {
    try {
        const url = 'https://dict.deepl.com/english-chinese/search?ajax=1&source=english&onlyDictEntries=1&translator=dnsof7h3k2lgh3gda&kind=full&eventkind=keyup&forleftside=true&il=zh'
        const resp = await $http.request({
            method: "POST",
            url: url,
            body: {"query": translate_text},
            header: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        if (resp.data) {
            // 解析html
            const $ = xin.load(resp.data);
            const translation_lines = $(".translation_lines");
            let $aLink = $('a.dictLink');
            const toDict = {
                word: translate_text,
                phonetics: [],
                parts: [],
                exchanges: [],
                additions: []
            }
            if (translation_lines) {
                // toDict.phonetics.push({
                //     "type": "us",
                //     "value": 'xxx',
                //     "tts": {
                //         "type": "url",
                //         "value": "https://dict.youdao.com/dictvoice?audio="
                //     }
                // })
                // toDict.phonetics.push({
                //     "type": "uk",
                //     "value": 'xxx',
                //     "tts": {
                //         "type": "url",
                //         "value": "https://dict.youdao.com/dictvoice?audio="
                //     }
                // })
                $aLink.each(function () {
                    if ($(this).prop('id')) {
                        toDict.parts.push({part: $(this).next().text(), means:[$(this).text()]})
                    }
                })
                // if (word.wfs && word.wfs.length) {
                //     word.wfs.forEach(function (e) {
                //         toDict.exchanges.push({name: e.wf.name, words: [e.wf.value]})
                //     })
                // }
                // if (word.prototype) {
                //     toDict.exchanges.push({name: '原形', words: [word.prototype]})
                // }
                // toDict.additions.push({
                //     name: '标签',
                //     value: (resp.data.ec.exam_type ? resp.data.ec.exam_type.join('/') : '')
                // })
                completion({
                    result: {
                        from: query.detectFrom,
                        to: query.detectTo,
                        fromParagraphs: translate_text.split('\n'),
                        toParagraphs: ".".split("\n"),
                        toDict: toDict,
                    },
                });
            }
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: resp.data.data.split('\n'),
                },
            });
        } else {
            const errMsg = resp ? JSON.stringify(resp) : '请求翻译接口失败,请检查网络'
            completion({
                error: {
                    type: 'unknown',
                    message: errMsg,
                    addtion: errMsg,
                },
            });
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e))
        Object.assign(e, {
            _type: 'network',
            _message: '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}

exports.translate = translate;
