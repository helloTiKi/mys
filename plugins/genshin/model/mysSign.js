import moment from 'moment'
import lodash from 'lodash'
import base from './base.js'
import MysApi from './mys/mysApi.js'
import gsCfg from './gsCfg.js'
import User from './user.js'
import common from '../../../lib/common/common.js'
import cfg from '../../../lib/config/config.js'
import geetest from './geetest.js'

let signing = false
export default class MysSign extends base {
  constructor(e) {
    super(e)
    this.model = 'sign'
    this.isTask = false
    this.force = false
    this.cfg = gsCfg.getConfig('mys', 'set')
  }

  static async sign(e, gamebiz = 'genshin') {
    let mysSign = new MysSign(e)

    if (e.msg.includes('force')) mysSign.force = true
    if (e.msg.indexOf('星铁') != -1) gamebiz = 'luna'
    /** 获取个人ck */
    let ck = gsCfg.getBingCkSingle(e.user_id)

    if (lodash.isEmpty(ck)) {
      e.reply('无法签到，请先#绑定cookie\n发送【cookie帮助】查看配置教程', false, { at: true })
      return false
    }

    if (signing) {
      e.reply('原神自动签到进行中，暂不能手动签到...')
      return false
    }
    //ck = ck[gamebiz];
    let uids = lodash.map(ck, 'uid')

    if (uids.length > 1) {
      await e.reply('多账号签到中...')
    }

    let msg = []
    gamebiz = gamebiz == 'all' ? ['genshin', 'luna'] : [gamebiz];

    for (let i in uids) {
      mysSign.ckNum = Number(i) + 1
      if (i >= 1) await common.sleep(5000)
      let uid = uids[i]
      let res
      let s = 0;
      while (s < gamebiz.length) {
        res = await mysSign.doSign(ck[uid], false, gamebiz[s])
        if (res) msg.push(res.msg)
        s++
      }

    }

    msg = msg.join('\n\n')

    await e.reply(msg)
  }

  async doSign(ck, isLog = true, gamebiz = 'genshin') {
    ck = this.setCk(ck)
    this.mysApi = new MysApi(ck.uid, ck.ck, { log: isLog, device_id: ck.device_id, gamebiz: gamebiz })
    this.key = `${this.prefix}isSign:${this.mysApi.uid}gamebiz:${gamebiz}`
    this.log = `[uid:${ck.uid}][qq:${lodash.padEnd(this.e.user_id, 10, ' ')}]`
    let api = {
      info: '',
      sign: '',
      home: ''
    };
    switch (gamebiz) {
      case 'genshin':
        api.info = 'bbs_sign_info', api.home = 'bbs_sign_home', api.sign = 'bbs_sign';
        break;
      case 'luna':
        api.info = 'luna_sign_info', api.home = 'luna_sign_home', api.sign = 'luna_sign';
        let UserGameRoles = await this.mysApi.getUserGameRoles('hkrpg_cn');
        if (!UserGameRoles) return {
          retcode: 100,
          msg: '[星穹铁道]签到失败：未查询到角色'
        }
        this.mysApi.uid = UserGameRoles.game_uid, this.mysApi.server = UserGameRoles.region || 'prod_gf_cn';
        ck.uid = UserGameRoles.game_uid
        break;
    }
    let isSigned = await redis.get(this.key)
    if (isSigned && this.isTask && !this.force) {
      let reward = await this.getReward(isSigned, gamebiz)
      return {
        retcode: 0,
        msg: `uid:${ck.uid}，今天已签到\n第${isSigned}天奖励：${reward}`,
        is_sign: true
      }
    }

    /** 判断是否已经签到 */
    let signInfo = await this.mysApi.getData(api.info)
    await common.sleep(100)

    if (!signInfo) return false

    if (signInfo.retcode == -100 && signInfo.message == '尚未登录') {
      logger.error(`[签到失败]${this.log} 绑定cookie已失效`)
      let userAdmin = new User(this.e)
      if (userAdmin) {
        await userAdmin.delCk(ck.uid)
      }
      return {
        retcode: -100,
        msg: `签到失败，uid:${ck.uid}，绑定cookie已失效`,
        is_invalid: true
      }
    }

    if (signInfo.retcode !== 0) {
      return {
        retcode: signInfo.retcode,
        msg: `签到失败：${signInfo.message || '未知错误'}`
      }
    }

    if (signInfo.first_bind) {
      return {
        retcode: 100,
        msg: '签到失败：首次请先手动签到'
      }
    }

    this.signInfo = signInfo.data

    if (this.signInfo.is_sign && !this.force) {
      // logger.mark(`[原神已签到][uid:${this.mysApi.uid}][qq:${lodash.padEnd(this.e.user_id,11,' ')}]`)
      let reward = await this.getReward(this.signInfo.total_sign_day, gamebiz)
      this.setCache(this.signInfo.total_sign_day)
      return {
        retcode: 0,
        msg: `uid:${ck.uid}，今天已签到\n第${this.signInfo.total_sign_day}天奖励：${reward}`,
        is_sign: true
      }
    }

    /** 签到 */
    let res = await this._Sign(gamebiz)

    if (res) {
      let totalSignDay = this.signInfo.total_sign_day
      if (!this.signInfo.is_sign) {
        totalSignDay++
      }

      let tips = '签到成功'

      if (this.signed) {
        tips = '今天已签到'
      }

      let reward = await this.getReward(totalSignDay, gamebiz)

      this.setCache(totalSignDay)

      return {
        retcode: 0,
        msg: `uid:${ck.uid}，${tips}\n第${totalSignDay}天奖励：${reward}`
      }
    }

    return {
      retcode: -1000,
      msg: `uid:${ck.uid}，签到失败：${this.signMsg}`
    }
  }

