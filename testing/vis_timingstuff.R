library(tidyverse)
library(rstan)
rm(list=ls())
source("readData.R")

ggplot(pairsdata.df,aes(x=inspectiontime,color=templatetype1==templatetype2))+geom_density()+theme_bw()+ggtitle("Response times to pairs")

ggplot(filter(triadsdata.df,timelimit=="selfpaced"),aes(x=inspectiontime))+geom_density()+theme_bw()+ggtitle("Overall triad response times")

ggplot(filter(triadsdata.df,timelimit=="selfpaced"),aes(x=inspectiontime,color=stimtype))+geom_density()+theme_bw()+ggtitle("Triad response times by trial type")

ggsave(
    ggplot(filter(triadsdata.df,timelimit=="selfpaced",stimtype=="att"),aes(x=inspectiontime,color=templatesetcode))+geom_density()+theme_bw()+ggtitle("Response times by which-match pattern for attraction trials"),
    file="timingbymatches.png")

ggsave(
    ggplot(filter(triadsdata.df,timelimit=="selfpaced",stimtype=="win"),aes(x=inspectiontime,color=templatesetcode))+geom_density()+theme_bw()+ggtitle("Response times by which-match pattern for win trials"),
    file="timingbymatches_win.png")

#Check the template codes mean what you think they mean re position/order
