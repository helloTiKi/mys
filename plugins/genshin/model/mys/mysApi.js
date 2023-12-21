import md5 from 'md5'
import lodash from 'lodash'
import fetch from 'node-fetch'
import cfg from '../../../../lib/config/config.js'
import geetest from '../geetest.js'
import gsData from './gsData.js'

let HttpsProxyAgent = ''
let AllDevice_id = {};
let deviceArray = [
  ['HUAWEI', 'TAS-AN00'],
  ['HUAWEI', 'LIO-AN00']
]
/**
 * 
 * @param {string} tuid 通行证id
 */
function new_fpData() {
  /**
   * 
   * @param {number} min 
   * @param {number} max 
   * @returns {number}
   */
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  function getGuid() {
    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4())
  }
  function getDeviceId() {
    return (S4() + S4() + S4() + S4())
  }
  let index = getRandomInt(0, deviceArray.length - 1)
  let data = {
    device_id: getDeviceId(),
    seed_id: getGuid(),
    seed_time: "1681057102863",
    platform: "2",
    device_fp: (function () { return S4() + S4() + S4() })(),
    app_name: 'bbs_cn',
    ext_fields: {
      "hostname": "ubuntu",
      "buildTime": "1676369261000",
      "oaid": "error_1002005",
      "romCapacity": "256",
      "serialNumber": "00a43012",
      "sdkVersion": "25",
      "vaid": "error_1002005",
      "ramCapacity": "15998",
      "osVersion": "7.1.2",
      "buildType": "user",
      /**手机品牌 */
      "manufacturer": deviceArray[index][0],
      /**分辨率 */
      "screenSize": "900x1600",
      "aaid": "error_1002005",
      "accelerometer": "0.13x9.75x2.0997705",
      "deviceType": "aosp",
      "cpuType": "armeabi-v7a",
      /**手机型号 */
      "board": deviceArray[index][1],
      "magnetometer": "-36.46x-0.015000001x-0.005000001",
      "romRemain": "246",
      "appMemory": "256",
      "display": "N2G47O",
      "buildUser": "build",
      /**手机品牌 */
      "brand": deviceArray[index][0],
      /**手机型号 */
      "productName": deviceArray[index][1],
      "ramRemain": "14606",
      "buildTags": "release-keys",
      "deviceInfo": "google/android_x86/x86:7.1.2/N2G47O/3636322:user/release-keys",
      "gyroscope": "0.0x0.0x3.0E-4",
      "hardware": "android_x86",
      "devId": "REL",
      "vendor": "WiFi",
      /**手机型号 */
      "model": deviceArray[index][1]
    }
  }

  return data
}
class UserData {
  game_biz = ''
  region = ''
  game_uid = ''
  nickname = ''
  level = 0
  is_chosen = false
  region_name = ''
  is_official = false
}


