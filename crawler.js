var http = require('http');
var jsdom = require('jsdom');
var mongo = require('mongodb');
var async = require('async');

function loadSongs(episode, callback) {
  console.log("Loading songs for " + episode["name"]);
  http.get("http://www.tunefind.com" + episode["link"], function(res) {
    var body = "";
    res.on("data", function(chunk) {
      body = body + chunk;
    });
    res.on("end", function() {
      jsdom.env(body, ["http://code.jquery.com/jquery.js"], function(errors, window) {
        var $ = window.$;
        var songs = $("ul.tf-blocks div.tf-songevent-text");
        episode["songs"] = [];
        async.eachSeries(songs, function(item, callback) {
          var song = {
            "name" : $(item).find("a").text().trim(),
            "singer" : $(item).clone().children().remove().end().text().trim().substring(3),
            "where" : $(item).find("div.small").text().trim()
          };
//          console.log(song["name"] + " " + song["singer"] + " " + song["where"]);
          episode["songs"].push(song);
          callback();
        }, function(error) {
          if (error) console.log(error);
          callback(error);
        });
      });
    });
  }).on("error", function(e) {
    console.error("Got error during loading " + episode["name"] + " at " + episode["link"] + " : " + e.message);
    callback(e);
  }); 
}

function loadEpisodes(season, callback) {
  console.log("Loading episodes for " + season["name"]);
  http.get("http://www.tunefind.com" + season["link"], function(res) {
    var body = "";
    res.on("data", function(chunk) {
      body = body + chunk;
    });
    res.on("end", function() {
      jsdom.env(body, ["http://code.jquery.com/jquery.js"], function(errors, window) {
        var $ = window.$;
        var episodes = $("ul.tf-blocks div.span8 p");
        season["episodes"] = [];
        async.eachSeries(episodes, function(item, callback) {
          var episode = {
            "name" : $(item).find("strong").text().trim(),
            "link" : $(item).find("strong a").attr("href"),
            "date" : $(item).find("span").text().trim()
          };
          season["episodes"].push(episode);
          loadSongs(episode, function(error) {
            callback(error);
          });
        }, function(error) {
          callback(error);
        });
      });
    });
  }).on("error", function(e) {
    console.error("Got error during loading " + season["name"] + " at " + season["link"] + " : " + e.message);
    callback(e);
  }); 
}

function loadSeasons(show, callback) {
  console.log("Loading seasons for " + show["name"]);
  http.get("http://www.tunefind.com" + show["link"], function(res) {
    var body = "";
    res.on("data", function(chunk) {
      body = body + chunk;
    });
    res.on("end", function() {
      jsdom.env(body, ["http://code.jquery.com/jquery.js"], function(errors, window) {
        var $ = window.$;
        var seasons = $("ul.tf-blocks p");
        show["seasons"] = [];
        async.eachSeries(seasons, function(item, callback){
          var season = {
                        "name" : $(item).find("strong a").text(),
                        "link" : $(item).find("strong a").attr("href")
                       };
          show["seasons"].push(season);
          loadEpisodes(season, function(error) {
            callback();
          });
        }, function(error) {
          callback(error);
        });
      });
    });
  }).on("error", function(e) {
    console.error("Got error during loading " + show["name"] + " at " + show["link"] + " : " + e.message);
    callback(e);
  }); 
}

function loadShows() {
  http.get("http://www.tunefind.com/browse/tv", function(res) {
    var body = "";
    res.on("data", function(chunk) {
      body = body + chunk;
    });
    res.on("end", function() {
      jsdom.env(body, ["http://code.jquery.com/jquery.js"], function(errors, window) {
        var $ = window.$;
        var shows = $("div.span4");
        var mongoClient = mongo.connect("mongodb://127.0.0.1:27017/tf", function(err, db){
          var showCollection = db.collection("show");
          var cont = false;
          async.eachSeries(shows, function(item, callback) {
            var show = {};
            show["name"] = $(item).text().trim();
            show["link"] = $(item).find("a").attr("href");
            if (show["name"] === "Switched at Birth") {
              cont = true;
            }
            if (cont) {
              loadSeasons(show, function() {
                showCollection.update({name:show["name"]}, show, {upsert:true, w:1}, function(err, result){
                  callback(err, result);
                });
              });
            } else {
              callback(null, null);
            }
          }, function(err) {
            if (err) throw err;
            console.log("Loading TV done");
          });
        });
      }); 
    }).on("error", function(e) {
      console.error("Got error : " + e.message);
    });
  });
}

loadShows();
//loadSeasons({"name": "House", "link" : "/show/house"}, function() {});