library(tidyverse)
rm(list=ls())

pairs.df <- read.csv("raw_data/pairsdata.csv",header=TRUE)%>%filter(question=="Which triangle has the largest area?")

pairs.df$comparisontype <- sapply(1:nrow(pairs.df), function(i){paste(sort( c(as.character(pairs.df[i,"templatetype1"]),as.character(pairs.df[i,"templatetype2"]))),collapse="-")}) #sort by template name to ignore order when deciding comparison type, doesn't matter which is template1 and which is template2
pairs.df$comparisontype <- ordered(pairs.df$comparisontype,levels=c("equilateral-equilateral", "skew-skew", "rightangle-rightangle","rightangle-skew","equilateral-rightangle", "equilateral-skew")) #ordering just to put same-same together and cross-template together.
pairs.df$templatesmatch <-  ifelse(pairs.df$templatetype1==pairs.df$templatetype2,"templates_match","templates_differ")

pairs.df$correct <- with(pairs.df,as.numeric(as.character(areachosen))>as.numeric(as.character(arearejected))) #'equal' goes to NA. think about this?


ggsave(
    ggplot(pairs.df,aes(x=comparisontype,y=abs(area1-area2),color=correct))+geom_jitter()+theme_bw()+ggtitle("Accuracy by abs difference and comparison type")
   ,
    file="plots/accuracy_comparisontype.png", width=10
    )

#ggplot(pairs.df,aes(y=inspectiontime,x=abs(area1-area2),color=comparisontype,shape=comparisontype))+geom_jitter()+theme_bw()+ggtitle("Choice time by abs difference and comparison type")

#ggplot(pairs.df,aes(x=inspectiontime,color=comparisontype))+geom_density()+theme_bw()#inspection time by all comparison types
ggsave(
    ggplot(pairs.df,aes(x=inspectiontime,color=templatesmatch))+geom_density()+theme_bw()+scale_color_discrete(name="Templates match")#inspection time by match status
    ,file="plots/matchstatus_time.png",width=10)

ggsave(
ggplot(
    pairs.df%>%group_by(templatesmatch)%>%summarize(prop.correct=sum(correct,na.rm=TRUE)/n(),
                                                    prop.eq=sum(is.na(correct))/n(),
                                                    prop.incorrect=sum(!correct,na.rm=TRUE)/n())%>%ungroup()%>%
    gather(key=condition,value=prop,prop.correct:prop.incorrect),
   aes(x=condition,y=prop))+geom_bar(stat="identity")+facet_wrap(.~templatesmatch)+theme_bw() #Proportion of in/correct and 'equal' responses.
,
file="plots/accuracy_matchstatus.png")
