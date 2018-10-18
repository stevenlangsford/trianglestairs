library(tidyverse)
library(rstan)
library(shinystan)
rm(list=ls())

options(mc.cores = parallel::detectCores())
rstan_options(auto_write = TRUE)

##sim setup
stim.per.trial <- 3
hm.trials <- 5
my.calc.noise = .01
my.ord.noise = .1
my.tolerance = .1
##stim setup
hm_stim <- stim.per.trial*hm.trials
#set a and b attributes, value is a*b/2, value gets passed as mean of calcobs
data.df <- data.frame(a=abs(rnorm(hm_stim,1,1.5)),b=abs(rnorm(hm_stim,1,1.5)))%>%mutate(value=a*b/2)
data.df$trial=rep(1:hm.trials,each=stim.per.trial)

##set up ordinal observations
ordobs.df <- data.frame();
for(atrial in 1:hm.trials){
    for(anattribute in 1:2){
        for(option1 in 2:stim.per.trial){
            for(option2 in 1:(option1-1)){
                targattrs=data.df%>%
                    filter(trial==atrial)%>%
                    select(c("a","b")[anattribute])%>%
                    unlist%>%as.numeric

                targdiff=targattrs[option1]-targattrs[option2]
                
                ordobs.df <- rbind(ordobs.df,data.frame(
                                                 trial=atrial,
                                                 option1=option1,
                                                 option2=option2,
                                                 attribute=anattribute,
                                                 difference=targdiff
                                             )
                                   )
            }
        }
    }
}



datalist <- list(
    hm_stim=nrow(data.df),
    calcobs=data.df$value,
    calcobs_noise=my.calc.noise,
    
    hm_ordobs=nrow(ordobs.df),
    ordobs_noise=my.ord.noise,
    tolerance=my.tolerance,
    ordobs_trial=ordobs.df$trial,
    ordobs_option1=ordobs.df$option1,
    ordobs_option2=ordobs.df$option2,
    ordobs_attribute=ordobs.df$attribute,
    ordobs_diff=ordobs.df$difference
)

fit <- stan(file="min.stan",
            data=datalist,
            iter=1000,
            chains=4,#,
            ## init=function(){
            ##     initattrs <- rep(1,nrow(stim.df)*3*2) #trials * options * attributes. Need to consider what counts as a good init value!
            ##     dim(initattrs)=c(nrow(stim.df),3,2)
            ##     list(est_trial_option_attribute=initattrs)
            ## },##Sanity check on these inits: hist(with(triadsdata.df,c(scaled.NS1,scaled.NS2,scaled.NS3,scaled.EW1,scaled.EW2,scaled.EW3)))
            control=list(max_treedepth=15,adapt_delta=.9)
            )

save.image(file="min.RData")
