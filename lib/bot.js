import './config/init.js'
import ListenerLoader from './listener/loader.js'
import { Client } from 'icqq'
//import { createClient } from 'icqq'
//const Client = createClient()
import cfg from './config/config.js'
import YH from './wechat/yh_http.js'
global.iswechat = false
export default class Yunzai extends Client {
  // eslint-disable-next-line no-useless-constructor
  constructor(conf) {
    super(conf)
  }

  /** 登录机器人 */
  static async run() {
    const bot = new Yunzai(cfg.bot)
    new YH(bot, {
      vesion: 'Pro'
    })
    /** 加载icqq事件监听 */
    await ListenerLoader.load(bot)
    global.iswechat = true
    //console.log(bot)
    //await bot.login(cfg.qq, cfg.pwd)
    return bot
  }
}
