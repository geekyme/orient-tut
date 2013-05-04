
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();
var orientdb = require('orientdb');
var dbConfig = {
    user_name: "admin",
    user_password: "admin"
};
var serverConfig = {
    host: "localhost",
    port: 2424
};

var server = new orientdb.Server(serverConfig);
var db = new orientdb.GraphDb("blog", server, dbConfig);

db.open(function(err) {
    if (err) {
      console.log(err);
        throw err;
    }
    console.log("Successfully connected to OrientDB");
    routes.init(db, function(err) {
      if (err) {
          throw err;
      }
    });
});

var OrientDBStore = require('connect-orientdb')(express);

var settings = {
    server: {
        host: "localhost",
        port: 2424
    },
    db: {
        user_name: "admin",
        user_password: "admin"
    },
    database: "blog",
    class_name: "Session"
};

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session({
    secret: 'hahahaha12',
    store: new OrientDBStore(settings)
  }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/new_post', routes.new_post_form);
app.post('/new_post', routes.new_post);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
