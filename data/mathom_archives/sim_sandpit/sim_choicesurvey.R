library(tidyverse) #this runs out of memory and crashes. It's bad to fit independent stan models over and over again in a loop. Don't do that.
library(rstan)
library(shinystan)
library(patchwork)
rm(list=ls())

##two factors in comparison difficulty with two levels each: triangle-type same/diff, orientation same/diff.
##So that's three levels of difficulty: none on, one on, both on.
##Let's assume they're just additive and contibute one 'basenoise' each for simplicity, although that's probably not true?

for(basenoise in seq(from=.01, to = .1,length=5)){
for(tolerance in c(0.01,0.05,0.1)){
##set.seed(4);
options(mc.cores = parallel::detectCores())
rstan_options(auto_write = TRUE)

#setup. Goal is just to generate choices according to howes16 for now, but with the possibility of making individual observations harder/easier, esp. ord ones.
calcobs.df = data.frame(trialid=c(),optionid=c(),value=c(),noisesd=c())
ordobs.df = data.frame(trialid=c(),option1=c(),option2=c(),attribute=c(),value=c(),noisesd=c(),tolerance=c())

##sim stim
rawstim.df <- read.csv("demostim.csv")
rawstim.df$trialid=1:nrow(rawstim.df)

## ##diag
## accumulator <- rawstim.df;
## for(i in 1:10)accumulator <- rbind(accumulator,rawstim.df)
## rawstim.df <- accumulator

##add some useful stim info:

rawstim.df$value1 = with(rawstim.df,option1attribute1*option1attribute2)
rawstim.df$value2 = with(rawstim.df,option2attribute1*option2attribute2)
rawstim.df$value3 = with(rawstim.df,option3attribute1*option3attribute2)


##generate the observations you want to use from the raw stim
combineattr <- function(a,b){ #hard assume 2 features
    return(a*b); #appropriate combination rule for areas (h*w) or gambles (p*v)
}

##all calc obs. one per stim, three stim per trial.
for(i in 1:nrow(rawstim.df)){
    for(j in 1:3){
        myattributes <- rawstim.df%>%filter(row_number()==i)%>%select(starts_with(paste0("option",j)))

        calcobs.df = rbind(calcobs.df,data.frame(
                                          trialid=rawstim.df$trialid[i],
                                          optionid=j,
                                          value=combineattr(myattributes[1,1],myattributes[1,2]),
                                          noisesd = basenoise #no variation in calcobs noise levels
                                      )
                           )
    }
}#end populate all calc obs.


##all ord obs.
  for(atrial in 1:nrow(rawstim.df)){
    for(option1 in 2:3){
      for(option2 in 1:(option1-1)){
          for(anattribute in 1:2){
              mynoise <- basenoise;
              shapematches = rawstim.df[atrial,paste0("option",option1,"shape")]==rawstim.df[atrial,paste0("option",option2,"shape")]
              orientationmatches = rawstim.df[atrial,paste0("option",option1,"orientation")]==rawstim.df[atrial,paste0("option",option2,"orientation")]
              if(!shapematches)mynoise <- mynoise+basenoise;#kinda questionable!
#              if(!orientationmatches)mynoise <- mynoise+basenoise;
              
              ordobs.df=rbind(ordobs.df,data.frame(
                                            trialid=atrial,
                                            option1=option1,
                                            option2=option2,
                                            attribute=anattribute,
                                            value=rawstim.df[atrial,paste0("option",option1,"attribute",anattribute)]-
                                                rawstim.df[atrial,paste0("option",option2,"attribute",anattribute)],
                                            noisesd=mynoise,
                                            tolerance=tolerance
                                        )
                              )
          }#for each attribute
      }#end option2
    }#end option1
  }#end for each trial

ordobs.df$ord_status <- with(ordobs.df,ifelse(abs(value)<tolerance,2,ifelse(value<0,1,3)))

datalist = list(
    hm_trials = length(unique(rawstim.df$trialid)),
    hm_options = 3,
    hm_attributes = 2,
    hm_calcobs = nrow(calcobs.df),
    hm_ordobs = nrow(ordobs.df),
    ord_trialid = ordobs.df$trialid,
    ord_option1=ordobs.df$option1,
    ord_option2=ordobs.df$option2,
    ord_attribute=ordobs.df$attribute,
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
                zeros <- rep(0.5,nrow(rawstim.df)*3*2) #trials x options x attributes. Need to consider what counts as a good init value!
                dim(zeros)=c(nrow(rawstim.df),3,2)
                list(est_trial_option_attribute=zeros)
            },
            chains=4,
            control=list(max_treedepth=15))

    save.image(paste0("demofit",basenoise,"noise,",tolerance,"tolerance.RData"))
    rm(fit)
    gc() #fitting multiple stan models in a loop tends to crash R, probably out of memory.
}#end each tolerance
}#end each noise

## mysamples <- as.data.frame(extract(fit, permuted = TRUE))
## source("visresults.R")
## #launch_shinystan(fit)

View("done")
