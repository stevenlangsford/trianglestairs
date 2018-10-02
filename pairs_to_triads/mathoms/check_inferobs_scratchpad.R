library(tidyverse)
library(rstan)
library(shinystan)
rm(list=ls())

load("testing_inferobs.RData") #contains obsuse_match, obsuse_no, obsuse_all

no_samples <- as.data.frame(extract(obsuse_no,permuted=TRUE))%>%select(starts_with("use"))%>%gather(obstype,p.use,1:2)%>%mutate(sim="no")
all_samples <- as.data.frame(extract(obsuse_all,permuted=TRUE))%>%select(starts_with("use"))%>%gather(obstype,p.use,1:2)%>%mutate(sim="all")
match_samples <- as.data.frame(extract(obsuse_match,permuted=TRUE))%>%select(starts_with("use"))%>%gather(obstype,p.use,1:2)%>%mutate(sim="match")
