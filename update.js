var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var Ut = require('./verifycode');

getNewsList = function(str, response, sign) {
  var url = 'http://weixin.sogou.com/weixin?type=1&query=' + encodeURIComponent(str) + '&ie=utf8&_sug_=y&_sug_type_=1';
  request(url, function(err, res, html) {
    if (err) return console.error(err);

    var $ = cheerio.load(html);

    var wechat = $($('#sogou_vr_11002301_box_0 a')[0]).attr('href') || '';
    // console.log(wechat);
    // setTimeout(function() {
    look_wechat_by_url(wechat.replace(/amp;/g, ''), str, response, sign);
    // }, 1000 + Math.ceil(Math.random() * 500));
  });
};

function look_wechat_by_url(url, str, response, sign) {
  //发布时间数组
  var article_pub_times = [];
  //标题列表数组
  var article_titles = [];
  //文章临时url列表数组
  var article_urls = [];
  request(url, function(err, res, html) {
    if (err) return console.error(err);

    console.log(html);
    if (html.indexOf('为了保护你的网络安全，请输入验证码') != -1) {
      //验证验证码
      console.log('验证码');
      Ut.solve_verifycode(html, url, function(err, result) {
        if (err) return callback(err, null);
        findArticle(result, article_pub_times, article_titles, article_urls);
      })
    } else {
      findArticle(html, article_pub_times, article_titles, article_urls);
    }
    console.log(article_titles);
    if (sign === 1) {
      let data = '';
      for (let i in article_pub_times) {
        data += '<item>\n<title>' + article_titles[i] + '</title>\n<link>' + article_urls[i] + '</link>\n<description>' + article_pub_times[i] + '</description>\n</item>\n';
      }
      data = '<?xml version="1.0" encoding="utf8"?>\n<rss version="2.0">\n<channel>\n<title>' + str + '</title>\n<link>https://tranquil-journey-94620.herokuapp.com/</link>\n<description>wechat</description>\n' + data + '</channel>\n</rss>';
      response.send(data);
    } else if (sign === 0) {
      let data = [];
      for (let i in article_pub_times) {
        data[i] = {
          "article_title": article_titles[i],
          "article_url": article_urls[i].replace(/(amp;)|(\\)/g, ''),
          "article_pub_time": article_pub_times[i]
        };
      }
      response.json(data);
    }
  });
}

function findArticle(html, article_pub_times, article_titles, article_urls) {
  var msglist = html.match(/var msgList = ({.+}}]});?/);
  if (!msglist) {
    console.log(`-没有搜索到文章,只支持订阅号,服务号不支持!`);
    return;
  }
  msglist = msglist[1];
  msglist = msglist.replace(/(&quot;)/g, '\\\"').replace(/(&nbsp;)/g, '');
  msglist = JSON.parse(msglist);
  if (msglist.list.length == 0) {
    console.log(`-没有搜索到文章,只支持订阅号,服务号不支持!`);
    return;
  }

  //循环文章数组,重组数据
  msglist.list.forEach(function(msg, index) {
    //基本信息,主要是发布时间
    var article_info = msg.comm_msg_info;
    //发布时间
    var article_pub_time = Ut.fmtDate(new Date(article_info.datetime * 1000)).split(" ")[0];
    //第一篇文章
    var article_first = msg.app_msg_ext_info;
    if (article_first.content_url != '' || article_first.content_url != 'undefined') {
      article_pub_times.push(article_pub_time);
      article_titles.push(article_first.title);
      article_urls.push('http://mp.weixin.qq.com' + article_first.content_url);
    }
    if (article_first.multi_app_msg_item_list.length > 0) {
      //其他文章
      var article_others = article_first.multi_app_msg_item_list;
      article_others.forEach(function(article_other, index) {
      console.log(article_other.content_url);
        if (article_other.content_url != '' || article_other.content_url != 'undefined') {
          article_pub_times.push(article_pub_time);
          article_titles.push(article_other.title);
          article_urls.push('http://mp.weixin.qq.com' + article_other.content_url);
        }
      })
    }
  })
}

module.exports = getNewsList;
