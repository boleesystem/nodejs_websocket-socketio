// 백엔드에서 구동되는 코드
import http from "http";
import Websocket from "ws";
import express from "express";
// import { disconnect } from "process";

const app = express();

app.set("view engine", "pug"); // pug로 view engine 설정
app.set("views", __dirname + "/views"); // express에 templates가 어디 있는지 지정
app.use("/public", express.static(__dirname + "/public")); // public url을 생성해 유저에게 파일을 공유
app.get("/", (req, res) => res.render("home")); // home.pug를 render해주는 route handler 만듦
app.get("/*", (req, res) => res.redirect("/")); // 유저가 어떤 url로 이동하든 home으로 돌려보냄(다른 url은 사용하지 않고 home만 사용할 것이기 때문)

const handleListen = () => console.log('Listening on http://localhost:3000/') // localhost는 동일한 포트에서 http, ws의 request 2개를 모두 처리할 수 있음

// 1. 웹소켓 서버 연결
// app.listen(3000, handleListen); 
const server = http.createServer(app); // express는 ws를 지원하지 않기 때문에 function을 추가해야 함
const wss = new Websocket.Server({ server }); // http 서버 위에 websocket 서버를 만들 수 있도록 한 것임
// *꼭 이렇게 하지 않아도 되고 websocket 서버만 만들어도 됨. 이렇게 만든 이유는 우리의 서버를 보이게 노출시키고 그 다음 http 서버 위에 ws 서버를 만들기 위함임
// *http 서버를 만든 이유는 views, static files, home, redirection을 원하기 때문임

// function handelConnection(socket) { // server.js에서의 socket은 연결된 브라우저를 뜻함 (app.js에서의 socket은 서버로의 연결을 의미)
//     console.log(socket)
// }
// wss.on("connection", handelConnection); // 이거만 적으면 아무 일도 일어나지 않음. app.js에 프론트엔드 관련 코드를 작성해줘야 함

// 위 코드를 더 좋은 방식으로 수정
// socket을 connection 안에 같은 역할을 하는 익명 함수를 만듦
// 그러면 socket이 지금 어떤 상태인지 알기 쉬워지고, event를 다룰 때도 좋음
// => connection이 생기면 socket을 받는다는 걸 알 수 있음
// 2-1. 메시지 보내기
const sockets = []; // ???!!! JS문법 - 클로저 https://poiemaweb.com/es6-block-scope

wss.on("connection", (socket) => { // 브라우저가 연결되면
    sockets.push(socket); // socket 연결되면(유저가 연결되면) const sockets = []; 해당 array에 넣어줌 
    socket["nickname"] = "Anonymous"
    console.log("Connected to Browser") // 콘솔로그하고 
    socket.on("close", () => console.log("Disconnected from the Browser")) // 브라우저가 꺼졌을 때를 위한 listener를 등록
    socket.on("message", msg => { // 브라우저가 서버에 메시지를 보냈을 때를 위한 listener를 등록
        // socket.send(message.toString('utf8')); // 브라우저 개발자도구 콘솔창에 뜸
        // console.log(message.toString('utf8')); // 서버 터미널에 뜸
        const parsedMessage = JSON.parse(msg); // ??? 왜 여기에는 .toString('utf8') 이거 없이도 잘 뜨지
        // console.log(parsed, message.toString('utf8')); 
        // ??? .toString('utf8') 이거 매번 이렇게 써줘야 하는 건가. 노드js에서 기본적으로 문자코드를 유니코드인 UTF-8로 사용하는데 이렇게 적어야 하는 이유는 뭐지
        // 문자코드 변환하는 3가지 모듈 있다고 함 https://junistory.blogspot.com/2017/08/blog-post_24.html
        // 1) iconv : 문자코드를 다른 문자코드로 변환
        // 2) iconv-lite : 문자코드를 utf-8로 변환 또는 utf-8을 다른 문자로 변환
        // 3) jschardet : 현재 문자코드가 어떤것인지 확인

        // (니꼬쌤) 코드 작성 방법1. if, else if
        // if(parsed.type === "new_message"){
        //     sockets.forEach((aSocket) => aSocket.send(parsed.payload.toString('utf8'))); 
        // 현재 해당 코드의 문제점은 누군가 메시지를 보내면 모든 socket을 거치기 때문에 중복이 생김
        // }else if(parsed.type === "nickname"){
        //     sockets.forEach((aSocket) => aSocket.send(parsed.payload.toString('utf8'))); 
        // }

        // (니꼬쌤) 코드 작성 방법2. switch
        switch(parsedMessage.type) {
            case "new_message":
                // sockets.forEach((aSocket) => aSocket.send(parsedMessage.payload.toString('utf8')))
                sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${parsedMessage.payload}`)) // ??? 뭐지 왜 .toString('utf8') 없어도 출력 잘되는 거지
                break; // break;가 없으면 첫번째 case가 2번 출력됨
                // ??? app.js, server.js 파일 모두 nickname 코드가 먼저 들어가 있는데 nickname 1번 입력시 2번 출력되는 이유는
            case "nickname":
                socket["nickname"] = parsedMessage.payload;
        }

        // (보리) 코드 작성 방법3. || 
        // if(parsed.type === "new_message" || "nickname"){ // ??? 이 방법으로 작성했을 때 발생 문제가 있을까 // ??? socket["nickname"] = "Anonymous" 이 코드가 추가됐는데, 이걸 반영할 수 있는 코드 수정 방법은 뭘까
        //     sockets.forEach((aSocket) => aSocket.send(parsed.payload.toString('utf8')));
        // }

        // sockets.forEach((aSocket) => aSocket.send(message.toString('utf8'))); // 현재 해당 코드의 문제점은 누군가 메시지를 보내면 모든 socket을 거치기 때문에 중복이 생김
    }); 
    // socket.send("hello"); // 브라우저에 메시지를 보내도록 만듦
});                                
                                   
server.listen(3000, handleListen);
