var express = require('express');
var app = express();
var path = require('path');
var update = require('./update');


app.use(express.static(path.join(__dirname)));

app.get('/', function (req, res) {
  update('魔宙');
  res.send('Hello World!');
});

app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening on port '+(process.env.PORT || 3000)+'!');
});
