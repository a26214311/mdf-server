var MongoClient = require('mongodb').MongoClient;
var mongourl = "mongodb://192.168.17.236:27050/db_game_server"
var path = require('path');
var request = require("request");
var fs = require('fs');


var udb;
initDB();
function initDB(){
  MongoClient.connect(mongourl, function(err, db) {
    udb=db;
  });
}

var ERROR_DB_ERROR=1;
var ERROR_WRONG_PWD=2;
var ERROR_NO_USER_FOUND=3;


function login(username,password,callback){
  var cl_user = udb.collection('cl_user');
  var query = {username:username};
  var now = new Date().getTime();
  cl_user.find(query).limit(1).toArray(function(err,list){
    console.log(33333333333)
    if(err){
      console.log('db err'+err);
    }else if(list.length==0){
      var cl_idx = udb.collection('cl_idx');
      cl_idx.findAndModify({'_id':'idx'},[],{ '$inc': {d:1}},[],function(err,data){
        if(err){
          console.log(err);
        }else{
          if(data.value){
            console.log(data.value);
            var id = data.value.d;
            cl_user.insert({'_id':id,username:username,password:password,info:"",ts:now,regts:now},function(){
              callback({r:0,id:id,info:""});
            });
          }else{
            var initid = 1234;
            var init = {'_id':'idx',d:initid};
            cl_idx.insert(init,function(err,data2){
              callback({r:0,id:initid,info:""});
            })
          }
        }
      })
    }else{
      var value = list[0];
      if(value.password==password){
        var id = value._id;
        var info = value.info;
        callback({r:0,id:id,info:info});
      }else{
        callback({r:ERROR_WRONG_PWD});
      }
    }
  });
}

function uploadInfo(userid,info,callback){
  var cl_user = udb.collection('cl_user');
  var query = {'_id':userid};
  cl_user.find(query).limit(1).toArray(function(err,list){
    if(err){
      callback({r:ERROR_DB_ERROR});
    }else if(list.length==0){
      callback({r:ERROR_NO_USER_FOUND});
    }else{
      var value = list[0];
      if(info=='get'){
        callback({r:0,d:value.info});
      }else{
        cl_user.updateOne({'_id':userid},{'$set':{info:info}},function(err,result){
          callback({r:0,d:info});
        })
      }
    }
  });
}

setTimeout(function(){
  // login('u4','p3',function(r){
  //   console.log(r);
  //   uploadInfo(12327,'get',function(r2){
  //     console.log(r2)
  //   })
  // });
},1000)

module.exports={
  login,
  uploadInfo
}