export default class MysApi {
  /**
   * @param uid 游戏uid
   * @param {string} cookie 米游社cookie
   * @param option 其他参数
   * @param option.log 是否显示日志
   */
  constructor(uid, cookie, option = {}) {
    this.uid = uid
    this.cookie = cookie
    this.server = this.getServer()
    /*    this.fpdata = gsData.getdefSet('mys', 'fp')
       this.device_id = this.getGuid() */
    /** 5分钟缓存 */
    this.cacheCd = 300

    this.option = {
      log: true,
      ...option
    }
    this.UserGameRoles = {};

  }
  async init() {
    this['x-rpc-challenge'] = await redis.get(this.cacheKey('x-rpc-challenge'))
  }
  async getFp() {

  }
  /**
   * 
   * @param {string} game_biz 游戏种类
   * @returns {Promise<UserData|undefined>}
   */
  async getUserGameRoles(game_biz = '') {
    let th = this;
    function isEmptyObj(obj) {
      return Object.keys(obj).length === 0;
    }
    if (isEmptyObj(this.UserGameRoles)) {
      let data = await this.getData('getUserGameRoles');
      if (data.retcode != 0) throw data.message;
      let list = data.data.list;
      //这里目前有bug 如果存在单个游戏不同服务器就会出现问题 game_biz是否唯一
      list.forEach(obj => {
        th.UserGameRoles[obj.game_biz] = obj;
      })
    }
    return this.UserGameRoles[game_biz];
  }
  getUrl(type, data = {}) {
    let host, hostRecord
    if (['cn_gf01', 'cn_qd01', 'prod_gf_cn'].includes(this.server)) {
      host = 'https://api-takumi.mihoyo.com/'
      hostRecord = 'https://api-takumi-record.mihoyo.com/'
    } else if (['os_usa', 'os_euro', 'os_asia', 'os_cht'].includes(this.server)) {
      host = 'https://api-os-takumi.mihoyo.com/'
      hostRecord = 'https://bbs-api-os.mihoyo.com/'
    }
    //console.log(data)
    let urlMap = {
      createVerification: {
        url: "https://api-takumi-record.mihoyo.com/game_record/app/card/wapi/createVerification",
        query: "is_high=true"
      },
      verifyVerification: {
        url: "https://api-takumi-record.mihoyo.com/game_record/app/card/wapi/verifyVerification",
        body: data
      },
      getUserGameRoles: {
        url: 'https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie',
        query: data.game_biz || ''
      },
      /** 首页宝箱 */
      index: {
        url: `${hostRecord}game_record/app/genshin/api/index`,
        query: `role_id=${this.uid}&server=${this.server}`
      },
      /** 深渊 */
      spiralAbyss: {
        url: `${hostRecord}game_record/app/genshin/api/spiralAbyss`,
        query: `role_id=${this.uid}&schedule_type=${data.schedule_type || 1}&server=${this.server}`
      },
      /** 角色详情 */
      character: {
        url: `${hostRecord}game_record/app/genshin/api/character`,
        body: { role_id: this.uid, server: this.server }
      },
      /** 树脂 */
      dailyNote: {
        url: `${hostRecord}game_record/app/genshin/api/dailyNote`,
        query: `role_id=${this.uid}&server=${this.server}`
      },
      /** 开拓力 */
      lunaDailyNote: {
        url: `${hostRecord}game_record/app/hkrpg/api/note`,
        query: `server=prod_gf_cn&role_id=${this.uid}`
      },
      /** 签到信息 */
      bbs_sign_info: {
        url: `${host}event/luna/info`,
        query: `act_id=e202311201442471&region=${this.server}&uid=${this.uid}`,
        sign: true,
        header: {
          'x-rpc-signgame': 'hk4e'
        }
      },
      /** 签到奖励 */
      bbs_sign_home: {
        url: `${host}event/luna/home`,
        query: `act_id=e202311201442471&region=${this.server}&uid=${this.uid}`,
        sign: true,
        header: {
          'x-rpc-signgame': 'hk4e'
        }
      },
      /** 签到 */
      bbs_sign: {
        url: `${host}event/luna/sign`,
        body: { act_id: 'e202311201442471', region: this.server, uid: this.uid },
        sign: true,
        header: {
          'x-rpc-signgame': 'hk4e'
        }
      },
      /**星穹列车签到信息 */
      luna_sign_info: {
        url: `${host}event/luna/info`,
        query: `lang=zh-cn&act_id=e202304121516551&region=prod_gf_cn&uid=${this.uid}`
      },
      /**星穹列车签到奖励 */
      luna_sign_home: {
        url: `${host}event/luna/home`,
        query: 'lang=zh-cn&act_id=e202304121516551'
      },
      /**星穹签到 */
      luna_sign: {
        url: `${host}event/luna/sign`,
        body: { act_id: 'e202304121516551', region: 'prod_gf_cn', uid: this.uid, lang: 'zh-cn' },
        sign: true
      },
      /** 详情 */
      detail: {
        url: `${host}event/e20200928calculate/v1/sync/avatar/detail`,
        query: `uid=${this.uid}&region=${this.server}&avatar_id=${data.avatar_id}`
      },
      /** 札记 */
      ys_ledger: {
        url: 'https://hk4e-api.mihoyo.com/event/ys_ledger/monthInfo',
        query: `month=${data.month}&bind_uid=${this.uid}&bind_region=${this.server}`
      },
      /** 养成计算器 */
      compute: {
        url: `${host}event/e20200928calculate/v2/compute`,
        body: data
      },
      blueprintCompute: {
        url: `${host}event/e20200928calculate/v1/furniture/compute`,
        body: data
      },
      /** 养成计算器 */
      blueprint: {
        url: `${host}event/e20200928calculate/v1/furniture/blueprint`,
        query: `share_code=${data.share_code}&region=${this.server}`
      },
      /** 角色技能 */
      avatarSkill: {
        url: `${host}event/e20200928calculate/v1/avatarSkill/list`,
        query: `avatar_id=${data.avatar_id}`
      },
      createVerification: {
        url: `${hostRecord}game_record/app/card/wapi/createVerification`,
        query: 'is_high=true'
      },
      verifyVerification: {
        url: `${hostRecord}game_record/app/card/wapi/verifyVerification`,
        body: data
      },
      /** 七圣召唤数据 */
      basicInfo: {
        url: `${hostRecord}game_record/app/genshin/api/gcg/basicInfo`,
        query: `role_id=${this.uid}&server=${this.server}`
      },
      /**使用兑换码 目前仅限国际服,来自于国服的uid请求已在myinfo.js的init方法提前拦截 */
      useCdk: {
        url: 'https://hk4e-api.mihoyo.com/common/apicdkey/api/exchangeCdkey',
        query: this.getCdkQuire(data.cdk, data.authKey),
        iscdk: true
      }
    }
    if (this.server.startsWith('os')) {
      urlMap.bbs_sign_info.url = 'https://hk4e-api-os.hoyoverse.com/event/sol/info'
      urlMap.bbs_sign_info.query = `act_id=e202102251931481&region=${this.server}&uid=${this.uid}`

      urlMap.bbs_sign_home.url = 'https://hk4e-api-os.hoyoverse.com/event/sol/home'
      urlMap.bbs_sign_home.query = `act_id=e202102251931481&region=${this.server}&uid=${this.uid}`

      urlMap.bbs_sign.url = 'https://hk4e-api-os.hoyoverse.com/event/sol/sign'
      urlMap.bbs_sign.body = { act_id: 'e202102251931481', region: this.server, uid: this.uid }

      urlMap.detail.url = 'https://sg-public-api.hoyolab.com/event/calculateos/sync/avatar/detail'// 角色天赋详情
      urlMap.detail.query = `lang=zh-cn&uid=${this.uid}&region=${this.server}&avatar_id=${data.avatar_id}`

      urlMap.avatarSkill.url = 'https://sg-public-api.hoyolab.com/event/calculateos/avatar/skill_list'// 查询未持有的角色天赋
      urlMap.avatarSkill.query = `lang=zh-cn&avatar_id=${data.avatar_id}`

      urlMap.compute.url = 'https://sg-public-api.hoyolab.com/event/calculateos/compute'// 已支持养成计算

      urlMap.blueprint.url = 'https://sg-public-api.hoyolab.com/event/calculateos/furniture/blueprint'
      urlMap.blueprint.query = `share_code=${data.share_code}&region=${this.server}&lang=zh-cn`

      urlMap.blueprintCompute.url = 'https://sg-public-api.hoyolab.com/event/calculateos/furniture/compute'
      urlMap.blueprintCompute.body = { lang: 'zh-cn', ...data }

      urlMap.ys_ledger.url = 'https://hk4e-api-os.mihoyo.com/event/ysledgeros/month_info'// 支持了国际服札记
      urlMap.ys_ledger.query = `lang=zh-cn&month=${data.month}&uid=${this.uid}&region=${this.server}`

      urlMap.useCdk.url = 'https://sg-hk4e-api.hoyoverse.com/common/apicdkey/api/webExchangeCdkey'
      urlMap.useCdk.query = `uid=${this.uid}&region=${this.server}&lang=zh-cn&cdkey=${data.cdk}&game_biz=hk4e_global`
    }

    if (!urlMap[type]) return false

    let { url, query = '', body = '', sign = '', header } = urlMap[type]

    if (query) url += `?${query}`
    if (body) body = JSON.stringify(body)

    let headers = this.getHeaders(query, body, sign)
    headers = { ...header, ...headers }
    return { url, headers, body }
  }
  getCdkQuire(cdk, authKey) {
    let keys = {
      sign_type: 2,
      auth_appid: 'apicdkey',
      authkey_ver: 1,
      cdkey: cdk,
      lang: 'zh-cn',
      device_type: 'pc',
      game_version: 'CNRELWin3.5.0_R13695448_S13586568_D13948595',
      plat_type: 'pc',
      authkey: encodeURIComponent(authKey),
      game_biz: 'hk4e_cn '
    }
    let data = [];
    Object.keys(keys).forEach(e => {
      data.push(`${e}=${keys[e]}`)
    })
    return data.join("&")
  }
  getServer() {
    let uid = this.uid
    switch (String(uid)[0]) {
      case '1':
      case '2':
        return 'cn_gf01' // 官服
      case '5':
        return 'cn_qd01' // B服
      case '6':
        return 'os_usa' // 美服
      case '7':
        return 'os_euro' // 欧服
      case '8':
        return 'os_asia' // 亚服
      case '9':
        return 'os_cht' // 港澳台服
    }
    return 'cn_gf01'
  }

