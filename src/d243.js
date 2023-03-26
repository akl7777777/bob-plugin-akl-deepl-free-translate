const {random, random_safe} = require("./e.js");


async function translate(query, source_lang, target_lang, translate_text, completion) {
    const rd = '0.243'
    try {
        const url = 'aHR0cDovLzE' + random(rd).slice(2, 3) + 'My' + random(rd).slice(2, 3) + 'yMjEuMTE2LjE5Mzo2' + random(rd).slice(0, 1) + 'DQzLw'
        const resp = await $http.request({
            method: "POST",
            url: random_safe(url + '==').concat('/translate'),
            body: {"text": translate_text, "source_lang": source_lang, "target_lang": target_lang},
            header: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        if (resp.data && resp.data.data) {
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: resp.data.data.split('\n'),
                },
            });
        } else {
            const errMsg = resp.data ? JSON.stringify(resp.data) : '请求翻译接口失败,请检查网络'
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
