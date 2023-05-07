import plugin from '../../../lib/plugins/plugin.js'
import fs from 'node:fs'
import gsCfg from '../model/gsCfg.js'
import User from '../model/user.js'
import mysLogin from '../model/mysLogin.js'
export class user extends plugin {
  constructor(e) {
    super({
      name: '用户绑定',
      dsc: '米游社ck绑定，游戏uid绑定',
      event: 'message',
      priority: 300,
      rule: [
        {
          reg: '^#*(体力|ck|cookie)帮助',
          fnc: 'ckHelp'
        },
        {
          reg: '^(ck|cookie|js)代码$',
          fnc: 'ckCode'
        },
        {
          reg: '^#绑定(cookie|ck)$',
          fnc: 'bingCk'
        },
        {
          reg: '(.*)_MHYUUID(.*)',
          event: 'message.private',
          fnc: 'noLogin'
        },
        {
          reg: '^#?我的(ck|cookie)$',
          event: 'message',
          fnc: 'myCk'
        },
        {
          reg: '^#?删除(ck|cookie)$',
          fnc: 'delCk'
        },
        {
          reg: '^#绑定(uid|UID)?[1-9][0-9]{8}$',
          fnc: 'bingUid'
        },
        {
          reg: '^#(我的)?(uid|UID)[0-9]{0,2}$',
          fnc: 'showUid'
        },
        {
          reg: '^#\\s*(检查|我的)*ck(状态)*$',
          fnc: 'checkCkStatus'
        },
        {
          reg: '登(入|录)米游社',
          fnc: 'mysLogin_index'
        }
      ]
    })
    this.User = new User(e)
  }

  async init() {
    let file = './data/MysCookie'
    if (!fs.existsSync(file)) {
      fs.mkdirSync(file)
    }
    /** 加载旧的绑定ck json */
    this.loadOldData()
  }

  /** 接受到消息都会执行一次 */
  accept() {
    if (!this.e.msg) return
    // 由于手机端米游社网页可能获取不到ltuid 可以尝试在通行证页面获取login_uid
    if (/(ltoken|ltoken_v2)/.test(this.e.msg) && /(ltuid|login_uid|ltmid_v2)/.test(this.e.msg)) {
      if (this.e.isGroup) {
        this.reply('请私聊发送cookie', false, { at: true })
        return true
      }
      this.e.ck = this.e.msg
      this.e.msg = '#绑定cookie'
      return true
    }
    if (this.e.msg == '#绑定uid') {
      this.setContext('saveUid')
      this.reply('请发送绑定的uid', false, { at: true })
      return true
    }
  }

  /** 绑定uid */
  saveUid() {
    if (!this.e.msg) return
    let uid = this.e.msg.match(/[1|2|5-9][0-9]{8}/g)
    if (!uid) {
      this.reply('uid输入错误', false, { at: true })
      return
    }
    this.e.msg = '#绑定' + this.e.msg
    this.bingUid()
    this.finish('saveUid')
  }

  /** 未登录ck */
  async noLogin() {
    this.reply('绑定cookie失败\n请先【登录米游社】或【登录通行证】再获取cookie')
  }

  /** #ck代码 */
  async ckCode() {
    await this.reply('javascript:(()=>{prompt(\'\',document.cookie)})();')
  }

  /** ck帮助 */
  async ckHelp() {
    let set = gsCfg.getConfig('mys', 'set')
    await this.reply(`Cookie绑定配置教程：${set.cookieDoc}\n获取cookie后【私聊发送】进行绑定`)
  }

  /** 绑定ck */
  async bingCk() {
    let set = gsCfg.getConfig('mys', 'set')
    if (!this.e.ck) {
      await this.reply(`请【私聊】发送米游社cookie，获取教程：\n${set.cookieDoc}`)
      return
    }
    await this.User.bing()
  }

  /** 删除ck */
  async delCk() {
    let msg = await this.User.delCk()
    await this.reply(msg)
  }

  /** 绑定uid */
  async bingUid() {
    await this.User.bingUid()
  }

  /** #uid */
  async showUid() {
    let index = this.e.msg.match(/[0-9]{1,2}/g)
    if (index && index[0]) {
      await this.User.toggleUid(index[0])
    } else {
      await this.User.showUid()
    }
  }

  /** 我的ck */
  async myCk() {
    if (this.e.isGroup) {
      await this.reply('请私聊查看')
      return
    }
    await this.User.myCk()
  }

