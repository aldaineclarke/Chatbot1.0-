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

/* ROUTES */
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

            // get the senders Page Scoped ID
            let sender_psid = webhook_event.sender.id;
            console.log("Sender ID: "+sender_psid);

             // Check if the event is a message or postback and
             // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);        
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
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

// Handles messages sent to the bot
function handleMessage(sender_psid, received_message) {

    let response;
  
    // Check if the message contains text
    if (received_message.text) {    
  
      // Create the payload for a basic text message
      response = {
        "text": `Echo: ${received_message.text}`
      }
    }else if(received_message.attachments){
        // Gey the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload_url;
        response ={
            "attachment": {
                "type": "template",
                "payload" : {
                    "template_type":"generic",
                    "elements":[{
                        "title": "Is this the right Picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [{
                            "type": "postback",
                            "title": "Yes!",
                            "payload": "yes",
                        },
                        {
                            "type": "postback",
                            "title": "No!",
                            "payload": "no",
                        }]
                    }]
                }
            }
        }
    }  
    
    // Sends the response message
    callSendAPI(sender_psid, response);    
  }

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": token },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
        console.log('message sent!')
        } else {
        console.error("Unable to send message:" + err);
        }
    }); 
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