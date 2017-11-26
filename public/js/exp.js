//Generic sequence-of-trials
//If that's all you want, all you need to edit is the makeTrial object and the responseListener. Give maketrial an appropriate constructor that accept the key trial properties, a drawMe function, and something that will hit responseListener.
//then put a list of trial-property objects in 'stim' and you're golden.

var trials = [];
var trialindex = 0;

function responseListener(aresponse){
    console.log("I hear you "+aresponse);
    nextTrial();
}

function nextTrial(){
    if(trialindex<trials.length){
	trials[trialindex].drawMe("uberdiv");
	trialindex++;
    }else{
	console.log("URDONE");
    }
}

function makeTrial(questiontext){
    this.questiontext = questiontext;
    this.drawMe = function(targdiv){
	var responses = "<button onclick='responseListener(\"yes\")'>Yes</button><button onclick='responseListener(\"no\")'>No</button>";
	document.getElementById(targdiv).innerHTML=
	    "<div class='trialdiv'><p>"+questiontext+"</br>"+responses+"</p></div>";
    }
}

//****************************************************************************************************
//Stimuli
var stim = ["Does this question have a correct answer?","What is the correct answer to this question?"];
trials = stim.map(function(x){return new makeTrial(x)});

nextTrial();
