import { createServer } from 'http';
import chokidar from 'chokidar';
import crypto from 'crypto'
import fs from 'fs'

let pathHash = {};
var getFunc = {};
var postFunc = {};
let _path = './plugins/genshin/resources/html/geetest/'
! function () {
    const dir = _path;
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        files.forEach(file => {
            if (['极验模拟验证.exe', 'HPSocket4C.dll', 'miniblink_4975_x32.dll', 'RSCProject.dll'].includes(file)) return
            getFileMd5(file).then(e => {
                pathHash[`/${file}`] = e;
                console.log(`/${file}=>${e}`)
            })

        });
    });
}()
function getFileMd5(file) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const filePath = file;
        const readStream = fs.createReadStream(filePath);
        readStream.on('data', chunk => {
            hash.update(chunk);
        });
        readStream.on('end', () => {
            const result = hash.digest('hex');
            resolve(result)
        });
    })
}
var watcher = chokidar.watch(_path)
watcher.on('change', (path, stats) => {
    console.log(`File ${path} has been changed`);
    // 处理文件修改
})
/**
 * 
 * @param {string} _contentType content-Type字段
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
const server = createServer(function (req, res) {

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
                console.log(type)
                postFunc[req.url](req, res, data)
            } catch (error) {
                try {
                    postFunc['default'](req, res, data)
                } catch (error) {
                    console.error(error)
                    res.writeHead(404)
                    res.end()
                }
            }
            res.end('success')
        })

    }


    //res.end("success")
});
/**
 * 
 * @param {http.IncomingMessage} _req 请求数据体
 * @param {http.ServerResponse} _res 回复数据体
 * @param {object} param Get请求参数
 */
function HttpGet(_req, _res, _params) {

}
/**
 * 
 * @param {http.IncomingMessage} _req 请求数据体
 * @param {http.ServerResponse} _res 回复数据体
 * @param {string|Uint8Array|Object} _data post数据体
 */
function HttpPost(_req, _res, _data) {
}
/**
 * 
 * @param {http.IncomingMessage} _req 
 * @param {http.ServerResponse} _res 
 * @param {string} _url 
 */
function HttpDefaultByGet(_req, _res, _url) {
}
/**
 * 
 * @param {http.IncomingMessage} _req 
 * @param {http.ServerResponse} _res 
 * @param {string|object|Uint8Array} _data 
 */
function HttpDefaultByPost(_req, _res, _data) {
}
export default class httpServer {
    constructor(port) {
        console.log('正在启动验证服务')
        server.listen(port)
    }
    /**
     *
     * @param {string|string[]} path url请求路径
     * @param {HttpGet} func 回调函数
     */
    get(path, func) {
        if (Array.isArray(path)) {
            path.forEach(e => {
                getFunc[e] = func;
            })
        } else getFunc[path] = func;

    }
    /**
     *
     * @param {string|string[]} path
     * @param {HttpPost} func
     */
    post(path, func) {
        if (Array.isArray(path)) {
            path.forEach(e => {
                postFunc[e] = func;
            })
        } else postFunc[path] = func;
    }
    /**
     *
     * @param {string|string[]} method
     * @param {HttpDefaultByGet|HttpDefaultByPost} func
     */
    default(method, func) {
        function set(key, func) {
            switch (key) {
                case 'get':
                    getFunc['default'] = func;
                    break;
                case 'post':
                    postFunc['default'] = func;
                    break
            }
        }
        if (Array.isArray(method)) {
            method.map(str => str.toLowerCase()).forEach(e => {
                set(e, func)
            })
        } else set(method, func);
    }
    getFileHash(path) {
        return pathHash[path]
    }
};