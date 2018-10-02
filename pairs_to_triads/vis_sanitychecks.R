library(tidyverse)
library(rstan)
library(shinystan)
library(patchwork)
rm(list=ls())
source("readData.R")

##Pairs data: checking comparison type, size difference, correct/incorrect/equal reponsetype, and accuracy.
pairsdata.df$comparisontype <- sapply(1:nrow(pairsdata.df), function(i){paste(sort( c(as.character(pairsdata.df[i,"templatetype1"]),as.character(pairsdata.df[i,"templatetype2"]))),collapse="-")}) #sort by template name to ignore order when deciding comparison type, doesn't matter which is template1 and which is template2
pairsdata.df$comparisontype <- ordered(pairsdata.df$comparisontype,levels=c("equilateral-equilateral", "skew-skew", "rightangle-rightangle","rightangle-skew","equilateral-rightangle", "equilateral-skew")) #ordering just to put same-same together and cross-template together.
pairsdata.df$templatesmatch <-  ifelse(pairsdata.df$templatetype1==pairsdata.df$templatetype2,"templates_match","templates_differ")
pairsdata.df$correct <- with(pairsdata.df,as.numeric(as.character(areachosen))>as.numeric(as.character(arearejected))) #'equal' goes to NA. think about this?

ggplot(pairsdata.df,aes(x=comparisontype,y=abs(area1-area2),color=correct))+geom_jitter()+theme_bw()+ggtitle("Accuracy by abs difference and comparison type")
ggplot(pairsdata.df,aes(x=abs(area1-area2),y=inspectiontime,color=correct,shape=comparisontype))+geom_point()+theme_bw()+ggtitle("Response time by size difference")

##Pairs fit: hist of est tolerance and noise params that you're gonna use in triadfits.
pairparamest.df <- data.frame();
for(targdata in list.files(pattern="*.RData")){
    load(targdata)
    pairsamples$ppntid=targid
    pairparamest.df <- rbind(pairparamest.df,pairsamples)
}
(ggplot(pairparamest.df,aes(x=sigma))+geom_histogram()+facet_wrap(.~ppntid)+theme_bw()+ggtitle("Sanity check on params estimated from pairs task"))/(ggplot(pairparamest.df,aes(x=tolerance))+geom_histogram()+facet_wrap(.~ppntid)+theme_bw())#facet display possible only for small/subset n.

(ggplot(pairparamest.df%>%group_by(ppntid)%>%summarize_all(mean),aes(x=sigma))+geom_histogram())/(ggplot(pairparamest.df%>%group_by(ppntid)%>%summarize_all(mean),aes(x=tolerance))+geom_histogram())#hist of ppnt means, sensible only for reasonable n's.
#Question: what happens to the bottom-line model comparison results if you artificially fix those noise&tolerance params at something nice-looking? At something tiny/huge?

##Triads response times by template-set? By difficulty? Colored by role-chosen?
rm(list=ls())
source("readData.R")
triadsdata.df$area1 <- sapply(triadsdata.df$area1,round) #There's some floating-point precision weirdness going on with non-equal areas that should be (and print as) equal.
triadsdata.df$area2 <- sapply(triadsdata.df$area2,round)
triadsdata.df$area3 <- sapply(triadsdata.df$area3,round)


winner_triads.df <- filter(triadsdata.df,area3>area1&area3>area2)
ggplot(winner_triads.df,aes(x=area3,y=responsetime-drawtime,color=rolechosen))+geom_jitter(size=5)
table(winner_triads.df$rolechosen)#ok that's suspicious, no? You're not that inaccurate on winner triads, right?
table(triadsdata.df$rolechosen)# No way, this is vastly too many decoy choices! Track a response through the whole pipeline please.

##(stretch goal) triangle plot, each trial is a point with targ,comp, and decoy coords, colored by optionchosen (sized by time taken? Faceted by template pattern?) Whouldn't that be nice...

