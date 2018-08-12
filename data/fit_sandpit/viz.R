library(tidyverse)
library(rstan)
library(patchwork)
rm(list=ls())


load("demofit_allobs.RData")
rm(list=setdiff(ls(),c("responses.df","fit")))
allobs.samples <- as.data.frame(extract(fit,permuted=TRUE))%>%select(starts_with("generated_choice"))%>%
    gather(whichtrial,simchoice,1:nrow(responses.df))%>%
    group_by(whichtrial)%>%
    summarize(ones=sum(simchoice==1)/n(), #FFS which options do these numbers refer to? Looks like targ-comp-decoy but how does it know?
              twos=sum(simchoice==2)/n(),
              threes=sum(simchoice==3)/n()
              )

TODO: vis this alongside filtered-ordobs equivalent... and human responses. Somehow.
