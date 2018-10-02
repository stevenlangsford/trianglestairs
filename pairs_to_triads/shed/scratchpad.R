library(tidyverse)
library(rstan)
library(shinystan)
library(patchwork)
rm(list=ls())
load("pair_paramests.RData")

## showme <- function(triadfit){
## predsamples <- as.data.frame(rstan::extract(triadfit,permute=TRUE))%>%
##     select(starts_with("triad"))%>%
##     gather(triad,choice)%>%
##     group_by(triad)%>%
##     summarize(targ=sum(choice==1)/n(),
##               comp=sum(choice==2)/n(),
##               decoy=sum(choice==3)/n())%>%#Pretty sure this labelling is right but for the love of all things scientific do double check it.
##     ungroup()%>%mutate(triad=substr(triad,7,nchar(triad)))

## triadsdata.df$choicenumber = as.numeric(ordered(triadsdata.df$rolechosen,levels=c("targ","comp","decoy")))

## for(i in 1:nrow(triadsdata.df)){
##     predsamples[predsamples$triad==paste0("choice.",i),"obs"] <- triadsdata.df[i,"choicenumber"]
## }

##     return(
##         ggplot(predsamples)+facet_wrap(.~triad)+geom_bar(aes(x=1,y=targ,fill=obs==1),stat="identity")+geom_bar(aes(x=2,y=comp,fill=obs==2),stat="identity")+geom_bar(aes(x=3,y=decoy,fill=obs==3),stat="identity")+theme_bw()+guides(fill=FALSE)
##     )
## }


## #TODO: Try with-and-without nonmatch ordobs, find a way to compare the fits. Get a more 'real' pairs df: with more than 6 rows.!
## bob <- showme(triadfit_allords)+ggtitle("all_ords")+showme(triadfit_matchords)+ggtitle("match_ords")
## #ggsave(bob,file="comparepredictions.png",width=14)

goodness_score <- function(triadfit){
predsamples <- as.data.frame(rstan::extract(triadfit,permute=TRUE))%>%
    select(starts_with("triad"))%>%
    gather(triad,choice)%>%
    group_by(triad)%>%
    summarize(targ=sum(choice==1)/n(),
              comp=sum(choice==2)/n(),
              decoy=sum(choice==3)/n())%>%#Pretty sure this labelling is right but for the love of all things scientific do double check it.
    ungroup()%>%mutate(triad=substr(triad,7,nchar(triad)))

triadsdata.df$choicenumber = as.numeric(ordered(triadsdata.df$rolechosen,levels=c("targ","comp","decoy")))

for(i in 1:nrow(triadsdata.df)){
    predsamples[predsamples$triad==paste0("choice.",i),"obs"] <- triadsdata.df[i,"choicenumber"]
}

for(i in 1:nrow(predsamples)){
    predsamples[i,"log_p_obs"] <- log(predsamples[i,as.numeric(predsamples[i,"obs"])+1])
}

return(sum(predsamples$log_p_obs))
}

print(goodness_score(triadfit_allords)) #is it true that the number of params is the same, in which case this is all you need? Really not sure.
print(goodness_score(triadfit_matchords))



