library(tidyverse)
library(rstan)
library(shinystan)
library(patchwork)
rm(list=ls())
load("min.RData")

mysamples <- as.data.frame(extract(fit,permuted=TRUE))


stimnumber = 1
targ.attr.ests <- select(mysamples,starts_with(paste0("est_option_attribute.",stimnumber,".")))
names(targ.attr.ests)=c("a","b")
targ.value.ests <- select(mysamples,paste0("estval.",stimnumber))
names(targ.value.ests)=c("value.est")

(ggplot(data=NULL,aes(x=a,y=b))+
    geom_point(data=targ.attr.ests,color="blue",alpha=.3)+
    geom_point(data=data.df[stimnumber,],color="red",size=5)+
    theme_bw())/
(ggplot(targ.value.ests,aes(x=value.est))+geom_histogram()+
    geom_vline(xintercept=data.df$value[stimnumber])+
    theme_bw())
