import http from 'http'
let port = 9999;
const server = http.createServer(function (req, res) {
  if (req.method == 'GET') {
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
    let data;
    switch (url) {
      case '/':
      case '/index.html':
        if (!params.sign) {
          captcha.newCaptcha().then(e => {
            res.statusCode = 302;
            res.setHeader("Location", '/index.html?sign=' + e)
            res.end()
          })
          return
        }
        data = fs.readFileSync(path + '/index.html', { encoding: 'utf-8' })
        res.end(data)
        break
      case '/ret':
        data = JSON.parse(req.headers.geetest)
        console.log(data)
        captcha.setValidate(data)
        res.end('OK')
        break;
      case '/getCaptcha':
        res.setHeader('content-type', 'application/json; charset=utf-8')
        let retdata = {
          code: 0,
          message: 'success',
          data: {}
        }
        data = captcha.getCaptcha(params.sign);
        if (data == undefined) retdata.code = -1, retdata.message = "该sign值不存在或已超时"
        retdata.data = data || {}
        res.end(JSON.stringify(retdata))
        break;
      case '/newCaptcha':
        data = captcha.setCaptcha(params.gt, params.challenge)
        res.end(data)
        break;
      default:
        data = getHtmlData(url)
        res.setHeader('Last-Modified', 'Mon, 03 Apr 2023 13:37:30 GMT')
        console.log(`发送了${url}文件`)
        res.end(data)

    }
    return
  }
  console.log("有客户")
  let data = new Uint8Array();
  req.on('data', function (d) {
    data += d;
    console.log('有数据')
  })
  req.on('end', function () {
    console.log(data + '')
    captcha.setValidate(JSON.parse(data), params.sign)
    res.end("success")
  })
  //res.end("success")
});
server.listen(port)

