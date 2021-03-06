var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var util = require('util');
var URL = require('url');
var fs = require('fs');
app.use(express.static('./static'));
var roomtable = {};
app.ws('/join/*', function(ws, req) {
  var path = req.path.substring(1);
  var pa = path.split("/");
  var roomid = pa[1];
  var room = roomtable[roomid];
  if(room==undefined){
    room = [ws];
    roomtable[roomid]= room;
  }else{
    if(room.length==1){
      var ws0 = room[0];
      room.push(ws);
      roomtable[roomid] = room;
      var ret = {r:0,msg:'join'};
      ws0.send(JSON.stringify(ret));
    }else{
      console.log("room is full");
      var ret = {r:128};
      ws.send(JSON.stringify(ret));
      ws.close();
    }
  }
  util.inspect(ws);
  ws.on('message', function(msg) {
    var room = roomtable[roomid];
    console.log(room.length);
    if(room&&room.length==2){
      var ws1 = room[0];
      var ws2 = room[1];
      ws1.send(msg);
      ws2.send(msg);
    }else{
      var ret = {r:102};
      ws.send(JSON.stringify(ret));
    }
  });
  ws.on('close', function(msg) {
    var room = roomtable[roomid];
    delete(roomtable[roomid]);
    if(room&&room.length==2){
      var ws1 = room[0];
      var ws2 = room[1];
      var ret = {r:0,msg:'leave'};
      if(ws==ws1){
        room=[ws2];
        roomtable[roomid]=room;
        ws2.send(JSON.stringify(ret));
      }
      if(ws==ws2){
        room=[ws1];
        roomtable[roomid]=room;
        ws1.send(JSON.stringify(ret));
      }
    }
  });
});
app.listen(3333,function(){
  loaduser();
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
  var ret = {r:0,d:ra};
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

