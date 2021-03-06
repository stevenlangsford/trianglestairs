library(tidyverse)
library(rstan)
library(shinystan)
library(patchwork)
rm(list=ls())
options(mc.cores = parallel::detectCores())
rstan_options(auto_write = TRUE)
##PARAMS
calcnoise = .1 #arbitrary!
ordnoise = .1
tolerance = .1

#setup. Goal is just to generate sim choices for obs stim using howes16 with and without the 'hard comparisons' turned off.
calcobs.df = data.frame(trialid=c(),optionid=c(),value=c(),noisesd=c())
ordobs.df = data.frame(trialid=c(),option1=c(),option2=c(),attribute=c(),value=c(),noisesd=c(),tolerance=c())

## stim

responses.df <- read.csv("../raw_data/responsedata.csv",colClasses=c("shapeflavor"="factor"))
responses.df$trialid = 1:nrow(responses.df) #More than one 'obs' can be associated with each trial.
##convert NS, EW attributes & areas to a stan-friendly scale by dividing everywhere by a constant px-to-stanunits conversion factor
##Scale areas as a proportion of max area, largest area is 1. 1/2w*h<=1 doesn't actually constrain w and h, but here they're in 0-2.

px_to_units=with(responses.df,max(c(area1,area2,area3)))

for(anoption in 1:3){
    responses.df[,paste0("area",anoption)] <- responses.df[,paste0("area",anoption)]/px_to_units
    for(attr in c("NS","EW")){
        responses.df[,paste0(attr,anoption)] <- responses.df[,paste0(attr,anoption)]/sqrt(px_to_units)
    }
}

##all calc obs. one per stim, three stim per trial.
 for(i in 1:nrow(responses.df)){
     for(j in 1:3){
         calcobs.df = rbind(calcobs.df,data.frame(
                                           trialid=responses.df$trialid[i],#Which is surely just i. (links calc and ord obs)
                                           optionid=j,
                                           value=responses.df[i,paste0("area",j)],
                                           noisesd = calcnoise #no variation in noise levels for now, but it's possible.
                                       )
                            )
     }
 }#end populate all calc obs.

## ##all ord obs.
   for(atrial in 1:nrow(responses.df)){
     for(option1 in 2:3){
       for(option2 in 1:(option1-1)){
           for(anattribute in c("EW","NS")){

               ordobs.df=rbind(ordobs.df,data.frame(
                                             trialid=atrial,
                                             option1=option1,
                                             option2=option2,
                                             attribute=anattribute,
                                             value=responses.df[atrial,paste0(anattribute,option1)]-
                                                 responses.df[atrial,paste0(anattribute,option2)],
                                             noisesd=ordnoise,
                                             tolerance=tolerance,
                                             shapematches = responses.df[atrial,paste0("template",option1)]==responses.df[atrial,paste0("template",option2)]              
                                         )
                               )
           }#for each attribute
       }#end option2
     }#end option1
   }#end for each trial
ordobs.df$ord_status <- with(ordobs.df,ifelse(abs(value)<tolerance,2,ifelse(value<0,1,3)))

#--potentially filter ordobs by matchstatus here--
ordobs.df <- filter(ordobs.df,shapematches) #if you're gonna toggle this, also toggle the save filename
##-- end filter --#

 datalist = list(
     hm_trials = length(unique(responses.df$trialid)),
     hm_options = 3,
     hm_attributes = 2,
     hm_calcobs = nrow(calcobs.df),
     hm_ordobs = nrow(ordobs.df),
     ord_trialid = ordobs.df$trialid,
     ord_option1=ordobs.df$option1,
     ord_option2=ordobs.df$option2,
     ord_attribute=as.integer(ordobs.df$attribute), #convert from factor
    ord_value=ordobs.df$ord_status,
    ord_noisesd = ordobs.df$noisesd,
    ord_tolerance = ordobs.df$tolerance,
    calc_trialid = calcobs.df$trialid,
    calc_optionid = calcobs.df$optionid,
    calc_noisesd=calcobs.df$noisesd,
    calc_value=calcobs.df$value)
    

fit <- stan(file="obsinput.stan",
            data=datalist,
            iter=1000,
            init=function(){
                zeros <- rep(0.5,nrow(responses.df)*3*2) #trials x options x attributes. Need to consider what counts as a good init value!
                dim(zeros)=c(nrow(responses.df),3,2)
                list(est_trial_option_attribute=zeros)
            },
            chains=4,
            control=list(max_treedepth=15))

    save.image(paste0("demofit_matchobs.RData"))
##     rm(fit)
##     gc() #fitting multiple stan models in a loop tends to crash R, probably out of memory.
## }#end each tolerance
## }#end each noise

## ## mysamples <- as.data.frame(extract(fit, permuted = TRUE))
## ## source("visresults.R")
## ## #launch_shinystan(fit)

## View("done")
