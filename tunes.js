var Db = require("mongodb").Db;
var Server = require("mongodb").Server;
var ObjectID = require("mongodb").ObjectID;

TunesProvider = function(host, port) {
  this.db = new Db('tf', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(){});
}

TunesProvider.prototype.getAllShows = function(callback) {
  this.db.collection('show', function(error, collection) {
    if(error) {
    	callback(error);
    } else {
    	collection.find().sort({"name":1}).toArray(function(error, results) {
    		if (error) {
    			callback(error);
    		} else {
    			callback(null, results);
    		}
    	});
    }
  });
};

TunesProvider.prototype.getHottestShows = function(callback) {
  this.db.collection('show', function(error, collection) {
    if(error) {
        callback(error);
    } else {
        collection.find().sort({"name":1}).skip(0).limit(10).toArray(function(error, results) {
            if (error) {
                callback(error);
            } else {
                callback(null, results);
            }
        });
    }
  });
};

TunesProvider.prototype.getHottestSongs = function(callback) {
  this.db.collection('show', function(error, collection) {
    if(error) {
        callback(error);
    } else {
        collection.find().sort({"name":1}).skip(0).toArray(function(error, results) {
            if (error) {
                callback(error);
            } else {
                var ret = [];
                for (var i = 0; i < results.length && ret.length < 10; i++) {
                    if (results[i].seasons != null && results[i].seasons.length > 0) {
                        for (var ii = 0; ii < results[i].seasons.length && ret.length < 10; ii++) {
                            if (results[i].seasons[ii].episodes != null && results[i].seasons[ii].episodes.length > 0) {
                                for (var iii = 0; iii < results[i].seasons[ii].episodes.length && ret.length < 10; iii++) {
                                    if (results[i].seasons[ii].episodes[iii].songs != null) {
                                        for (var j = 0; j < results[i].seasons[ii].episodes[iii].songs.length && ret.length < 10; j++) {
                                            ret.push(results[i].seasons[ii].episodes[iii].songs[j]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                callback(null, ret);
            }
        });
    }
  });
};

TunesProvider.prototype.getShow = function(id, callback) {
  this.db.collection('show', function(error, collection) {
    if(error) {
    	callback(error);
    } else {
    	collection.findOne({"_id": new ObjectID(id)}, function(error, result) {
        console.log(error);
        console.log(result);
    		if (error) {
    			callback(error);
    		} else {
    			callback(null, result);
    		}
    	});
    }
  });
};

exports.TunesProvider = TunesProvider;