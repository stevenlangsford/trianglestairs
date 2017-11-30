//Generic sequence-of-trials
//If that's all you want, all you need to edit is the makeTrial object and the responseListener. Give maketrial an appropriate constructor that accept the key trial properties, a drawMe function, and something that will hit responseListener.
//then put a list of trial-property-setter entries in 'stim' and you're golden.

var trials = [];
var trialindex = 0;

function responseListener(aresponse){//global so it'll be just sitting here available for the trial objects to use. So, it must accept whatever they're passing.
//    console.log("responseListener heard: "+aresponse); //diag
    trials[trialindex].response = aresponse;
    trials[trialindex].responseTime= Date.now();
    
    $.post('/response',{myresponse:JSON.stringify(trials[trialindex])},function(success){
    	console.log(success);//For now server returns the string "success" for success, otherwise error message.
    });
    
    //can put this inside the success callback, if the next trial depends on some server-side info.
    trialindex++; //increment index here at the last possible minute before drawing the next trial, so trials[trialindex] always refers to the current trial.
    nextTrial();
}

function nextTrial(){
    if(trialindex<trials.length){
	trials[trialindex].drawMe("uberdiv");
    }else{
	$.post("/finish",function(data){window.location.replace(data)});
    }
}

// a trial object should: drawMe and record draw time. Record a response and a response time. Be saveable and restoreable.
function makeTrial(questiontext){
    this.ppntID = localStorage.getItem("ppntID");
    this.questiontext = questiontext;
    this.drawMe = function(targdiv){
	this.drawTime = Date.now();
	var responses = "<button onclick='responseListener(\"yes\")'>Yes</button><button onclick='responseListener(\"no\")'>No</button>";
	document.getElementById(targdiv).innerHTML=
	    "<div class='trialdiv'><p>"+this.questiontext+"</br>"+responses+"</p></div>";
    }
    this.csvHeaders = ["ppntID","questiontext","drawTime","responseTime","response"];// dashboard.ejs assumes these exist (with these exact names) when generating responses csv.
}



function shuffle(a) { //via https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
//****************************************************************************************************
//Stimuli
var stim = shuffle(["Does this question have a correct answer?","What is the correct answer to this question?"]);
trials = stim.map(function(x){return new makeTrial(x)});

nextTrial();
