
var https = require("https");

var rewards = {
    eth: 200000,
    optimism: 8000,
    bsc: 10000,
    polygon: 160000,
    fantom: 4000,
    arbitrum: 8000,
    avalanche: 10000
};


var reward_eachchain = {};


(async () => {
    var chainids = {
        eth: 1,
        optimism: 10,
        bsc: 56,
        polygon: 137,
        fantom: 250,
        arbitrum: 42161,
        avalanche: 43114
    }

    var b = Object.keys(chainids);

    try {
        var s = await Promise.all(Object.keys(chainids).map(async (chainname) => {
            var chainid = chainids[chainname];
            reward_eachchain[chainname] = rewards[chainname] / (await getNodesCount(chainid));

        })
            //

        )
    }
    catch (e) {
        console.info(e);
    }


    console.info(reward_eachchain)


})()
async function getNodesCount(chainid) {

    return new Promise((resolve, reject) => {
        httpspost({
            hostname: 'explorer-api.forta.network',
            port: 443,
            path: '/graphql',
            data: {
                "operationName": "GetScanners",
                "variables": {
                    "getScannersInput": {
                        "chain_id": chainid
                    }
                },
                "query": "query GetScanners($getScannersInput: GetScannersInput) {\n  getScanners(input: $getScannersInput) {\n    id\n    created_at\n    uptime\n    latest_block\n    expected_latest_block\n    agents\n    __typename\n  }\n}\n"
            }
        }).then((r) => {
            try {

                var jdata = JSON.parse(r);
                // console.info(jdata.data.getScanners.length)
                resolve(jdata.data.getScanners.length)
            }
            catch (e) {
                console.info(e)
                resolve(0)
                // return 0;
            }

        })

    })



}



async function httpspost(options) {
    return new Promise((resolve) => {


        options.method = "POST";
        options.headers = {
            'Content-Type': 'application/json',
            'Content-Length': options.data ? JSON.stringify(options.data).length : 0
        }


        const req = https.request(options, res => {
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