  async getData(type, data = {}, cached = false) {
    let { url, headers, body } = this.getUrl(type, data)

    if (!url) return false

    let cacheKey = this.cacheKey(type, data)
    let cahce = await redis.get(cacheKey)
    if (cahce) return JSON.parse(cahce)

    headers.Cookie = this.cookie

    if (data.headers) {
      headers = { ...headers, ...data.headers }
      delete data.headers
    }
    if (this['x-rpc-challenge']) {
      headers['x-rpc-challenge'] = this['x-rpc-challenge']
    }
    let param = {
      headers,
      agent: await this.getAgent(),
      timeout: 10000
    }

    if (body) {
      param.method = 'post'
      param.body = body
    } else {
      param.method = 'get'
    }
    let response = {}
    let start = Date.now()
    console.log(`请求url:${url}`)
    try {
      response = await fetch(url, param)
    } catch (error) {
      logger.error(error.toString())
      return false
    }

    if (!response.ok) {
      logger.error(`[米游社接口][${type}][${this.uid}] ${response.status} ${response.statusText}`)
      return false
    }
    if (this.option.log) {
      logger.mark(`[米游社接口][${type}][${this.uid}] ${Date.now() - start}ms`)
    }
    const res = await response.json()

    if (!res) {
      logger.mark('mys接口没有返回')
      return false
    }

    if (res.retcode !== 0 && this.option.log) {
      logger.debug(`[米游社接口][请求参数] ${url} ${JSON.stringify(param)}`)
    }
    /**风控了 需要验证 */
    if (res.retcode == 1034) {
      let code = await this.getData('createVerification')
      if (code.retcode == 0) {
        while (true) {
          let geet = new geetest(code.data)
          let d = await geet.check()
          let c = await this.getData('verifyVerification', d)
          if (c.retcode == 0) {
            await this.cache(c.data.challenge, this.cacheKey('x-rpc-challenge'))
            this['x-rpc-challenge'] = c.data.challenge
            return await this.getData(type, data, cached)
          }
        }
      }
    }
    res.api = type

    if (cached) this.cache(res, cacheKey)

    return res
  }

