// //Generic sequence-of-trials
// //If that's all you want, all you need to edit is the makeTrial object and the responseListener. Give maketrial an appropriate constructor that accept the key trial properties, a drawMe function, and something that will hit responseListener.
// //then put a list of trial-property-setter entries in 'stim' and you're golden.

// var trials = [];
//var trialindex = 0;
//var diadindex = 0;
//var maxtrials = 100;//70?

var currentTrial = null; //Ouch. I swear in the original version there was none of this global var bs. Not that including it on mutation is any better. :-(
var currentquestion = null;
function nextTrial(){
    if(blockindex<all_questionblocks.length){
	currentTrial = all_questionblocks[blockindex].currentTrial(); //read by keyboardListener, which waits for responses. Switched away from clickable buttons because response times requested. Note order is important, you need to pull currentTrial and then call runTrial: runTrial draws the question block's currenttrial then increments it.
	currentquestion = all_questionblocks[blockindex].qtitle; // For some unholy reason this is read by keyboardresponselistener to tell if it's recording a response to a comparison trial (the default) or a 'match' trial. The shittyness of this code is getting out of control, even by my standards.
	all_questionblocks[blockindex].runTrial();

    }else{
	$.post("/finish",function(data){window.location.replace(data)});
    }
    // if(trialindex<maxtrials){
    // 	if(Math.random()<.2&&diadindex<trials.length){//about 1 in 5 or until they run out.
    // 	    trials[diadindex].drawme("uberdiv");
    // 	    diadindex++;
    // 	}else{
    // 	shuffle(allmanagers);
    // 	allmanagers[0].nextTrial().drawme("uberdiv");
    // 	    document.getElementById("expfooter").innerHTML="<p>Trial "+(trialindex+1)+" of "+maxtrials; //after trialindex++ so as if 1 indexed.
    // 	}
    // 	trialindex++;
    // }else{
    // 	$.post("/finish",function(data){window.location.replace(data)});
    // }
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

var drawtime = "init";

var keyslive = false; //set to true by triangle draw function: whenever a triangle is drawn, you can react to it. Gods, the spagettification of this code...
function keyboardListener(event) {//all this does is: filter to legal response keys for the current question, and dispatch legal responses to the appropriate question-specific response handler.
    var x = event.key;
     if(!keyslive)return; 
    // keyslive = false; //temp deafness on each keypress would avoid blitzing, but we want reaction times?
    // setTimeout(function(){keyslive=true},1000);

    if(currentquestion=="Do these two triangles match?"){
	if(x=='a'||x=='l'||x=='A'||x=='L'){//legal response keys: space is no longer one of them
	    matchrecordResponse(x);
	}else{
	    console.log("not a response key: "+x);
	}
    }else{//begin default behavior, when currentquestion is not 'do these triangles match'
    if(x=='a'||x=='l'||x=='A'||x=='L'||x==" "){
	keyslive=false; //will turn off responses until the next triangle is drawn: if a triangle is drawn you're in a trial, if not an outro or block-sep screen.
	pairrecordResponse(x);
    }else{
	console.log("Not a response key:"+x);// todo: consider counting the number of bad keypresses? Might be a sensible exclusion criterion? Maybe watch silently this time just to see what the pattern is, or if there even is one.
    }
    }//ends 'default' comparison response behavior.
}
document.addEventListener('keydown', keyboardListener)

function matchrecordResponse(mykey){
    var mystim=JSON.parse(currentTrial.summaryobj()) //Sigh.
    var saveMe = {
	question:currentquestion,
	EW1:mystim.EastWest1,
	EW2:mystim.EastWest2,
	NS1:mystim.NorthSouth1,
	NS2:mystim.NorthSouth2,
	orientation1:currentTrial.triangles[0].orientation,
	orientation2:currentTrial.triangles[1].orientation,
	area1:mystim.area1,
	area2:mystim.area2,
	presentationposition1:mystim.presentation1,
	presentationposition2:mystim.presentation2,
	templatetype1:mystim.templatetype1,
	templatetype2:mystim.templatetype2,
	responsekey:mykey,
	responsemeans: mykey=='a'||mykey=='A' ? "match" : "notmatch", //filtering to only 'a' or 'l' done by keyboardlistener.
	drawtime:drawtime,
	responsetime:Date.now(),
	inspectiontime:Date.now()-drawtime,
	ppntid:localStorage.getItem("ppntID"),
	stimid:mystim.stimid
    }

    console.log(saveMe);
    nextTrial();

    $.post("/matchresponse",{myresponse:JSON.stringify(saveMe)},
	   function(success){
	       console.log(success);//probably 'success', might be an error
	       //Note potential error not handled at all. Hah.
	   }
	  );
    
}

function pairrecordResponse(mykey){//used to pass args, now everything scraped from global var currentStim. Sadface, this smells.
    var mystim=JSON.parse(currentTrial.summaryobj()) //WTF is this bouncing in and out of JSON format? I think there used to be a reason, probably intended to save summaryobj directly to db. Sigh.

    var saveMe = {
	question:currentquestion,
	EW1:mystim.EastWest1,
	EW2:mystim.EastWest2,
	NS1:mystim.NorthSouth1,
	NS2:mystim.NorthSouth2,
	orientation1:currentTrial.triangles[0].orientation,
	orientation2:currentTrial.triangles[1].orientation,
	area1:mystim.area1,
	area2:mystim.area2,
	presentationposition1:mystim.presentation1,
	presentationposition2:mystim.presentation2,
	templatetype1:mystim.templatetype1,
	templatetype2:mystim.templatetype2,

	responsekey:mykey,
//	areachosen: (mystim.presentation_position[positionchosen]==0) ? mystim.area1 : mystim.area2,
//	templatechosen:mystim.roles[mystim.presentation_position[positionchosen]],
	drawtime:drawtime,
	responsetime:Date.now(),
	inspectiontime:Date.now()-drawtime,
	ppntid:localStorage.getItem("ppntID"),
	stimid:mystim.stimid
    }

    //So the deal is: the stim object has a fixed triangle1, triangle2, always in that order, and randomizes left and right when drawing to the screen based on 'presentation position'. Response keys indicate left or right: you need to map this back to which triangle was chosen by checking which triangles were where. Could do this in a data preprocessing step, so long as you remember, but probably best to keep this as close to the drawing code as possible? Anyway this whole process is not very ergonomic, there's probably a better way!
    var positionchosen = mykey=='a'||mykey=='A' ? mystim.presentation1 : mykey=='l'||mykey=='L' ? mystim.presentation2 : 'equal'; //Filtering to only legal responses done in keyboardlistener.
    if(positionchosen!='equal'){
	positionchosen=positionchosen+1; //convert 0,1 to 1,2
	saveMe.areachosen = saveMe["area"+positionchosen]
	saveMe.arearejected = saveMe["area"+(positionchosen%2+1)]
	saveMe.templatechosen = saveMe["templatetype"+positionchosen]
	saveMe.templaterejected = saveMe["templatetype"+(positionchosen%2+1)]
	saveMe.NSchosen = saveMe["NS"+positionchosen]
	saveMe.EWchosen = saveMe["EW"+positionchosen]
	saveMe.NSrejected = saveMe["NS"+(positionchosen%2+1)]
	saveMe.EWrejected = saveMe["EW"+(positionchosen%2+1)]
    }else{ //gotta have consistent fillers for the data download & transfer to R. objs saved to the same db must have the same fields.
	saveMe.areachosen = "equal"
	saveMe.arearejected = "equal"
	saveMe.templatechosen = "equal"
	saveMe.templaterejected = "equal"
	saveMe.NSchosen = "equal"
	saveMe.EWchosen = "equal"
	saveMe.NSrejected = "equal"
	saveMe.EWrejected = "equal"
    }
    
    console.log(saveMe);
    nextTrial();

// //save to db
    	$.post("/pairresponse",{myresponse:JSON.stringify(saveMe)},
	       function(success){
		   console.log(success);//probably 'success', might be an error
		   //Note potential error not handled at all. Hah.
	       }
	      );
}//end pair record response
function recordResponse(positionchosen,stimsummary,stimid){
    var mytrial = allmanagers[0].getcurrent();
    var rolechosen = mytrial.roles[mytrial.presentation_position[positionchosen]]; //means "get the role corresponding to the thing presented at the position clicked."
    //if ppnt chose the target, that's attraction-effectish, move the decoy closer to the target.
    //if ppnt chose the comp, that's similarity-effectish, move the decoy away from the target.
    allmanagers[0].update(rolechosen);

    var mystim =  JSON.parse(stimsummary); //If you'd done this right the first time, stimsummary would be exactly the thing you want to save :-( close but no cigar.
    //make a data-save object:

    var saveMe = {
	template1:mystim.templatetype1,
	template2:mystim.templatetype2,
	template3:mystim.templatetype3,
	NS1:mystim.NorthSouth1,
	NS2:mystim.NorthSouth2,
	NS3:mystim.NorthSouth3,
	EW1:mystim.EastWest1,
	EW2:mystim.EastWest2,
	EW3:mystim.EastWest3,
	area1:mystim.area1,
	area2:mystim.area2,
	area3:mystim.area3,
	role1:mystim.roles[0],
	role2:mystim.roles[1],
	role3:mystim.roles[2],
	position1:mystim.presentation1,
	position2:mystim.presentation2,
	position3:mystim.presentation3,
	decoydistance:mystim.decoydist,
	optionchosen:rolechosen,
	ppntid:localStorage.getItem("ppntID"),
	drawtime:drawtime,
	responsetime:Date.now(),
	inspectiontime:Date.now()-drawtime,
	stimid:mystim.stimid,
	shapeflavor:allmanagers[0].flavor.join("")
     }
//    console.log(saveMe); 
    nextTrial();

//save to db
    	$.post("/response",{myresponse:JSON.stringify(saveMe)},
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
	keyslive = true; //horrible global var use :-(
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


var comparisonpairdrawHTML = "<div><table style='border:solid 3px black; margin:0 auto'>"+//haha, tables. Oh dear.
"<tr><td align='left' class='buttontd'>"+
    "<span class='kbdprompt' id='aside'>This one [A]</span>"+
    "</td>"+
    "<td><canvas id='stimleft' width='"+canvassize/1.5+"' height='"+canvassize/1.5+"'></canvas></td>"+
    "<td><canvas id='stimright' width='"+canvassize/1.5+"' height='"+canvassize/1.5+"'></canvas></td>"+
    "<td align='right' class='buttontd'>"+
    "<span class='kbdprompt' id='lside'>[L] This one</span>"+
    "</td></tr>"+
    "<tr><td colspan='5'>[space] <br/> They're equal</td></tr>"+
    "</table></div>";

var matchpairdrawHTML = "<div><table style='border:solid 3px black; margin:0 auto'>"+//haha, tables. Oh dear.
"<tr><td align='left' class='buttontd'>"+
    "<span class='kbdprompt' id='aside'></span>"+
    "</td>"+
    "<td><canvas id='stimleft' width='"+canvassize/1.5+"' height='"+canvassize/1.5+"'></canvas></td>"+
    "<td><canvas id='stimright' width='"+canvassize/1.5+"' height='"+canvassize/1.5+"'></canvas></td>"+
    "<td align='right' class='buttontd'>"+
    "<span class='kbdprompt' id='lside'></span>"+
    "</td></tr>"+
    "<tr><td colspan='5'>[A]= match <br/> doesn't match = [L]</td></tr>"+
    "</table></div>";


function pairtrialobj(triangles,stimid,drawerHTML){
    this.triangles = triangles;
    this.presentation_position = shuffle([0,1])
    this.hm_rotations=shuffle([0,1,2,3])[0];
    this.stimid = stimid;

    for(var i=0;i<this.hm_rotations;i++){
    	for(var j=0;j<this.triangles.length;j++)this.triangles[j]=this.triangles[j].cloneme().rotate90();//whee
    }

    this.drawme = function(targdiv){ //draw happens in two steps: clear the screen, then draw the trial. Avoids blitzing under the new kbd setup aimed at getting RT.
	document.getElementById(targdiv).innerHTML="+";
	setTimeout(this.oknowactuallydrawme.bind(this,targdiv),1000); //Wow, that's some nasty js scoping horror. check browser consistancy?
    }
    
    this.oknowactuallydrawme = function(targdiv){
	drawtime=Date.now();
	document.getElementById(targdiv).innerHTML = drawerHTML;

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
	
	// setTimeout(function(){
	//     var responsebuttons = document.getElementsByClassName("responsebutton");
	//     for(var i=0;i<responsebuttons.length;i++)responsebuttons[i].disabled=false;
	// },1000)
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

function trialobj(triangles,roles,stimid,decoydist){ //responsible for drawing to screen, including randomization of locations and starting orientation. Also TODO here recording responses.
    this.triangles = triangles;
    this.roles = roles;
    this.presentation_position = shuffle([0,1,2]);
    this.stimid = stimid;
    this.hm_rotations = shuffle([0,1,2,3])[0]; //canonical orientation is tall (N), randomize so NSEW versions all presented.
    this.decoydist = decoydist;
    
    for(var i=0;i<this.hm_rotations;i++){
    	for(var j=0;j<this.triangles.length;j++)this.triangles[j]=this.triangles[j].cloneme().rotate90();//whee
    }

    this.drawme = function(targdiv){
	drawtime=Date.now();//public, visible to response-recording function. Which also records response time when hit, so between them you have total view time.
	document.getElementById(targdiv).innerHTML = "<table style='border:solid 3px black'>"+//haha, tables. Oh dear.
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
							"black"); //colors useful for diag/dev. Could also be used as a fun manipulation to do things to the similarity structure? Could be a fun companion study?
	
	//diag center pointer:
	// var ctx = document.getElementById('stimcanvas').getContext('2d');
	// ctx.fillStyle="black";
	// ctx.fillRect(center_x,center_y,15,15)
	//end diag

	setTimeout(function(){for(var i=0;i<3;i++)document.getElementsByClassName("responsebutton")[i].disabled=false},1000)
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

	return(JSON.stringify(this)); //could mess with this if it's convenient? This seems like a nice conservative way to get everything though.
    }
}

function trialgetter(x1,y1,x2,y2,x3,y3,shapetypes,roles,orientations,stimid,decoydist){
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
    return new trialobj(mytriangles,roles,stimid,decoydist)
		       
}

function pairtrialgetter(x1,y1,x2,y2,template1,template2,stimid,drawHTML){
    var scalefactor = 100;//check consistency with triad trials (converts between 'scale relative to canonical size of 1' and 'canvas pixels')
    x1=x1*scalefactor;
    x2=x2*scalefactor;
    y1=y1*scalefactor;
    y2=y2*scalefactor;
    var mytriangles = [new triangle(x1,y1,template1,shuffle([0,1,2,3])),
		       new triangle(x2,y2,template2,shuffle([0,1,2,3]))]
    return new pairtrialobj(mytriangles,stimid,drawHTML);
		       
}

//MAIN: exp stim setup starts here.

//DIADS
var questionblockobj = function(myquestion){
    this.trials = [];
    this.trialindex = -1;
    //add diad stim (to check template impact)
    this.qtitle = myquestion;

    //STIMGEN VERSION TWO: Walk through templates, but have a fixed number of trials per combo, and make both triangles random between .8 and 1.2?
    var attrmax = 1.2;
    var attrmin = .8;
    
    var templatelist = ["rightangle","equilateral","skew"];
    for(var reps=0;reps<10;reps++){
	for(var i=0;i<templatelist.length;i++){
	    for(var j=0;j<templatelist.length;j++){
		this.trials.push(pairtrialgetter(Math.random()*(attrmax-attrmin)+attrmin,
						 Math.random()*(attrmax-attrmin)+attrmin,
						 Math.random()*(attrmax-attrmin)+attrmin,
						 Math.random()*(attrmax-attrmin)+attrmin,
	    					 templatelist[i],
	    					 templatelist[j],
	    					 "pair"+templatelist[i]+"vs"+templatelist[j]+"_"+reps,
						 myquestion=="Do these two triangles match?" ? matchpairdrawHTML : comparisonpairdrawHTML
						)
	    			);
		
	    }
	}
    }
    
    //STIMGEN VERSION ONE: Walkthrough templates and one set of height/widths, other one fixed at 1:1 reference.
// var templatelist = ["rightangle","equilateral","skew"];
//     var heights = [.5,1.3]//[.9,1,1.1]; //one option size 1, other option this size. 1-1 comparison is important!
//     var widths = [.5,1.3]//[.9,1,1.1];
    
//     for(var i=0;i<templatelist.length;i++){
// 	for(var j=0;j<templatelist.length;j++){
// 	    for(var height1=0;height1<heights.length;height1++){
// 		for(var width1=0;width1<widths.length;width1++){
// 		    //pairtrialgetter args are: x1,y1,x2,y2,template1,template2,stimid
// 		    this.trials.push(pairtrialgetter(1,1,
// 	    					     widths[width1],heights[height1],
// 	    					     templatelist[i],
// 	    					     templatelist[j],
// 	    					     "pair"+templatelist[i]+"vs"+templatelist[j]+"_"+(widths[width1]*heights[height1]/2.0)),
//    						 myquestion=="Do these two triangles match?" ? matchpairdrawHTML : comparisonpairdrawHTML
// 	    			    );
// 		}//width1
// 	    }//height1
// 	}//template j
//     }//template i
//END STIMGEN VERSION ONE
    
    shuffle(this.trials);
    
    this.currentTrial = function(){
	return this.trials[this.trialindex];
    }
    
    this.runTrial = function(){
	if(this.trialindex==-1){ //on first run, draw spacer screen
	    	    document.getElementById("pgtitle").innerHTML="";
	    document.getElementById("uberdiv").innerHTML="<h1>The question in this block is</h1><h2>"+myquestion+"</h2>"+
		"<button onclick='nextTrial()'>Begin</button>";
	    this.trialindex++;
	}
	else if(this.trialindex<this.trials.length){
	    document.getElementById("pgtitle").innerHTML="<h1>"+this.qtitle+"</h1>";
	    document.getElementById("expfooter").innerHTML="<p> "+(Math.floor(this.trialindex/this.trials.length*100))+"% of block "+(blockindex+1)+", "+(all_questionblocks.length-blockindex+" remaining"); //ugh, global vars. Ew.
	    this.trials[this.trialindex].drawme("uberdiv");
	    this.trialindex++;
	}else{
	    blockindex++ ;//ugh, global vars, yuk.
	    nextTrial();
	}
    }
}// questionblockobj
//END DIADS

//Start Triads:
// //possible flavors are:
// var get_trialmanager = function(myflavor,initdist){
//     this.id = "tm"+myflavor.join("");
//     this.flavor = myflavor;
//     this.decoydistance = initdist;
//     this.history = [];
//     this.stepsize = .1;
//     this.getcurrent = function(){
// 	return this.history[this.history.length-1];
//     }
//     this.nextTrial = function(){
// 	var newtrial = trialgetter(1,.5,1,.5,Math.sqrt(this.decoydistance)*1,Math.sqrt(this.decoydistance)*.5,myflavor,['targ','comp','decoy'],['0','1','0'],this.id+"_"+this.history.length,this.decoydistance);
// 	this.history.push(newtrial);
// 	return newtrial;
//     }

//     this.update = function(rolechosen){
// 	//crudest staircase you will ever see, should do a little more due diligence on this, might be a little too crude.
// 	if(rolechosen=="targ"){
// 	    this.decoydistance = Math.min(this.decoydistance+this.stepsize,1); //decoy closer -> more likely to give similarity, promoting comp
// 	}
// 	if(rolechosen=="comp"){
// 	    this.decoydistance = Math.max(this.decoydistance-this.stepsize, .4); //decoy more distant -> more likely to give attraction, promoting targ.
// 	}
// 	if(rolechosen=="decoy"){
// 	    this.decoydistance-=this.stepsize; //stop choosing the decoy you chump.
// 	}
//     }
//     // this.trialhistory = [];
//     // this.distancehistory = [];
//     // this.choicehistory = []; //?    
// }

// var allmanagers = [];
// var flavors = [
//     [0,0,0],
//     [0,0,1],
//     [0,1,0],
//     [1,0,0],
//     [0,1,2]
// ]
// for(var i=0;i<flavors.length;i++){
//     allmanagers.push(new get_trialmanager(flavors[i],.4))
//     allmanagers.push(new get_trialmanager(flavors[i],.9))
// }

//Go!
//shuffle(trials);
//nextTrial();
//End triads

var blockindex = 0;
var all_questionblocks = shuffle([new questionblockobj("Which triangle is taller?"),
				  new questionblockobj("Which triangle is wider?"),
				  new questionblockobj("Which triangle has the largest area?"),
				  new questionblockobj("Do these two triangles match?"), //Drawing html and keyboardlistener behavior change if they detects the exact text of this question :-( If you change it, change it in those places too. I'm so sorry.
				 ]);
nextTrial();

