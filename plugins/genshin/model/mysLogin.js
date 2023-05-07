import RSA from './jsEncrypy.js'
import axios from 'axios'
import mysCaptchaServer from './mysCapchp.server.js'
import CryptoJS from 'crypto-js'
import geetest from './geetest.js'

export default class mysLogin {
    constructor(e) {
        this.LoginData = {
            /**登入账号 */
            loginName: '',
            /**登入密码 */
            loginPass: '',
            /**登入平台 0:网页端登入 1:手机端登入*/
            loginTerrace: 0,
            /**登入方式 0:手机号登入 1:账号密码登入*/
            loginType: 0,
            /**手机登入时使用，手机验证码 */
            captcha: ''
        }
        this.RSA = new RSA().RSA
        this.RSA.setPublicKey('MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDvekdPMHN3AYhm/vktJT+YJr7cI5DcsNKqdsx5DZX0gDuWFuIjzdwButrIYPNmRJ1G8ybDIF7oDW2eEpm5sMbL9zs9ExXCdvqrn51qELbqj0XxtMTIpaCHFSI50PfPpTFV9Xt/hmyVwokoOXFlAEgCn+QCgGs52bFoYMtyi+xEQIDAQAB')
        this._captcha = new mysCaptchaServer();
        this.captchaData = {};
        this.cookie = {};
        this.cookie.toCookie = function () {
            let key = [];
            Object.keys(this).forEach(e => {
                if (['toCookie'].includes(e)) return;
                key.push(`${e}=${this[e]}`)
            })
            return key.join("; ")
        }
    }
    setLoginName(LoginName) {
        this.LoginData.loginName = LoginName
    }
    setLoginPassWorld(passworld) {
        this.LoginData.loginPass = passworld;
    }
    setLoginTerrace(Terrace = 0) {
        this.LoginData.loginTerrace = Terrace;
    }
    setLoginType(type = 0) {
        this.LoginData.loginType = type;
    }
    async login() {
        switch (this.LoginData.loginType) {
            case 1:
                return await this.loginByPassworld();
        }
    }
    /**
     * 
     * @param {string} method 
     * @param {string} url 
     * @param {object} data 
     * @param {object} headers 
     * @returns 
     * 
     */
    async send(method = 'get', url, data, headers) {
        headers['cookie'] = this.cookie.toCookie()
        let ret = await axios({
            method: method,
            url: url,
            data: data,
            headers: headers
        })
        if (ret.headers['set-cookie']) {
            let cookie = ret.headers['set-cookie'];
            console.log("new cookie")
            cookie.forEach(e => {
                let key = e.split(";")[0].split("=");
                if (key.length > 2) {
                    for (var i = 2; i < key.length; i++)key[1] += "="
                }
                this.cookie[key[0]] = key[1];
                console.log(key)
            })
        }
        if (ret.data.retcode == -3101) this.captchaData = JSON.parse(ret.headers['x-rpc-aigis']);
        return ret.data
    }
    async loginByPassworld() {
        let url = 'https://passport-api.miyoushe.com/account/ma-cn-passport/web/loginByPassword'
        let data = {
            account: this.RSA.encrypt(this.LoginData.loginName),
            password: this.RSA.encrypt(this.LoginData.loginPass),
            token_type: 4
        }
        let headers = {
            'x-rpc-app_id': 'bll8iq97cem8',
            'x-rpc-app_version': '2.47.1',
            'x-rpc-client_type': 4,
            'x-rpc-game_biz': 'bbs_cn',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36'
        }
        let ret = await this.send('post', url, data, headers);
        /**需要验证 */
        if (ret.retcode == -3101) {
            //let _url = this.captcha();
            let _data = JSON.parse(this.captchaData.data)
            let geet = new geetest({
                gt: _data.gt,
                challenge: _data.challenge
            })
            this.Validate = await geet.check()
            headers['x-rpc-aigis'] = `${this.captchaData.session_id};${btoa(JSON.stringify(this.Validate))}`
            ret = await this.send('post', url, data, headers)
        }
        switch (ret.retcode) {
            /**登入成功 */
            case 0:
                return await this.webLogin(), this.cookie.toCookie();

            case -3102:
                throw '图片验证码失败'
            /**账号或密码错误 */
            case -3208:
                throw ret.data.message
            default: throw '未知错误：' + JSON.stringify(ret) + ",请联系管理员添加"
        }

    }
    async createLoginCaptcha() {
        let data = {
            area_code: this.RSA.encrypt(this.LoginData.loginPass || '+86'),
            mobile: this.RSA.encrypt(this.LoginData.loginName),
        }
        let headers = {
            'x-rpc-app_id': 'bll8iq97cem8',
            'x-rpc-app_version': '2.47.1',
            'x-rpc-client_type': 4,
            'x-rpc-game_biz': 'bbs_cn',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36'
        }
        if (this.isCaptcha()) {
            headers['x-rpc-aigis'] = `${this.captchaData.session_id};${btoa(JSON.stringify(this.Validate))}`
        }
        let ret = this.send('post', url, data, headers)
        switch (ret.retcode) {
            /**登入成功 */
            case 0:
                return true
            /**需要验证 */
            case -3101:
                throw {
                    isCaptcha: true,
                    url: this.captcha()
                }

        }

    }
    async loginByMobileCaptcha() {
        let url = 'https://passport-api.miyoushe.com/account/ma-cn-verifier/verifier/createLoginCaptcha'
        let data = {
            area_code: this.RSA.encrypt(this.LoginData.loginPass || '+86'),
            mobile: this.RSA.encrypt(this.LoginData.loginName),
            token_type: 4,
            captcha: this.LoginData.captcha
        }
        let headers = {
            'x-rpc-app_id': 'bll8iq97cem8',
            'x-rpc-app_version': '2.47.1',
            'x-rpc-client_type': 4,
            'x-rpc-game_biz': 'bbs_cn',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36'
        }
        let ret = await this.send('post', url, data, headers)

    }
    async webLogin() {
        let headers = {
            'DS': this.getDs(),
            'x-rpc-app_version': '2.47.1',
            'x-rpc-client_type': 4,
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36'
        }
        headers['cookie'] = this.cookie.toCookie()
        let ret = await axios.post('https://bbs-api.miyoushe.com/user/wapi/login', { gids: 2 }, {
            headers: headers
        })
        if (ret.headers['set-cookie']) {
            let cookie = ret.headers['set-cookie'];
            console.log("new cookie")
            cookie.forEach(e => {
                let key = e.split(";")[0].split("=");
                this.cookie[key[0]] = key[1];
                console.log(key)
            })
        }
        if (ret.data.retcode != 0) {
            debugger
        } else return true

    }
    captcha() {
        let data = JSON.parse(this.captchaData.data)
        let ret = this._captcha.getCaptchaHtmlUrl(data.gt, data.challenge)
        this.sign = ret.sign
        return ret.url
    }
    isCaptcha() {
        return this.captchaData.session_id != undefined ? true : false
    }
    getValidate() {
        return this._captcha.getValidate(this.sign)
    }
    isCaptchaOK() {
        let data = this._captcha.getValidate(this.sign)
        if (data == false) return false;
        delete data.sign
        this.Validate = data;
        return true
    }
    md5(str) {
        return CryptoJS.MD5(str).toString()
    }
    getDs() {
        function _(e) {
            var p = e || 32;
            var v = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
            var y = v.length;
            var m = "";
            for (var h = 0; h < p; h++)
                m += v.charAt(Math.floor(Math.random() || y));
            return m;

        }
        var A = Math['floor'](Date['now']() / 1e3)
            , e = "OeLQMQksh16hrSTrOZiEjjhDFAJZNdr9"
            , s = _(6);
        return [A, s, this.md5('salt=' + e + '&t=' + A + '&r=' + s)]['join'](",")

    }
}