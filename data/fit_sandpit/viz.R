library(tidyverse)
library(rstan)
library(patchwork)
rm(list=ls())


load("demofit_allobs.RData")
rm(list=setdiff(ls(),c("responses.df","fit")))
allobs.samples <- as.data.frame(extract(fit,permuted=TRUE))

allobs.simchoices <- allobs.samples%>%select(starts_with("generated_choice"))%>%
    gather(whichtrial,simchoice,1:nrow(responses.df))%>%
    group_by(whichtrial)%>%
    summarize(ones=sum(simchoice==1)/n(), #FFS which options do these numbers refer to? Looks like targ-comp-decoy but how does it know?
              twos=sum(simchoice==2)/n(),
              threes=sum(simchoice==3)/n()
              )

choice.plot <- function(trialid){
    return(ggplot(allobs.simchoices%>%filter(whichtrial==paste0("generated_choice.",trialid))%>%gather(option,endorsement,ones:threes))+
        geom_bar(aes(x=option,y=endorsement,fill=option),stat="identity")+
        theme_bw())
}


est.attr.plot <- function(trialid){
    dotsize = 5
    estattr <- allobs.samples%>%select(c(paste0("est_trial_option_attribute.",trialid,".",1:3,".1"),paste0("est_trial_option_attribute.",trialid,".",1:3,".2")))
    meanest <- estattr%>%summarize_all(mean)
    return(
        ggplot(responses.df[trialid,])+
        geom_point(data=estattr,aes_string(x=paste0("est_trial_option_attribute.",trialid,".1.1"),y=paste0("est_trial_option_attribute.",trialid,".1.2")),color="blue",alpha=.1)+
        geom_point(data=estattr,aes_string(x=paste0("est_trial_option_attribute.",trialid,".2.1"),y=paste0("est_trial_option_attribute.",trialid,".2.2")),color="red",alpha=.1)+
        geom_point(data=estattr,aes_string(x=paste0("est_trial_option_attribute.",trialid,".3.2"),y=paste0("est_trial_option_attribute.",trialid,".3.1")),color="green",alpha=.1)+ #AAAAAAAAH WHHYYYYYYYYY no seriously this could be serious. Trace this back.
        geom_point(aes(x=NS1,y=EW1),color="red",size=dotsize)+
        geom_point(aes(x=NS2,y=EW2),color="blue",size=dotsize)+
        geom_point(aes(x=NS3,y=EW3),color="green",size=dotsize)+        
        geom_point(data=meanest,aes_string(x=paste0("est_trial_option_attribute.",trialid,".1.1"),
                                           y=paste0("est_trial_option_attribute.",trialid,".1.2")),shape=13,size=dotsize,color="blue")+
        geom_point(data=meanest,aes_string(x=paste0("est_trial_option_attribute.",trialid,".2.1"),
                                           y=paste0("est_trial_option_attribute.",trialid,".2.2")),shape=13,size=dotsize,color="red")+
        geom_point(data=meanest,aes_string(x=paste0("est_trial_option_attribute.",trialid,".3.2"), #Seriously. Not ok.
                                           y=paste0("est_trial_option_attribute.",trialid,".3.1")),shape=13,size=dotsize,color="green")+
        theme_bw()
    )    
}
combo.plot <- function(trialid){
    est.attr.plot(trialid)/choice.plot(trialid)
}

for(i in 90:99){x11();print(combo.plot(i))} #this is bs man you're predicting the same size attraction effect at all decoy positions. This smells.
