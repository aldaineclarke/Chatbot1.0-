"use strict"; // Tells the program to ensure that each variable is declared with var,let or const else an error will occur

const request = require("request");
const express = require("express");
const bodyParser = require("body-parser");
const server = express().use(bodyParser.json()); //creates an express http server
// above code could be also written as "server.use(bodyParser.json());"

// passes the value of port number in the environment variable or port 5000
const port = process.env.PORT || 5000;
const MYAPPTOKEN = process.env.CHATTOKEN1;
const token = process.env.PAGETOKEN;
server.listen(port, ()=>{ console.log("Webhook is listening on port "+ port)});

server.get('/',(request, response)=>{
    response.send("This is my webhook example;");
});
server.get('/webhook',(request, response)=>{
    response.send("This is my webhook example get rqest;");
});
server.post("/webhook",(request, response)=>{
    let body = request.body; // post data from the request

    //checks if this is an event from a page subscription

    if (body.object === 'page'){
        
        //Iterates over the entries there may be multiple if its batched.
        body.entry.forEach(function(entry){
            // Gets the message. entry.messaging is an array but  will only ever contain one message, so we use index[0]
            let webhook_event = entry.messaging[0];
            let sender = webhook_event.sender.id;
        
            if(webhook_event.message && webhook_event.message.text){
                let text = webhook_event.message.text;
                sendMessage(sender,"Echo: "+ text.substring(0,100));
                
            }
            

        });
        // returns '200 OK' status code to all requests
        response.status(200).send('EVENT_RECIEVED');
    }else{
        // returns '404' if the event is not from a page subscription
        console.log('something went wrong');
        response.sendStatus(404);
    }


});

function sendMessage(sender, text){
    let messageData = {text:text}
    request({
        url:"https://graph.facebook.com/2.6/me/messages",
        qs: {access_token:token},
        method: "POST",
        json:{
            reciept:{id:sender},
            message:messageData
        }
    },(error,response,body)=>{
        if(error){
            console.log("Sending message");
        }else if(response.body.error){
            console.log(error)
        }

        }

    );

}

// Adds support for GET requests to our webhook

server.get('/webhook',(request, response)=>{

    // Your verify token. Should be a random String.
    let VERIFY_TOKEN = MYAPPTOKEN;

    // Parse the query params
    
    let mode = request.query['hub.mode'];
    let token = request.query['hub.verify_token'];
    let challenge = request.query['hub.challenge'];
    console.log(typeof(MYAPPTOKEN));
    // Checks if a token and mode is in the query string of the request
    if(mode && token){
        // Checks the mode and the token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN){
            // Responds witb the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            response.status(200).send(challenge);

        }else{
            // 403 Forbidden if tokens do not match
            response.sendStatus(403);
        }
    }

});