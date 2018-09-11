library(tidyverse)
library(rstan)
library(shinystan)
rm(list=ls())
options(mc.cores = parallel::detectCores())
rstan_options(auto_write = TRUE)

setwd("..")
source("readData.R")
setwd("pair_stan")
targdata <- filter(areapairs.df,ppntid==areapairs.df$ppntid[1])#one ppnt at a time, for now.

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

##Set up the info for the triad trials. Actually this should be read in too?
hm_triads = 10;
triads.df <- data.frame()
decoysize = seq(from=.5,to=1,length=hm_triads)

for(i in 1:hm_triads){
    triads.df <- rbind(triads.df,data.frame(
                                     triadid=i,
                                     width1=1,
                                     height1=.5,
                                     width2=.5,
                                     height2=1,
                                     width3=1*sqrt(decoysize[i]),#decoy is option1 scaled down in both dims to decoysize
                                     height3=.5*sqrt(decoysize[i])
                                 )
                       )
    }
triads.df <- triads.df%>%mutate(area1 = width1*height1/2,
                                area2 = width2*height2/2,
                                area3 = width3*height3/2)

ordobs.df <- data.frame();
##firstpass: include all ordobs.
for(atrial in 1:nrow(triads.df)){
    for(option1 in 2:3){
        for(option2 in 1:(option1-1)){
            ordobs.df <- rbind(ordobs.df,data.frame(
                                             trialid=atrial,
                                             option1id=option1,
                                             option2id=option2,
                                             ord_status=1 #FILLER not actually observing anything here yet. TODO
                                             ))
        }
    }
}

## int hm_ordorbs;
## int trialid[hm_ordobs];
## int option1id[hm_ordobs];
## int option2id[hm_ordobs];
## int ord_status[hm_ordobs];


datalist <- list(N=nrow(targdata),
                 diff=targdata$std.diff,
                 choice=targdata$choice,
                                        #Triads
                 hm_triads=hm_triads,
                 calcobs = as.matrix(triads.df[,c("area1","area2","area3")]),
                 hm_ordobs = nrow(ordobs.df),
                 trialid = ordobs.df$trialid,
                 option1id = ordobs.df$option1id,
                 option2id = ordobs.df$option2id,
                 ord_status = ordobs.df$ord_status
                 )

fit <- stan(file="seepairs_esttriads.stan",
            data=datalist,
            iter=1000,
            chains=4,
            control=list(max_treedepth=15))

save(fit,file="seepairesttriad_test1.RData")
