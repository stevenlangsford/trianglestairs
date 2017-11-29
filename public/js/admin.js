var ppntID = Math.round(Math.random()*10000000);
localStorage.setItem("ppntID",ppntID); //cookie alternative, retrive with localStorage.getItem("ppntID"). Only stores strings. Used in exp.js to tag saved trials.

var dev = false;
var instructionindex = 0;
var instructionlist = ["These are the instructions.","Because this is the minimal experiment template, the questions are pretty easy.","There are only two of them, and they're pretty self explanatory.","You still have to do the demographics questions though.","Ethics and consent too!"]

function nextInstructions(){
    var nextButton = "<button id='nextbutton' onclick='nextInstructions()'>Next</button>"
    document.getElementById("uberdiv").innerHTML="<p>"+instructionlist[instructionindex]+"</br>"+nextButton+"</p>";
    instructionindex++;
    if(instructionindex>=instructionlist.length)demographics()
}

function demographics(){
    document.getElementById("uberdiv").innerHTML="<p>Demographics questions</br><button onclick='startExp()'>Submit</button></p>"
}

function startExp(){
    $.post('/exp',
	   function(data){
	       window.location.replace(data);
	   }
	  );
}

function start(){
    nextInstructions();
}

start();
