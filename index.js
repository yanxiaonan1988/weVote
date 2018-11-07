const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(fileUpload());

app.get('/api', (req, res, next) => res.send('Hello World!'));



app.post('/api/vote/create', (req, res, next) => {
    let voteFile = req.files.voteFile;
    console.log(req.body.voteTitle);

    voteFile.mv('data/xxx.jpg', function(err) {
        res.redirect('/');
    });
});



app.listen(port, () => console.log(`Example app listening on port ${port}!`));