var redis = require('redis')
var multer  = require('multer')
var http = require('http');
var httpProxy = require('http-proxy');
var express = require('express')
var fs      = require('fs')
var app = express()

// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})
client.set("key", "value");
client.get("key", function(err,value){ console.log(value)});
var list = {};
var host;

var options = {}
var proxy   = httpProxy.createProxyServer(options);
//Server instances
var instance1 = 'http://0.0.0.0:3000';
var instance2  = 'http://0.0.0.0:3001';
var instances = {};
client.lpush("instances",instance1);
client.lpush("instances",instance2);

var server  = http.createServer(function(req, res)
	{
		client.rpoplpush("instances","instances",function(err,TARGET){
	  		proxy.web( req, res, {target: TARGET } );
		});
	});
server.listen(8080);

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next)
{
	console.log(req.method, req.url);
	var url = "http://"+host+":"+req.socket.localPort+req.url;
	console.log(url);
	client.lpush("list",url);
	client.ltrim("list", 0, 4);
	// ... INSERT HERE.

	next(); // Passing the request to the next handler in the stack.
});

var image_list = {};
app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		client.lpush("image_list",img);
	  		client.ltrim("image_list", 0, 4); //Keep 5 recently used images
		});
	}
	console.log("Uploaded image");
   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
		console.log("meow");
		res.writeHead(200, {'content-type':'text/html;charset=utf-8'});
		client.lrange('image_list', 0, -1, function(err, items){
			if (err) throw err
			var show_image = "";
			items.forEach(function (imagedata)
			{
				show_image += "\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/><br>"
			});
			res.write(show_image);
   			res.end();
		});

});

app.get('/get', function(req,res){
	client.get("key1",function(err,value){
		 res.send(value);
		 client.expire('key1', 10);
	});

});

app.get('/set', function(req,res){
	client.set("key1","this message will self-destruct in 10 seconds");
	res.end();
});

app.get('/recent',function(req,res){
	var urls = "";
	client.lrange('list', 0, -1, function(err, items) {
    	//console.log(reply); // ['angularjs', 'backbone']
    	var recent_urls = "";
    	items.forEach(function (url)
			{
				recent_urls += url;
				recent_urls += "\n";
			});

		res.send(recent_urls);
	})

});



//HTTP SERVER
var server = app.listen(3000, function () {

  host = server.address().address
  port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})
//2nd Instance running on port 3001
var server1 = app.listen(3001, function () {
	var host1 = server1.address().address
	var port1 = server1.address().port
	console.log('Example app listening at http://%s:%s', host1, port1)
})

app.get('/', function(req, res) {
  res.send('hello world')
})