var fs= require('fs')
var request= require('request')
var mongoose = require('mongoose')
var User = mongoose.model('User')
var Mydoc = mongoose.model('Mydoc')
var Events = mongoose.model('Events')
var muilter = require('../modules/multerUtil');
var entities= require('entities')
var _ = require('underscore')
//multer有single()中的名称必须是表单上传字段的name名称。
var upload=muilter.single('file');   
var xml2js=require('xml2js')
var parser = new xml2js.Parser({attrkey:"_key"})

exports.dataInput = function (req, res) {
  upload(req, res, function (err) {

    if (err) {
      return  console.log(err);
    } 
  //文件信息在req.file或者req.files中显示。

 
  var file = req.file
  // console.log(req)
  fs.readFile(file.path, {encoding:'utf-8'},function (err, data) {
    if (err) throw err;
    var _id_Doc
    var doc = new Mydoc({
      originalName:file.originalname,
      owner:req.session.user._id,
      content:data,
      sequence:req.body.sequence
    })
    doc.save(function(err, mydoc) {
      if (err) {
        console.log(err)

      }
      _id_Doc=mydoc._id

      console.log("文件内容存入了数据库！")

      User.findById(req.session.user._id,function(err,user){
        if(err){console.log(err)
        }
        if (user.mydoc.indexOf(mydoc._id)==-1){
          user.mydoc.push(mydoc._id)
          user.save(function(err,user){
            if (err){
              console.log(err)
            }
          })
        }
      })
   

    var options = {
      method:"POST",
      url: 'http://geocontext.svail.com:8080/txt',
      encoding:"utf-8",
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      form:{req:"parse",txt:""}
    };
    var lines = data.split("\n")
    
    var linexml= String
    
    var linejson ={}

    for (var i = 0; i < lines.length; i++) {
    
    var line = lines[i]

    options.form.txt = line
    
    request(options,  function(error, response, body) {
      // console.log(response)
      if (!error && response.statusCode == 200) {
        var parsedXML=entities.decodeXML(body)

        parsedXML=parsedXML
                          .replace('<?xml version="1.0" encoding="utf-8"?>','')
                      
                          // .replace(/time/g,'<time>')
                          // .replace(/\/<time>/g,'</time>')
                          .replace(/\n/,'')

        console.log(parsedXML)

        linexml= parsedXML.replace(/\d{4}-\d{2}-\d{2}/g,"$& ")

        parser.parseString(linexml,function(err,data){
          if(err){
           
            console.log(err)
          }

        linejson = data
        var mongo_events = new Events({     
          mydoc:_id_Doc,
          xml:linexml,
          json:linejson,
          raw:linexml.replace(/[a-z]|[A-Z]|=|<.+?>|\//g,"")
        })
        mongo_events.save(function(err,data){
          if(err){
            console.log(err)
          }   
          Mydoc.findById(_id_Doc,function(err,doc){
            
            //console.log(JSON.stringify(data))

            doc.events.push(data._id)

            // var _doc=_.extend(doc, {events:events})
            doc.save(function(err,data){
              if(err){console.log('err')}
            })
          })
        })
      })
      }
    });
  };

// 返回个人文档第一页信息

Mydoc
.find({},{_id:0,content:0,_v:0,owner:0})
.exec(function(err, data) {
  if(err){
    console.log(err)
  }
  var results={}
  results['data']=data.slice(0,10)
  results['totalPages']=Math.ceil(data.length/10)
  results['currentPage']=1

  res.json(results)
});
 })

});

})

}