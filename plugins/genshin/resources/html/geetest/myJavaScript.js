/**
 * 获取URL中的指定或全部参数
 * @param {string|undefined} key 指定的参数名，留空则获取全部
 * @returns {object|string} 返回指定参数名的值，或返回全部参数值
 */
function getParams(key) {
    let url = document.location.href;
    let i = 0;
    let params = [];
    if (i = url.indexOf("?"), i != -1) {
        let d = url.slice(i + 1, url.length);
        url = url.slice(0, i)
        d.split("&").forEach(e => {
            let key = e.split("=");
            params[key[0]] = key[1]
        })
    }
    return key == '' || key == undefined ? params : params[key]
}
async function _nine(arr) {
    let dom = $('.geetest_item_ghost');
    if (dom.length !== 9) return;

    for (const e of arr) {
        dom[e - 1].click();
        await sleep(300)
    }
}
async function _wordBygt4(arr) {
    let dom = $('.geetest_bg');
    if (dom.length !== 1) return;
    let { top, left } = dom.offset()
    dom = dom[0];
    for (const e of arr) {
        let x = e[0], y = e[1];
        console.log(x, y)
        let mouseEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x + left,
            clientY: y + top
        })
        dom.dispatchEvent(mouseEvent)
        //dom[e - 1].click();
        await sleep(500)
    }
    $('.geetest_submit').click()
}
async function sleep(ms) {
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}
/**
 * 
 * @param {Function} func 
 */
async function getGeetest(func) {
    function loggingDecorator(_func) {
        return function () {
            const result = _func.apply(this, arguments);
            func(arguments)
            return result;
        }
    }
    let keys = {};
    while (true) {
        Object.keys(window).forEach(e => {
            if (e.indexOf('geetest_') != -1) {
                if (keys[e]) return;
                keys[e] = window[e];
                window[e] = loggingDecorator(window[e]);
                console.log(e);
            }

        })
        await sleep(1)
    }
}

window.tools = {
    /**
     * 
     * @param {object} config 
     * @param {string|'GET'} config.method
     * @param {string} config.url
     * @param {string|'arraybuffer'} config.responseType 返回数据的格式
     * @param {string} config.data post要发送的数据
     * @returns 
     */
    HttpRequest: async ({ method = 'GET', responseType = '', url = '', data = '', Headers = {} } = {}) => {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.responseType = responseType;
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8')
            if (Headers) {
                Object.keys(Headers).forEach(e => {
                    xhr.setRequestHeader(e, Headers[e])
                })
            }
            //xhr.withCredentials = true;
            xhr.onload = function (e) {
                if (this.status == 200) {
                    var ret = this.response;
                    var contentType = xhr.getResponseHeader('content-type');
                    if (contentType.indexOf('application/json') != -1) {
                        ret = JSON.parse(ret);
                    }
                    resolve(ret)
                    return
                }
            };
            xhr.send(data);
        })
    },
    getDataByPicMd5: async function (geetestType, clickType, pic_md5) {
        var data = await this.HttpRequest({
            method: "POST",
            url: 'http://43.138.134.70/api/getDataByPicMd5',
            Headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            data: JSON.stringify({
                geetestType: geetestType,
                type: clickType,
                pic_md5: pic_md5
            })
        })
        return data
    },
    newClickData: async function (GeetestType, type, pic_md5, clickData, picType) {
        var data = this.HttpRequest({
            method: 'POST',
            url: "http://43.138.134.70/api/newClickData",
            Headers: {
                'Content-Type': 'charset=UTF-8; application/json'
            },
            data: JSON.stringify({
                GeetestType: GeetestType,
                "pic_md5": pic_md5,
                type: type,
                clickData: clickData,
                picType: picType
            })
        })
    },
    getPicData: async function (url) {
        var data = await this.HttpRequest({
            url: url,
            responseType: 'arraybuffer'
        })
        return data
    },
    calculateMD5: function (arraybuffer) {
        const wordArray = CryptoJS.lib.WordArray.create(arraybuffer);
        const md5Value = CryptoJS.MD5(wordArray);
        return md5Value.toString();
    },
    getDataByPicUrl: async function (url) {
        let data = await this.HttpRequest({
            method: 'POST',
            url: 'http://43.138.134.70/api/getDataByPicUrl',
            data: JSON.stringify({
                url: url,
            })
        })
        return data
    }
}
window.captcha = {
    /**
     * 
     * @param {Array} clickArray 
     */
    wordGt3: async function (clickArray) {
        let dom = $('.geetest_big_item');
        if (dom.length !== 1) return;
        let { top, left } = dom.offset()
        dom = dom[0];
        await sleep(1000)
        for (const e of clickArray) {
            let x = e[0], y = e[1];
            console.log(x, y)
            let mouseEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x + left,
                clientY: y + top
            })
            dom.dispatchEvent(mouseEvent)
            //dom[e - 1].click();
            await sleep(500)
        }
        $('.geetest_commit_tip').click()
    }
}
!function () {
   
}()