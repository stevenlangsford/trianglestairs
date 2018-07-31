rm(list=ls())
source("readin_data.R")

##js for rolechosen is
##stimsummary.rolechosen = stimsummary.roles[stimsummary.presentation_position[positionchosen]];
##So yes, this does take presentation position into account

ggplot(pairs.df,aes(x=rolechosen))+geom_bar()+theme_bw()#maybe this is all you really need?

pairs.df$correct <- with(pairs.df,areachosen==ifelse(area1>=area2,area1,area2))
ggplot(pairs.df,aes(x=rolechosen))+geom_bar()+facet_wrap(~correct)+
    theme_bw()


pairs.df%>%group_by(ppntID)%>%summarize(accuracy = sum(areachosen==ifelse(area1>=area2,area1,area2)))%>%ungroup()
