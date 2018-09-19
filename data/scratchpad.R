library(tidyverse)
library(rstan)
library(shinystan)
rm(list=ls())
load("demofit.RData")
mysamples <- as.data.frame(extract(fit,permuted=TRUE))

simchoices <- mysamples%>%select(starts_with("triad_choice"))%>%
    gather(stim,choice,triad_choice.1:triad_choice.50)%>%
    group_by(stim)%>%
    summarize(targ=sum(choice==1)/n(),
              comp=sum(choice==2)/n(),
              decoy=sum(choice==3)/n()
              )

View(simchoices)