  getHeaders(query = '', body = '', sign = false, iscdk = false) {
    const cn = {
      app_version: '2.37.1',
      User_Agent: `Mozilla/5.0 (Linux; Android 12; ${this.device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/2.37.1`,
      client_type: 5,
      Origin: 'https://webstatic.mihoyo.com',
      X_Requested_With: 'com.mihoyo.hyperion',
      Referer: 'https://webstatic.mihoyo.com',
      "x-rpc-device_fp": this.device_ip
    }
    const os = {
      app_version: '2.9.0',
      User_Agent: `Mozilla/5.0 (Linux; Android 12; ${this.device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBSOversea/2.9.0`,
      client_type: '2',
      Origin: 'https://webstatic-sea.hoyolab.com',
      X_Requested_With: 'com.mihoyo.hoyolab',
      Referer: 'https://webstatic-sea.hoyolab.com',
      "x-rpc-device_fp": this.device_ip
    }
    let client
    if (this.server.startsWith('os')) {
      client = os
    } else {
      client = cn
    }
    if (sign) {
      return {
        'x-rpc-app_version': client.app_version,
        'x-rpc-client_type': client.client_type,
        'x-rpc-device_id': this.option.device_id || this.getGuid(),
        'User-Agent': client.User_Agent,
        'X-Requested-With': client.X_Requested_With,
        'x-rpc-platform': 'android',
        'x-rpc-device_model': this.device,
        'x-rpc-device_name': this.device,
        'x-rpc-channel': 'miyousheluodi',
        'x-rpc-sys_version': '6.0.1',
        Referer: client.Referer,
        DS: this.getDsSign()
      }
    }
    return {
      'x-rpc-app_version': client.app_version,
      'x-rpc-client_type': client.client_type,
      'User-Agent': client.User_Agent,
      Referer: client.Referer,
      DS: this.getDs(query, body),
      "x-rpc-device_fp": this.device_ip
    }
  }

