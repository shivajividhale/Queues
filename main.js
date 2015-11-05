var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})
client.set("key", "value");
client.get("key", function(err,value){ console.log(value)});
var list = {};
///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next)
{
	console.log(req.method, req.url);
	client.lpush("list",req.url);
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
	  		console.log(img);
	  		client.lpush("image_list",img);
		});
	}

   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
		console.log("meow");
		res.writeHead(200, {'content-type':'text/html;charset=utf-8'});
		client.lrange('image_list', 0, -1, function(err, items){
			if (err) throw err
			items.forEach(function (imagedata)
			{
				console.log("Image:"+imagedata);
				var show_image = "<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>"
				//console.log(show_image);
				//res.writeHead(200, {'content-type':'text/html'});
	   		//res.write(show_image);
	   		 res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
			});
		});

   	res.end();
});

app.get('/get', function(req,res){
	client.get("key1",function(err,value){
		 res.send(value);
		 client.expire('key1', 10);
	});

});

app.get('/set', function(req,res){
	//var key_val = {"key": "this message will self-destruct in 10 seconds"};
	client.set("key1","this message will self-destruct in 10 seconds");
	res.end();
});

app.get('/recent',function(req,res){
	var urls = "";
	/*for (var key in list){
		console.log(key)
		urls += list[key];
		urls += "\n";
	}
	console.log(urls);
	*/
	client.lrange('list', 0, -1, function(err, reply) {
    	console.log(reply); // ['angularjs', 'backbone']
		res.send(reply);
	})

});



//HTTP SERVER
var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})

app.get('/', function(req, res) {
  res.send('hello world')
})