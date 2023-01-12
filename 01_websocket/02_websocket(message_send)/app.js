const http = require("http"); // 서버 목적 http 모듈 사용(노드js에 내장)
// 스트림 단위로 파일 입출력(fs 모듈 사용) https://blog.naver.com/hj_kim97/222229366122
// 1) 파일을 읽기 위해서는 createReadSteam(path, [options])
// 2) 파일을 쓰기 위해서는 createWriteStream(path, [options])
// 3) 입력과 출력을 한번에 이어주기 위해서는 inputStream.pipe(outputStream)
// 4) 새 폴더(디렉토리)를 만들기 위해서는 mkdir(path[, options], callback), mkdirSync(path[, options])
// 5) 디렉토리 삭제하기 위해서는 rmdir(path, callback), rmdirSync(path)
// 6) 파일 존재 확인을 위해서는 exists(path, callback)
// 7) 파일명 변경하기 위해서는 rename(oldPath, newPath, callback), renameSync(oldPath, newPath)
// 8) 파일을 삭제하기 위해서는 unlink(path, callback), unlinkSync(path)
const fs = require("fs"); // 파일 입출력 목적 fs 모듈 사용(노드js에 내장)
const ws = new require("ws"); // npm i ws

// new 연산자 : 사용자 정의 객체 타입 또는 내장 객체 타입의 인스턴스를 생성 https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/new
// 클래스 : 자동차 설계도, 객체 : 실제 자동차, 인스턴스 : 실제 자동차 중 단 하나
// ??? ({ noServer: true })는 뭐지 : +허준튜터님+ 포트를 여기에서 열지는 않겠다(ws npm 사이트 예제에서 확인 가능)
const wss = new ws.Server({ noServer: true });

// ??? 왜 SetConstructor 쓰는 거지 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/Set
// => 여러개가 붙을 때를 대비해서 Set을 가져왔다고 하는데 용도가 뭐지 => clients가 여러 명일 때 배열로 관리
// const set1 = new Set([1, 2, 3, 4, 5]); +조성훈님+ Set은 중복을 제거하는 효과도 있음!
// console.log(set1.has(1));
// expected output: true
const clients = new Set();

function accept(req, res) {
  // ??? 연결 시에 헤더에 upgrade라는 문자열이 포함되어 있을 때를 하기 위해 한다라는 게 뭔 말이지
  // => HTTP 1.1 (전용) Upgrade 헤더를 사용하여 이미 설정된 클라이언트 / 서버 연결을 다른 프로토콜 (동일한 전송 프로토콜을 통해 )로 업그레이드 할 수 있음
  // 예를 들어 클라이언트가 HTTP 1.1에서 HTTP 2.0으로 연결을 업그레이드하거나 HTTP 또는 HTTPS 연결을 WebSocket으로 업그레이드하는 데 사용할 수 있음
  // 개발자도구 - network - ws - header
  // https://runebook.dev/ko/docs/http/headers/upgrade
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade
  if (
    req.url == "/ws" && // +허준튜터님+ wss(보안 강화 버전임)를 하려면 관련 세팅 더 필요
    req.headers.upgrade &&
    // 소문자로 바꾸기
    req.headers.upgrade.toLowerCase() == "websocket" &&
    // upgrade 위치 찾아주는 정규표현식
    // 해당 문자열.match('찾을 단어') : match()함수는 인자에 포함된 문자를 찾으면 이를 반환함
    req.headers.connection.match(/\bupgrade\b/i)
  ) {
    // ??? .handleUpgrade는 뭐지 : 웹통신 -> 소켓 보냈을 때 헤더가 있는데 upgrade하겠다는 처리
    // ??? 버퍼는 왜 생성하지 => 동영상, 사진 등 바이트 잘라서 보낼 때
    // 버퍼 : 바이트를 저장하는 단위 https://yceffort.kr/2021/10/understanding-of-nodejs-buffer
    // 버퍼 생성 방법 : Buffer.from() / Buffer.alloc() / Buffer.allocUnsafe()
    // Buffer.alloc() : 데이터를 채울 필요가 없는 빈 버퍼를 생성하고 싶을 때 유용
    // 요청을 받으면 소켓의 데이터를 저장하고 버퍼를 생성해 onSocketConnect에 이벤트 핸들러가 생긴다
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect);
  } else if (req.url == "/") {
    // index.html
    // fs.createReadStream : 파일 읽기
    // pipe : stream 간에 read와 write event들을 연결(입력을 출력으로 리다이렉트할 수 있게 해주는 또다른 콘셉트) https://programmingsummaries.tistory.com/363
    // pipe(res) : 리턴안에 넣어서 한 번 더 정확하게 집어주는 역할
    fs.createReadStream("./index.html").pipe(res);
  } else {
    // res.writeHead 와 Location:'/', 은 무엇을 의미? https://www.inflearn.com/questions/5583/res-writehead-%EC%99%80-location-039-039-%EC%9D%80-%EB%AC%B4%EC%97%87%EC%9D%84-%EC%9D%98%EB%AF%B8%ED%95%98%EB%82%98%EC%97%AC
    // writeHead는 http 응답 메시지 헤더를 작성한다는 뜻 // Location: '/'는 어디로 이동할지를 적어주는 것
    // => 종합하면 '/'로 이동해라라는 명령이 됨
    // 404 : page not found
    res.writeHead(404);
    // res.send() : 정보를 돌려보내 주는 가장 기본적인 역할을 수행
    // res.json() : 정보를 돌려보내긴하는데, json 형태로 바꿔서 돌려줌
    // res.end() : 주로 서버가 작동을 안하거나 오류가 있을 경우, 특정 문구를 나타내고 응답을 종료하고자 할 때 사용
    res.end();
  }
}

