'use strict';
const util = require('util');
const moment = require('moment');
const mkdirp = util.promisify(require('mkdirp'));
const uuidv4 = require('uuid/v4');
const md5 = require('md5');

let currentVote = undefined;
let signInMap = undefined;

exports.createVote = async (voteTitle, voteFile) => {
    try{
        
        currentVote = {};
        signInMap = {};
        
        currentVote.voteID = moment().format('YYYYMMDDHHmmss'),
        currentVote.voteTitle = voteTitle,
        currentVote.votePath = 'data/' + currentVote.voteID,
        currentVote.voteFilePath = currentVote.votePath + '/voteFile.pdf'
        currentVote.voters = {};

        await mkdirp(currentVote.votePath);
        await util.promisify(voteFile.mv)(currentVote.voteFilePath);
        return currentVote;
    }catch(err){
        console.log(err);
        throw err;
    }
};

exports.getCurrentVote = () => {
    return currentVote;
};

exports.signIn = (name) => {
    let token = uuidv4();
    let userId = md5(token);
    signInMap[token] = userId;
    let user = {userId, name};
    currentVote.voters[userId] = user;
    return {token, user, voters: currentVote.voters};
};

exports.vote = (token, decision) => {
    let userId = signInMap[token];
    currentVote.voters[userId].decision = decision;
    return currentVote.voters;
};

exports.closeVote = () => {
    currentVote = undefined;
    signInMap = undefined;
};