library(tidyverse)
library(rstan)
library(shinystan)
library(patchwork)
rm(list=ls())
load(sample(list.files(pattern=".RData"),1)) #note arbitrary selection



cloudplot <- function(afit,trialnumber){

    mysamples <- as.data.frame(extract(afit,permuted=TRUE))
    
    stim1 = (trialnumber-1)*3+1
    stim2 = (trialnumber-1)*3+2
    stim3 = (trialnumber-1)*3+3

    targ.attr.ests1 <- select(mysamples,starts_with(paste0("est_option_attribute.",stim1,".")))
    names(targ.attr.ests1)=c("a","b")
    targ.value.ests1 <- select(mysamples,paste0("estval.",stim1))
    names(targ.value.ests1)=c("value.est")
    targ.attr.ests2 <- select(mysamples,starts_with(paste0("est_option_attribute.",stim2,".")))
    names(targ.attr.ests2)=c("a","b")
    targ.value.ests2 <- select(mysamples,paste0("estval.",stim2))
    names(targ.value.ests2)=c("value.est")
    targ.attr.ests3 <- select(mysamples,starts_with(paste0("est_option_attribute.",stim3,".")))
    names(targ.attr.ests3)=c("a","b")
    targ.value.ests3 <- select(mysamples,paste0("estval.",stim3))
    names(targ.value.ests3)=c("value.est")
    
    estclouds.plot <- (ggplot(data=NULL,aes(x=a,y=b))+
                       geom_point(data=targ.attr.ests1,color="red",alpha=.1)+
                       geom_point(data=targ.attr.ests2,color="blue",alpha=.1)+
                       geom_point(data=targ.attr.ests3,color="green",alpha=.1)+
                       geom_point(data=calcobs.df[stim1,],color="black",size=6)+
                       geom_point(data=calcobs.df[stim1,],color="red",size=5)+
                       geom_point(data=calcobs.df[stim2,],color="black",size=6)+
                       geom_point(data=calcobs.df[stim2,],color="blue",size=5)+
                       geom_point(data=calcobs.df[stim3,],color="black",size=6)+
                       geom_point(data=calcobs.df[stim3,],color="green",size=5)+
                       theme_bw())
    return(estclouds.plot)
    }

endorsementplot <- function(afit,trialnumber,atitle){
mychoices <- as.data.frame(extract(afit),permuted=TRUE)%>%select(paste0("triad_choice.",trialnumber))
names(mychoices)="mychoice"
mychoices <- mychoices%>%summarize(targ=sum(mychoice==1),comp=sum(mychoice==2),decoy=sum(mychoice==3))%>%gather(rolechosen,endorsements,targ:decoy)
mychoices$rolechosen = ordered(mychoices$rolechosen,levels=c("targ","comp","decoy"))

return(
(ggplot(mychoices,aes(y=endorsements,x=rolechosen,fill=rolechosen))+
 geom_bar(stat="identity")+
 theme_bw()+ggtitle(atitle)+
 scale_fill_manual(values=c("green","red","blue"))+guides(fill=FALSE)) #uh oh, why is this order weird?
       )
}

human.endorsementplot <- function(adf,trialnumber,atitle){
mychoices <- as.data.frame(triadsdata.df[trialnumber,"choicenumber"])
names(mychoices)="mychoice"
mychoices <- mychoices%>%summarize(targ=sum(mychoice==1),comp=sum(mychoice==2),decoy=sum(mychoice==3))%>%gather(rolechosen,endorsements,targ:decoy)
mychoices$rolechosen = ordered(mychoices$rolechosen,levels=c("targ","comp","decoy"))

return(
(ggplot(mychoices,aes(y=endorsements,x=rolechosen,fill=rolechosen))+
 geom_bar(stat="identity")+
 theme_bw()+ggtitle(atitle)+
 scale_fill_manual(values=c("green","red","blue"))+guides(fill=FALSE)) #uh oh, why is this order weird?
       )
}

for(i in sample(1:nrow(triadsdata.df),10)){ #more random selection. Set seed if you want repeats?
    x11();
    print(cloudplot(fit_allords,i)+
          endorsementplot(fit_allords,i,"allords")+
          endorsementplot(fit_sansords,i,"sansords")+
          endorsementplot(fit_matchords,i,"matchsords")+
          human.endorsementplot(triads.df,i,"this_human")
          )
}
