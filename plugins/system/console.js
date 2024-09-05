import cfg from '../../lib/config/config.js'
import common from '../../lib/common/common.js'
import MysSign from '../genshin/model/mysSign.js'

async function deley(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function a() {
    await deley(2000)
    let mysSign = new MysSign({})
    await mysSign.signTask(!!this?.e?.msg)
}

a()

export class friend extends plugin {
    constructor() {
        super({
            name: 'autoFriend',
            dsc: '自动同意好友',
            event: 'request.friend'
        })
    }
    async accept() {

    }
}