  getDs(q = '', b = '') {
    let n = ''
    if (['cn_gf01', 'cn_qd01'].includes(this.server)) {
      n = 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs'
    } else if (['os_usa', 'os_euro', 'os_asia', 'os_cht'].includes(this.server)) {
      n = 'okr4obncj8bw5a65hbnn5oo6ixjc3l9w'
    }
    let t = Math.round(new Date().getTime() / 1000)
    let r = Math.floor(Math.random() * 900000 + 100000)
    let DS = md5(`salt=${n}&t=${t}&r=${r}&b=${b}&q=${q}`)
    return `${t},${r},${DS}`
  }

  /** 签到ds */
  getDsSign() {
    /** @Womsxd */
    const n = 'Qqx8cyv7kuyD8fTw11SmvXSFHp7iZD29'
    const t = Math.round(new Date().getTime() / 1000)
    const r = lodash.sampleSize('abcdefghijklmnopqrstuvwxyz0123456789', 6).join('')
    const DS = md5(`salt=${n}&t=${t}&r=${r}`)
    return `${t},${r},${DS}`
  }
  /**
   * 
   * @returns {string}
   */
  getGuid() {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }

    return this.device_id || (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4())
  }

  cacheKey(type, data) {
    return 'Yz:genshin:mys:cache:' + md5(this.uid + type + JSON.stringify(data))
  }

  async cache(res, cacheKey) {
    if (!res || res.retcode !== 0) return
    redis.setEx(cacheKey, this.cacheCd, JSON.stringify(res))
  }

  /* eslint-disable quotes */
  get device() {
    if (!this._device) this._device = `Yz-${md5(this.uid).substring(0, 5)}`
    return this._device
  }

  async getAgent() {
    let proxyAddress = cfg.bot.proxyAddress
    if (!proxyAddress) return null
    if (proxyAddress === 'http://0.0.0.0:0') return null

    if (!this.server.startsWith('os')) return null

    if (HttpsProxyAgent === '') {
      HttpsProxyAgent = await import('https-proxy-agent').catch((err) => {
        logger.error(err)
      })

      HttpsProxyAgent = HttpsProxyAgent ? HttpsProxyAgent.default : undefined
    }

    if (HttpsProxyAgent) {
      return new HttpsProxyAgent(proxyAddress)
    }

    return null
  }
}
