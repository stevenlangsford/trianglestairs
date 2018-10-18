library(tidyverse)
library(rstan)
library(shinystan)
library(patchwork)
rm(list=ls())

#todo: ok, WHICH choices mismatch? For win trials, get accuracy & which roles chosen in errors? For comp trials, which roles chosen in mismatches?
source("readData.R")
master.triads.df <- triadsdata.df #who knows what unholy overwriting is going on when you load the env's for all the model fits, definitely nothing good.

for(amodel in list.files(patter=".RData")){
    load(amodel);

    augument.mastertriads <- function(afit,fitname){
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
        choicesummary.df$modelchoice <- sapply(1:nrow(choicesummary.df),function(i){which(choicesummary.df[i,2:4]==max(choicesummary.df[i,2:4]))[1]})#note lazy max tiebr
        choicesummary.df$presentationsequence <- triadsdata.df$presentationsequence
        for(i in 1:nrow(choicesummary.df)){
            master.triads.df[master.triads.df$ppntID==triadsdata.df$ppntID[1]&master.triads.df$presentationsequence==triadsdata.df[i,"presentationsequence"],fitname]<<- choicesummary.df[i,"modelchoice"] #ugh, <<-, sorry
            #could consider adding model confidence, other interesting things here...
        }
    }#end aug mastertriads

    augument.mastertriads(fit_allords,"allords")
    augument.mastertriads(fit_matchords,"matchords")
    augument.mastertriads(fit_sansords,"sansords")
}#end for each modelfit.

rm(list=setdiff(ls(),"master.triads.df")) #model code is 1:decoy, 2:targ, 3:comp

##with(master.triads.df,table(choicenumber,allords))
with(filter(master.triads.df,stimtype=="win"),table(rolechosen,allords)) #ok good
with(filter(master.triads.df,stimtype=="att"),table(rolechosen,allords)) #allords choses targ more agressively than people, who show a slight preference.

master.triads.df$allords <- sapply(master.triads.df$allords,function(x){c("decoy","targ","comp")[x]})
master.triads.df$matchords <- sapply(master.triads.df$matchords,function(x){c("decoy","targ","comp")[x]})
master.triads.df$sansords <- sapply(master.triads.df$sansords,function(x){c("decoy","targ","comp")[x]})

##
master.triads.df <- filter(master.triads.df,timelimit=="selfpaced",stimtype=="com")
##

choicepattern.df <- master.triads.df%>%group_by(stimtype)%>%
    select(rolechosen,allords,matchords,sansords,stimtype,decoydist)%>%rename(humans=rolechosen)%>%ungroup()%>%
    gather(decisionsource,roleendorsed,humans:sansords)

choicepattern.df$decisionsource <- ordered(choicepattern.df$decisionsource,levels=rev(c("humans","allords","matchords","sansords")))
choice.plot <- ggplot(choicepattern.df,aes(x=roleendorsed,group=decisionsource,fill=decisionsource))+facet_grid(decoydist~stimtype)+geom_bar(position="dodge")+theme_bw()

#ggsave(choice.plot+ggtitle("self-paced, attraction trials"),file="selfpaced_compbydecoydist.png",width=10)
print(choice.plot)

filter(choicepattern.df,decisionsource=="humans")%>%
    group_by(stimtype)%>%
    summarize(targ=sum(roleendorsed=="targ"),comp=sum(roleendorsed=="comp"),decoy=sum(roleendorsed=="decoy")) #should split this by decoy distance! too close->simeffect
#and you haven't looked at templatetype!
