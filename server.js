const express = require("express");
const app = express();
const port = process.env.PORT ? process.env.PORT : 3000;
app.set("json spaces", 3);
app.use(express.json());

const cors = require("cors");
app.use(cors());

const morgan = require("morgan");
app.use(morgan("short"));

// var fs = require('fs');
app.use(express.static("public"));
const path = require("path");

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);

let dbPprefix = properties.get("db.prefix");

let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

console.log(uri);
console.log(dbName);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);


const imagepath = path.join(__dirname,"images");
app.use(express.static(imagepath));

app.param('collectionName', function (req, res, next, collectionName) {
  req.collection = db.collection(collectionName);
  return next();
});

app.get('/', function(req, res, next){
  res.send('Select function, e.g., /collections/products')
});

app.get('/collections/:collectionName', function (req, res, next) {
  req.collection.find({}).toArray(function (err, results) {
    if (err) {
      return next(err);
    }
    if(results.length==0){
      return next();
    }
    else{
    res.send(results);
    }
  });
});

app.put('/collections/:collectionName/:id',function (req,res,next){
  console.log(req.params.id)
  let idd=parseInt(req.params.id);
  req.collection.updateOne({id:idd},
      {$set:req.body},
      {safe:true,multi:false},function(err,result){

          if(err){
              return next(err);
          }
          res.send(result);
      });
});

app.post('/collections/:collectionName',function (req,res,next){
  req.collection.insertOne(req.body,(function(err,results){
      if(err){
          return next(err);
      }
      res.send(result);
  }));
});
 


app.get('/collections/:collectionName/search',function (req,res,next){
  let searchword=req.query.q;
  req.collection.find({subject:
          {$regex:new RegExp(searchword)}}).toArray(function(err,results){
      if(err){
          return next(err);
      }
          res.send(results);
          });

});
app.use(function (req, res) {
  res.status(404).send("No data found");
});

app.listen(port, function () {
  console.log(`App started http://localhost:${port}/`);
});

