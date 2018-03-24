const http = require('http');
const request = require('request');
const server = http.createServer();
const cheerio = require('cheerio');
const schedule = require('node-schedule');

server.on('request', (request, response) => {
    getHistory().then((data) => {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(
            {
                history: data,
            }));
    });
});

server.listen(3000);

const statusHistory = [];
updateHistory();
schedule.scheduleJob('0 */5 * * * *', function() {
    updateHistory();
});

function updateHistory() {
    getStatusData().then((data) => {
        statusHistory.unshift(data);
        if (statusHistory.length > 12*24) {
            statusHistory.pop();
        }
    });
}

function getHistory() {
    return new Promise((resolve, reject) => {
        resolve(statusHistory);
    })
}

function getStatusData() {
    return new Promise((resolve, reject) => {
        const url = "https://www.seaofthieves.com/status";

        request(url, (error, response, body) => {
            const $ = cheerio.load(body);

            let status = 'unknown';
            if ($('.service').hasClass('service--healthy')) {
                status = 'healthy';
            } else if ($('.service').hasClass('service--warning')) {
                status = 'warning';
            }

            resolve({
                'timestamp': new Date(),
                'status': status,
                'msg': $('.service__title').html(),
            });
        });
    });
}