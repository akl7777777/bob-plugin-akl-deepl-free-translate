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
                toDict.phonetics.push({
                    "type": "us",
                    "value": '',
                    "tts": {
                        "type": "url",
                        "value": "https://dict.youdao.com/dictvoice?audio=" + translate_text + '&type=2'
                    }
                })
                toDict.phonetics.push({
                    "type": "uk",
                    "value": '',
                    "tts": {
                        "type": "url",
                        "value": "https://dict.youdao.com/dictvoice?audio=" + translate_text + '&type=1'
                    }
                })
                const patsArr = []
                $aLink.each(function () {
                    if ($(this).prop('id')) {
                        patsArr.push({part: $(this).next().text(), means:[$(this).text()]})
                        toDict.parts.push({part: $(this).next().text(), means:[$(this).text()]})
                    }
                })

                // 把同类型的分组合并到新数组
                let newArr = []
                let means = []
                let tmpName = ''
                for (let i = 0; i < patsArr.length; i++) {
                    if (i===0){
                        // 第一个直接赋值
                        tmpName = patsArr[i].part
                    }
                    if (patsArr[i].part === tmpName) {
                        // 相同直接push
                        means.push(patsArr[i].means[0])
                    }else {
                        // 不同先push到新数组,再清空
                        newArr.push({part: tmpName, means: JSON.parse(JSON.stringify(means))})
                        means = []
                        tmpName = patsArr[i].part
                        means.push(patsArr[i].means[0])
                        if (i===patsArr.length-1){
                            break
                        }
                    }
                    if (i===patsArr.length-1){
                        newArr.push({part: tmpName, means: JSON.parse(JSON.stringify(means))})
                        means = []
                    }
                }
                toDict.parts = newArr
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
