library(tidyverse)
library(rstan)
library(shinystan)
library(patchwork)
rm(list=ls())
load("min.RData")

mysamples <- as.data.frame(extract(fit,permuted=TRUE))

trialnumber = 25
stim1 = (trialnumber-1)*3+1
stim2 = (trialnumber-1)*3+2
stim3 = (trialnumber-1)*3+3

targ.attr.ests1 <- select(mysamples,starts_with(paste0("est_option_attribute.",stim1,".")))
names(targ.attr.ests1)=c("a","b")
targ.value.ests1 <- select(mysamples,paste0("estval.",stim1))
names(targ.value.ests1)=c("value.est")
targ.attr.ests2 <- select(mysamples,starts_with(paste0("est_option_attribute.",stim2,".")))
names(targ.attr.ests2)=c("a","b")
targ.value.ests2 <- select(mysamples,paste0("estval.",stim2))
names(targ.value.ests2)=c("value.est")
targ.attr.ests3 <- select(mysamples,starts_with(paste0("est_option_attribute.",stim3,".")))
names(targ.attr.ests3)=c("a","b")
targ.value.ests3 <- select(mysamples,paste0("estval.",stim3))
names(targ.value.ests3)=c("value.est")

(ggplot(data=NULL,aes(x=a,y=b))+
 geom_point(data=targ.attr.ests1,color="red",alpha=.1)+
 geom_point(data=targ.attr.ests2,color="blue",alpha=.1)+
 geom_point(data=targ.attr.ests3,color="green",alpha=.1)+
 geom_point(data=calcobs.df[stim1,],color="black",size=6)+
 geom_point(data=calcobs.df[stim1,],color="red",size=5)+
 geom_point(data=calcobs.df[stim2,],color="black",size=6)+
 geom_point(data=calcobs.df[stim2,],color="blue",size=5)+
 geom_point(data=calcobs.df[stim3,],color="black",size=6)+
 geom_point(data=calcobs.df[stim3,],color="green",size=5)+
 theme_bw())



    
## (ggplot(targ.value.ests1,aes(x=value.est))+geom_histogram()+
##     geom_vline(xintercept=calcobs.df$value[stim1])+
##     theme_bw())
