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
    let voteDescription = req.body.voteDescription;
    let meetingName = req.body.meetingName;
    let isRecorded = req.body.isRecorded;
    let voteFile = req.files.voteFile;
    
    let currentVote = await voteService.createVote(voteTitle, voteDescription, meetingName, isRecorded, voteFile);
    io.emit('voteCreated', currentVote);
    res.redirect('/admin.html');
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

app.get('/data/:voteID/:index/voteFile.jpg', (req, res, next) => {
    res.sendFile(__dirname + `/data/${req.params.voteID}/voteFile-${req.params.index}.jpg`);
});
app.get('/data/:voteID/voteFile.jpg', (req, res, next) => {
    res.sendFile(__dirname + `/data/${req.params.voteID}/voteFile.jpg`);
});

app.post('/api/vote/signIn', jsonParser, (req, res, next) => {
    let name = req.body.name;
    let result = voteService.signIn(name);
    io.emit('signIn', result);
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
    let result = voteService.vote(token, decision);
    io.emit('decision', result);
    res.json({
        success: true,
        voters: result.voters
    })
});

app.post('/api/vote/finish', (req, res, next) => {
    voteService.finishVote();
    io.emit('finishVote', voteService.getCurrentVote());
    res.json({
        success: true,
        msg: '本次投票成功结束'
    })
});

app.post('/api/vote/close', (req, res, next) => {
    try{
        voteService.closeVote();
        io.emit('closeVote');
        res.json({
            success: true,
            msg: '本次投票成功关闭，可以创建其他投票'
        });
    }catch(e){
        res.json({
            success: false,
            msg: e.message
        });
    }
    
});

app.post('/api/vote/save', (req, res, next) => {
    voteService.saveVote();
    res.json({
        success: true,
        msg: '投票状态成功保存'
    })
});

app.post('/api/vote/search', jsonParser, (req, res, next) => {
    let votes = voteService.search(req.body.searchText);
    res.json({
        success: true,
        votes: votes
    });
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