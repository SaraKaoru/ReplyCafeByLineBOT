'use strict'
var https = require('https');

exports.handler = function (event, context) {
    console.log('EVENT:', JSON.stringify(event, null, 2));
    var event_data=JSON.parse(event.body);;
    console.log('event_data:', event_data);
    console.log('event_content:',event_data.events);
    var reply_token = event_data.events[0].replyToken;
    console.log('reply_token:', reply_token);
    var message = event_data.events[0].message;
    console.log('messagetext:', message.text);
    var postData;
    console.log('type:', message.type);
    if(message.type=="location")
    {
        console.log("location");
        var currnetlocation = {
            latitude: message.latitude,longitude: message.longitude
        }
        getcafes().then(function(cafes){
            var closest=closestLocation(currnetlocation,cafes);
            var str =   'wifi:'+closest.wifi+'\n'
                +'座位:'+closest.seat+'\n'
                +'安靜度:'+closest.quiet+'\n'
                +'餐點美味度:'+closest.tasty+'\n'
                +'價位:'+closest.cheap+'\n'
                +'音樂:'+closest.music+'\n'

            str = str.replace(/(\d+)/g,function(a){return Array(+a+1).join('★')});
            str=closest.name+'\n'+closest.address+'\n'+str;
            console.log(str);
            postData = JSON.stringify({
            replyToken: reply_token,
                messages: [
                    {type: "text", text: str},
                    {
                        "type": "location",
                        "title": closest.name,
                        "address": closest.address,
                        "latitude": closest.latitude,
                        "longitude": closest.longitude
                    }
                ]
            })
            callLine(postData);
        });
    }
    else {
        console.log(message.type);
        postData = JSON.stringify({
            replyToken: reply_token,
            messages: [{type: "text", text: "はろーわ～るど"}]
        });
        callLine(postData);
    } 
    
};

function callLine(postData){
    const accessToken="wYQ7nUSnqPsfV8Z8j0c37fQdLiCKzjah8MwW5G1OwWmtsrfEYOQYgAHWZEkcU0ic74SpcxiPfEaW75v+VpJ78jdjs/0b2L8vTkt9Ji41HNWyc/1OVTbmAqlGSYQ5SFgeBcb3HdzOEVgxT30tBOVylgdB04t89/1O/w1cDnyilFU="
    
    console.log('callLine,postData:',postData);
    var contentLen = Buffer.byteLength(postData, 'utf8');
    var rp = require('minimal-request-promise'),
        options = {
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Content-Length":contentLen+'',
                "Authorization": "Bearer " +accessToken
            },
        body: postData
    };
    console.log('Step:','rp has completed');
    rp.post('https://api.line.me/v2/bot/message/reply', options).then(
        function (response) {
            console.log('got response', response.body, response.headers);
        },
        function (response) {
            console.log('got error', response.body, response.headers, response.statusCode, response.statusMessage);
        }
    );
    console.log('Step:','rp posted');
}

function closestLocation(targetLocation, locationData) {
    function vectorDistance(dx, dy) {
        return Math.sqrt(dx * dx + dy * dy);
    }

    function locationDistance(location1, location2) {
        var dx = location1.latitude - location2.latitude,
            dy = location1.longitude - location2.longitude;

        return vectorDistance(dx, dy);
    }

    return locationData.reduce(function(prev, curr) {
        var prevDistance = locationDistance(targetLocation , prev),
            currDistance = locationDistance(targetLocation , curr);
        return (prevDistance < currDistance) ? prev : curr;
    });
}
function getcafes(){
    return new Promise(function(resolve, reject){
        var rpcafe = require('minimal-request-promise')
        rpcafe.get('https://cafenomad.tw/api/v1.0/cafes/')
        .then(response => {
            resolve(JSON.parse(response.body))
        }) 
    });
    
}