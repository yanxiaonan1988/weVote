let mode;

let updateCurrentVote = (currentVote) => {
    if(currentVote){
        
        if(mode == 'voter'){
            let user;
            if(localStorage.user) {user = JSON.parse(localStorage.user);}
            updateSignIn(user, currentVote.voters);
            if(user && currentVote.voters[user.userId]){
                updateDecision(currentVote.voters[user.userId].decision); 
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
        $('#currentVote #voteFile').html(`</div><embed src="${currentVote.voteFilePath}" id="voteFile" height="900" width="100%"/>`);
        updateVoters(currentVote.voters);
        
        updateVoteProgress(currentVote.notice);
    }
}

let updateVoters = (voters) => {
    let votersHtml = '';
    for(let userId in voters){
        let voter = voters[userId];
        let badgeHtml = "";
        if(voter.decision === 1){badgeHtml = `<span class="badge badge-pill badge-success">√</span>`};
        if(voter.decision === -1){badgeHtml = `<span class="badge badge-pill badge-danger">×</span>`};
        votersHtml += `<button type="button" class="btn btn-secondary">${voter.name}${badgeHtml}</button> `
    }
    $('#currentVote #voters').html(votersHtml);
}

let updateVoteProgress = (notice) => {
    if(notice.all != 0){
        $("#voteProgress #support").css('width', notice.support/notice.all*100+"%");
        $("#voteProgress #support").text(notice.support);
        $("#voteProgress #oppose").css('width', notice.oppose/notice.all*100+"%");
        $("#voteProgress #oppose").text(notice.oppose);
    }
}

let voteCreatedCallback = (currentVote) => { location.reload(); }
let signInCallback = (voters, notice) =>{ updateVoters(voters); updateVoteProgress(notice); }
let decisionCallback = (voters, notice) =>{ updateVoters(voters); updateVoteProgress(notice); }
let finishVoteCallback = () => {
    $('#currentVote').find("*").attr("disabled", "disabled");

}

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
    

    $('#currentVote').load('_currentVote.html', () => {
        if(mode == 'admin'){
            $('#createVoteModal').load('_createVoteModal.html', () => {
                initCurrentVote();
            });
        }else{
            initCurrentVote();
        }
    });

    let socket = io.connect('http://localhost:3000');
    socket.on('voteCreated', function (data) {
        voteCreatedCallback(data);
    });
    socket.on('signIn', function (data) {
        signInCallback(data.voters, data.notice);
    });
    socket.on('decision', function (data) {
        decisionCallback(data.voters, data.notice);
    });
    socket.on('finishVote', function (data) {
        finishVoteCallback(data);
    });
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
let updateSignIn = (user, voters) => {
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

let updateDecision = (decision) => {
    if(decision === 1){
        $('#decision_1').attr('disabled', 'disabled');
        $('#decision_-1').addClass('invisible');
    }else if(decision === -1){
        $('#decision_-1').attr('disabled', 'disabled');
        $('#decision_1').addClass('invisible');
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
            alert('已结束');
        }
    });
}

let saveVote = () => {
    $.post({
        url: '/api/vote/save',
        contentType:'application/json;charset=utf-8',
        success: function updateData(data){
            $('#saveVote').attr('disabled', 'disabled');
            alert('已保存');
        }
    });
}



    