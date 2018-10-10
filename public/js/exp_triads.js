//embarassing diag hacks:
var verboseresponses = false;//DIAG FLAG used in response listener. False for public-facing version... possibly leave the var in for messing from js console?
var bob; //diag misc holder for things you want to examine from the console. Hi bob.
//exp level setup args:
var timeout_penalty = 5000; //infuriating enforced pause on timeout screen.
var timeout_master_time = 2000; //this value is passed to the constructor of any trialobj objects in time-pressure blocks. The similar-looking timeout_time is the global state var timepressure_loop polls continously to see if the current trial has timed out yet: this value is set by each trialobj when it draws so they can be different.

//global state args (there are more scattered throughout, so sorry)
var trialindex = 0; //refers to trials[], defined (much) later Incremented by nextTrial()
var timeout_time = Infinity; //Trialobj draw resets this for the timpressure loop to reference

function transitionscreen(message){ //has a drawme fn exactly like a trialobj. If you're populating trials[] with more than one block type, whack one of these in between the blocks.

    this.message = message;
    this.drawme = function(targdiv){
	drawtime=Infinity; //switch off any outstanding timeouts.
	document.getElementById(targdiv).innerHTML="<p>"+message+"</p><br/><button onclick='nextTrial()'>Continue</button>";
    }
}

function nextTrial(){
    if(trialindex<trials.length){
	trials[trialindex].drawme("uberdiv");
	trialindex++;
	document.getElementById("expfooter").innerHTML="<p>Trial "+trialindex+" of "+trials.length; //after trialindex++ so as if 1 indexed.
    }else{
	$.post("/finish",function(data){window.location.replace(data)});
    }
}

function timepressure_loop(){
    if(Date.now()-drawtime > timeout_time){ //requires drawtime to be up to date.
	timeout_screen();
    }
    setTimeout(timepressure_loop,10);//interval sets poll rate. Amazingly, recursive timeout is preferred to setInterval according to http://bonsaiden.github.io/JavaScript-Garden/
}

timepressure_loop(); //go ahead and start polling this on page load.

function timeout_screen(){
    drawtime=Infinity; //all timepressure polls will decide Date.now() is less than drawtime+timeout... until a redraw resets drawtime.
	document.getElementById("uberdiv").innerHTML = "<div style='background-color:red;'><h1'>Timeout</h1><p>This is a timed block. For these trials, be as accurate as you can without going over the "+(timeout_master_time/1000)+" second time limit.</p></div>"
	setTimeout(nextTrial,timeout_penalty);
}

// // a trial object should have a drawMe function and a bunch of attributes.
// //the data-getting process in 'dashboard.ejs' & getData routes creates a csv with a col for every attribute, using 'Object.keys' to list all the properties of the object. Assumes a pattern where everything interesting is saved to the trial object, then that is JSONified and saved as a response.
// //Note functions are dropped by JSON.
// //Also note this means you have to be consistent with the things that are added to each trial before they are saved, maybe init with NA values in the constructor.
// function makeTrial(questiontext){
//     this.ppntID = localStorage.getItem("ppntID");
//     this.questiontext = questiontext;
//     this.drawMe = function(targdiv){
// 	this.drawTime = Date.now();
// 	var responses = "<button onclick='responseListener(\"yes\")'>Yes</button><button onclick='responseListener(\"no\")'>No</button>";
// 	document.getElementById(targdiv).innerHTML=
// 	    "<div class='trialdiv'><p>"+this.questiontext+"</br>"+responses+"</p></div>";
//     }
// }



// function shuffle(a) { //via https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
//     var j, x, i;
//     for (i = a.length - 1; i > 0; i--) {
//         j = Math.floor(Math.random() * (i + 1));
//         x = a[i];
//         a[i] = a[j];
//         a[j] = x;
//     }
//     return a;
// }
// //****************************************************************************************************
// //Stimuli
// var stim = shuffle(["Does this question have a correct answer?","What is the correct answer to this question?"]);
// trials = stim.map(function(x){return new makeTrial(x)});

// nextTrial();


//****************************************************************************************************
//housekeeping
const canvassize = 150*3;//roughly three max triangle widths. Which is more than you need 'cause they're in a circle not a line.

