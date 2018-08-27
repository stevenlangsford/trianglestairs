library(tidyverse)
library(rstan)
library(shinystan)
library(patchwork)

rm(list=ls())

for(targdata in list.files(pattern=".*RData")){
dataname = strsplit(targdata,".RData")[1]
load(targdata)
dir.create(paste0("trialplots_",dataname))
targdir <- paste0("trialplots_",dataname)

mysamples <- as.data.frame(extract(fit, permuted = TRUE))

trialplot <- function(trialid){ #assumes mysamples and rawstim.df visible.
    opt1.df <- data.frame(x=mysamples[,paste0("est_trial_option_attribute.",trialid,".1.1")],y=mysamples[,paste0("est_trial_option_attribute.",trialid,".1.2")])
    opt2.df <- data.frame(x=mysamples[,paste0("est_trial_option_attribute.",trialid,".2.1")],y=mysamples[,paste0("est_trial_option_attribute.",trialid,".2.2")])
    opt3.df <- data.frame(x=mysamples[,paste0("est_trial_option_attribute.",trialid,".3.1")],y=mysamples[,paste0("est_trial_option_attribute.",trialid,".3.2")])


    attribute.plot <- ggplot(data=data.frame(),aes(x=x,y=y))+geom_point(data=opt1.df,aes(color="1"),alpha=.2)+
        geom_point(data=opt2.df,aes(color="2"),alpha=.2)+
        geom_point(data=opt3.df,aes(color="3"),alpha=.2)+
        geom_point(data=rawstim.df[trialid,], aes(x=option1attribute1,y=option1attribute2,fill="1",shape="1"),color="black",pch=21,size=5)+
        geom_point(data=rawstim.df[trialid,], aes(x=option2attribute1,y=option2attribute2,fill="2",shape="2"),color="black",pch=21,size=5)+
        geom_point(data=rawstim.df[trialid,], aes(x=option3attribute1,y=option3attribute2,fill="3",shape="3"),color="black",pch=21,size=5)+
        theme_bw()+
        ggtitle(paste(rawstim.df$stimid[trialid],"Trial",trialid,paste0("value",1:3,"=",signif(rawstim.df[trialid,c("value1","value2","value3")],3)," ",collapse="")))
    

    choice.plot <- ggplot(mysamples%>%select(starts_with(paste0("generated_choice.",trialid))),aes_string(x=paste0("generated_choice.",trialid)))+
        geom_bar(stat="count",aes_string(fill=paste0("generated_choice.",trialid)))+
        theme_bw()

    return(attribute.plot/choice.plot)

    
}#end trialplot

for(i in 1:nrow(rawstim.df)){
     ggsave(trialplot(i),file=paste0(targdir,"/",dataname,"_trial",i,".png"))
}

}#end for every data file
