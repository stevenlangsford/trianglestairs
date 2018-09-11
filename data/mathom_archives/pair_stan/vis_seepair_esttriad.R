library(tidyverse)
library(rstan)
library(shinystan)

rm(list=ls())
load("seepairesttriad_test1.RData")

mysamples <- as.data.frame(extract(fit,permuted=TRUE))

ests <- mysamples%>%select(starts_with(paste0("est_trial_option_attribute")))%>%
    gather(attribute,est)%>%
    separate(attribute,c("prefix","trial","option","attribute"),sep="\\.")%>%
    group_by(trial,option,attribute)%>%mutate(sampleid=1:n())%>%spread(attribute,est)%>%select(-sampleid)%>%rename(x="1",y="2")

ggplot(ests%>%filter(trial==1),aes(x=x,y=y,color=option))+geom_point(alpha=.3)+theme_bw()

