

$('.custom-file-input').on('change', function() { 
    let fileName = $(this).val().split('\\').pop(); 
    $(this).siblings('.custom-file-label').addClass('selected').html(fileName);
});

$.get({
    url: '/api/vote/current',
    success: function updateData(data){
        updateCurrentVote(data.currentVote);
    }
});

let updateCurrentVote = (currentVote) => {
    if(currentVote){
        $('#currentVote #voteTitle').val(currentVote.voteTitle);
        $('#currentVote #voteFile').html(`</div><embed src="${currentVote.voteFilePath}" id="voteFile" height="100%" width="100%"/>`);
    }
};