function shuffle(a) { //credit SO
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

// function shuffle(a){ // if you want to switch randomization off for testing
//     return a;
// }

function linelength(x1,y1,x2,y2){
    var a = x2-x1;
    var b = y2-y1;
    return Math.sqrt(a*a+b*b)
}

var drawtime = Infinity; //arbitrary init set to a large number so timeout will definitely never trigger before a draw event resets this to now-ish.

function recordResponse(positionchosen,stimsummary,stimid){
    stimsummary = JSON.parse(stimsummary); //from JSON string back into an object. Because trying to return 'this' from the trialobj summary fn was terrifying, easier/safer to pass a string and reconstitute it here, add whatever response-recording attributes you want and then pass to db as an object.

    stimsummary.ppntID = localStorage.getItem("ppntID");//a random number generated (on page load) in admin.js. How reliable is this? Will some people turn off localstorage?
    stimsummary.positionchosen = positionchosen;
    stimsummary.rolechosen = stimsummary.roles[stimsummary.presentation_position[positionchosen]];
    stimsummary.drawtime = drawtime; //public var set by triangle.drawme
    stimsummary.responsetime = Date.now(); //will probably match the time recorded in response db table.
    stimsummary.presentationsequence = trialindex;

    if(verboseresponses){
	bob=stimsummary;//DIAG, embarassing, but convenient to expose to the console. Hi bob.
	console.log("this is position "+positionchosen);
	var codenumber = stimsummary.rolechosen=="targ" ? 1 : stimsummary.rolechosen=="comp" ? 2 : 3;
	console.log(stimsummary.rolechosen+ "ie choice-code number is"+codenumber);
	console.log("that is: "+stimsummary["templatetype"+codenumber]+ " of area "+Math.round(stimsummary["area"+codenumber])+"("+JSON.stringify(stimsummary.triangles[codenumber-1])+")");
	console.log(stimsummary.presentation_position);
	console.log("see bob for details "+bob.stimid);
    }
    else{
	nextTrial();
    }

//save to db
    	$.post("/response",{myresponse:JSON.stringify(stimsummary)},
	       function(success){
		   console.log(success);//probably 'success', might be an error
		   //Note potential error not handled at all. Hah.
	       }
	      );
}

//stim template. Can rotate, stretch height or width, & dilate
function triangle(base,height,templatetype, orientation){
    this.base = base;
    this.height = height;
    this.templatetype = templatetype;    
    this.orientation = parseInt(orientation); //init triangle is drawn 'vertical', below apply rotations until this is true.

    //convert to cords so you can draw the thing.
    this.x1=0;
    //	this.x2 varies by template type:
    this.x3=base;
    this.y1=0;
    this.y2=height;
    this.y3=0;
    
    if(templatetype=="rightangle"){
	this.x2=0;
    }
    else if(templatetype=="equilateral"){
	this.x2=base/2;
    }
    else if(templatetype=="skew"){
	this.x2=base/4;
    }
    else{
	console.log("bad template:"+templatetype+" for "+base+":"+height);
    }

    for(var i=0;i<orientation;i++){
	var newx1=-this.y1; //rot90. Init vals are for N orientation, spin to match requested oriantation.
	var newx2=-this.y2;
	var newx3=-this.y3;
	var newy1=this.x1;
	var newy2=this.x2;
	var newy3=this.x3;

	this.x1=newx1;
	this.x2=newx2;
	this.x3=newx3;
	this.y1=newy1;
	this.y2=newy2;
	this.y3=newy3;
    }

    this.cloneme = function(){//This is probably redundant and useless. But, js is literally satan. Never do anything 'in place' just in case.
	return new triangle(this.base, this.height, this.templatetype,this.orientation);
    }

    this.area = function(){
	//heron's formula, because 'base' and 'height' are visually obvious (i hope?) but annoying in xycords land.
	var a = linelength(this.x1,this.y1,this.x2,this.y2);//linelength defined up top with shuffle, used in a few places
	var b = linelength(this.x2,this.y2,this.x3,this.y3);
	var c = linelength(this.x3,this.y3,this.x1,this.y1);
	var s = (a+b+c)/2;
	return Math.sqrt(s*(s-a)*(s-b)*(s-c));
    }
    
    this.rotate90 = function(){//swaps width & height while preserving similarity properties

	return new triangle(this.base,this.height, this.templatetype,(this.orientation+1)%4);
    }

    this.NorthSouth = function(){
	if(this.orientation==0||this.orientation==2) return this.height;
	else return this.base;
    }
    this.EastWest = function(){
	if(this.orientation==0||this.orientation==2) return this.base;
	else return this.height;
    }

    this.drawoffset_x = function(){
    	var leftmost = Math.min(this.x1,this.x2,this.x3);
    	var rightmost = Math.max(this.x1,this.x2,this.x3);
	
    	if(this.orientation==0) return -this.EastWest()/2;
    	if(this.orientation==2) return this.EastWest()/2;
    	return 0;
    }
    this.drawoffset_y = function(){
    	if(this.orientation==1) return -this.NorthSouth()/2;
    	if(this.orientation==3) return this.NorthSouth()/2;
    	return 0;
    }

    this.leftmost = function(){
	return	Math.min(this.x1,this.x2,this.x3);
    }
    this.lowest = function(){
	return	Math.max(this.y1,this.y2,this.y3);
    }

    this.drawme = function(canvas,shiftx,shifty,color){	
	var leftmost = Math.min(this.x1,this.x2,this.x3);
	var highest = Math.min(this.y1,this.y2,this.y3);
	var rightmost = Math.max(this.x1,this.x2,this.x3);
	var lowest = Math.max(this.y1,this.y2,this.y3);
	var width = rightmost-leftmost;
	var height = lowest-highest;
	
//	var shiftx = -leftmost+canvas.width/2-width/2 + (-5+20*Math.random());//center the shape & add jitter 
//	var shifty = canvas.height-lowest-canvas.height/2+height/2 + (-5+10*Math.random());

	if (canvas.getContext) {
	    var ctx = canvas.getContext('2d');
	    ctx.fillStyle=color;
	    ctx.beginPath();
	    ctx.moveTo(this.x1+shiftx,this.y1+shifty);
	    ctx.lineTo(this.x2+shiftx,this.y2+shifty);
	    ctx.lineTo(this.x3+shiftx,this.y3+shifty);
	    ctx.fill();
	}
    }
}//end triangle

function pairtrialobj(triangles,stimid){
    this.triangles = triangles;
    this.presentation_position = shuffle([0,1])
    this.hm_rotations=shuffle([0,1,2,3])[0];
    this.stimid = stimid;

    for(var i=0;i<this.hm_rotations;i++){
    	for(var j=0;j<this.triangles.length;j++)this.triangles[j]=this.triangles[j].cloneme().rotate90();//whee
    }

    this.drawme = function(targdiv){
	drawtime=Date.now();
	document.getElementById(targdiv).innerHTML = "<table style='border:solid 3px black'>"+//haha, tables. Oh dear.
	"<tr><td align='left' class='buttontd'><button class='responsebutton' onclick=recordResponse('0','"+this.summaryobj()+"','"+this.stimid+"') disabled>This one</button></td>"+
	    "<td><canvas id='stimleft' width='"+canvassize/2+"' height='"+canvassize/2+"'></canvas></td>"+
	    "<td><canvas id='stimright' width='"+canvassize/2+"' height='"+canvassize/2+"'></canvas></td>"+
	    "<td align='right' class='buttontd'><button class='responsebutton' onclick=recordResponse('1','"+this.summaryobj()+"','"+this.stimid+"') disabled>This one</button></td></tr>";

	var leftcanvas = document.getElementById('stimleft');
	var rightcanvas = document.getElementById('stimright');
	var jitter = 10;
	this.triangles[this.presentation_position[0]].drawme(leftcanvas,
							     leftcanvas.width/2-this.triangles[this.presentation_position[0]].leftmost()/2+Math.random()*jitter-jitter/2,
							     leftcanvas.height/2-this.triangles[this.presentation_position[0]].lowest()/2+Math.random()*jitter-jitter/2,
							     "black");
	this.triangles[this.presentation_position[1]].drawme(rightcanvas,
							     rightcanvas.width/2-this.triangles[this.presentation_position[1]].leftmost()/2+Math.random()*jitter-jitter/2,
							     rightcanvas.height/2-this.triangles[this.presentation_position[1]].lowest()/2+Math.random()*jitter-jitter/2,
							     "black");
	window.scrollTo(0,1000);//scroll-to-bottom defensive against small screens where the title may push lowest response buttons out of view. Bad in general, terrible on timed trials. Large screens won't see any difference.
    }

    this.summaryobj = function(){
	//copies the earlier summaryobj for triads so that you can save responses to the same db table. This is kinda dumb, but it's true that you can't mix response formats. Correct solution would be to give pairs their own table!
	this.roles = [this.triangles[this.presentation_position[0]].templatetype,this.triangles[this.presentation_position[1]].templatetype]; //would be targ, comp, decoy in a triad.
	this.area1 = this.triangles[0].area()
	this.area2 = this.triangles[1].area()
	this.area3 = "pairtrial"//this.triangles[2].area()

	this.NorthSouth1 = this.triangles[0].NorthSouth()
	this.NorthSouth2 = this.triangles[1].NorthSouth()
	this.NorthSouth3 = "pairtrial"//this.triangles[2].NorthSouth()

	this.EastWest1 = this.triangles[0].EastWest()
	this.EastWest2 = this.triangles[1].EastWest()
	this.EastWest3 = "pairtrial"//this.triangles[2].EastWest()

	this.orientation1 = this.triangles[0].orientation
	this.orientation2 = this.triangles[1].orientation
	this.orientation3 = "pairtrial"//this.triangles[2].orientation

	this.templatetype1 = this.triangles[0].templatetype
	this.templatetype2 = this.triangles[1].templatetype
	this.templatetype3 ="pairtrial"// this.triangles[2].templatetype

	this.presentation1 = this.presentation_position[0];
	this.presentation2 = this.presentation_position[1];
	this.presentation3 ="pairtrial"// this.presentation_position[2];

	return(JSON.stringify(this)); //could mess with this if it's convenient? This seems like a nice conservative way to get everything though.

	//old pairs summaryobj: didn't match triads one, so only the cols they have in common got saved. Whups.	
	// this.area1 = this.triangles[0].area();
	// this.area2 = this.triangles[1].area();
	// this.template1 = this.triangles[0].templatetype;
	// this.template2 = this.triangles[1].templatetype;
	// this.orientation1 = this.triangles[0].orientation;
	// this.orientation2 = this.triangles[1].orientation;
	// this.presentedonleft = this.presentation_position[0];
	// this.roles = ["pairtrial","pairtrial"]; //this filler makes this summaryobj compatible with the record-response fn for triads.
	// return JSON.stringify(this);
    }
}

function trialobj(triangles,roles,stimid,decoydist,timelimit){ //responsible for drawing to screen, including randomization of locations and starting orientation. Also TODO here recording responses.

    this.triangles = triangles;
    this.roles = roles;
    this.presentation_position = shuffle([0,1,2]);
    this.stimid = stimid;
    this.hm_rotations = shuffle([0,1,2,3])[0]; //canonical orientation is tall (N), randomize so NSEW versions all presented.
    this.decoydist = decoydist;
    this.timelimit = timelimit;
    
    for(var i=0;i<this.hm_rotations;i++){
    	for(var j=0;j<this.triangles.length;j++)this.triangles[j]=this.triangles[j].cloneme().rotate90();//whee
    }

    this.drawme = function(targdiv){
	timeout_time=timelimit; //trial objs are in control of when they want to time out. Infinity for 'never'.
	drawtime=Date.now();//public, visible to response-recording function. Which also records response time when hit, so between them you have total view time.
	document.getElementById(targdiv).innerHTML = "<table style='border:solid 3px "+(this.timelimit < Infinity ? "red" : "black")+"'>"+//haha, tables. Oh dear.
	"<tr><td colspan='2' align='center' class='buttontd'><button class='responsebutton' onclick=recordResponse('2','"+this.summaryobj()+"','"+this.stimid+"') disabled>This one</button></td></tr>"+
	    "<tr><td colspan='2' align='center'><canvas id='stimcanvas' width='"+canvassize+"' height='"+canvassize+"'></canvas></td></tr>"+
	    "<tr><td align='left' class='buttontd'><button class='responsebutton' onclick=recordResponse('1','"+this.summaryobj()+"','"+this.stimid+"') disabled>This one</button></td><td align='right' class='buttontd'><button class='responsebutton' onclick=recordResponse('0','"+this.summaryobj()+"','"+this.stimid+"') disabled>This one</button></td></tr>";
	//old table-based draw:
	// document.getElementById(targdiv).innerHTML="<table style='border:solid 3px black'>"+//haha, tables. Oh dear.
	// "<tr><td colspan='2' align='center' class='buttontd'><button class='responsebutton' onclick=recordResponse('0','"+this.summaryobj()+"','"+this.stimid+"') disabled>This one</button></td></tr>"+
	//     "<tr><td colspan='2' align='center'>"+
	//     "<canvas id='canvas0"+stimid+"' width='"+canvassize+"' height='"+canvassize+"'></canvas>"+
	//     "</td></tr>"+
	//     "<tr>"+
	//     "<td align='center'>"+"<canvas id='canvas1"+stimid+"' width='"+canvassize+"' height='"+canvassize+"'></canvas>"+"</td>"+
	//     "<td align='center'>"+"<canvas id='canvas2"+stimid+"' width='"+canvassize+"' height='"+canvassize+"'></canvas>"+"</td>"+
	//     "</tr>"+
	//     "<tr><td align='left' class='buttontd'><button class='responsebutton' onclick=recordResponse('1','"+this.summaryobj()+"','"+this.stimid+"') disabled>This one</button></td> <td align='right' class='buttontd'><button class='responsebutton' onclick=recordResponse('2','"+this.summaryobj()+"','"+this.stimid+"') disabled>This one</button></td></tr>"+
	//     "</table></br>";

	var d = canvassize/5; //distance apart
	var jitter = 10; //jitter less critical now that there's no clear alignment issue, but might be nice mitigation of possible orientation dist-artifacts.
	var rot_offset = Math.PI;
	var center_x = canvassize/2;
	var center_y = canvassize/2;


	//in polar cords, position1 is (d,0)
	//position 2 is (d, 2pi/3)
	//position 3 is (d, 4pi/3)

	// so pos 1 in rect cords is: d*cos(0),d*sin(0) = (d,0)
	// pos 2 is d*cos(2pi/3), d*sin(2pi/3)
	//pos 3 is d*cos(4pi/3), d*sin(4pi/3)
	

	this.triangles[this.presentation_position[0]].drawme(document.getElementById('stimcanvas'),
							jitter*Math.random()-jitter/2+center_x+this.triangles[this.presentation_position[0]].drawoffset_x()+d,
							jitter*Math.random()-jitter/2+center_y+this.triangles[this.presentation_position[0]].drawoffset_y(),
						       "black");

	this.triangles[this.presentation_position[1]].drawme(document.getElementById('stimcanvas'),
							jitter*Math.random()-jitter/2+center_x+this.triangles[this.presentation_position[1]].drawoffset_x()+d*Math.cos(2.0/3.0*Math.PI),
							jitter*Math.random()-jitter/2+center_y+this.triangles[this.presentation_position[1]].drawoffset_y()+d*Math.sin(2.0/3.0*Math.PI),
						       "black");
	
	this.triangles[this.presentation_position[2]].drawme(document.getElementById('stimcanvas'),
							jitter*Math.random()-jitter/2+center_x+this.triangles[this.presentation_position[2]].drawoffset_x()+d*Math.cos(4.0/3.0*Math.PI),
							jitter*Math.random()-jitter/2+center_y+this.triangles[this.presentation_position[2]].drawoffset_y()+d*Math.sin(4.0/3.0*Math.PI),
							"black"); //colors useful for diag/dev. But not as useful as you might think, really. Could be a fun manipulation to do things to the similarity structure? Meh.
	
	//diag center pointer:
	// var ctx = document.getElementById('stimcanvas').getContext('2d');
	// ctx.fillStyle="black";
	// ctx.fillRect(center_x,center_y,15,15)
	//end diag

	setTimeout(function(){for(var i=0;i<3;i++)document.getElementsByClassName("responsebutton")[i].disabled=false},500)//minimal? how does this affect those timed trials? Made more sense in the untimed blocks...
    }// drawme
    
    //possibly add this.summaryobj(), pass that to recordResponse
    this.summaryobj=function(){
	
	//using 'this' stops you cheating, but really you want the info in the triangles array broken up into cols for convenience. So:
	this.area1 = this.triangles[0].area()
	this.area2 = this.triangles[1].area()
	this.area3 = this.triangles[2].area()

	this.NorthSouth1 = this.triangles[0].NorthSouth()
	this.NorthSouth2 = this.triangles[1].NorthSouth()
	this.NorthSouth3 = this.triangles[2].NorthSouth()

	this.EastWest1 = this.triangles[0].EastWest()
	this.EastWest2 = this.triangles[1].EastWest()
	this.EastWest3 = this.triangles[2].EastWest()

	this.orientation1 = this.triangles[0].orientation
	this.orientation2 = this.triangles[1].orientation
	this.orientation3 = this.triangles[2].orientation

	this.templatetype1 = this.triangles[0].templatetype
	this.templatetype2 = this.triangles[1].templatetype
	this.templatetype3 = this.triangles[2].templatetype

	this.presentation1 = this.presentation_position[0];
	this.presentation2 = this.presentation_position[1];
	this.presentation3 = this.presentation_position[2];

	this.timelimit = this.timelimit;
	return(JSON.stringify(this)); //could mess with this if it's convenient? This seems like a nice conservative way to get everything though.
    }
}

function trialgetter(x1,y1,x2,y2,x3,y3,shapetypes,roles,orientations,stimid,decoydist,timelimit){
    //triangles,roles,stimid
    var shape_mapping = shuffle(["rightangle","equilateral","skew"])

    var scalefactor = 100;
    x1=x1*scalefactor;
    x2=x2*scalefactor;
    x3=x3*scalefactor;
    y1=y1*scalefactor;
    y2=y2*scalefactor;
    y3=y3*scalefactor;
    
    var mytriangles = [new triangle(x1,y1,shape_mapping[shapetypes[0]],orientations[0]),
		       new triangle(x2,y2,shape_mapping[shapetypes[1]],orientations[1]),
		       new triangle(x3,y3,shape_mapping[shapetypes[2]],orientations[2])];
    return new trialobj(mytriangles,roles,stimid,decoydist,timelimit);
		       
}

function pairtrialgetter(x1,y1,x2,y2,template1,template2,stimid){
    var scalefactor = 100;//check consistency with triad trials (converts between 'scale relative to canonical size of 1' and 'canvas pixels')
    x1=x1*scalefactor;
    x2=x2*scalefactor;
    y1=y1*scalefactor;
    y2=y2*scalefactor;
    var mytriangles = [new triangle(x1,y1,template1,shuffle([0,1,2,3])),
		       new triangle(x2,y2,template2,shuffle([0,1,2,3]))]
    return new pairtrialobj(mytriangles,stimid);
		       
}

//MAIN: exp stim setup starts here.

var trials = [];

//add triad stim: generated by stim_setup.R, which contains a description of what these are.
var triads = [];

var timed_block = [trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes000','0.9',timeout_master_time),trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes001','0.9',timeout_master_time),trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes010','0.9',timeout_master_time),trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes100','0.9',timeout_master_time),trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes012','0.9',timeout_master_time),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes000','0.8',timeout_master_time),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes001','0.8',timeout_master_time),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes010','0.8',timeout_master_time),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes100','0.8',timeout_master_time),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes012','0.8',timeout_master_time),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes000','0.7',timeout_master_time),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes001','0.7',timeout_master_time),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes010','0.7',timeout_master_time),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes100','0.7',timeout_master_time),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes012','0.7',timeout_master_time),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes000','-0.025',timeout_master_time),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes001','-0.025',timeout_master_time),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes010','-0.025',timeout_master_time),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes100','-0.025',timeout_master_time),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes012','-0.025',timeout_master_time),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes000','-0.05',timeout_master_time),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes001','-0.05',timeout_master_time),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes010','-0.05',timeout_master_time),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes100','-0.05',timeout_master_time),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes012','-0.05',timeout_master_time),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes000','-0.1',timeout_master_time),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes001','-0.1',timeout_master_time),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes010','-0.1',timeout_master_time),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes100','-0.1',timeout_master_time),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes012','-0.1',timeout_master_time),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes000','-0.15',timeout_master_time),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes001','-0.15',timeout_master_time),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes010','-0.15',timeout_master_time),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes100','-0.15',timeout_master_time),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes012','-0.15',timeout_master_time),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes000','1.1',timeout_master_time),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes001','1.1',timeout_master_time),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes010','1.1',timeout_master_time),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes100','1.1',timeout_master_time),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes012','1.1',timeout_master_time),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes000','1.2',timeout_master_time),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes001','1.2',timeout_master_time),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes010','1.2',timeout_master_time),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes100','1.2',timeout_master_time),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes012','1.2',timeout_master_time),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes000','1.3',timeout_master_time),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes001','1.3',timeout_master_time),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes010','1.3',timeout_master_time),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes100','1.3',timeout_master_time),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes012','1.3',timeout_master_time)]

