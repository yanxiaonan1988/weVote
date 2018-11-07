'use strict';

const express = require('express');
const fileUpload = require('express-fileupload');

const voteService = require('./service/voteService');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(fileUpload());

app.get('/api', (req, res, next) => res.send('Hello World!'));



app.post('/api/vote/create', async (req, res, next) => {
    let voteTitle = req.body.voteTitle;
    let voteFile = req.files.voteFile;
    await voteService.createVote(voteTitle, voteFile);
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});