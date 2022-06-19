const { exec } = require('child_process');
var http = require("http");


(async () => {


    var fortaw = await getFortaWalletaddress();

    console.info(fortaw);
    var hostname = await getHostname();
    console.info(hostname);
    register_node(fortaw, hostname)

})()


async function getFortaWalletaddress() {
    var cmd_str = `cat /root/.forta/.walletaddress`;
    return new Promise((resolve, reject) => {
        exec(cmd_str, (err, stdout, stderr) => {
            console.info(stdout)
            resolve(stdout);
        })
    })
}

async function getHostname() {
    var cmd_str = `cat /etc/hostname`;
    return new Promise((resolve, reject) => {
        exec(cmd_str, (err, stdout, stderr) => {

            resolve(stdout);
        })
    })
}

function register_node(wallet, nodeid) {

    const data = JSON.stringify({
        walletaddress: wallet,
        nodeid: nodeid
    })

    const options = {
        hostname: '93.179.127.18',
        port: 36123,
        path: '/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }


    const req = http.request(options, res => {
        console.log(`状态码: ${res.statusCode}`)

        res.on('data', d => {
            process.stdout.write(d)
        })
    })

    req.on('error', error => {
        console.error(error)
    })

    req.write(data)
    req.end()
}
