library(tidyverse)
rm(list=ls())

demographics.df <- read.csv("raw_data/demographicsdata.csv",header=TRUE)
matchdata.df <- read.csv("raw_data/matchdata.csv",header=TRUE)
pairsdata.df <- read.csv("raw_data/pairsdata.csv",header=TRUE)

##TODO: Exclusion criteria here?

##What's the correct way to standardize? Is doing it on the differences weird/wrog?
heightpairs.df <- filter(pairsdata.df,question=="Which triangle is taller?")%>%
    mutate(
        diff=NS1-NS2,
        std.diff = (diff-mean(diff))/sd(diff))
widthpairs.df <- filter(pairsdata.df,question=="Which triangle is wider?")%>%mutate(
                                       diff=EW1-EW2,
                                       std.diff = (diff-mean(diff))/sd(diff))
areapairs.df <- filter(pairsdata.df,question=="Which triangle has the largest area?")%>%mutate(
                                                                                            diff=area1-area2,
                                                                                            std.diff = (diff-mean(diff))/sd(diff))
