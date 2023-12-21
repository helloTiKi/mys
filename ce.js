import p from 'child_process';
//import puppeteer from 'puppeteer';

p.exec('tasklist | findstr msedge.exe', (error, stdout, stderr) => {
  if (error) {
    console.error(`执行错误： ${error}`);
    return;
  }
  //console.log(`输出结果：\n${stdout}`);
  stdout.replace(/msedge.exe *([0-9]*?) /g, (match, p1) => {
    p.exec(`netstat -ano | findstr ${p1}`, async (error, stdout, stderr) => {
      if (error) {
        return;
      }
      if (stdout.includes('LISTENING')) {
        let url = /TCP *(.*?:[0-9]*) */.exec(stdout)[1]
        console.log(url)
        let data = await (await fetch(`http://${url}/json/version`)).json()

        console.log(data.webSocketDebuggerUrl)
      }
    })
  })
})