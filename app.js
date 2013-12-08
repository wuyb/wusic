
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var TunesProvider = require('./tunes').TunesProvider;
var util = require('util');
var jsdom = require('jsdom');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var tunes = new TunesProvider('localhost', 27017);

app.get('/', routes.index);
app.get('/shows', function(req, res) {
  var shows;
  var songs;
  tunes.getHottestShows(function(error, ret_shows) {
    shows = ret_shows;
    tunes.getHottestSongs(function(error, ret_songs) {
      songs = ret_songs;
      util.log(JSON.stringify(songs));
      res.render('shows', {title:"Shows", shows:shows, songs:songs});
    });
  });

//	tunes.getAllShows(function(error, shows) {
//		res.render('shows', {title:"Shows", shows:shows});
//	});
});

app.get('/shows/:id', function(req, res) {
	tunes.getShow(req.params.id, function(error, show) {
		res.render('show', {title:show.name, show:show});
	});
});

app.post('/songs/search', function(req, response) {
  util.log("Searching for : " + req.body.name);
  var url = "http://soso.music.qq.com/fcgi-bin/multiple_music_search.fcg?mid=1&p=1&catZhida=1&lossless=0&t=100&searchid=29604715711729816&remoteplace=txt.yqqlist.top&utf8=1&w=";
  var keyUrl = "http://s.plcloud.music.qq.com/fcgi-bin/fcg_musicexpress.fcg?json=1&g_tk=1&loginUin=0&hostUin=0&format=jsonp&inCharset=GB2312&outCharset=GB2312&notice=0&platform=yqq&jsonpCallback=MusicJsonCallback&needNewCode=0&guid=1"; 
  var searchUrl = url + encodeURIComponent(req.body.name);
  util.log("Key URL : " + keyUrl);
  util.log("Search URL : " + searchUrl);
  var mid;
  http.get(searchUrl, function(res) {
    var body = "";
    res.on("data", function(chunk) {
      body = body + chunk;
    });
    res.on("end", function() {
      jsdom.env(body, ["http://code.jquery.com/jquery.js"], function(errors, window) {
        mid = window.$("div#main a.btn_like").attr("mid").trim();
        http.get(keyUrl, function(res) {
          var body = "";
          res.on("data", function(chunk) { body = body + chunk; });
          res.on("end", function() {
            body = body.substring("jsonCallback(".length);
            body = JSON.parse(body.substring(0, body.length - 2));
            var key = body.key;
            var sip = body.sip;
            sip = sip.substring(sip.indexOf("/", 7) + 1, sip.indexOf("/", sip.indexOf("/", 7) + 1));
            response.send(JSON.stringify({"result" : "ok", "mid" : mid, "key" : key, "sip" : sip}));
          });
        }, function(error) {
          console.error("Got error during search for "  + req.body.name + " : " + e.message);
        });
      });
    });
  }).on("error", function(e) {
    console.error("Got error during search for "  + req.body.name + " : " + e.message);
  }); 

});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

