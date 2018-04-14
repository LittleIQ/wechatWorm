var request = require('request');
var cheerio = require('cheerio');

var getNewsList=function(done) {
    var news = new Array();
    request('http://www.bilibili.com', function (err, res) {
        if (err) return console.error(err);

        var $ = cheerio.load(res.body.toString());

        var body=$('body');
        console.log(body);
    });
};

getNewsList();
