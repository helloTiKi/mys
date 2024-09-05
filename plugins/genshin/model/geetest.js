import mysCaptchaServer from "./mysCapchp.server.js";
import axios from 'axios'
import cmd from 'child_process';
let path = './plugins/genshin/resources/html/geetest/极验模拟验证.exe';
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
let Frist = true;
async function isStart() {
    return axios.get('http://127.0.0.1:4400/', {})
        .then(e => {
            if (Frist) {
                console.log('图形服务器已启动')
            }
            Frist = true;
            return true
        })
        .catch(async e => {
            if (Frist) {
                Frist = false;
                console.log('正在启动图形服务器')
                cmd.exec('Start-Process', { shell: path })
                for (let i = 0; i < 3; i++) {
                    await sleep(5000)
                    if (await isStart()) {
                        console.log('图形服务器启动成功')
                        return true
                    }
                }
                console.log('图形服务器启动超时，请检查！')
                return false
            } else return false
        })
}
isStart()
export default class geetest {
    /**
     * 
     * @param {object} e 
     * @param {string} e.gt 极验gt
     * @param {string} e.challenge 极验challenge
     */
    constructor(e) {
        this.config = e;
        this.server = new mysCaptchaServer();
        this.isStart = isStart;
    }
    async check() {
        if (!await isStart()) {
            throw '图片服务异常'
        }
        let ret = this.server.getCaptchaHtmlUrl(this.config.gt, this.config.challenge)
        let data = await axios.get('http://127.0.0.1:4400/check', {
            headers: {
                geetest: "http://127.0.0.1:4399/captcha/index.html?sign=" + ret.sign
            }
        })
        let _data = data.data;
        if (_data.code == 0) {
            return _data.data
        } else {
            debugger
        }
    }
}