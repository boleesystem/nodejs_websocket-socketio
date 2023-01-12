1. app.js

1) 노드js 내장 HTTP 모듈
   https://www.w3schools.com/nodejs/nodejs_http.asp

var http = require('http');

//create a server object:
http.createServer(function (req, res) {
res.write('Hello World!'); //write a response to the client
res.end(); //end the response
}).listen(8080); //the server object listens on port 8080
