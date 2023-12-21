import YAML from 'yaml'
//import _http from 'http'
import CryptoJS from 'crypto-js'
import fs from 'node:fs'
import axios from 'axios'
import httpServer from './httpServer.js'
//debugger
let path = './plugins/genshin/resources/html/geetest'
let port = 4399;
let IPaddress = '127.0.0.1';
var getHtmlData = typeof getHtmlData == 'function' ? getHtmlData : function e(_s) {
    function get(key) {
        return fs.readFileSync(path + key, { encoding: 'utf-8' })
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
    /**
     * 
     * @param {string} gt gt
     * @param {string|undefined} cg chanllge
     * @returns 
     */
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

var _captcha = new Captcha();
var http = new httpServer(port);
var tool = {
    /**
     * @param {string} key 请求路径
     * @returns {boolean} 返回是否可以更新缓存
     */
    isCache: function (key, Etag) {
        let md5 = http.getFileHash(key);
        return (md5 == Etag)
    }
}
//接口设置区
{//http.get('/getCaptcha', (req, res, params) => {})
    http.get(['/', '/index.html'], (req, res, params) => {
        if (!params.sign) {
            _captcha.newCaptcha().then(e => {
                res.statusCode = 302;
                res.setHeader("Location", 'index.html?sign=' + e)
                res.end()
            })
            return
        }
        let reqMd5 = req.headers['if-none-match'];
        if (tool.isCache('/index.html', reqMd5)) {
            res.writeHead(304, {
                ETag: reqMd5
            })
            res.end()
        } else {
            let data = fs.readFileSync(path + '/index.html', { encoding: 'utf-8' })
            res.writeHead(200, 'OK', {
                ETag: http.getFileHash('/index.html')
            })
            res.end(data)
            console.log('发送了index.html文件')
        }

    })
    http.get('/ret', (req, res, _param) => {
        let data = JSON.parse(req.headers.geetest)
        console.log(data)
        _captcha.setValidate(data)
        res.end('OK')
    })
    http.get('/getCaptcha', (_req, res, params) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        let retdata = {
            code: 0,
            message: 'success',
            data: {}
        }
        let data = _captcha.getCaptcha(params.sign);
        if (data == undefined) retdata.code = -1, retdata.message = "该sign值不存在或已超时"
        retdata.data = data || {}
        res.end(JSON.stringify(retdata))
    })
    http.get('/Publicnetwork', (_req, res, _params) => {
        res.end('OK')
    })
    http.get('/newCaptcha', (_req, res, params) => {
        let data = _captcha.setCaptcha(params.gt, params.challenge)
        res.end(data)
    })
    http.get('/getCaptchaHtmlUrl', (_req, res, params) => {
        let data = _captcha.setCaptcha(params.gt, params.challenge)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
            url: `http://${this.host}/index.html?sign=` + data,
            sign: data
        }))
    })
    http.get('/getValidate', (_req, res, params) => {
        res.setHeader('Content-Type', 'application/json')
        let ret = this.captcha.getCaptcha(params.sign)
        if (ret.geetest_validate != undefined) {
            res.end(JSON.stringify({
                code: 0,
                data: ret
            }))
        } else if (ret?.Validate.geetest_validate == '') {
            res.end(JSON.stringify({
                code: 0,
                data: null
            }))
        }
    })
    http.default('get', (req, res, url) => {
        let reqMd5 = req.headers['if-none-match'];
        if (tool.isCache(url, reqMd5)) {
            res.writeHead(304, {
                ETag: reqMd5
            })
            res.end()
        } else {
            let data = fs.readFileSync(path + url, { encoding: 'utf-8' })
            res.writeHead(200, 'OK', {
                ETag: http.getFileHash(url)
            })
            res.end(data)
            console.log(`发送了${url}文件`)
        }
    })
}
new Promise(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    let data = (await axios.get('https://qifu-api.baidubce.com/ip/local/geo/v1/district')).data
    if (data.code == 'Success' || data.msg == "查询成功") {
        IPaddress = data.ip;
        axios.get(`http://${data.ip}:${port}/Publicnetwork`, { timeout: 5000 })
            .then(e => {
                console.log(`当前ip:${IPaddress} 为可访问到本机的公网IP`)
            })
            .catch(e => {
                console.log(`当前ip:${IPaddress} 为无法访问到本机的外网IP 或端口未开放，端口为：${port}\n设置为本地ip:127.0.0.1`)
                IPaddress = '127.0.0.1'
            })
    } else {
        console.error('ip接口查询异常')
        console.info(JSON.stringify(data))
    }
})

export default class mysCaptchaServer {
    constructor() {
        this.captcha = _captcha;
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