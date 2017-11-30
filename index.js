const express = require('express');
const myParser = require("body-parser");
const ejs = require('ejs');
const app = express();
const pg = require('pg');
const json2csv = require('json2csv');
const helmet = require('helmet'); //minimal security best practices. Sets HTTP headers to block first-pass vulnerability sniffing and clickjacking stuff.
//See: https://github.com/helmetjs/helmet
//Also: https://expressjs.com/en/advanced/best-practice-security.html


//App settings:
app.set('port', (process.env.PORT || 5000));

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(myParser.urlencoded({extended : true}));
app.use(helmet()); //default settings, can customize here.
app.set('view engine', 'ejs');

//local helper functions
// function requireLogin (request, response, next) {
//     if (!request.session.user) {
// 	response.redirect('/');//should set a 'you bounced' setting and goto the login page:TODO
//     } else {
// 	next();
//     }
// };

//routes
//participant-facing routes, including index.
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


app.post('/demographics',function(req,res){
//save the response in db
    var pool = new pg.Pool(
	{connectionString:process.env.DATABASE_URL}
    )    
    // connection using created pool
    pool.connect(function(err, client, done) {
    	client.query('insert into demographics values ($1, $2)', //Probably a crime to save a multi-value objs in one 'info' col. Oh well.
		     [Date.now(),
		     req.body.demographics],
    		     function(err, result){
    			 if (err)
    			 {console.error(err); res.send("Error " + err); } //For now the client just prints the error to the console. What's ideal?
    			 else
    			 { // response.render('pages/db', {results: result.rows});
    			     res.send("success");
    			 }
    		     });//end query
	done();
    });
    // pool shutdown
    pool.end()
});


app.post('/response',function(req,res){
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
    			 if (err)
    			 {console.error(err); res.send("Error " + err); } //For now the client just prints the error to the console. What's ideal?
    			 else
    			 { // response.render('pages/db', {results: result.rows});
    			     res.send("success");
    			 }
    		     });//end query
	done();
    });
    // pool shutdown
    pool.end()
});


//experimenter-facing routes: login, see the data and usage stats.

app.get("/getresponses",function(req,res){
    var pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
    pool.connect(function(err,client,done){
	client.query('select * from responses',function(err,result){
	    if(err){
		{console.error(err); res.send("Error "+err);}
		}else{
		    //TODO do something sensible if there are no results!
		    var fields = Object.keys(JSON.parse(result.rows[0].responseobj));
		    var responses = [];
		    	   for(var i=0;i<result.rowCount;i++){
			       responses.push(JSON.parse(result.rows[i].responseobj));
			   }

		    var response_csv = json2csv({data: responses, fields:fields});
		    res.attachment("responsedata.csv");
		    res.send(response_csv);
		}
	});//end query
    });
    pool.end();    
});


//should collapse this and getresponses into one getData and pass it the target table name? Two issues with that, differing col names in the db and getting file-save prompts from the client page.
app.get("/getdemographics",function(req,res){
    var pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
    pool.connect(function(err,client,done){
	client.query('select * from demographics',function(err,result){
	    if(err){
		{console.error(err); res.send("Error "+err);}
		}else{
		    //TODO do something sensible if there are no results!
		    var fields = Object.keys(JSON.parse(result.rows[0].demoobj));
		    var responses = [];
		    	   for(var i=0;i<result.rowCount;i++){
			       responses.push(JSON.parse(result.rows[i].demoobj));
			   }
		    var response_csv = json2csv({data: responses, fields:fields});
		    res.attachment("demographicsdata.csv");
		    res.send(response_csv);
		}
	});//end query
    });
    pool.end();    
});

app.get("/dashboard",function(req,res){
    res.render('pages/dashboard');
});
// app.post('/loginhandler',function(req,res){
// //save the response in db
//     var pool = new pg.Pool(
// 	{connectionString:process.env.DATABASE_URL}
//     )    
//     // connection using created pool
//     pool.connect(function(err, client, done) {
//     	client.query('select * from users where id=$1',
// 		     [],
//     		     function(err, result){
//     			 done();
//     			 if (err)
//     			 {console.error(err); res.send("Error " + err); }
//     			 else
//     			 { // response.render('pages/db', {results: result.rows});
// 			     if(result.rowCount==0){
// 				 request.session.loginbounce=true;
// 				 response.redirect("/"); //should go to login page
//   				 return;
//   			     }
//   			     request.session.pwdmatch=result.rows[0].password==request.body.loginpwd;
// 			     if(result.rows[0].password==request.body.loginpwd){
// 				 //login success.
// 			     }else{
// 				 //login failure.
// 			     }
			     
//     			 }
//     		     });//end query
// 	done()
//     });
//     // pool shutdown
//     pool.end()
// });


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
