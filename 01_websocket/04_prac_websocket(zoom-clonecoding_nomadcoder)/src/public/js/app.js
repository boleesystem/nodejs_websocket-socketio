// 유저한테만 보여지는 프론트엔드에 사용되는 app.js

const messageList = document.querySelector("ul");
// const messageForm = document.querySelector("form");
const nicknameForm = document.querySelector("#nickname"); // 닉네임 넣기(home.pug 파일의 form#nickname 부분)
const messageForm = document.querySelector("#message"); // 메시지 넣기(home.pug 파일의 form#message 부분)

// 1. 웹소켓 서버 연결
// var aWebSocket = new WebSocket(url [, protocols]);
const socket = new WebSocket(`ws://${window.location.host}`); // 브라우저에서는 서버에 연결
// app.js에서의 socket은 서버로의 연결을 의미(server.js에서의 socket은 연결된 브라우저를 뜻함)
// 브라우저가 url을 스스로 가져오게 함
// *서버로 접속할 수도 있고, 모바일 등으로도 접속할 수 있도록 설정함

function makeMessage(type, payload){
    const msg = {type, payload};
    return JSON.stringify(msg);
};
// 백엔드는 JavaScript object를 전혀 이해하지 못함
// => 프로그래밍 언어에만 의존하면 안됨(백엔드로 JavaScript object를 보내면 좋지 않음)
// => 이유는? 연결하고 싶은 프론트와 백엔드 서버가 JavaScript 서버일 수도 있고, 다른 언어의 서버일 수 있기 때문임
// * 서버를 JavaScript로 만들었는데 Java를 이용해 서버에 접속하려고 하면 JavaScript object를 Java에 보낼 수 없음
// * 백엔드에 있는 모든 서버는 그 string을 가지고 뭘할지 정하는 거임
// => 왜 object를 string으로 바꿔줘야 하는 거지? 
// * Websocket이 브라우저에 있는 API이기 때문임. 백엔드에서는 다양한 프로그래밍 언어를 사용할 수 있기 때문에 이 API는 어떠한 판단도 하면 안됨

// 2. 백엔드에서 프론트엔드로 메세지 보내기
// 2-2. 메시지 받기
socket.addEventListener("open", () => { // connection이 open일 때 사용하는 listener 등록
    console.log("Connected to Server");
});

// 2-3. socekt에 messgae 이벤트 추가하기
socket.addEventListener("message", (message) => { // 메시지를 받을 때 사용하는 listener 등록
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
    // console.log("New message: ", message.data);
});

// 2-4. socket에 close 이벤트 추가하기
socket.addEventListener("close", () => { // 서버가 오프라인이 됐을 때 사용하는 listener 등록
    console.log("Disconnected to Server"); // 서버의 상태를 브라우저 개발자도구 콘솔에 콘솔로그

});

// // 3. 프론트엔드에서 백엔드로 메시지 보내기
// // 3-1. 메시지 보내기
// setTimeout(() => { // 즉시 실행되지 않게 하기 위해 timeout 사용
//     socket.send("hello from the browser");
// }, 10000);

function handleNickSubmit(event){
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    // socket.send(input.value); // text 전송
    // socket.send({ // 위의 text 전송 코드를 JSON object 전체를 전송하게 코드 수정
    //     type:"nickname",
    //     payload: input.value,
    // });
    socket.send(makeMessage("nickname", input.value)); // 출력값은 {"type":"nickname","payload":"입력값"}
};

function handleSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    // socket.send(input.value); // 프론트엔드에서 백엔드로 보내기
    // input.value = ""; // ??? 비워두는 이유는 // 메시지 보내고 값을 비워줌 그리고 그 메시지는 서버로 감
    socket.send(makeMessage("new_message", input.value)); // 출력값은 {"type":"nickname","payload":"입력값"}
    input.value = "";
};

nicknameForm.addEventListener("submit", handleNickSubmit);
messageForm.addEventListener("submit", handleSubmit);
