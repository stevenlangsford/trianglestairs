library(tidyverse)
library(rstan)
library(shinystan)

rm(list=ls()); gc();
options(mc.cores = parallel::detectCores())
rstan_options(auto_write = TRUE)

source("readData.R")

targidlist= demographics.df$ppntID #pulled out and named so that you can rm-everything-except-loop-vars (?)
conditionflaglist = c("notimepressure","timepressure") 

for(targid in targidlist){#don't forget to do exclusions first
for(conditionflag in conditionflaglist){
    source("readData.R")
    print("this run is:")
    print(targid) #useful to have in the output stream if there's an error somewhere
    print(conditionflag)

pairsdata.df <- filter(pairsdata.df,ppntid==targid)
master_triadsdata.df <- filter(triadsdata.df,ppntID==targid)#Gods, get yourself a case convention. Sheesh.
    if(conditionflag=="timepressure"){ #flagstrings-if combo ugly but convenient to tag saved outputs with the conditionflag.
        triadsdata.df <- filter(master_triadsdata.df,timelimit=="2000") #these 'magic values' for time conditions set in readData.
    }else{
        triadsdata.df <- filter(master_triadsdata.df,timelimit=="selfpaced")
    }

if(nrow(triadsdata.df)<10){#Inclusion criterion by accuracy should take care of this, but it doesn't exist yet...
    print(paste("SKIPPED ",targid,conditionflag,"not enough data"))
    next;
}
##pairs: est ppnt noise and tolerance
##step one: get the information the model needs out of the saved data

## model wants pairs choice coded as 1,2, or 3 meaning area1 {<,=,>} area2
choicecoding <- function(rowid){
    with(pairsdata.df[rowid,],{
        if(responsekey==' '){return(2)};# equal. No dramas
        if(responsekey=='a'){
            ##ppnt chose option presented on the left.
            ##if left option is area1, that means 1>2, coded as "choice = 3"
            ##if left option is area2, that means 1<2, coded as "choice = 1"
            if(presentationposition1==0){
                return(3)
            }else{
                return(1)
            }
        }#end if chose left option
        if(responsekey=='l'){
            ##ppnt chose option presented on the right.
            ##if right option is area1, that means 1>2, coded as "choice = 3"
            ##if right option is area2, that means 1<2, coded as "choice = 1"
            if(presentationposition2==0){
                return(3)
            }else{
                return(1)
            }
        }#end if chose right option
    })#end with(targetrow,{dostuff})
}#end choicecoding
pairsdata.df$choice <- sapply(1:nrow(pairsdata.df),choicecoding)#Quite a convoluted process... but seems like the most readable salvage of the awkward data-save format? What would be the cleanest way to randomize L-R and also get clean access to meaning of response button?

scalingconstant = 2500 #converts areas in px to stan-friendly numbers around 1.
pairsdata.df <- pairsdata.df%>%mutate(
                                   diff=((area1-area2)/scalingconstant) #If you're going to convert units, make sure everything is on commensurable scales, ok? For now you're just dividing everything by a constant, that's legit, right?
                               )

datalist_pairs <- list(
    N=nrow(pairsdata.df),
    diff = pairsdata.df$diff,
    choice = pairsdata.df$choice
)

fit <- stan(file="seepairs_getests.stan",
            data=datalist_pairs,
            iter=1000,
            chains=4
            )

pairsamples <- as.data.frame(rstan::extract(fit,permuted=TRUE))

#Please play around with fixed values of these to see what happens!
my.tolerance = mean(pairsamples$tolerance) #underwhelemed with the mean as a summary. They're both constrained > 0, so dists likely right skewed. Inspect!
my.calc.noise = mean(pairsamples$sigma)
my.ord.noise = mean(pairsamples$sigma) #hmm, committed to same level as calc noise? Meaning in the model is a bit different, not totally clear why these should be the same number. Maybe explore fixing a range of arbitrary values just to see what happens.

##End paramest from pairs
#begin fun with triads.

calcobs.df <- data.frame(a=c(),b=c(),value=c(),trial=c()) #each row is an option now, following min.R/min.stan format.
for(arow in 1:nrow(triadsdata.df)){
    calcobs.df <- rbind(calcobs.df,with(triadsdata.df[arow,],data.frame(
                                         a=scaled.NS1,
                                         b=scaled.EW1,
                                         value=scaled.area1,
                                         trial=arow)))

    calcobs.df <- rbind(calcobs.df,with(triadsdata.df[arow,],data.frame(
                                         a=scaled.NS2,
                                         b=scaled.EW2,
                                         value=scaled.area2,
                                         trial=arow)))

    calcobs.df <- rbind(calcobs.df,with(triadsdata.df[arow,],data.frame(
                                         a=scaled.NS3,
                                         b=scaled.EW3,
                                         value=scaled.area3,
                                         trial=arow)))
}#end build calcobs.


ordobs.df <- data.frame()
for(atrial in 1:nrow(triadsdata.df)){
    for(anattribute in 1:2){
        for(option1 in 2:3){#'3' is up to stim per trial
            for(option2 in 1:(option1-1)){
                matchstatus <- triadsdata.df[atrial,paste0("templatetype",option1)]==triadsdata.df[atrial,paste0("templatetype",option2)]
                targattrs=calcobs.df%>%
                    filter(trial==atrial)%>%
                    select(c("a","b")[anattribute])%>%
                    unlist%>%as.numeric

                targdiff=targattrs[option1]-targattrs[option2]
                
                ordobs.df <- rbind(ordobs.df,data.frame(
                                                 trial=atrial,
                                                 option1=option1,
                                                 option2=option2,
                                                 attribute=anattribute,
                                                 difference=targdiff,
                                                 matchstatus=matchstatus
                                             )
                                   )
            }
        }
    }
}#end build ordobs



datalist_allords <- list(
    hm_stim=nrow(calcobs.df),
    calcobs=calcobs.df$value,
    calcobs_noise=my.calc.noise,
    trial=calcobs.df$trial,
    
    hm_ordobs=nrow(ordobs.df),
    ordobs_noise=my.ord.noise,
    tolerance=my.tolerance,
    ordobs_trial=ordobs.df$trial,
    ordobs_option1=ordobs.df$option1,
    ordobs_option2=ordobs.df$option2,
    ordobs_attribute=ordobs.df$attribute,
    ordobs_diff=ordobs.df$difference
)

fit_allords <- stan(file="min.stan",
            data=datalist_allords,
            iter=1000,
            chains=4,
            init=function(){
                initattrs <- rep(1.5,nrow(calcobs.df)*2) #Need to consider what counts as a good init value. targ/comp are 1:2 and 2:1 after scalingfactor.
                dim(initattrs)=c(nrow(calcobs.df),2)
                list(est_option_attribute=initattrs)
            },##Sanity check on these inits: hist(with(triadsdata.df,c(scaled.NS1,scaled.NS2,scaled.NS3,scaled.EW1,scaled.EW2,scaled.EW3)))
            control=list(max_treedepth=15,adapt_delta=.9)
            )

match_ordobs.df <- ordobs.df%>%filter(matchstatus==TRUE)
datalist_matchords <- list(
    hm_stim=nrow(calcobs.df),
    calcobs=calcobs.df$value,
    calcobs_noise=my.calc.noise,
    trial=calcobs.df$trial,
    
    hm_ordobs=nrow(match_ordobs.df),
    ordobs_noise=my.ord.noise,
    tolerance=my.tolerance,
    ordobs_trial=match_ordobs.df$trial,
    ordobs_option1=match_ordobs.df$option1,
    ordobs_option2=match_ordobs.df$option2,
    ordobs_attribute=match_ordobs.df$attribute,
    ordobs_diff=match_ordobs.df$difference
)

fit_matchords <- stan(file="min.stan",
            data=datalist_matchords,
            iter=1000,
            chains=4,
            init=function(){
                initattrs <- rep(1.5,nrow(calcobs.df)*2) #Need to consider what counts as a good init value. targ/comp are 1:2 and 2:1 after scalingfactor.
                dim(initattrs)=c(nrow(calcobs.df),2)
                list(est_option_attribute=initattrs)
            },##Sanity check on these inits: hist(with(triadsdata.df,c(scaled.NS1,scaled.NS2,scaled.NS3,scaled.EW1,scaled.EW2,scaled.EW3)))
            control=list(max_treedepth=15,adapt_delta=.9)
            )


datalist_sansords <- list(
    hm_stim=nrow(calcobs.df),
    calcobs=calcobs.df$value,
    calcobs_noise=my.calc.noise,
    trial=calcobs.df$trial
)

fit_sansords <- stan(file="min_sansords.stan",
            data=datalist_sansords,
            iter=1000,
            chains=4,
            init=function(){
                initattrs <- rep(1.5,nrow(calcobs.df)*2) #Need to consider what counts as a good init value. targ/comp are 1:2 and 2:1 after scalingfactor.
                dim(initattrs)=c(nrow(calcobs.df),2)
                list(est_option_attribute=initattrs)
            },##Sanity check on these inits: hist(with(triadsdata.df,c(scaled.NS1,scaled.NS2,scaled.NS3,scaled.EW1,scaled.EW2,scaled.EW3)))
            control=list(max_treedepth=15,adapt_delta=.9)
            )

    save.image(file=paste0(targid,conditionflag,"fit.RData"))
    rm(list=setdiff(ls(),c("conditionflag","targid","targidlist","conditionflaglist"))); gc();#fitting stan models in a loop is a memory hazard.
}#conditionflag
}#ppntid
