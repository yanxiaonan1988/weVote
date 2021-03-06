'use strict';
let mode;
let votes;

let updateCurrentVote = (currentVote) => {
    
    if(currentVote){
        $('#currentVotePanel').load('_currentVote.html', () =>{
            $('#saveVote').removeAttr('disabled');
            $('#currentVote').removeClass('invisible');
            $('#currentVoteNotice').addClass('invisible');
            if(mode == 'voter'){
                let user;
                if(localStorage.user) {user = JSON.parse(localStorage.user);}
                updateSignIn(user, currentVote.voters, currentVote.status);
                if(user && currentVote.voters[user.userId]){
                    updateDecision(currentVote.voters[user.userId].decision, currentVote.status); 
                }else if(currentVote.isRecorded == 'N'){
                    $('#voter #name').val("匿名"+Math.floor(Math.random()*1000+1));
                    $('#voter #name').attr('disabled', 'disabled');
                }
            }
            
            if(currentVote.status == 1){
                if(mode == 'admin'){
                    $('#finishVote').attr('disabled', 'disabled');
                }
                $('#currentVote').find("*").attr("disabled", "disabled");
                
            }

            $('#currentVote #voteTitle').val(currentVote.voteTitle);
            $('#currentVote #isRecorded').val(currentVote.isRecorded == 'Y'?'记名':'不记名');
            $('#currentVote #meetingName').val(currentVote.meetingName);
            $('#currentVote #voteDescription').val(currentVote.voteDescription);
            if(mode == 'admin'){
                $('#currentVote #voteFile').html(`</div><embed src="${currentVote.voteFilePath}" id="voteFile" height="900" width="100%"/>`);
            }else{
                for(let i=0; i<currentVote.voteFilePathList.length; i++){
                    $('#currentVote #voteFile').append(`<img src="${currentVote.voteFilePathList[i]}" width="100%" border="1px"></img>`);
                }
            }
            updateVoters(currentVote.voters);   
            updateVoteProgress(currentVote.notice);
        });
    }else{
        $('#saveVote').attr('disabled', 'disabled');
        $('#currentVotePanel').load('_currentVoteNotice.html');
    }
}

let updateVoters = (voters) => {
    let votersHtml = '';
    for(let userId in voters){
        let voter = voters[userId];
        let badgeHtml = "";
        if(voter.decision === 1){badgeHtml = `<span class="badge badge-pill badge-success">√</span>`};
        if(voter.decision === -1){badgeHtml = `<span class="badge badge-pill badge-danger">×</span>`};
        if(voter.decision === '*'){badgeHtml = `<span class="badge badge-pill badge-warning">?</span>`};
        votersHtml += `<button type="button" class="btn btn-outline-secondary">${voter.name} ${badgeHtml}</button> `
    }
    $('#currentVote #voters').html(votersHtml);
}

let updateVoteProgress = (notice) => {
    $('#notice-all').html(`<button type="button" class="btn btn-lg btn-outline-info">总签到人数<span class="badge badge-pill badge-success">${notice.all}</span></button>`)
    if(notice.voted !== undefined){
        $("#voteProgress #voted").css('width', (notice.all==0?0:notice.voted/notice.all*100)+"%");
        $("#voteProgress #voted").text(notice.voted==0?'':'已投票:'+notice.voted);
    }else{
        $("#voteProgress #support").css('width', (notice.all==0?0:notice.support/notice.all*100)+"%");
        $("#voteProgress #support").text(notice.support==0?'':'赞成:'+notice.support);
        $("#voteProgress #oppose").css('width', (notice.all==0?0:notice.oppose/notice.all*100)+"%");
        $("#voteProgress #oppose").text(notice.oppose==0?'':'反对'+notice.oppose);
    }
    
}

let voteCreatedCallback = (currentVote) => { location.reload(); }
let signInCallback = (voters, notice) =>{ updateVoters(voters); updateVoteProgress(notice); }
let decisionCallback = (voters, notice) =>{ updateVoters(voters); updateVoteProgress(notice); }
let finishVoteCallback = (currentVote) => {
    updateCurrentVote(currentVote);
}
let closeVoteCallback = () => { updateCurrentVote(undefined); }

let initCurrentVote = () => {
    $.get({
        url: '/api/vote/current',
        success: function updateData(data){
            updateCurrentVote(data.currentVote);
        }
    });
}

let init = (_mode) => {
    mode = _mode;
    $('#alertPanel').load('_commonAlert.html', () => {
         $('#commonAlert').hide(); 
        });
    if(mode == 'admin'){
        $('#createVoteModal').load('_createVoteModal.html', () => {
            $('#searchText').on('input', () => { $('#searchButton').text($('#searchText').val() == ''?'显示全部':'立即搜索'); });
            initCurrentVote();
        });
    }else{ initCurrentVote(); }

    let socket = io.connect(`http://${location.host}`);
    socket.on('voteCreated', function (data) { voteCreatedCallback(data); });
    socket.on('signIn', function (data) { signInCallback(data.voters, data.notice); });
    socket.on('decision', function (data) { decisionCallback(data.voters, data.notice); });
    socket.on('finishVote', function (data) { finishVoteCallback(data); });
    socket.on('closeVote', function (data) { closeVoteCallback(data); });
}

