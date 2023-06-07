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

let tools = {
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
            url: '/api/getDataByPicMd5',
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
            url: "/api/newClickData",
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
            url: '/api/getDataByPicUrl',
            data: JSON.stringify({
                url: url,
            })
        })
        return data
    }
}
let captcha = {
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
//提示框创建
function showDialog(message) {
    const modal = document.querySelector('#overlay');
    const okButton = document.querySelector('#okButton');
    const cancelButton = document.querySelector('#cancelButton');
    window.hideDialog = () => {
        modal.style.display = 'none';
    }
    okButton.addEventListener('click', hideDialog);
    cancelButton.addEventListener('click', hideDialog);

    $('.message')[0].innerText = message;
    modal.style.display = 'block';
}

!function (th) {
    let geetest_key = 'gct_path'
    var _geetestData = {
        pic_type: "",
        pic_md5: "",
        pic_url: "",
        naturalWidth: 0,
        naturalHeight: 0,
        clickArray: [],
        captchaArray: [],
        type: '',
        new: true
    };
    getGeetest(async e => {
        let data = e[0].data
        let keys = Object.keys(data)
        //geetest_big_item
        if (keys.includes(geetest_key)) {
            setTimeout(() => {
                _geetestData.clickArray = [];
                let geetest = document.querySelector('.geetest_commit');
                geetest.addEventListener('click', (event) => {
                    console.log(_geetestData.clickArray)
                })
                document.querySelector('.geetest_big_item').addEventListener('click', function item(event) {
                    let { top, left } = $('.geetest_item_wrap').offset()
                    _geetestData.clickArray.push([Math.round(event.clientX - left), Math.round(event.clientY - top)])
                    setTimeout(() => {
                        let arr = document.querySelectorAll('.geetest_mark_show');
                        for (const dom of arr) {
                            if (!dom.isok) {
                                dom.addEventListener('click', function mark_show(event) {
                                    let num = parseInt(this.firstChild.textContent) - 1
                                    for (; num < _geetestData.clickArray.length;) {
                                        _geetestData.clickArray.pop()
                                    }
                                })
                                dom.isok = true
                            }
                        }
                    }, 100);
                })
            }, 200);
            console.log(data)
            if (keys.includes('pic_type')) {
                geetest_key = 'pic_type';
                //click
                let pic_type = data['pic_type'];
                _geetestData.pic_type = pic_type;
                _geetestData.pic_url = `https://static.geetest.com${data.pic}?challenge=${window.GeeChallenge}`;
                console.log(_geetestData.pic_url)
                var picdata = await tools.getPicData(_geetestData.pic_url);
                console.log(picdata)
                _geetestData.pic_md5 = tools.calculateMD5(new Uint8Array(picdata))
                console.log(_geetestData.pic_md5)
                const img = new Image();
                img.src = _geetestData.pic_url;
                img.onload = function () {
                    _geetestData.naturalWidth = img.naturalWidth, _geetestData.naturalHeight = img.naturalHeight;
                    console.log('原始宽度：', img.naturalWidth);
                    console.log('原始高度：', img.naturalHeight);
                };

                var captchaData = await tools.getDataByPicMd5('gt3', 'click', _geetestData.pic_md5)
                switch (captchaData.code) {
                    case 0:
                        //查询成功，执行模拟操作流程
                        break;
                    case -4:
                        let data = await tools.getDataByPicUrl(_geetestData.pic_url);
                        if (data.code == 10000) {
                            let clickdata = data.data.data;
                            clickdata = function (data) {
                                let retdata = [];
                                let width = Math.floor($('.geetest_item_img').width()), height = Math.floor($('.geetest_item_img').height())
                                clickdata.split('|').forEach(e => {
                                    let _d = e.split(',').map(e => {
                                        return parseInt(e)
                                    });
                                    _geetestData.captchaArray.push([_d[0], _d[1]])
                                    _d[0] = Math.floor(_d[0] * (width / _geetestData.naturalWidth)),
                                        _d[1] = Math.floor(_d[1] * (height / _geetestData.naturalHeight))
                                    retdata.push([_d[0], _d[1]])
                                });
                                return retdata
                            }(clickdata)

                            captcha.wordGt3(clickdata)
                        }
                        break

                }
            }
        } else if (keys.includes('result') && keys.length == 1) {
            _geetestData.type = data['result'];
            console.log('验证模式：' + _geetestData.type)
        }
    })
    function _init_(gt, challenge) {
        if (!challenge) {
            location.href = './gt4.html?gt=' + gt
            return
        }
        initGeetest({
            // 以下 4 个配置参数为必须，不能缺少
            gt: gt,
            challenge: challenge,
            offline: false, // 表示用户后台检测极验服务器是否宕机
            new_captcha: true, // 用于宕机时表示是新验证码的宕机
            timeout: '5000',
            product: "bind", // 产品形式，包括：float，popup
            width: "300px",
            https: true
            // 更多前端配置参数说明请参见：http://docs.geetest.com/install/client/web-front/
        }, function (e) {
            $('#wait').hide(),
                u = e,
                e.onReady((() => {
                    e.verify(),
                        e.onSuccess((() => {
                            var result = e.getValidate();
                            if (!result) {
                                return alert('请完成验证');
                            };
                            try {
                                result.sign = getParams('sign');
                                $.ajax('ret', {
                                    headers: {
                                        Geetest: JSON.stringify(result)
                                    },
                                    success: function (e) {
                                        console.log(e)
                                    }
                                })
                                tools.newClickData('gt3', 'click', _geetestData.pic_md5, _geetestData.new ? _geetestData.captchaArray.join('|') : _geetestData.clickArray.join('|'), _geetestData.pic_type)
                                result.isOK = 1;
                                console.info(JSON.stringify(result))
                                showDialog('验证成功')
                            } catch (error) {

                            }
                        }
                        ))
                }
                )),
                e.onError((t => {
                }
                ))
        })
    }
    th._init_ = _init_;
}(this)