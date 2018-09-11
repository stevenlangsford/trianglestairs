library(tidyverse)
rm(list=ls())

demographics.df <- read.csv("raw_data/demographicsdata.csv",header=TRUE)
pairsdata.df <- read.csv("raw_data/pairsdata.csv",header=TRUE)
triadsdata.df <- read.csv("raw_data/responsedata.csv",header=TRUE)

#do exclusions here?
