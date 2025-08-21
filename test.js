// const { Client } = require('whatsapp-web.js');
const {Client, LocalAuth} = require('whatsapp-web.js')
const {sendKafkaMessage} = require("./mytools/mysql_server");
const md5 = require("md5");
const moment = require("moment");
const QRCode = require('qrcode');
const _config = {
    puppeteer: {
        // true
        headless: false, args: [
            '--disable-setuid-sandbox',
            '--no-sandbox',
            //'--proxy-server=http://172.16.3.94:2115',
            '--proxy-server=http://127.0.0.1:7890',
            '--ignore-certificate-errors',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled'
        ]
    },
    authStrategy: new LocalAuth(),
    webVersion: "2.2412.54",
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    authTimeoutMs: 60000, // Optional: timeout for authentication in milliseconds
    qrTimeout: 30000, // Optional: timeout for QR code generation
}
const client = new Client(_config);
console.log(client)
client.on('qr', (qr) => {
    QRCode.toFile('qr.png', qr, (err) => {
        if (err) {
            console.error('生成二维码失败', err);
        } else {
            console.log('二维码已生成：qr.png，请打开图片扫码登录');
        }
    });
});

// client.on("qr", (qr) => {
//     qrcode.generate(qr, {small: true});
// });

client.on("ready", () => {
    console.log("Client is ready!");
});

client.on("authenticated", () => {
    console.log("Client is authenticated!");
});

client.on("auth_failure", (msg) => {
    console.error("Authentication failure", msg);
});

client.on("message", (msg) => {
    console.log("MESSAGE RECEIVED", msg);
    // console.log("message body: ", msg.body);
    const whats_data = {

        value: {
            data: {
                msg_time: moment(msg.timestamp*1000).format("YYYY-MM-DD HH:mm:ss"),
                gather_time: moment().format("YYYY-MM-DD HH:mm:ss"),
                from: msg.from,                   //来自（群或私人）
                to: msg.to,                       //发送给
                author: msg.author,               //接收人
                msg_type: msg.type,                   //种类
                nitifyName: msg._data.notifyName, //备注名
                content: msg.body,
            },
            table_type: "message",
            platform: "whatsapp",
            uuid: md5(String(msg.timestamp*1000) + msg.from + msg.to + msg.body)
        }
    };
    console.log(whats_data);
    sendKafkaMessage(whats_data);
    if (msg.body === "!ping") {
        msg.reply("pong");
    }


});

// client.initialize();
client
    .initialize()
    .then(() => {
        console.log("Client initialized successfully");
    })
    .catch((err) => {
        console.error("Error initializing client", err);
    });
