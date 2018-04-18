var express = require('express');
var app = express();
var update = require('./update');

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.get('/wechat', (req, res) => {
  let query = req.query.name || '';
  if (query === '')
    res.send('{messsage:"incorrect request"}');
  else
    update(query, res, 0);
})

app.get('/xml', (req, res) => {
  let query = req.query.name || '';
  if (query === '')
    res.send('{messsage:"incorrect request"}');
  else
    update(query, res, 1);
})

app.listen(process.env.PORT || 3000, function() {
  console.log('Example app listening on port ' + (process.env.PORT || 3000) + '!');
});
