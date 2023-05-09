import http from 'http'
import CryptoJS from 'crypto-js'
import fs from 'node:fs'
//import axios from 'axios'
import axios from 'axios'
//debugger
let path = './plugins/genshin/resources/html/geetest'
let port = 4399;
let isPublicnetwork = false;
let IPaddress = '127.0.0.1';
var getHtmlData = typeof getHtmlData == 'function' ? getHtmlData : function e(s) {
    let data = {};
    function get(key) {
        if (!data[key]) {
            data[key] = fs.readFileSync(path + key, { encoding: 'utf-8' })
        }
        return data[key]
    }
    return get
}()
function Captcha() {
    this.CaptchaData = {};
    setTimeout(() => {
        //console.log('开始清理无用数据')
        this.clearCaptcha()
    }, 30000);
}
Captcha.prototype = {
    setCaptcha: function (gt, cg) {
        let key = CryptoJS.MD5(gt + cg).toString();
        this.CaptchaData[key] = {
            gt: gt,
            challenge: cg,
            type: cg == '' ? 4 : 3,
            Validate: {
                geetest_challenge: '',
                geetest_validate: '',
                geetest_seccode: ''
            },
            timetemp: new Date().getTime()
        }
        return key
    },
    getCaptcha: function (sign) {
        try {
            if (this.CaptchaData[sign].Validate.geetest_validate != '') return this.CaptchaData[sign].Validate
        } catch (error) { }
        try {
            return this.CaptchaData[sign];
        } catch (error) {

        }
    },
    newCaptcha: async function () {
        let url = 'https://www.geetest.com/demo/gt/register-click-official?t=' + new Date().getTime();
        let data = await axios.get(url)
        data = data.data;
        return this.setCaptcha(data.gt, data.challenge);
        debugger
    },
    setValidate: function (e) {
        let sign = e.sign;
        delete e.sign
        this.CaptchaData[sign].Validate = e;
        this.CaptchaData[sign].timetemp = new Date().getTime()
        //this.CaptchaData[sign].Validate = {};

    },
    clearCaptcha: async function () {
        let th = this;
        let nowTime = new Date().getTime();
        Object.keys(this.CaptchaData).forEach(e => {
            let timetemp = this.CaptchaData[e].timetemp + 300000;
            if (timetemp < nowTime) delete this.CaptchaData[e]
        })
        setTimeout(() => {
            th.clearCaptcha()
        }, 30000);
    }
}
if (!global.mysCaptchaServer) {
    console.log('正在启动验证服务')
    const server = http.createServer(function (req, res) {
        if (req.method == 'GET') {
            {
                var url = req.url;
                var params = {};
                var i = 0;
                if (i = url.indexOf("?"), i != -1) {
                    let d = url.slice(i + 1, url.length);
                    url = url.slice(0, i)
                    d.split("&").forEach(e => {
                        let key = e.split("=");
                        params[key[0]] = key[1]
                    })
                }
            }
            let data;
            switch (url) {
                case '/':
                case '/index.html':
                    if (!params.sign) {
                        captcha.newCaptcha().then(e => {
                            res.statusCode = 302;
                            res.setHeader("Location", '/index.html?sign=' + e)
                            res.end()
                        })
                        return
                    }
                    data = fs.readFileSync(path + '/index.html', { encoding: 'utf-8' })
                    res.end(data)
                    break
                case '/ret':
                    data = JSON.parse(req.headers.geetest)
                    console.log(data)
                    captcha.setValidate(data)
                    res.end('OK')
                    break;
                case '/getCaptcha':
                    res.setHeader('content-type', 'application/json; charset=utf-8')
                    let retdata = {
                        code: 0,
                        message: 'success',
                        data: {}
                    }
                    data = captcha.getCaptcha(params.sign);
                    if (data == undefined) retdata.code = -1, retdata.message = "该sign值不存在或已超时"
                    retdata.data = data || {}
                    res.end(JSON.stringify(retdata))
                    break;
                case '/Publicnetwork':
                    res.end('OK')
                    break;
                case '/newCaptcha':
                    data = captcha.setCaptcha(params.gt, params.challenge)
                    res.end(data)
                    break;
                default:
                    data = getHtmlData(url)
                    res.setHeader('Last-Modified', 'Mon, 03 Apr 2023 13:37:30 GMT')
                    console.log(`发送了${url}文件`)
                    res.end(data)

            }
            return
        }
        console.log("有客户")
        let data = new Uint8Array();
        req.on('data', function (d) {
            data += d;
            console.log('有数据')
        })
        req.on('end', function () {
            console.log(data + '')
            captcha.setValidate(JSON.parse(data), params.sign)
            res.end("success")
        })
        //res.end("success")
    });
    global.mysCaptchaServer = server
    global.mysCaptchaServer.listen(port, '',)
    new Promise(async (res, rej) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        let data = (await axios.get('https://qifu-api.baidubce.com/ip/local/geo/v1/district')).data
        if (data.code == 'Success' || data.msg == "查询成功") {
            IPaddress = data.ip;
            axios.get(`http://${data.ip}:${port}/Publicnetwork`, { timeout: 5000 })
                .then(e => {
                    isPublicnetwork = true;
                    console.log(`当前ip:${IPaddress} 为可访问到本机的公网IP`)
                })
                .catch(e => {
                    isPublicnetwork = false;
                    console.log(`当前ip:${IPaddress} 为无法访问到本机的外网IP\n设置为本地ip:127.0.0.1`)
                    IPaddress = '127.0.0.1'
                })
        } else {
            console.error('ip接口查询异常')
            console.info(JSON.stringify(data))
        }
    })
}
if (!global.mysCaptchaData) {
    var captcha = new Captcha();
    global.mysCaptchaData = captcha;
}
export default class mysCaptchaServer {
    constructor() {
        this.captcha = global.mysCaptchaData;
        this.host = IPaddress + ":" + port;
    }
    getCaptchaHtmlUrl(gt, challenge) {
        let sign = this.captcha.setCaptcha(gt, challenge);
        return {
            url: `http://${this.host}/index.html?sign=` + sign,
            sign: sign
        }
    }
    getValidate(sign) {
        let ret = this.captcha.getCaptcha(sign)
        if (ret.geetest_validate != undefined) {
            return ret;
        } else if (ret?.Validate.geetest_validate == '') {
            return false;
        }
    }
}