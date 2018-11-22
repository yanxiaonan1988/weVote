'use strict';
const util = require('util');
const moment = require('moment');
const mkdirp = util.promisify(require('mkdirp'));
const uuidv4 = require('uuid/v4');
const md5 = require('md5');
const fs = require('fs');
const _ = require('lodash');
const exec = util.promisify(require('child_process').exec);

let currentVote = undefined;
let signInMap = undefined;

exports.createVote = async (voteTitle, voteDescription, meetingName, isRecorded, voteFile) => {
    try{
        currentVote = {};
        signInMap = {};
        
        currentVote.voteID = moment().format('YYYYMMDDHHmmss'),
        currentVote.voteTitle = voteTitle,
        currentVote.voteDescription = voteDescription;
        currentVote.meetingName = meetingName;
        currentVote.isRecorded = isRecorded;
        currentVote.votePath = 'data/' + currentVote.voteID;
        currentVote.voteFilePath = currentVote.votePath + '/voteFile.pdf';
        currentVote.voteFilePathList = [];
        currentVote.voters = {};
        currentVote.status = 0;
        currentVote.notice = {all: 0, support: 0, oppose: 0};

        await mkdirp(currentVote.votePath);

        let tempVoteFilePath;
        if(_.endsWith(voteFile.name, '.doc')){ tempVoteFilePath = currentVote.votePath + '/voteFile.doc'; }
        if(_.endsWith(voteFile.name, '.docx')){ tempVoteFilePath = currentVote.votePath + '/voteFile.docx'; }
        if(tempVoteFilePath){
            await util.promisify(voteFile.mv)(tempVoteFilePath);
            let { stdout, stderr } = await exec(`soffice --headless --convert-to pdf ${tempVoteFilePath} --outdir ${currentVote.votePath}`);
        }else{
            await util.promisify(voteFile.mv)(currentVote.voteFilePath);
        }
        await exec(`convert -density 150  -quality 100 ${currentVote.voteFilePath} ${currentVote.votePath}/voteFile.jpg`);


        if(fs.existsSync(`${currentVote.votePath}/voteFile.jpg`)){
            currentVote.voteFilePathList.push(`${currentVote.votePath}/voteFile.jpg`);
        }else{
            for(let i = 0; ; i++){
                let tempFile = `${currentVote.votePath}/voteFile-${i}.jpg`;
                if(fs.existsSync(tempFile)){
                    currentVote.voteFilePathList.push(`${currentVote.votePath}/${i}/voteFile.jpg`);
                }else{
                    break;
                }
            }
        }
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
    currentVote.notice.all += 1;
    return {token, user, voters: currentVote.voters, notice: currentVote.notice};
};

exports.vote = (token, decision) => {
    let userId = signInMap[token];
    currentVote.voters[userId].decision = decision;
    if(decision === 1){ currentVote.notice.support += 1; }
    if(decision === -1){ currentVote.notice.oppose += 1; }
    return {voters: currentVote.voters, notice: currentVote.notice};
};

exports.finishVote = () => {
    currentVote.status = 1;
};

exports.saveVote = async () => {
    await fs.writeFileSync(currentVote.votePath + '/vote.json', JSON.stringify(currentVote));
}

exports.closeVote = () => {
    if(currentVote){
        if(fs.existsSync(currentVote.votePath + '/vote.json')){
            let savedVote = JSON.parse(fs.readFileSync(currentVote.votePath + '/vote.json'));
            if(!_.isEqual(currentVote, savedVote)){
                throw new Error('尚未保存当前投票变动!');
            }
        }else{
            throw new Error('尚未保存当前投票变动!');
        }
    }
    currentVote = undefined;
    signInMap = undefined;
};

exports.search = (searchText) => {
    let votes = [];
    let dirs = fs.readdirSync('data/');
    for(let i = 0; i < dirs.length; i++){
        let dir = dirs[i];
        if(fs.existsSync(`data/${dir}/vote.json`)){
            let voteText = fs.readFileSync(`data/${dir}/vote.json`);
            let reg = new RegExp(`${searchText}`);
            if(searchText == "" || reg.test(voteText)){
                votes.push(JSON.parse(voteText));
            }
        }
    }
    return votes;
};
