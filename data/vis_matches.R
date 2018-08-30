library(tidyverse)
rm(list=ls())

match.df <- read.csv("raw_data/matchdata.csv",header=TRUE)
match.df$correct <- with(match.df,ifelse( templatetype1==templatetype2, responsemeans=="match", responsemeans=="notmatch"))
match.df$comparisontype <- sapply(1:nrow(match.df), function(i){paste(sort( c(as.character(match.df[i,"templatetype1"]),as.character(match.df[i,"templatetype2"]))),collapse="-")}) #sort by template name to ignore order when deciding comparison type, doesn't matter which is template1 and which is template2

match.df$comparisontype <- ordered(match.df$comparisontype,levels=c("equilateral-equilateral", "skew-skew", "rightangle-rightangle","rightangle-skew","equilateral-rightangle", "equilateral-skew")) #ordering just to put same-same together and cross-template together.

ggplot(match.df,aes(x=comparisontype,y=inspectiontime,color=correct))+geom_jitter()+theme_bw()
