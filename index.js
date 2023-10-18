var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var util = require('util');
var URL = require('url');
var fs = require('fs');
app.use(express.static('./static'));
var roomtable = {};
var ERROR_ROOM_IS_FULL = 5;
var ERROR_ROOM_IS_EMPTY = 6;
app.ws('/join/*', function(ws, req) {
  var path = req.path.substring(1);
  var pa = path.split("/");
  var roomid = pa[1];
  var userid = pa[2];
  var room = roomtable[roomid];
  if(room==undefined){
    room = [{user:userid,ws:ws}];
    roomtable[roomid]= room;
    var ret = {result:0,join:roomid};
    ws.send(JSON.stringify(ret));
  }else{
    if(room.length==1){
      var ws0 = room[0];
      var newuser = {user:userid,ws:ws}
      room.push(newuser);
      roomtable[roomid] = room;
      var ret = {result:0,msg:'join',id:userid};
      ws0.ws.send(JSON.stringify(ret));
      var retok = {result:0,join:roomid,otherid:ws0.user};
      console.log(retok);
      ws.send(JSON.stringify(retok));
    }else{
      console.log("room is full");
      var ret = {result:ERROR_ROOM_IS_FULL};
      ws.send(JSON.stringify(ret));
      ws.close();
    }
  }
  util.inspect(ws);
  ws.on('message', function(msg) {
    var room = roomtable[roomid];
    if(room&&room.length==2){
      var ws1 = room[0];
      var ws2 = room[1];
      ws1.ws.send(msg);
      ws2.ws.send(msg);
    }else{
      var ret = {result:ERROR_ROOM_IS_EMPTY};
      ws.send(JSON.stringify(ret));
    }
  });
  ws.on('close', function(msg) {
    var room = roomtable[roomid];
    delete(roomtable[roomid]);
    if(room&&room.length==2){
      var ws1 = room[0].ws;
      var ws2 = room[1].ws;
      if(ws==ws1){
        var ret = {result:0,msg:'leave',id:room[1].user};
        room=[room[1]];
        roomtable[roomid]=room;
        ws2.send(JSON.stringify(ret));
      }
      if(ws==ws2){
        var ret = {result:0,msg:'leave',id:room[0].user};
        room=[room[0]];
        roomtable[roomid]=room;
        ws1.send(JSON.stringify(ret));
      }
    }
  });
});
app.listen(30066,function(){
  console.log('server running on 30066')
});


app.get('/rooms',function(req,res){
  var ret = {};
  for(var p in roomtable){
    ret[p]=roomtable[p].length;
  }
  res.send(JSON.stringify(ret));
});

app.get('/rooms2',function(req,res){
  var ra = [];
  for(var p in roomtable){
    ra.push({id:p,count:roomtable[p].length});
  }
  var ret = {result:0,d:ra};
  res.send(JSON.stringify(ret));
});

function hashCode(str){
  var h = 0, off = 0;
  var len = str.length;
  for(var i = 0; i < len; i++){
    h = 31 * h + str.charCodeAt(off++);
  }
  return h;
}



var users = {};
app.get('/adduser',function(req,res){
  var querydata = req.query;
  var id = querydata.id;
  var data = querydata.data;
  var userstr = fs.readFileSync('users.txt','utf-8');
  var nu = eval("("+userstr+")");
  if(!nu[id]){
    nu[id]=data;
    fs.writeFileSync('users.txt', JSON.stringify(nu));
    res.send('0');
  }else{
    res.send('1');
  }
});

app.get('/getusers',function(req,res){
  var userstr = fs.readFileSync('users.txt','utf-8');
  res.send(userstr);
});

var users = {};
function loaduser(){
  var userstr = fs.readFileSync('users.txt','utf-8');
  var nu = eval("("+userstr+")");
  for(var p in nu){
    if(users[p]==undefined){
      users[p]=nu[p];
    }
  }
}


var ERROR_LACK_PARAMETER = 4;
const {login,uploadInfo} = require('./user');
app.get('/login',function(req,res){
  var querydata = req.query;
  var username = querydata.username;
  var password = querydata.password;
  if(username&&password){
    login(username,password,function(ret){
      res.send(JSON.stringify(ret));
    })
  }else{
    var ret = {result:ERROR_LACK_PARAMETER}
    res.send(JSON.stringify(ret));
  }
});

app.get('/uploadInfo',function(req,res){
  var querydata = req.query;
  var userid = parseInt(querydata.id);
  var info = querydata.info;
  if(userid&&info){
    uploadInfo(userid,info,function(ret){
      res.send(JSON.stringify(ret));
    })
  }else{
    var ret = {result:ERROR_LACK_PARAMETER}
    res.send(JSON.stringify(ret));
  }
});