  setCk(ck) {
    ck.ck = lodash.trim(ck.ck, ';') + `; _MHYUUID=${ck.device_id}; `
    return ck
  }

  // 缓存签到奖励
  async getReward(signDay, gamebiz = 'genshin') {
    let key = `${this.prefix}reward:gamebiz:${gamebiz}`
    let reward = await redis.get(key)
    let api = gamebiz == 'genshin' ? 'bbs_sign_home' : 'luna_sign_home';
    if (reward) {
      reward = JSON.parse(reward)
    } else {
      let res = await this.mysApi.getData(api)
      if (!res || Number(res.retcode) !== 0) return false

      let data = res.data
      if (data && data.awards && data.awards.length > 0) {
        reward = data.awards

        let monthEnd = Number(moment().endOf('month').format('X')) - Number(moment().format('X'))
        redis.setEx(key, monthEnd, JSON.stringify(reward))
      }
    }
    if (reward && reward.length > 0) {
      reward = reward[signDay - 1] || ''
      if (reward.name && reward.cnt) {
        reward = `${reward.name}*${reward.cnt}`
      }
    } else {
      reward = ''
    }

    return reward
  }

  async _Sign(gamebiz = 'genshin') {
    let api = gamebiz == 'genshin' ? 'bbs_sign' : 'luna_sign'
    this.signApi = true
    this.is_verify = false
    let sign = await this.mysApi.getData(api)
    this.signMsg = sign?.message ?? 'Too Many Requests'

    if (!sign) {
      logger.mark(`[签到失败]${this.log}：${sign.message || this.signMsg}`)
      return false
    }

    /** 签到成功 */
    if (sign.retcode === -5003) {
      this.signed = true
      logger.mark(`[已经签到]${this.log} 第${this.ckNum}个`)
      return true
    }

    if (sign.data && (sign.data.risk_code === 375) || (sign.api == 'luna_sign' && sign.data.risk_code === 5001)) {
      let gt = sign.data.gt, challenge = sign.data.challenge;
      console.log(sign.data)
      let g = new geetest({ gt: gt, challenge: challenge })
      let ret = await g.check();
      sign = await this.mysApi.getData(api, {
        headers: {
          'x-rpc-challenge': ret.geetest_challenge,
          'x-rpc-seccode': ret.geetest_seccode,
          'x-rpc-validate': ret.geetest_validate
        }
      })
      if (sign.retcode != 0) {
        
        this.signMsg = '验证码失败'
        //sign.message = '验证码失败'
        this.is_verify = true
        logger.mark(`[签到失败]${this.log}：${sign.message} 第${this.ckNum}个`)
        return false
      }


    }

    if (sign.retcode === 0 && (sign?.data.success === 0 || sign?.message === 'OK')) {
      logger.mark(`[签到成功]${this.log} 第${this.ckNum}个`)
      return true
    }

    logger.mark(`[签到失败]${this.log}：${sign.message} 第${this.ckNum}个`)
    return false
  }