let signIn = () => {
    let name = $('#voter #name').val();
    $.post({
        url: '/api/vote/signIn',
        contentType:'application/json;charset=utf-8',
        data: JSON.stringify({name: name}),
        success: function updateData(data){
            localStorage.token = data.token;
            localStorage.user = JSON.stringify(data.user);
            updateSignIn(data.user, data.voters);
            updateDecision(undefined);
        }
    });
}
let updateSignIn = (user, voters, status) => {
    if(user && voters && voters[user.userId] ){
        $('#voter #name').val(user.name);
        $('#voter #name').attr('disabled', 'disabled');
        $('#voter #signIn').text('已签到');
        $('#voter #signIn').attr('disabled', 'disabled');
    }else{
        $('#voter #name').val('');
        $('#voter #name').removeAttr('disabled');
        $('#voter #signIn').text('签到');
        $('#voter #signIn').removeAttr('disabled');
    }
    if(status == 1){
        $('#voter #name').attr('disabled', 'disabled');
        $('#voter #signIn').attr('disabled', 'disabled');
    }
}

let makeDecision = (decision) => {
    $.post({
        url: '/api/vote/vote',
        contentType:'application/json;charset=utf-8',
        data: JSON.stringify({token: localStorage.token, decision: decision}),
        success: function updateData(data){
            updateDecision(decision);
            updateVoters(data.voters);
        }
    });
}

let updateDecision = (decision, status) => {
    if(status == 1){
        $('#decision_1').attr('disabled', 'disabled');
        $('#decision_-1').attr('disabled', 'disabled');
        return;
    }
    if(decision === 1){
        $('#decision_1').attr('disabled', 'disabled');
        $('#decision_-1').addClass('invisible');
    }else if(decision === -1){
        $('#decision_-1').attr('disabled', 'disabled');
        $('#decision_1').addClass('invisible');
    }else if(decision === '*'){
        $('#decision_1').addClass('invisible');
        $('#decision_-1').addClass('invisible');
    }else{
        $('#decision_1').removeAttr('disabled');
        $('#decision_-1').removeAttr('disabled');
    }
}

let finishVote = () => {
    $.post({
        url: '/api/vote/finish',
        contentType:'application/json;charset=utf-8',
        success: function updateData(data){
            $('#finishVote').attr('disabled', 'disabled');
            commonAlert(data.success, data.msg);
        }
    });
}

let saveVote = () => {
    $.post({
        url: '/api/vote/save',
        contentType:'application/json;charset=utf-8',
        success: function updateData(data){
            // $('#saveVote').attr('disabled', 'disabled');
            commonAlert(data.success, data.msg);
        }
    });
}

let closeVote = () => {
    $.post({
        url: '/api/vote/close',
        contentType:'application/json;charset=utf-8',
        success: function updateData(data){
            commonAlert(data.success, data.msg);
        }
    });
}

let search = () => {

    $.post({
        url: '/api/vote/search',
        contentType:'application/json;charset=utf-8',
        data: JSON.stringify({searchText: $('#searchText').val() }),
        success: function updateData(data){
            votes = data.votes;
            $('#currentVote').addClass('invisible');
            $('#currentVoteNotice').addClass('invisible');
            $('#searchText').val("");
            $('#searchButton').text('显示全部');
            updateVotesTable();
        }
    });
    
}

let updateVotesTable = () => {
    let votesTableHtml =
    `<table class="table">
            <thead class="thead-dark">
            <tr>
                <th scope="col">投票ID</th>
                <th scope="col">投票名称</th>
                <th scope="col">投票类型</th>
                <th scope="col">会议名称</th>
                <th scope="col">投票描述</th>
            </tr>
        </thead>
        <tbody>`;
    for(let i = 0; i < votes.length; i++){
        let vote = votes[i];
        votesTableHtml +=
        `<tr>
            <th scope="row"><a href="#" onclick="displayVote(${i})">${vote.voteID}</a></th>
            <td>${vote.voteTitle}</td>
            <td>${vote.isRecorded == 'Y'?'记名':'不记名'}</td>
            <td>${vote.meetingName}</td>
            <td>${vote.voteDescription}</td>
        </tr>`;
    }
    votesTableHtml += `</tbody></table>`;
    $('#votesTable').html(votesTableHtml);

}

let displayVote = (index) => {
    let vote = votes[index];
    updateCurrentVote(vote);
}

let commonAlert = (success, message) => {
    if(success){
        $('#commonAlert #alertTitle').text('通知');
        $('#commonAlert #alertText').text(message);
        $('#commonAlert').removeClass('alert-danger');
        $('#commonAlert').addClass('alert-success');
    }else{
        $('#commonAlert #alertTitle').text('错误');
        $('#commonAlert #alertText').text(message);
        $('#commonAlert').removeClass('alert-success');
        $('#commonAlert').addClass('alert-danger');
    }
    $('#commonAlert').show();
}


    