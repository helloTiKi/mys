import axios from 'axios';
import fs from 'fs';
import http from 'http'
import CryptoJS from 'crypto-js';
console.log('开始运行微信机器人')
let tempPath = process.cwd().replace(/\\/g, "/") + '/temp/'
let getFunc = {};
let postFunc = {};
let listens = {};
let postUrl = 'http://www.webcaptcha.online/YH/'
let vesion = 'Pro';
/**
 * @typedef {"eventPrivateMsg"|"eventGroupMsg"|"eventSystemMsg"|"eventSendMsg"|"EventMessageRecall"|"EventGroupMemberAdd"|"EventGroupMemberDecrease"|"EventReceivedTransfer"|"EventFriendVerify"|"EventGroupInvite"} EventType
 */
function getContentType(_contentType) {
    let retdata = {
        /**表示主类型，对于text/html，type就是text */
        type: '',
        /**表示子类型，对于text/html，subtype就是html */
        subtype: '',
        /**表示字符集，比如utf-8； */
        charset: 'utf-8',
        /**用于分割消息体中多个实体之间的边界*/
        boundary: '',
        /**用于标识消息体的开头部分 */
        start: '',
        /**用于指示消息体中使用的自然语言 */
        language: '',
        /**可以添加其他的定制属性，这些属性必须以“X-”开头。 */
        extension: ''
    }

    _contentType.split(';').forEach(e => {
        let data = e.toLowerCase();
        let isOK = false;
        data.replace(/charset=([\s|\S]*)/g, (_a, value, _c) => {
            if (['utf8', 'utf-8'].includes(value)) {
                retdata.charset = 'utf-8'
            } else retdata.charset = value;
            isOK = true;
        })
        if (isOK) return
        data.replace(/([application|audio|font|image|message|model|multipart|text|video]*)\/([\s|\S]*)/g, (_a, type, subtype) => {
            retdata.type = type, retdata.subtype = subtype;
            isOK = true;
        })
        if (isOK) return
    })
    return retdata;
}
const server = http.createServer(function (req, res) {

    if (req.method == 'GET') {
        console.log("有客户Get请求了=>" + req.url)
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
        try {
            getFunc[url](req, res, params)
        } catch (error) {
            try {
                getFunc['default'](req, res, url)
            } catch (error) {
                console.error(error)
                console.error(url + '路径未定义')
                res.writeHead(404)
                res.end()
            }
        }
        return
    } else if (req.method == 'POST') {
        let data = new Uint8Array();
        req.on('data', function (d) {
            data += d;
            //console.log('有数据')
        })
        req.on('end', function () {
            //console.log(data + '')
            console.log("有客户Post请求了=>" + req.url)
            try {
                let type = getContentType(req.headers['content-type']);
                switch (type.type) {
                    case 'application':
                        switch (type.subtype) {
                            case 'json':
                                data = JSON.parse(data + '');
                                break
                        }
                        break
                }
                postFunc[req.url](req, res, data)
            } catch (error) {
                try {
                    postFunc['default'] && postFunc['default'](req, res, data)
                } catch (error) {
                    console.error(error)
                    res.writeHead(404)
                    res.end()
                }
            }
        })

    }


    //res.end("success")
});
postFunc['/robot'] = function (req, res, data) {
    //消息处理入口 
    //console.log(data)
    Object.keys(listens).forEach(e => {
        listens[e](data)
    })
    res.end(JSON.stringify({ code: 0 }))
}
//监听8080端口
server.listen(8080)
/**群列表 */
class GroupList {
    /**群id */
    group_wxid = ''
    /**群名称 */
    group_name = ''
}
/**群信息 */
class GroupInfo {
    /**群名称 */
    group_name = ''
    /**群头像url */
    group_Image = ''
}
/**api返回数据格式 */
class CallBackData {
    code = -1
    data = {}
    event = ""
    msg = ""
}
/**好友信息 */
class FriendInfo {
    /**头像url */
    head_Image = ''
    /**朋友圈背景图url */
    Friends_Image = ''
    /**网名 */
    nickName = ''
    /**个性签名 */
    signature = ''
    /**微信号 */
    wxNumber = ''
    /**微信id */
    wxid = ''
}
class FriendList {
    /**网名 */
    friend_name = ''
    /**备注 */
    friend_nickname = ''
    /**微信号 */
    friend_number = ''
    /**微信id */
    friend_wxid = ''

}
class MsgData {
    /**来源机器人id */
    robot_wxid = ''
    /**消息类型 */
    type = ''
    /**
     * 消息内容 */
    msg = ''
}
class eventPrivateMsgData extends MsgData {
    /**消息来源id */
    from_wxid = ''
    /**昵称 */
    from_name = ''
}
class eventGroupMsgData extends MsgData {
    /**消息来源的人昵称 */
    final_from_name = ''
    /**消息来源的人id */
    final_from_wxid = ''
    /**消息来源群id */
    from_wxid = ''
    /**消息来源群名称 */
    from_name = ''
}
class ReceivedTransferData {
    /**对方昵称 */
    from_name = ''
    /**对方id */
    from_wxid = ''
    /**转账金额，例如：1.00 */
    money = ''
    /**转账id */
    money_id = ''
    /**框架机器人id */
    robot_wxid = ''
}
class LinkData {
    /**标题 */
    title = ''
    /**描述 */
    desc = ''
    /**链接 */
    url = ''
    /**图片url */
    pic = ''
}
/**
 * @typedef {"通过QQ号添加"|"通过邮箱添加"|"通过微信号搜索"|"通过QQ好友添加"|"通过通讯录添加"|"通过群聊添加"|"通过手机号添加"|"通过名片添加"|"通过扫一扫添加"|"单向添加"|"朋友验证消息"} addtype
 */
