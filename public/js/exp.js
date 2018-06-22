// //Generic sequence-of-trials
// //If that's all you want, all you need to edit is the makeTrial object and the responseListener. Give maketrial an appropriate constructor that accept the key trial properties, a drawMe function, and something that will hit responseListener.
// //then put a list of trial-property-setter entries in 'stim' and you're golden.

// var trials = [];
 var trialindex = 0;

// function responseListener(aresponse){//global so it'll be just sitting here available for the trial objects to use. So, it must accept whatever they're passing.
// //    console.log("responseListener heard: "+aresponse); //diag
//     trials[trialindex].response = aresponse;
//     trials[trialindex].responseTime= Date.now();
    
//     $.post('/response',{myresponse:JSON.stringify(trials[trialindex])},function(success){
//     	console.log(success);//For now server returns the string "success" for success, otherwise error message.
//     });
    
//     //can put this inside the success callback, if the next trial depends on some server-side info.
//     trialindex++; //increment index here at the last possible minute before drawing the next trial, so trials[trialindex] always refers to the current trial.
//     nextTrial();
// }

function nextTrial(){
    if(trialindex<trials.length){
	trials[trialindex].drawme("uberdiv");
    }else{
	$.post("/finish",function(data){window.location.replace(data)});
    }
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
const canvassize = 150;

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

function recordResponse(responseType,stimsummary,stimid){
    //TODO, save response and advance to next trial.

    console.log("got "+responseType+":"+stimid);
    nextTrial();
    // console.log(responseType);//placeholder
    //     console.log(stimsummary);
}

//stim template. Can rotate, stretch height or width, & dilate
function triangle(base,height,templatetype, orientation){
    this.base = base;
    this.height = height;
    this.templatetype = templatetype;    
    this.orientation = orientation; //init triangle is drawn 'vertical', below apply rotations until this is true.

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
    

    this.cloneme = function(){//js is literally satan. Never do anything 'in place' just in case.
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
    
    this.drawme = function(canvas){	
	var leftmost = Math.min(this.x1,this.x2,this.x3);
	var highest = Math.min(this.y1,this.y2,this.y3);
	var rightmost = Math.max(this.x1,this.x2,this.x3);
	var lowest = Math.max(this.y1,this.y2,this.y3);
	var width = rightmost-leftmost;
	var height = lowest-highest;
	
	var shiftx = -leftmost+canvas.width/2-width/2 + (-5+20*Math.random());//center the shape & add jitter 
	var shifty = canvas.height-lowest-canvas.height/2+height/2 + (-5+10*Math.random());

	if (canvas.getContext) {
	    var ctx = canvas.getContext('2d');
	    
	    ctx.beginPath();
	    ctx.moveTo(this.x1+shiftx,this.y1+shifty);
	    ctx.lineTo(this.x2+shiftx,this.y2+shifty);
	    ctx.lineTo(this.x3+shiftx,this.y3+shifty);
	    ctx.fill();
	}
    }
}//end triangle


function trialobj(triangles,roles,stimid){ //responsible for drawing to screen, including randomization of locations and starting orientation. Also TODO here recording responses.
    this.triangles = triangles;
    this.roles = roles;
    this.presentation_position = shuffle([0,1,2]);
    this.stimid = stimid;
    this. hm_rotations = 0;//shuffle([0,1,2,3])[0]; //canonical orientation is tall (N), randomize so NSEW versions all presented.

    for(var i=0;i<this.hm_rotations;i++){
    	for(var j=0;j<this.triangles.length;j++)this.triangles[j]=this.triangles[j].cloneme().rotate90();//whee
    }

    this.drawme = function(targdiv){
	document.getElementById(targdiv).innerHTML="<table style='border:solid 3px black'>"+//haha, tables. Oh dear.
	"<tr><td colspan='2' align='center' class='buttontd'><button onclick=recordResponse('"+this.roles[this.presentation_position[0]]+"','"+this.summarystring()+"','"+this.stimid+"')>This one</button></td></tr>"+
	    "<tr><td colspan='2' align='center'>"+
	    "<canvas id='canvas0"+stimid+"' width='"+canvassize+"' height='"+canvassize+"'></canvas>"+
	    "</td></tr>"+
	    "<tr>"+
	    "<td align='center'>"+"<canvas id='canvas1"+stimid+"' width='"+canvassize+"' height='"+canvassize+"'></canvas>"+"</td>"+
	    "<td align='center'>"+"<canvas id='canvas2"+stimid+"' width='"+canvassize+"' height='"+canvassize+"'></canvas>"+"</td>"+
	    "</tr>"+
	    "<tr><td align='left' class='buttontd'><button onclick=recordResponse('"+this.roles[this.presentation_position[1]]+"','"+this.summarystring()+"','"+this.stimid+"')>This one</button></td> <td align='right' class='buttontd'><button onclick=recordResponse('"+this.roles[this.presentation_position[2]]+"','"+this.summarystring()+"','"+this.stimid+"')>This one</button></td></tr>"+
	    "</table></br>";
	for(var i=0;i<this.presentation_position.length;i++){
	    triangles[this.presentation_position[i]].drawme(document.getElementById('canvas'+i+this.stimid));
	}
    }
    //possibly add this.summarystring(), pass that to recordResponse
    this.summarystring=function(){
	//add some things you might want to inspect that are derived from changeable status vars.
	this.areas = [this.triangles[0].area(), this.triangles[1].area(),this.triangles[2].area()];//you might want to inspect these?
//	this.axislengths = [this.triangles[0].longaxis(),this.triangles[1].longaxis(),this.triangles[2].longaxis()]
//	this.baselengths = [this.triangles[0].base(),this.triangles[1].base(),this.triangles[2].base()];
	return(JSON.stringify(this)); //could mess with this if it's convenient? This seems like a nice conservative way to get everything though.
    }
    
}

function trialgetter(x1,y1,x2,y2,x3,y3,shapetypes,roles,orientations,stimid){
    //triangles,roles,stimid
    var shape_mapping = shuffle(["rightangle","equilateral","skew"])

    var    scalefactor = 100;
    x1=x1*scalefactor;
    x2=x2*scalefactor;
    x3=x3*scalefactor;
    y1=y1*scalefactor;
    y2=y2*scalefactor;
    y3=y3*scalefactor;
    
    var mytriangles = [new triangle(x1,y1,shape_mapping[shapetypes[0]],orientations[0]),
		       new triangle(x2,y2,shape_mapping[shapetypes[1]],orientations[1]),
		       new triangle(x3,y3,shape_mapping[shapetypes[2]],orientations[2])];
    return new trialobj(mytriangles,roles,stimid)
		       
}

//CREATE STIM HERE
var trials = shuffle(
    [trialgetter(1.02167548628636,0.445750742773657,1.02167548628636,0.445750742773657,0.995806085196582,0.434464081886068,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.95shapes000'),trialgetter(1.08911446450723,0.559598057718747,1.08911446450723,0.559598057718747,1.06153747035087,0.545428718433917,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'attraction0.95shapes001'),trialgetter(1.1635618001113,0.568927544191972,1.1635618001113,0.568927544191972,1.13409975731605,0.554521977033637,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.95shapes010'),trialgetter(0.871875336989884,0.478685548072164,0.871875336989884,0.478685548072164,0.849798960395141,0.466564959289154,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.95shapes100'),trialgetter(1.18965398719093,0.677686321368272,1.18965398719093,0.677686321368272,1.1595312754632,0.660526920466667,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'attraction0.95shapes012'),trialgetter(1.05666044981803,0.501571945400457,1.05666044981803,0.501571945400457,1.00243612045291,0.475832927372118,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes000'),trialgetter(1.03830573385171,0.495486288408669,1.03830573385171,0.495486288408669,0.985023307975204,0.470059566226344,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes001'),trialgetter(1.0034351907397,0.516902677421831,1.0034351907397,0.516902677421831,0.951942206130884,0.490376936787683,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes010'),trialgetter(1.11650268390277,0.495579600274791,1.11650268390277,0.495579600274791,1.05920744844713,0.470148089635244,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes100'),trialgetter(0.989963155741409,0.471655543112641,0.989963155741409,0.471655543112641,0.939161511537255,0.447451736183906,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'attraction0.9shapes012'),trialgetter(1.1540814980871,0.516516901970992,1.1540814980871,0.516516901970992,1.06401056789532,0.476205054066475,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.85shapes000'),trialgetter(1.13076223602546,0.628825687792158,1.13076223602546,0.628825687792158,1.04251127056646,0.579748638448758,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'attraction0.85shapes001'),trialgetter(1.0592896940648,0.471705631567773,1.0592896940648,0.471705631567773,0.976616842758263,0.434891104099451,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.85shapes010'),trialgetter(1.12558840255999,0.590983915122862,1.12558840255999,0.590983915122862,1.03774123180151,0.544860247902024,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'attraction0.85shapes100'),trialgetter(0.907197189492565,0.624018083800314,0.907197189492565,0.624018083800314,0.836394482005786,0.575316246575172,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'attraction0.85shapes012'),trialgetter(1.01534641795546,0.605193257898961,1.01534641795546,0.605193257898961,0.990346417955463,0.620470570133511,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes000'),trialgetter(0.924578878718248,0.351781088034877,0.924578878718248,0.351781088034877,0.899578878718248,0.361557359364638,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes001'),trialgetter(1.08611318724977,0.4595480169243,1.08611318724977,0.4595480169243,1.06111318724977,0.470375043259619,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes010'),trialgetter(0.977259458272638,0.593409617086249,0.977259458272638,0.593409617086249,0.952259458272638,0.608988606928016,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes100'),trialgetter(0.953410412020905,0.436245650142978,0.953410412020905,0.436245650142978,0.928410412020905,0.447992762317038,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.025shapes012'),trialgetter(1.13437086261994,0.518153538459794,1.13437086261994,0.518153538459794,1.08437086261994,0.542045435426109,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes000'),trialgetter(1.12925123364171,0.331195142413521,1.12925123364171,0.331195142413521,1.07925123364171,0.346538888711404,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes001'),trialgetter(0.917900642236905,0.413785385590023,0.917900642236905,0.413785385590023,0.867900642236905,0.43762367798508,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes010'),trialgetter(1.0098843689138,0.462434485580164,1.0098843689138,0.462434485580164,0.959884368913795,0.48652251641785,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes100'),trialgetter(1.07239041552843,0.320261798142746,1.07239041552843,0.320261798142746,1.02239041552843,0.335924200356152,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.05shapes012'),trialgetter(0.933625685842378,0.437627351127082,0.933625685842378,0.437627351127082,0.833625685842378,0.490124216154083,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes000'),trialgetter(0.992036756816184,0.543562476282941,0.992036756816184,0.543562476282941,0.892036756816184,0.604497462664331,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes001'),trialgetter(1.19709009697242,0.440324132749087,1.19709009697242,0.440324132749087,1.09709009697242,0.480459772835916,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes010'),trialgetter(0.944749278839104,0.569596663370111,0.944749278839104,0.569596663370111,0.844749278839104,0.63702455915392,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes100'),trialgetter(0.984433603539202,0.634889819519773,0.984433603539202,0.634889819519773,0.884433603539202,0.706674724229314,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.1shapes012'),trialgetter(0.893147692951322,0.606445074680413,0.893147692951322,0.606445074680413,0.743147692951322,0.728852453543151,['0','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes000'),trialgetter(0.868727823546252,0.70636947022519,0.868727823546252,0.70636947022519,0.718727823546252,0.853790256039475,['0','0','1'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes001'),trialgetter(1.01313830106627,0.476831155108506,1.01313830106627,0.476831155108506,0.863138301066268,0.559696986896898,['0','1','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes010'),trialgetter(0.960264447702654,0.588943208228137,0.960264447702654,0.588943208228137,0.810264447702654,0.697971170006166,['1','0','0'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes100'),trialgetter(1.05261690394967,0.482872675703738,1.05261690394967,0.482872675703738,0.902616903949673,0.563118127609876,['0','1','2'],['targ','comp','decoy'],['0','1','0'],'compromise-0.15shapes012')]
)//end shuffle stimlist


nextTrial();
