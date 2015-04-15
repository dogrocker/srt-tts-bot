var request     = require('request');
var cheerio     = require('cheerio');
var moment      = require('moment');
var Twit        = require('twit');
var pg          = require('pg');
pg.defaults.ssl = true;

var t = new Twit ({
    consumer_key          : process.env.PICKTWOBOT_TWIT_CONSUMER_KEY,
    consumer_secret       : process.env.PICKTWOBOT_TWIT_CONSUMER_SECRET,
    access_token          : process.env.PICKTWOBOT_TWIT_ACCESS_TOKEN,
    access_token_secret   : process.env.PICKTWOBOT_TWIT_ACCESS_TOKEN_SECRET
});

var connectionString = process.env.DATABASE_URL;

setInterval(function() {
var today = moment().format("DD/MM/YYYY");
var yesterday = moment().subtract(1, 'days').format("DD/MM/YYYY");

var days = {
    today: today
    //yesterday: yesterday
};

console.log('Today: ' + today);
console.log('Yesterday: ' + yesterday);
console.log('Time Now: ' + moment().format("HH:mm"));

var url = 'http://tts.railway.co.th/srttts/view';

for (day in days) {
    request.post({url:url, form: {date:days[day], line:3}}, (function(day) { return function(error,response,body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            console.log("Starting: " + day + " [");
            $('table tbody tr').each(function() {
                // Declare variable
                var trainData = {
                    startTime       : $(this).find('td').eq(2).text().trim(),
                    trainID         : $(this).find('td').eq(0).text().trim(),
                    delayTime       : $(this).find('td').eq(8).text().trim(),
                    destinationTime : $(this).find('td').eq(7).text().trim(),
                    destination     : $(this).find('td').eq(3).text().trim(),
                    now             : $(this).find('td').eq(5).text().trim()
                }

                if (day == 'today') {
                    if (trainData.startTime != "" && trainData.startTime == moment().format("HH:mm")) {
                    //if (startTime != "" && startTime == "08:00") {
                        console.log('Match StartTime: ' + trainData.startTime);
                        //trainID = 389;
                        checkTrain(trainData.trainID);
                    }
                    if (trainData.delayTime != "" && trainData.destinationTime != 'ปลายทาง') {
                    //if (trainData.delayTime != "") {
                        console.log(trainData.trainID + " " + trainData.delayTime);
                        calDelay(trainData, tweetStatus);
                    }
                } else if (day == 'yesterday') {
                    if ('ปลายทาง' != trainData.destinationTime && trainData.delayTime != "") {
                        if (trainData.destinationTime != "") {
                            calDelay(trainData, tweetStatus);
                        }
                    }
                }
            })
        } else {
            console.log(error);
        }
        console.log("]");
    }})(day));
}
}, 1 * 60 * 1000);

function checkTrain(trainID) {
    pg.connect(connectionString, function(error, client, done) {
        var handleError = function(err) {
        if(!err) return false;
        done(client);
        return true;
        };

        client.query('SELECT * FROM srt WHERE id = ' + trainID, function(error, result) {
            if(handleError(error)) return;
            console.log("checkTrain Start [");
            if (typeof result.rows[0] !== "undefined") {
                console.log("Found TrainID: " + result.rows[0].id + " Delay: " + result.rows[0].delay);
                if (result.rows[0].delay > 0) {
                    client.query('UPDATE srt SET delay=($1) WHERE id=($2)', [0, trainID], function(error, result) {
                        if(handleError(error)) return;
                        console.log("SET delay of trainID: " + trainID + " to 0");
                    })
                }
                done();
            } else {
                client.query('INSERT INTO srt(id, delay) values($1, $2)', [trainID, 0], function(error, result) {
                if(handleError(error)) return;
                console.log("Can't find TrainID: " + trainID + " design to create new");
                done();
                })
            }
            console.log("]");
        })
    })
}

function calDelay(trainData, callback) {
    result = false;
    pg.connect(connectionString, function(error, client, done) {
        var handleError = function(err) {
        if(!err) return false;
        done(client);
        return true;
        };

        client.query('SELECT * FROM srt WHERE id = ' + trainData.trainID, function(error, result) {
            if(handleError(error)) return;
            console.log("calDelay Start");
            if (typeof result.rows[0] !== "undefined") {
                if (trainData.delayTime > 0 && trainData.delayTime != result.rows[0].delay) {
                    client.query('UPDATE srt SET delay=($1) WHERE id=($2)', [trainData.delayTime, trainData.trainID], function(error, result) {
                        if(handleError(error)) return;
                        console.log("SET delay of trainID: " + trainData.trainID + " to " + trainData.delayTime);
                        result = true;
                        callback(trainData, result);
                    })
                }
            }
            done();
        })
    })
}

function tweetStatus(trainData, result) {
    if (result) {
        // Try to Tweet to Twitter.com
        console.log("Try to tweet!");
        trainData.destination = trainData.destination.replace(/\s+/g, '');
        trainData.destination = trainData.destination.replace('-', 'ไป');
        trainData.startTime = trainData.startTime.replace(':', '');
        var tweetMessage = "#ข" + trainData.trainID + " #ออก" + trainData.startTime + " #" + trainData.destination + " ถึง #" + trainData.now + " " + trainData.destinationTime + " ช้า " + trainData.delayTime + " นาที";
        console.log(tweetMessage);
        t.post('statuses/update', {status: tweetMessage}, function(err, data, response) {
            console.log(data);
        });

    }
}