class YHAPI {
    /**
     * 
     * @param {"Air"|"Pro"} vesion 请如实填写框架版本，这可能会导致框架停止运行
     */
    constructor(vesion) {
        this.isPro = vesion == 'Pro' ? true : false
        this.ProApi = [
            "OpenWeChatBrowser",
            "DecryptImages",
            "GetFirendLists",
            "GetGroupMemberComments",
            "GetGroupMemberList",
            "SendRelayTheMsg",
            "SendGifImageMsg",
            "SendBusinessCardMsg",
            "SendAtesMsg",
            "SendCustomAteMsg",
            "SendAppletCard",
            "SendAppletMsg",
            "SendCustomXml",
            "SendKWMusicSharing",
            "SendKGMusicSharing",
            "SendMusicLinkB",
            "SendMusicLinkC",
            "SendVoiceSharing",
            "AddFriendToWxid",
            "AddFirends",
            "ModifyFriendNotes",
            "DeleteFriends",
            "CreateGroupChat",
            "ModifyGroupName",
            "ModifyGroupNotes",
            "SetGroupNickname",
            "SendGroupInviteLess",
            "SendGroupInviteMany",
            "KickOutGroupMembers",
            "QuitGroupChat",
            "AgreeToFriend",
            "AgreeToGroup",
            "AutomaticMoney"
        ]
        this.createTime = new Date().getTime()
    }
    /**
     * 
     * @param {string} api 
     * @param {object} config 
     * @returns 
     */
    async sendData(api, config) {
        config['event'] = api;
        /**@type {CallBackData} */
        let data = new CallBackData
        if (!this.isPro) {
            if (this.ProApi.includes(api)) {
                data.code = -1;
                data.msg = '你使用的Pro函数，为保证框架运行，已拦截函数发送'
                data.event = api
                console.error(data)
                return data
            }
        }

        try {
            data = (await axios.post(postUrl, config)).data
        } catch (error) {
            console.error(error)
        }
        return data
    }
    /**
     * 输出日志
     * @param {string} robot_wxid 框架机器人id
     * @param {string} msg 要输出的内容
     * @param {number} color 字体颜色
     */
    OutputLog(robot_wxid, msg, colour) {
        this.sendData('OutputLog', {
            robot_wxid: robot_wxid,
            msg: {
                msg: msg,
                colour: colour
            }
        })
    }
    /**
     * 调用微信内置浏览器 Pro
     * @param {string} robot_wxid 框架机器人id
     * @param {string} url 网址url
     */
    OpenWeChatBrowser(robot_wxid, url) {
        this.sendData('OpenWeChatBrowser', {
            robot_wxid: robot_wxid,
            msg: {
                url: url
            }
        })
    }
    /**
     * 微信图片解密 Pro
     * @param {string} robot_wxid 框架机器人id
     * @param {string} path 要保存的路径
     * @param {string} datpath dat文件路径
     */
    async DecryptImages(robot_wxid, path, datpath) {
        return await this.sendData('DecryptImages', {
            robot_wxid: robot_wxid,
            msg: {
                name: path,
                datpath: datpath
            }
        })

    }
    /**
     * 取框架所有机器人id
     */
    async GetRobotIds() {
        let data = await this.sendData('GetRobotIds', {})
        /**
         * @type {string[]}
         */
        let robots = [];
        data.data.robot.split("|").forEach(e => {
            if (e) {
                robots.push(e)
            }
        })
        return [1]
    }
    /**
     * 取框架机器人名称
     * @param {string} robot_wxid 机器人框架id
     * @returns 返回昵称
     */
    async GetRobotName(robot_wxid) {
        let data = await this.sendData('GetRobotName', { robot_wxid: robot_wxid });
        /**@type {string} */
        let name = data.data.Name;
        return name
    }
    /**
     * 取框架机器人头像
     * @param {string} robot_wxid 机器人框架id
     * @returns 返回的是图片的url
     */
    async GetRobotImage(robot_wxid) {
        let data = await this.sendData('GetRobotImage', { robot_wxid: robot_wxid });
        /**@type {string} */
        let image = data.data.Image;
        return image
    }
    /**
     * 取好友列表 Pro
     * @param {string} robot_wxid 机器人框架id
     */
    async GetFirendLists(robot_wxid) {
        let data = await this.sendData('GetFirendLists', { robot_wxid: robot_wxid });
        /**@type {FriendList[]} */
        let ret = []
        Object.keys(data.data).forEach(e => {
            let d = data.data;
            let c = new FriendList;
            c.friend_name = d[e].friend_name,
                c.friend_nickname = d[e].friend_nickname,
                c.friend_number = d[e].friend_number,
                c.friend_wxid = d[e].friend_wxid
            ret.push(c)
        })
        return ret
    }
    /**
     * 
     * @param {string} robot_wxid 
     * @returns 返回群聊列表
     */
    async GetGroupLists(robot_wxid) {
        let data = await this.sendData('GetGroupLists', { robot_wxid: robot_wxid });
        /**
         * @type {GroupList[]}
         */
        let list = [];
        if (data.data == null) return list
        Object.keys(data.data).forEach(e => {
            list.push({ group_name: data.data[e].group_name, group_wxid: data.data[e].group_wxid })
        })
        return list
    }
    /**
     * 取群信息
     * @param {string} robot_wxid 框架机器人id
     * @param {string} group_wxid 群id
     * @returns 返回群信息
     */
    async GetGroupInfo(robot_wxid, group_wxid) {
        let data = await this.sendData('GetGroupInfo', { robot_wxid: robot_wxid, msg: { from_wxid: group_wxid } });
        console.log(data)
        /**@type {GroupInfo} */
        let group_data = new GroupInfo
        group_data.group_name = data.data['群名称'];
        group_data.group_Image = data.data['群头像'];
        return group_data
    }
    /**
     * 取群成员详细
     * @param {string} robot_wxid 框架机器人id
     * @param {string} group_wxid 群id
     * @param {string} from_wxid 要查询的人id
     */
    async GetGroupMemberDetails(robot_wxid, group_wxid, from_wxid) {
        let data = await this.sendData('GetGroupMemberDetails', {
            robot_wxid: robot_wxid,
            msg: {
                /**根据官方api就是这样传参的，不知道为什么要这么设置 */
                group_wxid: from_wxid,
                from_wxid: group_wxid
            }
        });
        /**@type {FriendInfo} */
        let _FriendInfo = new FriendInfo;
        if (data.code == 0) {
            _FriendInfo.Friends_Image = data.data['朋友圈背景图']
            _FriendInfo.head_Image = data.data['头像']
            _FriendInfo.nickName = data.data['网名']
            _FriendInfo.wxNumber = data.data['微信号']
            _FriendInfo.wxid = data.data['微信ID']
            _FriendInfo.signature = data.data['签名']
        }
        return _FriendInfo

    }
    /**
     * 取群成员备注 Pro
     * @param {string} robot_wxid 框架机器人id
     * @param {string} group_wxid 群聊id
     * @param {string} from_wxid 查询的人id
     */
    async GetGroupMemberComments(robot_wxid, group_wxid, from_wxid) {
        let data = await this.sendData('GetGroupMemberComments', {
            robot_wxid: robot_wxid,
            msg: {
                /**根据官方api就是这样传参的，不知道为什么要这么设置 */
                group_wxid: from_wxid,
                from_wxid: group_wxid
            }
        });
        return data
    }
    /**
     * 转发消息 Pro
     * @param {string} robot_wxid 机器人框架id
     * @param {string} to_wxid 发送对象
     * @param {string} msg  要发送的内容
     * @returns 返回是否发送成功
     */
    async SendRelayTheMsg(robot_wxid, to_wxid, msg) {
        let ret = await this.sendData("SendRelayTheMsg", { robot_wxid: robot_wxid, to_wxid: to_wxid, msg: msg })
        return ret.code == 1 ? true : false

    }
    /**
     * 发送文本消息
     * @param {string} robot_wxid 机器人框架id
     * @param {string} to_wxid 发送对象
     * @param {string} msg  要发送的内容
     * @returns 返回是否发送成功
     */
    async SendTextMsg(robot_wxid, to_wxid, msg) {
        let ret = await this.sendData("SendTextMsg", { robot_wxid: robot_wxid, to_wxid: to_wxid, msg: msg })
        return ret.code == 1 ? true : false
    }
    /**
     * 发送图片消息
     * @param {string} robot_wxid 机器人框架id
     * @param {string} to_wxid 发送对象
     * @param {string} ImagePath  要发送的图片路径
     * @param {'jgp'|"png"|"bmp"|"tiff"|"gif"|"raw"|"psd"|"svg"} [picture_format] 图片格式，默认jpg
     * @returns 返回是否发送成功
     */
    async SendImageMsg(robot_wxid, to_wxid, ImagePath, picture_format) {
        if (!picture_format) {
            picture_format = 'jgp'
        }
        let msg = {
            name: '',
            type: 0,
            url: ImagePath
        }
        if (ImagePath.slice(0, 4) == 'http') {
            msg.name = new Date().getTime() + '.' + picture_format
        } else {
            msg.type = 1
            msg.url = ImagePath.replace('\\', '/')
        }
        let ret = await this.sendData("SendImageMsg", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: msg
        })
        return ret.code == 1 ? true : false

    }
    /**
     * 发送动态表情
     * @param {string} robot_wxid 机器人框架id
     * @param {string} to_wxid 发送对象
     * @param {string} ImagePath  动态表情路径，可以是网络动态表情url 格式是gif图片
     * @returns 返回是否发送成功
     */
    async SendGifImageMsg(robot_wxid, to_wxid, ImagePath) {
        let msg = {
            name: '',
            type: 0,
            url: ImagePath
        }
        if (ImagePath.slice(0, 4) == 'http') {
            msg.name = new Date().getTime() + '.gif'
        } else {
            msg.type = 1
            msg.url = ImagePath.replace('\\', '/')
        }
        let ret = await this.sendData("SendGifImageMsg", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: msg
        })
        return ret.code == 1 ? true : false

    }
    /**
     * 发送文件消息
     * @param {string} robot_wxid 机器人框架id
     * @param {string} to_wxid 发送对象
     * @param {string} path  文件路径
     * @param {'txt'|'jpg'|"png"|"gif"|"mp4"|"mp3"} [file_format] 文件格式，如果传的是网络文件，请指定文件格式,默认txt
     * @returns 返回是否发送成功
     */
    async SendFileMsg(robot_wxid, to_wxid, path, file_format) {
        if (!file_format) {
            file_format = 'txt'
        }
        let msg = {
            name: '',
            type: 0,
            url: path
        }
        if (path.slice(0, 4) == 'http') {
            msg.name = new Date().getTime() + '.' + file_format
        } else {
            msg.type = 1
            msg.url = path.replace('\\', '/')
        }
        let ret = await this.sendData("SendFileMsg", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: msg
        })
        return ret.code == 1 ? true : false
    }
    /**
     * 发送视频消息
     * @param {string} robot_wxid 机器人框架id
     * @param {string} to_wxid 发送对象
     * @param {string} path  文件路径
     * @param {"mp4"|"avi"|"mov"|"wmv"|"flv"|"mkv"|"webm"|"mpeg"} [Video] 视频格式,如果是网络视频，请指定视频格式
     * @returns 返回是否发送成功
     */
    async SendViedeoMsg(robot_wxid, to_wxid, path, Video) {
        if (!Video) {
            Video = 'mp4'
        }
        let msg = {
            name: '',
            type: 0,
            url: path
        }
        if (path.slice(0, 4) == 'http') {
            msg.name = new Date().getTime() + '.' + Video
        } else {
            msg.type = 1
            msg.url = path.replace('\\', '/')
        }
        let ret = await this.sendData("SendViedeoMsg", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: msg
        })
        return ret.code == 1 ? true : false

    }
    /**
     * 发送名片分享
     * @param {string} robot_wxid 框架机器人id
     * @param {string} to_wxid 发送对象
     * @param {string} from_wxid 要发谁的名片(只能是好友)
     */
    async SendBusinessCardMsg(robot_wxid, to_wxid, from_wxid) {
        let data = await this.sendData('SendBusinessCardMsg', {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                from_wxid: from_wxid
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 发送艾特消息
     * @param {string} robot_wxid 框架机器人id 
     * @param {string} to_wxid 发送对象(理论上是往群里发的，是群id)
     * @param {string} final_from_wxid 要@谁。
     * @param {string} msg 消息内容
     */
    async SendAteMsg(robot_wxid, to_wxid, final_from_wxid, msg) {
        /**理论上不获取名称也可以的，只是发送的消息只有 @ 标志，没有 @ 的人的名字。 */
        let name = (await this.GetGroupMemberDetails(robot_wxid, to_wxid, final_from_wxid)).nickName

        let data = await this.sendData("SendAteMsg", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                final_from_wxid: final_from_wxid,
                msg: msg,
                final_from_name: name
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 发送多人艾特消息
     * @param {string} robot_wxid 框架机器人id 
     * @param {string} to_wxid 发送对象(理论上是往群里发的，是群id)
     * @param {string[]} final_from_wxids 要@谁。
     * @param {string} msg 消息内容
     */
    async SendAtesMsg(robot_wxid, to_wxid, final_from_wxids, msg) {
        let data = await this.sendData("SendAtesMsg", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                final_from_wxids: final_from_wxids.join("|"),
                msg: msg,
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 发送艾特All消息
     * @param {string} robot_wxid 框架机器人id  
     * @param {string} to_wxid 发送对象 群id
     * @param {string} msg 消息内容
     * @returns 返回结果不代表发送成功，只代表框架执行成功，如遇执行成功但是发送失败请检查框架机器人所在群的权限(只有管理才能 @所有人)
     */
    async SendAteAllMsg(robot_wxid, to_wxid, msg) {
        let data = await this.sendData("SendAteAllMsg", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: msg
        })
        return data.code == 1 ? true : false
    }
    /**
     * 发送自定义艾特消息
     * @param {string} robot_wxid 框架机器人id
     * @param {string} to_wxid 发送对象(群id)
     * @param {string} final_from_wxid 要 @ 的人的id。
     * @param {string} msg 消息内容，在内容里定义 "@" 来确定位置
     */
    async SendCustomAteMsg(robot_wxid, to_wxid, final_from_wxid, msg) {
        let name = (await this.GetGroupMemberDetails(robot_wxid, to_wxid, final_from_wxid)).nickName
        let data = await this.sendData("SendCustomAteMsg", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                final_from_wxid: final_from_wxid,
                msg: msg.replace("@", "@" + name)
            }
        })
        return data.code == 1 ? true : false
    }
    async SendAppletCard() {
        return false
    }
    async SendAppletMsg() {

        return false
    }
    /**
     * 发送分享链接
     * @param {string} robot_wxid 框架机器人id
     * @param {string} to_wxid 发送对象id
     * @param {LinkData} config 链接参数
     */
    async SendSharingLink(robot_wxid, to_wxid, config) {
        let data = await this.sendData("SendSharingLink", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                title: config.title,
                desc: config.desc,
                url: config.url,
                pic: config.pic
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 发送音乐分享
     * @param {string} robot_wxid 框架机器人id
     * @param {string} to_wxid 发送对象id
     * @param {string} name 音乐名
     * @param {"QQMusic"|"WYYMusic"|"KWMusic"|"KGMusic"} [type] 分享类型，默认QQ音乐分享
     */
    async SendMusicSharing(robot_wxid, to_wxid, name, type) {
        let api = `Send${type ? type : "QQMusic"}Sharing`
        let data = await this.sendData(api, {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                name: name
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 发送音乐链接
     * @param {string} robot_wxid 框架机器人id
     * @param {string} to_wxid 发送对象id
     * @param {LinkData} config 链接参数
     */
    async SendMusicLinkA(robot_wxid, to_wxid, config) {
        let data = await this.sendData("SendMusicLinkA", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                title: config.title,
                desc: config.desc,
                music: config.url,
                pic: config.pic
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 发送音乐链接II
     * @param {string} robot_wxid 框架机器人id
     * @param {string} to_wxid 发送对象id
     * @param {LinkData} config 链接参数
     */
    async SendMusicLinkB(robot_wxid, to_wxid, config) {
        let data = await this.sendData("SendMusicLinkB", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                title: config.title,
                desc: config.desc,
                music: config.url,
                pic: config.pic
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 发送音乐链接III
     * @param {string} robot_wxid 框架机器人id
     * @param {string} to_wxid 发送对象id
     * @param {LinkData} config 链接参数
     */
    async SendMusicLinkC(robot_wxid, to_wxid, config) {
        let data = await this.sendData("SendMusicLinkC", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                title: config.title,
                desc: config.desc,
                music: config.url,
                pic: config.pic
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 语音专用分享
     * @param {string} robot_wxid 框架机器人id
     * @param {string} to_wxid 发送对象id
     * @param {LinkData} config 链接参数
     */
    async SendVoiceSharing(robot_wxid, to_wxid, config) {
        let data = await this.sendData("SendVoiceSharing", {
            robot_wxid: robot_wxid,
            to_wxid: to_wxid,
            msg: {
                title: config.title,
                desc: config.desc,
                music: config.url,
                pic: config.pic
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 通过Wxid添加好友
     * @param {string} robot_wxid 机器人框架id
     * @param {string} friend_wxid 要加谁的id
     * @param {string} addtext 附加语
     * @param {addtype} [_addtype] 添加类型
     */
    async AddFriendToWxid(robot_wxid, friend_wxid, addtext, _addtype) {
        let map = {
            "通过QQ号添加": 1,
            "通过邮箱添加": 2,
            "通过微信号搜索": 3,
            "通过QQ好友添加": 4,
            "通过通讯录添加": 10,
            "通过群聊添加": 14,
            "通过手机号添加": 15,
            "通过名片添加": 17,
            "通过扫一扫添加": 30,
            "单向添加": 6,
            "朋友验证消息": 0
        }
        let type = map[_addtype ? _addtype : "通过扫一扫添加"]
        let data = await this.sendData("AddFriendToWxid", {
            robot_wxid: robot_wxid,
            msg: {
                friend_wxid: friend_wxid,
                addtext: addtext,
                addtype: type
            }
        })
        return data.code == 1 ? true : false

    }
    /**
     * 通过微信号添加好友
     * @param {string} robot_wxid 机器人框架id
     * @param {string} to_id 要加谁的 微信号/手机号
     * @param {string} addtext 附加语
     * @param {addtype} [_addtype] 添加类型  手机和qq必须对应类型，其他的使用默认的 默认扫一扫添加(30)
     */
    async AddFirends(robot_wxid, to_id, addtext, _addtype) {
        let map = {
            "通过QQ号添加": 1,
            "通过邮箱添加": 2,
            "通过微信号搜索": 3,
            "通过QQ好友添加": 4,
            "通过通讯录添加": 10,
            "通过群聊添加": 14,
            "通过手机号添加": 15,
            "通过名片添加": 17,
            "通过扫一扫添加": 30,
            "单向添加": 6,
            "朋友验证消息": 0
        }
        let type = map[_addtype ? _addtype : "通过扫一扫添加"]
        let data = await this.sendData("AddFriendToWxid", {
            robot_wxid: robot_wxid,
            msg: {
                to_id: to_id,
                addtext: addtext,
                addtype: type
            }
        })
        return data.code == 1 ? true : false

    }
    /**
     * 修改好友备注
     * @param {string} robot_wxid  机器人框架id
     * @param {string} friend_wxid 朋友id
     * @param {string} remarks 新的备注
     */
    async ModifyFriendNotes(robot_wxid, friend_wxid, remarks) {
        let data = await this.sendData("ModifyFriendNotes", {
            robot_wxid: robot_wxid,
            msg: {
                friend_wxid: friend_wxid,
                remarks: remarks
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 删除好友
     * @param {string} robot_wxid 框架机器人id
     * @param {string} friend_wxid 朋友id
     * @returns 
     */
    async DeleteFriends(robot_wxid, friend_wxid) {
        let data = await this.sendData("DeleteFriends", {
            robot_wxid: robot_wxid,
            msg: {
                friend_wxid: friend_wxid
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 创建群聊
     * @param {string} robot_wxid 框架机器人id
     * @param {string} to_wxid_A 朋友id_A
     * @param {string} to_wxid_B 朋友id_B
     * @returns 
     */
    async CreateGroupChat(robot_wxid, to_wxid_A, to_wxid_B) {
        let data = await this.sendData("CreateGroupChat", {
            robot_wxid: robot_wxid,
            msg: {
                to_wxid_A: to_wxid_A,
                to_wxid_B: to_wxid_B
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 修改群名称
     * @param {string} robot_wxid 框架机器人id
     * @param {string} group_wxid 群id
     * @param {string} groupname 新的群名称
     */
    async ModifyGroupName(robot_wxid, group_wxid, groupname) {
        let data = await this.sendData("ModifyGroupName", {
            robot_wxid: robot_wxid,
            msg: {
                from_wxid: group_wxid,
                groupname: groupname
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 修改你在哪个群聊里的昵称
     * @param {string} robot_wxid 框架机器人id
     * @param {string} group_wxid 群id
     * @param {string} remarks 新的昵称
     */
    async SetGroupNickname(robot_wxid, group_wxid, remarks) {
        let data = await this.sendData("SetGroupNickname", {
            robot_wxid: robot_wxid,
            msg: {
                from_wxid: group_wxid,
                remarks: remarks
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 邀请好友进群_直接拉
     * @param {string} robot_wxid 框架机器人id
     * @param {string} group_wxid 群聊id
     * @param {string} friend_wxid 朋友id
     */
    async SendGroupInviteLess(robot_wxid, group_wxid, friend_wxid) {
        let data = await this.sendData("SendGroupInviteLess", {
            robot_wxid: robot_wxid,
            msg: {
                from_wxid: group_wxid,
                final_from_wxid: friend_wxid
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 邀请好友进群_发链接
     * @param {string} robot_wxid 框架机器人id
     * @param {string} group_wxid 群聊id
     * @param {string} friend_wxid 朋友id
     */
    async SendGroupInviteMany(robot_wxid, group_wxid, friend_wxid) {
        let data = await this.sendData("SendGroupInviteMany", {
            robot_wxid: robot_wxid,
            msg: {
                from_wxid: group_wxid,
                final_from_wxid: friend_wxid
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 踢出群成员
     * @param {string} robot_wxid 框架机器人id
     * @param {string} group_wxid 群聊id
     * @param {string} to_id 对象id，要踢出谁
     * @returns 返回结果只代表框架执行成功，实际结果要看是否有权限(管理)
     */
    async KickOutGroupMembers(robot_wxid, group_wxid, to_id) {
        let data = await this.sendData("KickOutGroupMembers", {
            robot_wxid: robot_wxid,
            msg: {
                from_wxid: group_wxid,
                to_id: to_id
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 退出群聊
     * @param {string} robot_wxid 框架机器人id
     * @param {string} group_wxid 群聊id
     * @returns 
     */
    async QuitGroupChat(robot_wxid, group_wxid) {
        let data = await this.sendData("QuitGroupChat", {
            robot_wxid: robot_wxid,
            msg: {
                from_wxid: group_wxid
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 同意好友请求
     * @param {string} robot_wxid 框架机器人id
     * @param {string} v3 v3数据
     * @param {string} v4 v4数据
     */
    async AgreeToFriend(robot_wxid, v3, v4) {
        let data = await this.sendData("AgreeToFriend", {
            robot_wxid: robot_wxid,
            msg: {
                v3: v3,
                v4: v4,
                addtype: 10
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 同意进群邀请
     * @param {string} robot_wxid 框架机器人id
     * @param {string} friend_wxid 邀请人id
     * @param {string} url 链接url
     */
    async AgreeToGroup(robot_wxid, friend_wxid, url) {
        let data = await this.sendData("AgreeToGroup", {
            robot_wxid: robot_wxid,
            msg: {
                friend_wxid: friend_wxid,
                url: url
            }
        })
        return data.code == 1 ? true : false
    }
    /**
     * 自动收款
     * @param {string} robot_wxid 框架机器人id
     * @param {string} from_wxid v3数据
     * @param {string} v4 v4数据
     */
    async AutomaticMoney(robot_wxid, from_wxid, money_id) {
        let data = await this.sendData("AutomaticMoney", {
            robot_wxid: robot_wxid,
            msg: {
                from_wxid: from_wxid,
                money_id: money_id,
            }
        })
        return data.code == 1 ? true : false
    }
}
class YH_http extends YHAPI {
    /**
     * 
     * @param {"Air"|"Pro"} vesion 请如实填写框架版本，这可能会导致框架停止运行
     */
    constructor(vesion) {
        super(vesion)
        let that = this;
        this.cb = {
            eventPrivateMsg: false
        }
        /**下面是消息进阶处理，在事件传到回调函数前处理数据结构 */
        listens[this.createTime] = function (e) {
            /**
             * @type {EventType}
             */
            let event = e.Event;
            delete e.Event;
            if (e.type && typeof e.type == 'number') {
                let map = {
                    1: 'text',
                    3: 'image',
                    34: "voice",
                    47: 'emjoi',
                    48: 'position',
                    49: 'shareLink',
                    2001: 'redEnvelope'
                }
                e.type = map[e.type]
            }
            switch (event) {
                /**私聊消息 */
                case 'eventPrivateMsg':
                    that.eventPrivateMsg(e);
                    break
                case 'eventGroupMsg':
                    that.eventGroupMsg(e);
                    break
                case 'eventSystemMsg':
                    that.eventSystemMsg(e);
                    break;
                case 'eventSendMsg':
                    that.eventSendMsg(e);
                    break;
                case 'EventMessageRecall':
                    that.EventMessageRecall(e)
                    break;
                case 'EventGroupMemberAdd':
                    that.EventGroupMemberAdd(e);
                    break
                case 'EventGroupMemberDecrease':
                    that.EventGroupMemberDecrease(e)
                    break;
                case 'EventReceivedTransfer':
                    that.EventReceivedTransfer(e)
                        .then(_e => {
                            if (_e > 0) {
                                setTimeout(() => {
                                    that.AutomaticMoney(e.robot_wxid, e.from_wxid, e.money_id)
                                }, _e * 1000)
                            }
                        })
                    break;
                case 'EventFriendVerify':
                    that.EventFriendVerify(e)
                    break;
                case 'EventGroupInvite':
                    that.EventGroupInvite(e);
                    break;
                default: return
            }

        }
    }
    /**
     * @callback eventPrivate
     * @param {eventPrivateMsgData} data
     */
    /**
     * 私聊消息
     * @param {eventPrivate} data 
     */
    async eventPrivateMsg(data) {
        if (typeof data == 'function') {
            this.eventPrivateMsg = data;
        }
    }
    /**
     * @callback eventGroup
     * @param {eventGroupMsgData} data
     */
    /**
     * 群聊消息
     * @param {eventGroup} data 
     */
    async eventGroupMsg(data) {
        if (typeof data == 'function') {
            this.eventGroupMsg = data;
        }
    }
    /**系统消息 */
    async eventSystemMsg(data) {
        if (typeof data == 'function') {
            this.eventSystemMsg = data;
        }
    }
    /**本人消息 */
    async eventSendMsg(data) {
        if (typeof data == 'function') {
            this.eventSendMsg = data;
        }
    }
    /**消息撤回 */
    async EventMessageRecall(data) {
        if (typeof data == 'function') {
            this.EventMessageRecall = data;
        }
    }
    /**新人进群 */
    async EventGroupMemberAdd(data) {
        if (typeof data == 'function') {
            this.EventGroupMemberAdd = data;
        }
    }
    /**新人退群 */
    async EventGroupMemberDecrease(data) {
        if (typeof data == 'function') {
            this.EventGroupMemberDecrease = data;
        }
    }
    /**
     * @callback EventReceivedTransfer
     * @param {ReceivedTransferData} data
     * @returns {number} 返回在多少秒后自动执行收款操作，如果为0则不执行
     */
    /**
     * 转账事件
     * @param {EventReceivedTransfer} data 
     */
    async EventReceivedTransfer(data) {
        if (typeof data == 'function') {
            this.EventReceivedTransfer = data;
        }
    }
    /**好友请求 */
    async EventFriendVerify(data) {
        if (typeof data == 'function') {
            this.EventFriendVerify = data;
        }
    }
    /**邀请进群 */
    async EventGroupInvite(data) {
        if (typeof data == 'function') {
            this.EventGroupInvite = data;
        }
    }
}
class ruleData {
    /**正则 */
    reg = ''
    /**函数 */
    fnc = () => { }
}
class YHdata {
    /**
     * 规则数组
     * @type {ruleData[]} 
     * */
    rule = []
    /**
     * 框架版本
     * @type {"Pro"|"Air"} 
     * */
    vesion = ''
}

class message {
    /**
     * 
     * @param {MsgData} e 
     */
    constructor(e) {
        this.post_type = "message";
        /**机器人id */
        this.self_id = e.robot_wxid
        this.message = [];
        this.message.push({ type: e.type, text: e.msg });
        {
            switch (e.type) {
                case 'text':
                    let reg = new RegExp('\\[@nickname=\(.*?\),wxid=\(.*?\)\\] ', 'g')
                    if (reg.test(e.msg)) {
                        this.message[0].text = e.msg.replace(reg, '');
                        let tmp = this.message.pop()
                        let data = reg.exec(e.msg)
                        let name = data[1].split('[@emoji=\\u2005]&')
                        let test = data[2];
                        name.forEach(v => {
                            if (v == "所有人") {
                                const atall = new RegExp('notify@all');
                                test = test.replace(atall)
                                this.message.push({ type: 'at', id: 'notify@all', name: '所有人', text: "@所有人" })
                            } else if (v != '') {
                                const at = new RegExp('wxid_\[0-9a-z\]\{14\}');
                                let id = at.exec(test)
                                this.message.push({ type: 'at', id: id[0], name: v, text: `@${v}` })
                            }
                        })
                        this.message.push(tmp)
                    }
                    break
                case 'image':
                    let tmp = this.message.pop();
                    tmp.text = tmp.text.replace(/\\/g, "/");
                    this.message.push({
                        asface: false,
                        file: new RegExp('图片消息->\\[(.*?)\\]').exec(tmp.text)[1],
                        type: 'image',
                        url: ''
                    })
                    break
                case 'emjoi':
                    this.message.pop();
                    this.message.push({
                        asface: true,
                        file: '',
                        type: 'image',
                        url: e.msg
                    })
                    break;
            }
        }

        this.time = new Date().getTime()
    }
}
class GroupMessage extends message {
    /**
     * 
     * @param {eventGroupMsgData} e 
     */
    constructor(e) {
        super(e)
        let that = this;
        this.nickname = (function (_) {
            return _.replace(/\[@emoji=(.*?)\]/g, (a, b) => {
                return String.fromCharCode(parseInt(b.slice(2), 16));
            })
        })(e.final_from_name);
        this.message_type = 'group';
        this.group_id = e.from_wxid;
        this.group_name = e.from_name;
        this.user_id = e.final_from_wxid
        this.sender = {
            age: 0,
            area: '',
            card: '',
            level: 1,
            nickname: e.final_from_name,
            role: 'owner',
            sex: 'unknown',
            title: '',
            user_id: this.user_id
        }
        this.atall = (function (s) {
            let isall = false;
            s.forEach(val => {
                if (val.type == 'at') {
                    if (val.id == 'notify@all') {
                        isall = true
                    }
                }
            })
            return isall
        })(this.message)
        this.atme = (function (s) {
            let isat = false;
            s.forEach(val => {
                if (val.type == 'at') {
                    if (val.id == that.self_id) {
                        isat = true
                    }
                }
            })
            return isat
        }(this.message))
    }
    /**
     * 
     * @param {string|object} msg 发送的消息
     * @param {boolean} quote 是否引用回复
     */
    async reply(msg, quote = false) {
        let api = new YHAPI(vesion);
        let type = typeof msg

        if (type == 'string') {
            api.SendTextMsg(this.self_id, this.group_id, msg)
        } else if (type == 'object') {
            if (Array.isArray(msg)) {
                if (msg.length == 2) {
                    switch (msg[0].type) {
                        case "at":
                            api.SendAteMsg(this.self_id, this.group_id, msg[0].id, msg[1])
                            break
                        default: debugger
                    }
                } else {
                    debugger
                }
            } else {
                switch (msg.type) {
                    case 'image':
                        let buffer = Buffer.from(msg.file)
                        let md5 = CryptoJS.MD5(buffer.toString('hex')).toString();
                        let path = `${tempPath}image/${md5}.jpg`
                        console.log(`图片路径：${path}`)
                        if (fs.existsSync(path)) {
                            api.SendImageMsg(this.self_id, this.group_id, path)
                        } else {
                            fs.writeFile(path, buffer, (err) => {
                                if (err) {
                                    throw err;
                                }
                                api.SendImageMsg(this.self_id, this.group_id, path)
                            })
                        }
                        break;
                }
            }
        }
    }
}
class PrivateMessage extends message {
    /**
     * 
     * @param {eventPrivateMsgData} e 
     */
    constructor(e) {
        super(e)
        let that = this;
        this.nickname = (function (_) {
            return _.replace(/\[@emoji=(.*?)\]/g, (a, b) => {
                return String.fromCharCode(parseInt(b.slice(2), 16));
            })
        })(e.from_name);
        this.message_type = 'private';
        this.user_id = e.from_wxid
        this.sender = {
            age: 0,
            area: '',
            card: '',
            level: 1,
            nickname: e.from_name,
            role: 'owner',
            sex: 'unknown',
            title: '',
            user_id: this.user_id
        }
    }
    /**
     * 
     * @param {string|object} msg 发送的消息
     * @param {boolean} quote 是否引用回复
     */
    async reply(msg, quote = false) {
        let api = new YHAPI(vesion);
        let type = typeof msg

        if (type == 'string') {
            api.SendTextMsg(this.self_id, this.user_id, msg)
        } else if (type == 'object') {
            if (Array.isArray(msg)) {
                if (msg.length == 2) {
                    switch (msg[0].type) {
                        case "at":
                            debugger
                            break
                        default: debugger
                    }
                } else {
                    debugger
                }
            } else {
                switch (msg.type) {
                    case 'image':
                        let buffer = Buffer.from(msg.file)
                        let md5 = CryptoJS.MD5(buffer.toString('hex')).toString();
                        let path = `${tempPath}image/${md5}.jpg`
                        console.log(`图片路径：${path}`)
                        if (fs.existsSync(path)) {
                            api.SendImageMsg(this.self_id, this.group_id, path)
                        } else {
                            fs.writeFile(path, buffer, (err) => {
                                if (err) {
                                    throw err;
                                }
                                api.SendImageMsg(this.self_id, this.user_id, path)
                            })
                        }
                        break;
                }
            }
        }
    }
}
export default class YH extends YH_http {
    /**
     * 
     * @param client
     * @param {YHdata} e 
     */
    constructor(client, e) {
        super(e.vesion)
        client.wechat = this
        this.listener = {
            message: () => { }
        }
        this.start()
    }
    async start() {
        let that = this;
        //监听事件只有首次设置有效
        this.eventPrivateMsg(async function (e) {
            let message = new PrivateMessage(e)
            console.log(message)
            that.message(message)

        })
        this.eventGroupMsg(async function (e) {
            let message = new GroupMessage(e)
            that.message(message)
            console.log(message)
        })
        this.EventReceivedTransfer(async function (e) {

        })
    }
    async on(matcher, listener) {
        async function isLogin(e) {
            if (e.length > 0 && global.iswechat) {
                listener(e)
            } else {
                setTimeout(() => {
                    isLogin(e)
                }, 1000);
            }
        }
        if (matcher == "message") {
            if (typeof listener == 'function') {
                this.listener.message = listener
            }
        } else if (matcher == 'system.online') {
            setTimeout(() => {
                this.GetRobotIds().then(e => {
                    isLogin(e)
                })
            }, 1000);
        }
    }
    async once(matcher, listener) {
        on(matcher, listener)
    }
    async message(msg) {
        this.listener.message(msg)
    }
}


