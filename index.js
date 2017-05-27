var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var util = require('util');
var URL = require('url');
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
      room.push(ws);
      roomtable[roomid] = room;
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
      ws1.close();
      ws2.close();
    }
  });
});
app.listen(3333);

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
