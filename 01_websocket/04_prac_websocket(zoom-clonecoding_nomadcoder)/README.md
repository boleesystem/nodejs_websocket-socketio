Zoom Clone using NodeJS, WebRTC and Websockets.

- 초기세팅
npm init -y
npm i nodemon -D
git init
npm i @babel/core @babel/cli @babel/node @babel/preset-env -D
touch .gitignore
npm i express pug
npm i ws

- 서버 실행
npm run dev

- nodemon이 특정폴더의 변경 후에는 자동 실행되지 않게 설정
nodemon.json 파일에 "ignore": ["src/public/*"], 추가

- CSS
https://andybrewer.github.io/mvp/﻿

- 파일별 정리
babel : 작성 코드를 일반 Node.js 코드로 컴파일

server.js 파일 : 백엔드에서 구동되는 코드
1) express를 import
2) express 어플리케이션을 구성
3) view engine을 pug로 설정
4) views 디렉토리 설정
5) public 폴더를 유저에게 공개
* 보안상 유저가 쉽게 서버 내 모든 폴더를 들여다 볼 수 없도록 설정(유저가 볼 수 있는 폴더를 따로 지정)

public 파일 : 프론트엔드에서 구동되는 코드
