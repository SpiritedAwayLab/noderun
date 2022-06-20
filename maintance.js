//var calldb = require("./calldb.js");
const { exec } = require('child_process');
var https = require("https");
var http = require("http");
var walletaddress = "";
var nodeid = "";
var initrun = true;
var standbymode = true;
var ini2 = false;

(async () => {
    walletaddress = await getFortaWalletaddress();
    await getReadytoRun();
    //walletaddress = "0xB7515707dA7F7e2874432419A5A646eeC727Ee5b" // await getFortaWalletaddress();
    nodeid = await getnodeid();
    var okn, errormsg;

    setInterval(async () => {
        var sla = await getSLA();
        //var okn = 4;//await getnodestatus();

        var rr = await getStatus();
        okn = rr[0]
        errormsg = rr[1]

        await sendReport(sla, okn, errormsg)
    }, 30000)

})()

async function getnodeid() {
    var cmd_str = `cat /etc/hostname`;
    return new Promise((resolve, reject) => {
        exec(cmd_str, (err, stdout, stderr) => {
            stdout = stdout.replace(/^\s+|\s+$/g, '');
            resolve(stdout);
        })
    })
}

async function getSLA() {
    try {

        //console.info(walletaddress);
        var r = await httpsget("https://api.forta.network/stats/sla/scanner/" + walletaddress);
        var jdata = JSON.parse(r);
        //console.info(jdata.statistics)
        if (jdata.statistics?.avg)
            return jdata.statistics.avg;
        else
            0

    }
    catch (e) {

    }

}
async function getStatus() {

    var cmd_str = `forta status --format json`;

    return new Promise((resolve, reject) => {
        exec(cmd_str, (err, stdout, stderr) => {
            // console.info(stdout)
            try {
                var statusjson = JSON.parse(stdout);
                var ok_n = 0;

                var errormsg = "";


                statusjson.forEach(item => {
                    console.info(item)
                    var key = item.name.split('.')[2];
                    var value = item.status;
                    var details = item.details;
                    if (value == "ok") {
                        console.info(item)
                        console.info(value)
                        ok_n++;

                    }
                    else {
                        //  console.info(item)
                        //  console.info(details)
                        errormsg += key + ":" + details.replace(/\'/g, "");
                        //  console.info(errormsg)
                    }


                })
                resolve([ok_n, errormsg])
            }
            catch (e) {
                resolve([0, 'forta not in run'])
            }





        })
    })
}


async function sendReport(sla, okn, errormsg = null) {
    console.info(errormsg)
    await httppost({
        hostname: '93.179.127.18',
        port: 36123,
        path: '/report',
        data: {
            walletaddress: walletaddress,
            nodeid: nodeid,
            okn: okn,
            sla: sla,
            errormsg: errormsg
        }
    })
}

async function getFortaWalletaddress() {
    var cmd_str = `cat /root/.forta/.walletaddress`;
    return new Promise((resolve, reject) => {
        exec(cmd_str, (err, stdout, stderr) => {
            //console.info(stdout)
            stdout = stdout.replace(/^\s+|\s+$/g, '');
            resolve(stdout);
        })
    })
}

async function startNode() {
    var cmd_str = `/root/runnode.sh`;
    return new Promise((resolve, reject) => {
        exec(cmd_str, (err, stdout, stderr) => {
            console.info(stdout)
            //  stdout = stdout.replace(/^\s+|\s+$/g, '');
            // resolve(stdout);
        })
    })
}

async function registerNode(chain) {
    var cmd_str = `/root/register.sh ${chain}`;
    return new Promise((resolve, reject) => {
        exec(cmd_str, (err, stdout, stderr) => {
            console.info(stdout)
            //  stdout = stdout.replace(/^\s+|\s+$/g, '');
            // resolve(stdout);
        })
    })
}

async function getReadytoRun() {

    while (standbymode) {
        console.info("standbymode")
        console.info("http://93.179.127.18:36123/ready/" + walletaddress)
        var r = await httpget("http://93.179.127.18:36123/ready/" + walletaddress);
        console.info(r)
        if (initrun) {
            if (r == "") {
                ini2 = true;
                initrun = false;
            }
            else {
                console.info("start run node");
                startNode(r);
                standbymode = false;
                initrun = false;
            }
        }
        if (standbymode && r != "") {
            if (ini2)
                await registerNode(r);
            console.info("start run node");
            startNode();
            standbymode = false;
        }
        await sleep(3000)
    }




}















async function httppost(options) {
    return new Promise((resolve) => {


        options.method = "POST";
        options.headers = {
            'Content-Type': 'application/json',
            'Content-Length': options.data ? JSON.stringify(options.data).length : 0
        }


        const req = http.request(options, res => {
            //console.log(`状态码: ${res.statusCode}`)
            var data = ""
            res.on('data', chunk => { data += chunk })
            res.on('end', () => {
                resolve(data);

            })

        })

        req.on('error', error => {
            console.error(error)
        })

        req.write(JSON.stringify(options.data))
        req.end()

    })
}

async function httpget(url) {
    return new Promise((resolve) => {
        http.get(url, res => {
            var data = "";
            res.on('data', chunk => { data += chunk })

            res.on('end', () => {

                resolve(data);

            })
            res.on('error', (error) => {
                console.info(error)
                rejects(error)
            })
        })
    })
}

async function httpsget(url) {
    return new Promise((resolve) => {
        https.get(url, res => {
            var data = "";
            res.on('data', chunk => { data += chunk })

            res.on('end', () => {

                resolve(data);

            })
            res.on('error', (error) => {
                console.info(error)
                rejects(error)
            })
        })
    })
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
