library(tidyverse)
rm(list=ls())
rawdata.df <- read.csv("raw_data/responsedata.csv",colClasses=c("shapeflavor"="character","ppntid"="character"),header=TRUE)
demographics.df <- read.csv("raw_data/demographicsdata.csv",header=TRUE)
pairs.df <- read.csv("raw_data/pairsdata.csv",header=TRUE)

##stimplot: you need: the ns and ew of each triangle, which one was chosen, and their shapetype
#ggplot(rawdata.df,aes(x=shapeflavor,y=decoydistance))+geom_jitter()+theme_bw()
#ggplot(rawdata.df,aes(x=shapeflavor,y=decoydistance))+geom_violin()+theme_bw()
