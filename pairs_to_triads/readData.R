library(tidyverse)
##rm(list=ls())

demographics.df <- read.csv("raw_data/demographicsdata.csv",header=TRUE)
pairsdata.df <- read.csv("raw_data/pairsdata.csv",header=TRUE)
triadsdata.df <- read.csv("raw_data/responsedata.csv",header=TRUE)

scalingconstant = 2500 #converts areas in px to stan-friendly numbers around 1.
triadsdata.df <- triadsdata.df%>%mutate(
                                     scaled.area1=area1/scalingconstant,
                                     scaled.area2=area2/scalingconstant,
                                     scaled.area3=area3/scalingconstant,
                                     scaled.NS1=NorthSouth1/sqrt(scalingconstant),
                                     scaled.NS2=NorthSouth2/sqrt(scalingconstant),
                                     scaled.NS3=NorthSouth3/sqrt(scalingconstant),
                                     scaled.EW1=EastWest1/sqrt(scalingconstant),
                                     scaled.EW2=EastWest2/sqrt(scalingconstant),
                                     scaled.EW3=EastWest3/sqrt(scalingconstant)
                                 )
triadsdata.df$choicenumber <- as.numeric(ordered(triadsdata.df$rolechosen,levels=c("targ","comp","decoy")))#stan codes choices as 1,2,3: like this, right?

#do exclusions here?
