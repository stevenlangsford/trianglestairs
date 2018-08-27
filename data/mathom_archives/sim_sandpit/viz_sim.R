library(tidyverse)
library(rstan)
library(shinystan)
rm(list=ls())

targdata <- "demofit0.1noise,0.1tolerance.RData"
load(targdata)
mysamples <- as.data.frame(extract(fit, permuted = TRUE))
rawstim.df$stimid <- as.character(rawstim.df$stimid)

endorsements.df <- mysamples%>%select(starts_with("generated_choice."))%>%
    summarize_all(.funs=c(
                      "targ"=function(x){sum(x==1)},
                      "comp"=function(x){sum(x==2)},
                      "decoy"=function(x){sum(x==3)}
                  ))
endorsements.df <- cbind(rep(1:nrow(rawstim.df),times=1),
                         as.data.frame(t(endorsements.df)[1:nrow(rawstim.df),]),
                         as.data.frame(t(endorsements.df)[(nrow(rawstim.df)+1):(nrow(rawstim.df)*2),]),
                         as.data.frame(t(endorsements.df)[(nrow(rawstim.df)*2+1):(nrow(rawstim.df)*3),])
                         )
names(endorsements.df) <- c("trialid","chosetarg","chosecomp","chosedecoy") #this whole process seems unnecessarily complicated and undplyrlike but it works. :-(
endorsements.df$TCratio=endorsements.df$chosetarg/(endorsements.df$chosetarg+endorsements.df$chosecomp)

#gee this assumption about the format of information contained in stimtype is really scary!
endorsements.df$stimtype = substr(rawstim.df$stimid,1,3)
endorsements.df$shapeflavour <- substr(rawstim.df$stimid,nchar(rawstim.df$stimid)-2,nchar(rawstim.df$stimid))
endorsements.df$decoydist <- rawstim.df$decoydist

viz.TClines <- function(atrialtype){
    return(
        ggplot(filter(endorsements.df,stimtype==atrialtype),aes(x=decoydist,y=TCratio,color=shapeflavour))+geom_point()+geom_line()+theme_bw()
    )
}

## viz.TClines <- function(atrialtype){
## TCtracker.df <- endorsement.df%>%filter(trialtype==atrialtype)%>%mutate(TCratio = choseTarg/(choseTarg+choseComp))
## return(
##     ggplot(TCtracker.df,aes(x=decoydist,y=TCratio,color=shapeflavour))+
##     geom_point()+
##     geom_line()+
##     theme_bw()+ggtitle(atrialtype)
##     )
## }                        

## for(atrialtype in unique(rawdata.df$trialtype)){
##     x11();print(viz.TClines(atrialtype));
## }
