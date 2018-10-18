library(tidyverse)
library(rstan)
library(shinystan)
library(patchwork)
rm(list=ls())

##set.seed(4) #NOTE set seed
## getme <- sample(list.files(pattern=".RData"),1)#This is why seed is set
## load(getme)
agreement.df <- data.frame();

for(getme in list.files(pattern=".RData")){
load(getme)
for(fitstring in c("allords","matchords","noords")){
    if(fitstring=="allords")afit <- fit_allords
    if(fitstring=="matchords")afit <- fit_matchords
    if(fitstring=="noords")afit <- fit_sansords
 
    
mychoices <- as.data.frame(extract(afit),permuted=TRUE)%>%select(starts_with("triad_choice."))
choicesummary.df <- data.frame()
for(i in 1:ncol(mychoices)){
    choicesummary.df <- rbind(choicesummary.df,data.frame(
    trial=i,
    ones=sum(mychoices[,i]==1),
    twos=sum(mychoices[,i]==2),
    threes=sum(mychoices[,i]==3)
    ))
    
}
    choicesummary.df$modelchoice <- sapply(1:nrow(choicesummary.df),function(i){which(choicesummary.df[i,2:4]==max(choicesummary.df[i,2:4]))[1]})#note lazy max tiebreaker
choicesummary.df$humanchoice <-  as.numeric(ordered(triadsdata.df$rolechosen,levels=c("decoy","targ","comp")))#WHAAAT? But yes, this is right.



print(getme)
##print(table(choicesummary.df$humanchoice,choicesummary.df$modelchoice))
triadsdata.df$stimtype <- sapply(triadsdata.df$stimid,function(x){substr(x,1,3)}) #moved to readData can delete this line soon.
##print(table(triadsdata.df$stimtype,triadsdata.df$rolechosen))


for(astimtype in unique(triadsdata.df$stimtype)){
    targtrials <- choicesummary.df[triadsdata.df$stimtype==astimtype,]
    print(astimtype)
    with(targtrials,print(table(modelchoice,humanchoice)))
    agreement.df <- rbind(agreement.df,
                          data.frame(dataset=getme,stimtype=astimtype,model.matches=sum(targtrials$modelchoice==targtrials$humanchoice),n=nrow(targtrials),modeltype=fitstring,timelimit=triadsdata.df$timelimit[1])
                          )
}#for each stim type
    
}#for each model type
}#for each .RData

modelmatch.plot <- ggplot(agreement.df,aes(x=stimtype,y=model.matches/n))+geom_point()+theme_bw()+
    geom_hline(yintercept=.3,linetype="dashed")+
    geom_hline(yintercept=.5,linetype="dotted")+
    ylim(c(0,1))+
    facet_grid(timelimit~modeltype)+
    guides(color=FALSE)

ggsave(modelmatch.plot,file="modelmatches.png",width=15)
print(modelmatch.plot)
