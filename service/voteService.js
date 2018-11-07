'use strict';
const util = require('util');
const moment = require('moment');
const mkdirp = util.promisify(require('mkdirp'));

let currentVote = undefined;

exports.createVote = async (voteTitle, voteFile) => {
    try{
        
        currentVote = {};
        currentVote.voteID = moment().format('YYYYMMDDHHmmss'),
        currentVote.voteTitle = voteTitle,
        currentVote.votePath = 'data/' + currentVote.voteID,
        currentVote.voteFilePath = currentVote.votePath + '/voteFile.pdf'
        
        await mkdirp(currentVote.votePath);
        await util.promisify(voteFile.mv)(currentVote.voteFilePath);
    }catch(err){
        console.log(err);
        throw err;
    }
};

exports.getCurrentVote = () => {
    return currentVote;
};