function onSocketConnect(websocket) {
  // .add() : 어떤 요소를 추가로 선택할 때 사용 https://www.codingfactory.net/10190
  // 클라이언트 하나를 clisents 배열에 넣겠다
  clients.add(websocket);
  console.log(`new connection`);

  websocket.on("message", function (message) {
    // JSON.parse(): JSON 문자열을 JavaScript 객체로 변환
    const obj = JSON.parse(message);

    console.log("message received: ", obj);

    // 각각의 클라이언트에 전달
    // for ...of와 for ...in의 차이점? of는 배열 in은 객체
    // const of는 배열 = ["of", "는", "배열"];
    // const in은 객체 = {원: "in", 투: "은", 쓰리: "객체",};
    for (let client of clients) {
      // send로 클라이언트에 전송
      // JSON.stringify(): JavaScript 객체를 JSON 문자열로 변환 (+조성훈님+ 외우는 방법? string으로 변환)
      client.send(JSON.stringify(obj));
    }
  });

  websocket.on("close", function () {
    console.log(`connection closed`);
    // 배열에서 제거해 쓸데 없는 곳에서 보내는 걸 방지
    clients.delete(websocket);
  });
}

http.createServer(accept).listen(8080);

// // ************* 주석 제거 버전 *************
// const http = require("http");
// const fs = require("fs");
// const ws = new require("ws");

// const wss = new ws.Server({ noServer: true });

// const clients = new Set();

// function accept(req, res) {
//   if (
//     req.url == "/ws" &&
//     req.headers.upgrade &&
//     req.headers.upgrade.toLowerCase() == "websocket" &&
//     req.headers.connection.match(/\bupgrade\b/i)
//   ) {
//     wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect);
//   } else if (req.url == "/") {
//     fs.createReadStream("./index.html").pipe(res);
//   } else {
//     res.writeHead(404);
//     res.end();
//   }
// }

// function onSocketConnect(websocket) {
//   clients.add(websocket);
//   console.log(`new connection`);

//   websocket.on("message", function (message) {
//     const obj = JSON.parse(message);

//     console.log("message received: ", obj);

//     for (let client of clients) {
//       client.send(JSON.stringify(obj));
//     }
//   });

//   websocket.on("close", function () {
//     console.log(`connection closed`);
//     clients.delete(websocket);
//   });
// }

// http.createServer(accept).listen(8080);
