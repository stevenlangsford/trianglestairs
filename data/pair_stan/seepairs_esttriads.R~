library(tidyverse)
library(rstan)
rm(list=ls())
options(mc.cores = parallel::detectCores())
rstan_options(auto_write = TRUE)

setwd("..")
source("readData.R")
setwd("pair_stan")

singleppnt.estparams <- function(targdata){
for(i in 1:nrow(targdata)){
    ##ok, so difference scores are option1-option2, ignoring presentation position. If presentationposition1 is 0, the order was 1-2, otherwise 2-1.
    ##in the 1-2 presentation order, 'a'(left) indicates opt1>opt2, 'l'(right) indicates opt1<opt2
    ##in the 2-1 presentation order, this flips: 'a' indicates opt1<opt2, 'l' indicates opt1>opt2.
    if(targdata$responsekey[i]==" "){
        targdata$choice[i] = 2; #equal, no preference.
    }else{#pref indicated:
        if(targdata$presentationposition1[i]==0){#presentation order 1-2
            if(targdata$responsekey[i]=='a')targdata$choice[i]=3;
            if(targdata$responsekey[i]=='l')targdata$choice[i]=1;
        }else{#presentation order 2-1
            if(targdata$responsekey[i]=='a')targdata$choice[i]=1;
            if(targdata$responsekey[i]=='l')targdata$choice[i]=3;
        }
    }
    
}

##ggplot(targdata,aes(x=choice,y=std.diff,group=choice))+geom_violin()+geom_point(alpha=.3)+theme_bw() #quick sanity check: expect negative,0,positive std.diffs associated with choices 1,2,3

datalist <- list(N=nrow(targdata),
                 diff=targdata$std.diff,
                 choice=targdata$choice
                          )
fit <- stan(file="sensitivity.stan",
            data=datalist,
            iter=1000,
            chains=4,
            control=list(max_treedepth=15))
return(fit)
}

#demo:
area.est=singleppnt.estparams(filter(areapairs.df,ppntid==4574294))
save(area.est,file="test_area.RData")
height.est=singleppnt.estparams(filter(heightpairs.df,ppntid==4574294))
save(height.est,file="test_height.RData")
width.est=singleppnt.estparams(filter(widthpairs.df,ppntid==4574294))
save(width.est,file="test_width.RData")
