'use strict';

const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

const voteService = require('./service/voteService');

const app = express();
const port = 3000;
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));
app.use(fileUpload());

const jsonParser = bodyParser.json();


app.get('/api', (req, res, next) => res.send('Hello World!'));



app.post('/api/vote/create', async (req, res, next) => {
    let voteTitle = req.body.voteTitle;
    let voteFile = req.files.voteFile;
    let currentVote = await voteService.createVote(voteTitle, voteFile);
    io.emit('voteCreated', currentVote);
    res.redirect('/');
});

app.get('/api/vote/current', (req, res, next) => {
    res.json({
        success: true,
        currentVote: voteService.getCurrentVote()
    });
});

app.get('/data/:voteID/voteFile.pdf', (req, res, next) => {
    res.sendFile(__dirname + `/data/${req.params.voteID}/voteFile.pdf`);
});

app.post('/api/vote/signIn', jsonParser, (req, res, next) => {
    let name = req.body.name;
    let result = voteService.signIn(name);
    io.emit('signIn', result.voters);
    res.json({
        success: true,
        token: result.token,
        user: result.user,
        voters: result.voters
    });
});

app.post('/api/vote/vote', jsonParser, (req, res, next) => {
    let token = req.body.token;
    let decision = req.body.decision;
    let voters = voteService.vote(token, decision);
    io.emit('decision', voters)
    res.json({
        success: true,
        voters: voters
    })
});



io.on('connection', function (socket) {
    // socket.on('signIn', function (data) {
    //   console.log(data);
    // });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});

// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}!`)
// });