library(tidyverse)
library(rstan)
library(shinystan)

rm(list=ls())
source("readData.R")

#replace these with loops
targid =  demographics.df$ppntID[1]
conditionflag = "notimepressure"

pairsdata.df <- filter(pairsdata.df,ppntid==targid)
master_triadsdata.df <- filter(triadsdata.df,ppntID==targid)#Gods, get yourself a case convention. Sheesh.
    if(conditionflag=="timepressure"){ #flagstrings-if combo ugly but convenient to tag saved outputs with the conditionflag.
        triadsdata.df <- filter(master_triadsdata.df,timelimit==2000)#2000 and NA are magic numbers marking timed and untimed. yuk.
    }else{
        triadsdata.df <- filter(master_triadsdata.df,is.na(timelimit))
    }

##IGNORING param est from pairs for now: goes here
my.tolerance = .1
my.calc.noise = .1
my.ord.noise = .1

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
                                                 difference=targdiff
                                             )
                                   )
            }
        }
    }
}#end build ordobs



datalist <- list(
    hm_stim=nrow(calcobs.df),
    calcobs=calcobs.df$value,
    calcobs_noise=my.calc.noise,
    
    hm_ordobs=nrow(ordobs.df),
    ordobs_noise=my.ord.noise,
    tolerance=my.tolerance,
    ordobs_trial=ordobs.df$trial,
    ordobs_option1=ordobs.df$option1,
    ordobs_option2=ordobs.df$option2,
    ordobs_attribute=ordobs.df$attribute,
    ordobs_diff=ordobs.df$difference
)

fit <- stan(file="min.stan",
            data=datalist,
            iter=1000,
            chains=4,
            init=function(){
                initattrs <- rep(1.5,nrow(calcobs.df)*2) #Need to consider what counts as a good init value. targ/comp are 1:2 and 2:1 after scalingfactor.
                dim(initattrs)=c(nrow(calcobs.df),2)
                list(est_option_attribute=initattrs)
            },##Sanity check on these inits: hist(with(triadsdata.df,c(scaled.NS1,scaled.NS2,scaled.NS3,scaled.EW1,scaled.EW2,scaled.EW3)))
            control=list(max_treedepth=15,adapt_delta=.9)
            )

save.image(file="min.RData")
