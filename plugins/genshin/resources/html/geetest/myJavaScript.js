window.getParams = (key) => {
    let url = document.location.href;
    let i = 0;
    let params = [];
    if (i = url.indexOf("?"), i != -1) {
        let d = url.slice(i + 1, url.length);
        url = url.slice(0, i)
        d.split("&").forEach(e => {
            let key = e.split("=");
            params[key[0]] = key[1]
        })
    }
    return key == '' || key == undefined ? params : params[key]
}
async function _click(arr) {
    let dom = $('.geetest_item_ghost');
    if (dom.length !== 9) return;

    for (const e of arr) {
        dom[e - 1].click();
        await sleep(300)
    }
}
async function sleep(ms) {
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, ms);
    })
}
function loggingDecorator(func) {
    return function () {
        console.log(`Calling function: ${func.name}`);
        const result = func.apply(this, arguments);
        console.log(arguments)
        //console.log(`Function return value: ${result}`);
        return result;
    }
}
async function getGeetest() {
    let keys = {};
    while (true) {
        Object.keys(window).forEach(e => {
            if (e.indexOf('geetest') != -1) {
                if (keys[e]) return;
                keys[e] = window[e];
                window[e] = loggingDecorator(window[e]);
                console.log(e);
            }

        })
        await sleep(1)
    }
}
window.gt4handle = function (e) {
    $('#wait').hide(),
        u = e,
        e.onReady((() => {
            e.showCaptcha(),
                e.onSuccess((() => {
                    var result = e.getValidate();
                    if (!result) {
                        return alert('请完成验证');
                    };
                    console.log(result)
                    try {
                        result.sign = sign;
                        $.ajax('/ret', {
                            headers: {
                                Geetest: JSON.stringify(result)
                            },
                            success: function (e) {
                                console.log(e)
                            }
                        })
                        result.isOK = 1;
                        console.info(JSON.stringify(result))
                        alert('验证成功')
                    } catch (error) {

                    }
                }
                ))
        }
        )),
        e.onError((t => {
        }
        ))
}