  async signTask(manual) {
    if (this.cfg.isAutoSign != 1 && !manual) return

    if (signing && manual) {
      await this.e.reply('签到任务进行中，完成前请勿重复执行')
      return false
    }

    this.isTask = true

    let cks = (await gsCfg.getBingCk()).ck
    let uids = lodash.filter(cks, (o) => {
      return o.autoSign !== false
    })
    uids = lodash.map(uids, 'uid')

    if (uids.length <= 0) {
      if (manual) await this.e.reply('暂无ck需要签到')
      return
    }

    signing = true

    let tips = ['开始签到任务']

    let { noSignNum } = await this.getsignNum(uids)
    let time = noSignNum * 30 + noSignNum * 0.2 + uids.length * 0.02 + 5
    let finishTime = moment().add(time, 's').format('MM-DD HH:mm:ss')

    tips.push(`\n签到ck：${uids.length}个`)
    if (uids.length != noSignNum) tips.push(`\n未签ck：${noSignNum}个`)
    tips.push(`\n预计需要：${this.countTime(time)}`)

    if (time > 120) {
      tips.push(`\n完成时间：${finishTime}`)
    }

    logger.mark(`签到ck:${uids.length}个，预计需要${this.countTime(time)} ${finishTime} 完成`)

    if (manual) {
      await this.e.reply(tips)
      if (this.e.msg.includes('force')) this.force = true
    } else {
      await common.relpyPrivate(cfg.masterQQ[0], tips)
      await common.sleep(lodash.random(1, 20) * 1000)
    }

    let sucNum = 0
    let finshNum = 0
    let failNum = 0
    let invalidNum = 0
    let verifyNum = 0
    let contiNum = 0

    for (let i in uids) {
      this.ckNum = Number(i) + 1
      let uid = uids[i]
      let ck = cks[uid]
      if (!ck || !ck.qq) continue
      if (ck.autoSign === false) continue

      this.e.user_id = ck.qq
      let api = ['genshin', 'luna'];
      for (const game_biz of api) {
        let ret = await this.doSign(ck, false, game_biz)
        if (ret.retcode === 0) {
          if (ret.is_sign) {
            finshNum++
          } else {
            sucNum++
          }
        } else {
          if (this.is_verify) {
            verifyNum++
            contiNum++
          } else {
            contiNum = 0
          }
          if (ret.is_invalid) {
            invalidNum++
          } else {
            failNum++
          }
        }
        if (contiNum >= 5) {
          break
        }
        if (this.signApi) {
          await common.sleep(6.1 * 1000)
          this.signApi = false
        }
      }

    }

    let msg = `签到任务完成：${uids.length}个\n已签：${finshNum}个\n成功：${sucNum}个\n失败：${failNum}个`
    if (invalidNum > 0) {
      msg += `\n失效：${invalidNum}个`
    }
    if (contiNum >= 5) {
      msg += '\n\n验证码失败次数过多，已停止任务'
    }

    if (manual) {
      this.e.reply(msg)
    } else {
      common.relpyPrivate(cfg.masterQQ[0], msg)
    }

    signing = false
  }

  async setCache(day) {
    let end = Number(moment().endOf('day').format('X')) - Number(moment().format('X'))
    redis.setEx(this.key, end, String(day))
  }

  async getsignNum(uids) {
    let signNum = (await redis.KEYS(`${this.prefix}isSign*`)).length

    let noSignNum = uids.length - signNum

    noSignNum = noSignNum > 0 ? noSignNum : 0

    return { noSignNum, signNum }
  }

  countTime(time) {
    let hour = Math.floor((time / 3600) % 24)
    let min = Math.floor((time / 60) % 60)
    let sec = Math.floor(time % 60)
    let msg = ''
    if (hour > 0) msg += `${hour}小时`
    if (min > 0) msg += `${min}分钟`
    if (sec > 0) msg += `${sec}秒`
    return msg
  }

  async signClose() {
    let model = '开启'
    if (/关闭|取消/.test(this.e.msg)) {
      model = '关闭'
    }

    /** 获取个人ck */
    let ck = gsCfg.getBingCkSingle(this.e.user_id)

    if (lodash.isEmpty(ck)) {
      await this.e.reply(`${model}签到失败，请先#绑定cookie\n发送【cookie帮助】查看配置教程`, false, { at: true })
      return false
    }

    let autoCk = {}
    for (let i in ck) {
      if (!ck[i].isMain) continue
      autoCk = ck[i]
      if (model == '开启') {
        ck[i].autoSign = true
      } else {
        ck[i].autoSign = false
      }
    }

    if (lodash.isEmpty(autoCk)) return

    gsCfg.saveBingCk(this.e.user_id, ck)

    let msg = `uid:${autoCk.uid}，原神自动签到已${model}`
    if (model == '开启') {
      msg += '\n每天将为你自动签到~'
    }
    await this.e.reply(msg)
  }
}
