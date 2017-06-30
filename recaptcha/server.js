var express = require('express');
var app 	= express();
var request	= require('request');

app.use(express.static('public'));

app.get('/recaptcha/:recaptcha', function(req,res) {
	request.post({
		url:'https://www.google.com/recaptcha/api/siteverify', 
		form: {
			secret:'6LdOUCUUAAAAAG3EhDFShotOgyiLvEF6AGGHABdo',
			response: req.params.recaptcha
		}
	}, function (error, response, body) {
		if(error) {
			console.log(error);
		} else {
			console.log(response.statusCode,JSON.parse(body));
			res.set('Access-Control-Allow-Origin', '*');
			res.json(JSON.parse(body));
		}
	})
});

app.options('/*', function(req,res) {  
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
	res.send(200);

});

app.listen(process.env.PORT || 3000);
console.log('reCaptcha Service Listening on port process.env.VCAP_APP_PORT || 3000');

