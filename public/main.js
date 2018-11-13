$('#currentVote').load('_currentVote.html');
$('#createVoteModal').load('_createVoteModal.html');

$('.custom-file-input').on('change', function() { 
    let fileName = $(this).val().split('\\').pop(); 
    $(this).siblings('.custom-file-label').addClass('selected').html(fileName);
});

let updateCurrentVote = (currentVote) => {
    if(currentVote){
        $('#currentVote #voteTitle').val(currentVote.voteTitle);
        $('#currentVote #voteFile').html(`</div><embed src="${currentVote.voteFilePath}" id="voteFile" height="900" width="100%"/>`);
        updateVoters(currentVote.voters);
        
        let user;
        if(localStorage.user) {user = JSON.parse(localStorage.user);}
        updateSignIn(user, currentVote.voters);
        if(user && currentVote.voters[user.userId]){ updateDecision(currentVote.voters[user.userId].decision); }
    }
}

let updateVoters = (voters) => {
    let votersHtml = '';
    for(let userId in voters){
        let voter = voters[userId];
        let badgeHtml = "";
        if(voter.decision === 1){badgeHtml = `<span class="badge badge-pill badge-success">√</span>`};
        if(voter.decision === -1){badgeHtml = `<span class="badge badge-pill badge-danger">×</span>`};
        votersHtml += `<button type="button" class="btn btn-secondary">${voter.name}${badgeHtml}</button>`
    }
    $('#currentVote #voters').html(votersHtml);
}

let voteCreatedCallback = (currentVote) => { updateCurrentVote(currentVote); }
let signInCallback = (voters) =>{ updateVoters(voters); }
let decisionCallback = (voters) =>{ updateVoters(voters); }
let finishCallback = () => {
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

let initAdmin = () => {
    initCurrentVote();

    let socket = io.connect('http://localhost:3000');
    socket.on('voteCreated', function (data) {
        voteCreatedCallback(data);
    });
    socket.on('signIn', function (data) {
        signInCallback(data);
    });
    socket.on('decision', function (data) {
        decisionCallback(data);
    });
    socket.on('finish', function (data) {
        finishCallback(data);
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
        }
    });
}
let updateSignIn = (user, voters) => {
    if(user && voters && voters[user.userId] ){
        $('#voter #name').val(user.name);
        $('#voter #name').attr('disabled', 'disabled');
        $('#voter #signIn').text('已签到');
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

let updateDecision = (decision) => {
    if(decision === 1){
        $('#currentVote #decision_1').attr('disabled', 'disabled');
        $('#currentVote #decision_-1').addClass('invisible');
    }else{
        $('#currentVote #decision_-1').attr('disabled', 'disabled');
        $('#currentVote #decision_1').addClass('invisible');
    }
}

let finish = () => {
    $.post({
        url: '/api/vote/finish',
        contentType:'application/json;charset=utf-8',
        success: function updateData(data){
            $('#finishVote').attr('disabled', 'disabled');
            alert('已结束');
        }
    });
}




    