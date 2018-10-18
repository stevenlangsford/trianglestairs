library(tidyverse)
library(rstan)
library(shinystan)
rm(list=ls())

options(mc.cores = parallel::detectCores())
rstan_options(auto_write = TRUE)

hm_stim <- 10

data.df <- data.frame(a=abs(rnorm(hm_stim,1,1.5)),b=abs(rnorm(hm_stim,1,1.5)))%>%mutate(value=a*b/2)

datalist <- list(
    hm_stim=nrow(data.df),
    calcobs=data.df$value,
    calcobs_noise=0.01 #start low for max clarity, increase later.
)

fit <- stan(file="min.stan",
            data=datalist,
            iter=1000,
            chains=4#,
            ## init=function(){
            ##     initattrs <- rep(1,nrow(stim.df)*3*2) #trials * options * attributes. Need to consider what counts as a good init value!
            ##     dim(initattrs)=c(nrow(stim.df),3,2)
            ##     list(est_trial_option_attribute=initattrs)
            ## },##Sanity check on these inits: hist(with(triadsdata.df,c(scaled.NS1,scaled.NS2,scaled.NS3,scaled.EW1,scaled.EW2,scaled.EW3)))
            ## control=list(max_treedepth=15)
            )


