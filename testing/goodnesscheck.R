library(tidyverse)
library(rstan)
library(shinystan)
rm(list=ls())

source("readData.R")

fitgoodness.df <- data.frame();

for(somedata in list.files(pattern=".RData")){
load(somedata)
triadsdata.df$choicenumber <- as.numeric(ordered(triadsdata.df$rolechosen,levels=c("decoy","targ","comp")))#Moved to readData, delete this line.



    goodness_score <- function(triadfit,actualchoices){
        predsamples <- as.data.frame(rstan::extract(triadfit,permute=TRUE))%>%
            select(starts_with("triad_choice."))%>%
            gather(triad,choice)%>%
            group_by(triad)%>%
            summarize(targ=sum(choice==1)/n(),
                      comp=sum(choice==2)/n(),
                      decoy=sum(choice==3)/n())%>%#Pretty sure this labelling is right but for the love of all things scientific do double check it.
            ungroup()%>%mutate(triad=substr(triad,7,nchar(triad)))

        triadsdata.df$choicenumber = as.numeric(ordered(triadsdata.df$rolechosen,levels=c("targ","comp","decoy")))

        predsamples$obs <- actualchoices

        for(i in 1:nrow(predsamples)){
            predsamples[i,"log_p_obs"] <- log(predsamples[i,as.numeric(predsamples[i,"obs"])+1])#+1 to ignore first col, cols 2,3,4 ref targ comp decoy ie choices 1,2,3
        }

        return(sum(predsamples$log_p_obs))
    }



    for(afit in c("fit_allords","fit_matchords","fit_sansords")){
        fitgoodness.df <- rbind(fitgoodness.df, data.frame(ppntid=targid,conditionflag=conditionflag,afit=afit, score=goodness_score(eval(parse(text=afit)),triadsdata.df$choicenumber)))
    }
}#end for some data set

gcheck.plot <- ggplot(fitgoodness.df,aes(x=conditionflag,y=score,color=afit,shape=as.factor(ppntid)))+geom_point(size=5)+theme_bw()+facet_wrap(.~as.factor(ppntid))#ppndid as shape only for tiny n.
ggsave(gcheck.plot,file="gcheck.png")
print(gcheck.plot)
