var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var express = require('express');
var app = express();
var Ut = require('./verifycode');

function getNewsList(str) {
  var url = 'http://weixin.sogou.com/weixin?type=1&query=' + encodeURIComponent(str) + '&ie=utf8&_sug_=y&_sug_type_=1';
  request(url, function(err, res, html) {
    if (err) return console.error(err);

    var $ = cheerio.load(html);

    var wechat = $($('#sogou_vr_11002301_box_0 a')[0]).attr('href') || '';
    // console.log(wechat);
    setTimeout(function() {
      look_wechat_by_url(wechat.replace(/amp;/g, ''));
    }, 1000 + Math.ceil(Math.random() * 500));
  });
};

function look_wechat_by_url(url) {
  //发布时间数组
  var article_pub_times = [];
  //标题列表数组
  var article_titles = [];
  //文章临时url列表数组
  var article_urls = [];
  request(url, function(err, res, html) {
    if (err) return console.error(err);

    if (html.indexOf('为了保护你的网络安全，请输入验证码') != -1) {
      //验证验证码
      Ut.solve_verifycode(html, url, function(err, result) {
        if (err) return callback(err, null);
        findArticle(result, article_pub_times, article_titles, article_urls);
      })
    } else {
      findArticle(html, article_pub_times, article_titles, article_urls);
    }
    console.log(article_titles);
    let data = '';
    for(let i in article_pub_times){
        data += '<li><a href="'+article_urls[i]+'">'+article_titles[i]+' : '+article_pub_times[i]+'</a></li>';
    }
    data = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><ul>'+data+'</ul></body></html>';
    fs.writeFile('./test.html', data, {
      flag: 'w',
      encoding: 'utf-8',
      mode: '0666'
    }, function(err) {
      if (err) {
        console.log("文件写入失败")
      } else {
        console.log("文件写入成功");
      }
    })
  });
}

function findArticle(html, article_pub_times, article_titles, article_urls) {
  var msglist = html.match(/var msgList = ({.+}}]});?/);
  if (!msglist) return callback(`-没有搜索到文章,只支持订阅号,服务号不支持!`);
  msglist = msglist[1];
  msglist = msglist.replace(/(&quot;)/g, '\\\"').replace(/(&nbsp;)/g, '');
  msglist = JSON.parse(msglist);
  if (msglist.list.length == 0) return callback(`-没有搜索到文章,只支持订阅号,服务号不支持!`);

  //循环文章数组,重组数据
  msglist.list.forEach(function(msg, index) {
    //基本信息,主要是发布时间
    var article_info = msg.comm_msg_info;
    //发布时间
    var article_pub_time = Ut.fmtDate(new Date(article_info.datetime * 1000)).split(" ")[0];
    //第一篇文章
    var article_first = msg.app_msg_ext_info;
    article_pub_times.push(article_pub_time);
    article_titles.push(article_first.title);
    article_urls.push('http://mp.weixin.qq.com' + article_first.content_url.replace(/(amp;)|(\\)/g, ''));
    if (article_first.multi_app_msg_item_list.length > 0) {
      //其他文章
      var article_others = article_first.multi_app_msg_item_list;
      article_others.forEach(function(article_other, index) {
        article_pub_times.push(article_pub_time);
        article_titles.push(article_other.title);
        article_urls.push('http://mp.weixin.qq.com' + article_other.content_url.replace(/(amp;)|(\\)/g, ''));
      })
    }
  })
}

getNewsList('魔宙');

app.use(express.static('./'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
