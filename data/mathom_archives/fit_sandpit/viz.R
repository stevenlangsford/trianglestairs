library(tidyverse)
library(rstan)
library(patchwork)
rm(list=ls())

load("demofit_allobs.RData")
rm(list=setdiff(ls(),c("fit")))
allobs.samples <- as.data.frame(extract(fit,permuted=TRUE))

load("demofit_matchobs.RData")
rm(list=setdiff(ls(),c("fit","allobs.samples","responses.df")))
matchobs.samples <- as.data.frame(extract(fit,permuted=TRUE))

##Begin copy-paste patch for colClasses slip: slip fixed, delete when re-fit 
responses.df <- read.csv("../raw_data/responsedata.csv",colClasses=c("shapeflavor"="factor"))
responses.df$trialid = 1:nrow(responses.df) 
px_to_units=with(responses.df,max(c(area1,area2,area3)))
for(anoption in 1:3){
    responses.df[,paste0("area",anoption)] <- responses.df[,paste0("area",anoption)]/px_to_units
    for(attr in c("NS","EW")){
        responses.df[,paste0(attr,anoption)] <- responses.df[,paste0(attr,anoption)]/sqrt(px_to_units)
    }
}
##end copy paste patch for colClasses slip.

choice.plot <- function(trialid,my.samples){
    my.simchoices <- my.samples%>%select(starts_with("generated_choice"))%>%
    gather(whichtrial,simchoice,1:nrow(responses.df))%>%
    group_by(whichtrial)%>%
    summarize(ones=sum(simchoice==1)/n(), #FFS which options do these numbers refer to? Looks like targ-comp-decoy but how does it know?
              twos=sum(simchoice==2)/n(),
              threes=sum(simchoice==3)/n()
              )

    return(ggplot(my.simchoices%>%filter(whichtrial==paste0("generated_choice.",trialid))%>%gather(option,endorsement,ones:threes))+
        geom_bar(aes(x=option,y=endorsement,fill=option),stat="identity")+
        theme_bw()+scale_fill_discrete(guide=FALSE))
}


est.attr.plot <- function(trialid,my.samples){
    dotsize = 5
    estattr <- my.samples%>%select(c(paste0("est_trial_option_attribute.",trialid,".",1:3,".1"),paste0("est_trial_option_attribute.",trialid,".",1:3,".2")))
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
        theme_bw()+ylab("")+xlab("")#+xlim(c(0,4))+ylim(c(0,4))
    )    
}
combo.plot <- function(trialid){
    (est.attr.plot(trialid,allobs.samples)+est.attr.plot(trialid,matchobs.samples))/(choice.plot(trialid,allobs.samples)+choice.plot(trialid,matchobs.samples))
}

#for(i in c(98)){x11();print( combo.plot(i))}

print(combo.plot(98))
#ggsave(combo.plot(98),file="cherrypicked_noclouds.png")
#98,91,90(