  /** 加载旧的绑定ck json */
  loadOldData() {
    this.User.loadOldData()
  }

  /** 检查用户CK状态 **/
  async checkCkStatus() {
    await this.User.checkCkStatus()
  }
  async mysLogin_index(e) {
    e._mysLogin = new mysLogin();
    this.setContext('mysLogin_check');
    let msg = '请选择登入平台\n1.登入网页米游社\n';
    msg += '2.登入手机米游社\n';
    msg += '请回复序号即可'
    this.e.reply(msg)
  }
  async mysLogin_check(e) {
    //if (this.e.message.type != 'text') return
    let msg = Number.parseInt(this.e.message[0].text);
    this.e._mysLogin = e._mysLogin;
    console.log(msg, this.e.message)
    switch (msg) {
      case 1:
        e._mysLogin.setLoginTerrace(0);
        //this.finish('mysLogin_check')
        this.finish('mysLogin_check')
        this.setContext('mysLoginType');
        this.e.reply('请选择登入方式\n  1.手机验证码登入\n  2.账号密码登入\n回复序号即可')
        break
      case 2:
        this.e.reply('尚未支持手机米游社登入')
        this.finish('mysLogin_check')
        break;
      default:
        this.setContext('mysLogin_check')
        this.e.reply('[mysLogin_check]请回复数字序号')
    }

  }
  async mysLoginType(e) {
    this.e._mysLogin = e._mysLogin;
    let msg = Number.parseInt(this.e.message[0].text);
    switch (msg) {
      case 2:
        e._mysLogin.setLoginType(1);
        this.finish('mysLoginType')
        this.setContext('mysSetLoginName');
        this.e.reply('请输入账号')
        break
      case 1:
        e._mysLogin.setLoginType(0);
        this.finish('mysLoginType')
        this.setContext('mysSetLoginName');
        this.e.reply('请输入手机号')
        break;
      default:
        this.setContext('mysLoginType')
        this.e.reply('[mysLoginType]请回复数字序号')
    }

  }
  async mysSetLoginName(e) {
    this.e._mysLogin = e._mysLogin;
    let th = this;
    let msg = th.e.message[0].text;
    e._mysLogin.setLoginName(msg)
    if (e._mysLogin.LoginData.loginType == 1) {
      this.finish('mysSetLoginName')
      this.setContext('mysSetLoginPassword');
      this.e.reply('请输入密码')
    } else {
      function check() {
        if (e._mysLogin.isCaptchaOK()) {
          th.e.reply('验证成功')
          th.e._mysLogin.createLoginCaptcha()
            .then(s => {
              th.finish('mysSetLoginName')
              th.setContext('mysLoginByMobileCaptcha');
              th.e.reply('验证码已发送，请输入验证码')
            })
            .catch(s => {
              if (s.isCaptcha) {
                th.e.reply('请点击链接进行验证\n' + s.url)
                setTimeout(() => {
                  check()
                }, 1000);
                return
              } else {
                console.error("[user.js]未知错误，请检查");
                console.log(s)
              }
            })
        } else {
          setTimeout(() => {
            check()
          }, 1000);
        }
      }
      e._mysLogin.createLoginCaptcha()
        .then(s => {
          this.finish('mysSetLoginName')
          this.setContext('mysLoginByMobileCaptcha');
          this.e.reply('验证码已发送，请输入验证码')

        })
        .catch(s => {
          if (s.isCaptcha) {
            th.e.reply('请点击链接进行验证\n' + s.url)
            setTimeout(() => {
              check()
            }, 1000);
            return
          }
        })
    }

  }
  async mysLoginByMobileCaptcha(e) {
    let th = this;
    let msg = th.e.message[0].text;
    if (msg.length != 6) this.setContext('mysLoginByMobileCaptcha'), this.e.reply('请输入正确的六位验证码')
    else {
      e._mysLogin.LoginData.captcha = msg;
      e._mysLogin.loginByMobileCaptcha()
        .then(s => {
          th.e.ck = s;
          th.bingCk()
        }).catch(s => {
          th.e.reply(s)
        })
    }


  }
  async mysSetLoginPassword(e) {
    this.finish('mysSetLoginPassword')
    let th = this;
    let msg = this.e.message[0].text;
    e._mysLogin.setLoginPassWorld(msg);
    this.e.reply('正在登入，请稍候')
    e._mysLogin.login()
      .then(s => {
        th.e.ck = s;
        th.bingCk();
      })
      .catch(s => {
        th.e.reply(s);
      })
  }
}
