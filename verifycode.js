var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var Ut = {};

Ut.solve_verifycode = function(html, url, callback) {
  console.log('识别验证码');
  var code_cookie = '';
  var cert = '';
  var task_code = [];
  //获取base64格式的验证码图片
  task_code.push(function(callback) {
    var $ = cheerio.load(html);
    var img_url = 'http://mp.weixin.qq.com' + $("#verify_img").attr('src');
    img_url = `http://mp.weixin.qq.com/mp/verifycode?cert=${(new Date).getTime() + Math.random()}`
    cert = img_url.split('=')[1];
    var j = request.jar();
    request.get({
      url: img_url,
      encoding: 'base64',
      jar: j
    }, function(err, response, body) {
      if (err) return callback(err);
      var cookie_string = j.getCookieString(img_url);
      code_cookie = cookie_string;
      callback(null, body);
    })
  })
  //通过第三方接口识别验证码,并返回
  task_code.push(function(base64, callback) {
    var form = {
      img_base64: base64,
      typeId: 2040
    }
    var opts = {
      url: 'http://ali-checkcode.showapi.com/checkcode',
      method: 'POST',
      formData: form,
      json: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        //授权码
        "Authorization": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    };
    Ut.request_json(opts, function(err, data) {
      if (err) return callback(err);
      if (data.showapi_res_code == 0) {
        callback(null, data.showapi_res_body.Result);
      }
    })
  });
  //验证验证码是否正确
  task_code.push(function(verifycode, callback) {
    var verifycode_url = `http://mp.weixin.qq.com/mp/verifycode?cert=${encodeURIComponent(cert)}&input=${encodeURIComponent(verifycode)}`;
    var form = {
      input: encodeURIComponent(verifycode),
      cert: encodeURIComponent(cert)
    }
    var options = {
      url: verifycode_url,
      json: true,
      formData: form,
      method: 'post',
      headers: {
        "Cookie": code_cookie
      }
    };
    Ut.request_json(options, function(err, data) {
      if (err) return callback(err);
      console.log('验证码识别成功')
      callback(null);
    })
  })
  //验证码正确重新访问
  task_code.push(function(callback) {
    request(url, function(err, response, html) {
      if (err) return callback(err, null);
      //搜狗微信的验证码即使输入成功,有的时候也需要输入几次验证码,所以重复调用solve_verifycode方法
      if (html.indexOf('为了保护你的网络安全，请输入验证码') != -1) {
        return Ut.solve_verifycode(html, url, callback);
      }
      callback(null, html);
    })
  })
  async.waterfall(task_code, function(err, result) {
    if (err) return callback(err, null);
    // callback(null, result);
    console.log(result);
  })
};

Ut.request_json = function(options, callback) {
  request(options, function(error, response, body) {
    if (error) return callback(error, null);
    if (response.statusCode != 200) return callback("statusCode" + response.statusCode, null);
    callback(null, body);
  });
};

/**
格式化时间
*/
Ut.fmtDate = function(date) {
  // 将数字格式化为两位长度的字符串
  var fmtTwo = function(number) {
    return (number < 10 ? '0' : '') + number;
  };
  var yyyy = date.getFullYear();
  var MM = fmtTwo(date.getMonth() + 1);
  var dd = fmtTwo(date.getDate());
  var HH = fmtTwo(date.getHours());
  var mm = fmtTwo(date.getMinutes());
  var ss = fmtTwo(date.getSeconds());
  return '' + yyyy + '-' + MM + '-' + dd + ' ' + HH + ':' + mm + ':' + ss;
}

module.exports = Ut;
