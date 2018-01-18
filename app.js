const apiKeys = require('./apiKeys');
const accountSid = apiKeys.accountSid;
const authToken = apiKeys.authToken;

const client = require('twilio')(accountSid, authToken);

const http = require('http');
const express = require('express');
const util = require('util');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const bodyParser = require('body-parser');
let executeDelete = false;

const app = express();
let todoList = [];

app.use(bodyParser());

app.post('/sms', (req, res) => {
    const twiml = new MessagingResponse();
    const message = twiml.message({
        action: 'https://b5406b1c.ngrok.io/status',
        method: 'POST'
    }, '');

    if (req.body.Body.includes("add") || req.body.Body.includes("Add")) {
        //1. remove substring add + space
        let task = req.body.Body.substring(4); 
        //2. push that into an array
        todoList.push(task);
        console.log(todoList);
        //3. tell the user it was added.
        message.body('I will add "' + task + '" to the To-do List.');
    } 
    else if (req.body.Body.includes("list") || req.body.Body.includes("List")) {
        message.body('Here\'s your To-do List:\n' + printList());
    }
    else if (req.body.Body.includes("remove") || req.body.Body.includes("Remove")) {
        let index = req.body.Body.substring(7) - 1;
        message.body('I have removed "' + todoList[index] + '" from your To-do list.');
        console.log(index);
        todoList.splice(index, 1);
    }
    else {
        message.body('Hey there! This is Joe\'s To-do Bot made with Twilio. Let me help you remember your tasks! Try saying "add task", "list", or "remove #(task number)".');
    }

    function printList() {
        let todo = '';
        for (let i = 0; i < todoList.length; i++) {
            let num = i + 1;
            todo = todo + num + '. ' + todoList[i] + '\n';
        }
        return todo;
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

app.post('/status', (req, res) => {
    const messageSid = req.body.MessageSid;
    const messageStatus = req.body.MessageStatus;
    const xTwilioSignature = req.get('X-Twilio-Signature');
    let recentMessage = '';
    console.log(`SID: ${messageSid}, Status: ${messageStatus}, xTwilioSignature: ${xTwilioSignature}`);

    if (messageStatus === 'delivered') {
        recentMessage = messageSid;
        executeDelete = true;
        console.log("You are going to delete the message with sid: " + recentMessage);
    }

    if (executeDelete === true) {
        setTimeout(function () { 
            deleteMessage(recentMessage);
            console.log("Deleted message with sid: " + recentMessage); 
        }, 15000);
    }
    
    // if (messageStatus === 'delivered'){
    //     deleteMessage(messageSid);
    // }
    function deleteMessage(messageSid) {
        client.messages(messageSid)
            .fetch()
            .then((message) => {
                return message
                    .remove()
                    .then(() => console.log("Message deleted"))
            });
    }//end of function
});

http.createServer(app).listen(1337, () => {
    console.log('Express server listening on port 1337');
});



