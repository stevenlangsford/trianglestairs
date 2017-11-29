const express = require('express');
const myParser = require("body-parser");
const ejs = require('ejs');
const app = express();
const pg = require('pg');
const helmet = require('helmet'); //minimal security best practices. Sets HTTP headers to block first-pass vulnerability sniffing and clickjacking stuff.
//See: https://github.com/helmetjs/helmet
//Also: https://expressjs.com/en/advanced/best-practice-security.html

app.set('port', (process.env.PORT || 5000));

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(myParser.urlencoded({extended : true}));
app.use(helmet()); //default settings, can customize here.
app.set('view engine', 'ejs');


 
app.get('/', function (req, res) {
    res.render("pages/index");
   
})

app.get('/run',function(req,res){
    res.render("pages/exp");
});
app.post('/exp',function(req,res){
    //not sure why this needs to bounce to a new route to render, but it does seem to. I need to learn some express!
    return res.status(200).send("/run");    
})

app.get('/done',function(req,res){
    res.render("pages/outro");
});
app.post('/finish',function(req,res){
    return res.status(200).send("/done");//Another instance of the double-bounce to render.
});

app.post('/response',function(req,res){
    //    console.log("I hear:"+req.body.myresponse); //works

    //save the response in db

    var pool = new pg.Pool(
	{connectionString:process.env.DATABASE_URL}
    )    
    // connection using created pool
    pool.connect(function(err, client, done) {
    	client.query('insert into responses values ($1,$2)', //NOTE this assumes table responses exists with cols 'time', 'responseobj' !
		     [Date.now(),
		     req.body.myresponse],
    		     function(err, result){
    			 done();
    			 if (err)
    			 {console.error(err); res.send("Error " + err); } //For now the client just prints the error to the console. What's ideal?
    			 else
    			 { // response.render('pages/db', {results: result.rows});
    			     res.send("success");
    			 }
    		     });//end query
	done()
    });
    // pool shutdown
    pool.end()
});


//db template:
// app.post('/dbquery',function(req,res){
//     var pool = new pg.Pool(
// 	{connectionString:process.env.DATABASE_URL}
//     )    
//     // connection using created pool
//     pool.connect(function(err, client, done) {
//     	client.query('select * from responses', //placeholder query. Assuming 'responses' exists. Remember to sanitize the real thing.
//     		     function(err, result){
//     			 done();
//     			 if (err)
//     			 {console.error(err); res.send("Error " + err); }
//     			 else
//     			 { // response.render('pages/db', {results: result.rows});
//     			     res.send("success");
//     			 }
//     		     });//end query
// 	done()
//     });
//     // pool shutdown
//     pool.end()
    
//     console.log("qmanager"+req.body.qobj);//diag
    
// });


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