var untimed_block = [trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes000','0.9',Infinity),trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes001','0.9',Infinity),trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes010','0.9',Infinity),trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes100','0.9',Infinity),trialgetter(1,0.5,1,0.5,0.948683298050514,0.474341649025257,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes012','0.9',Infinity),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes000','0.8',Infinity),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes001','0.8',Infinity),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes010','0.8',Infinity),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes100','0.8',Infinity),trialgetter(1,0.5,1,0.5,0.894427190999916,0.447213595499958,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'attraction0.8shapes012','0.8',Infinity),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes000','0.7',Infinity),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes001','0.7',Infinity),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes010','0.7',Infinity),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes100','0.7',Infinity),trialgetter(1,0.5,1,0.5,0.836660026534076,0.418330013267038,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'attraction0.7shapes012','0.7',Infinity),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes000','-0.025',Infinity),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes001','-0.025',Infinity),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes010','-0.025',Infinity),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes100','-0.025',Infinity),trialgetter(1,0.5,1,0.5,0.975,0.512820512820513,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes012','-0.025',Infinity),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes000','-0.05',Infinity),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes001','-0.05',Infinity),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes010','-0.05',Infinity),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes100','-0.05',Infinity),trialgetter(1,0.5,1,0.5,0.95,0.526315789473684,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes012','-0.05',Infinity),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes000','-0.1',Infinity),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes001','-0.1',Infinity),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes010','-0.1',Infinity),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes100','-0.1',Infinity),trialgetter(1,0.5,1,0.5,0.9,0.555555555555556,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes012','-0.1',Infinity),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes000','-0.15',Infinity),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes001','-0.15',Infinity),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes010','-0.15',Infinity),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes100','-0.15',Infinity),trialgetter(1,0.5,1,0.5,0.85,0.588235294117647,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes012','-0.15',Infinity),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes000','1.1',Infinity),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes001','1.1',Infinity),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes010','1.1',Infinity),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes100','1.1',Infinity),trialgetter(1,0.5,1,0.5,1.04880884817015,0.524404424085076,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'winner1.1shapes012','1.1',Infinity),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes000','1.2',Infinity),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes001','1.2',Infinity),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes010','1.2',Infinity),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes100','1.2',Infinity),trialgetter(1,0.5,1,0.5,1.09544511501033,0.547722557505166,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'winner1.2shapes012','1.2',Infinity),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes000','1.3',Infinity),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes001','1.3',Infinity),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes010','1.3',Infinity),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes100','1.3',Infinity),trialgetter(1,0.5,1,0.5,1.14017542509914,0.570087712549569,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'winner1.3shapes012','1.3',Infinity)]

var timedfirst = Math.random()<.5;
shuffle(timed_block);
shuffle(untimed_block);

if(timedfirst){
    trials.push(new transitionscreen("This is a timed block. Please be as accurate as you can while making your choices within the "+(timeout_master_time/1000)+" second time limit. Trials that time-out will show an annoying reminder screen."));
    for(var i=0;i<timed_block.length;i++){
	trials.push(timed_block[i]);
    }
    trials.push(new transitionscreen("This is a free choice block. There is no time limit. Please choose the largest of the three triangles."));
    for(var i=0;i<untimed_block.length;i++){
	trials.push(untimed_block[i]);
    }
}else{
    trials.push(new transitionscreen("This is a free choice block. There is no time limit. Please choose the largest of the three triangles."));
    for(var i=0;i<untimed_block.length;i++){
	trials.push(untimed_block[i]);
    }
    trials.push(new transitionscreen("This is a timed block. Please be as accurate as you can while making your choices within the "+(timeout_master_time/1000)+" second time limit. Trials that time out will show an annoying reminder screen."));
    for(var i=0;i<timed_block.length;i++){
	trials.push(timed_block[i]);
    }
}

//Go!
nextTrial();
