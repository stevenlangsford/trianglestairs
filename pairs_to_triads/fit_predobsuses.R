library(tidyverse)
library(rstan)
library(shinystan)

rm(list=ls())
source("readData.R")

##Filter to a single participant... for now.
targid = demographics.df$ppntID[1]
pairsdata.df <- filter(pairsdata.df,ppntid==targid)
triadsdata.df <- filter(triadsdata.df,ppntID==targid)#Gods, get yourself a case convetion. Sheesh.

##step one: get the information the model needs out of the saved data

## model wants pairs choice coded as 1,2, or 3 meaning area1 {<,=,>} area2
choicecoding <- function(rowid){
    with(pairsdata.df[rowid,],{
        if(responsekey==' '){return(2)};# equal. No dramas
        if(responsekey=='a'){
            ##ppnt chose option presented on the left.
            ##if left option is area1, that means 1>2, coded as "choice = 3"
            ##if left option is area2, that means 1<2, coded as "choice = 1"
            if(presentationposition1==0){
                return(3)
            }else{
                return(1)
            }
        }#end if chose left option
        if(responsekey=='l'){
            ##ppnt chose option presented on the right.
            ##if right option is area1, that means 1>2, coded as "choice = 3"
            ##if right option is area2, that means 1<2, coded as "choice = 1"
            if(presentationposition2==0){
                return(3)
            }else{
                return(1)
            }
        }#end if chose right option
    })#end with(targetrow,{dostuff})
}#end choicecoding
pairsdata.df$choice <- sapply(1:nrow(pairsdata.df),choicecoding)#Quite a convoluted process... but seems like the most readable salvage of the awkward data-save format? What would be the cleanest way to randomize L-R and also get clean access to meaning of response button?

scalingconstant = 2500 #converts areas in px to stan-friendly numbers around 1.
pairsdata.df <- pairsdata.df%>%mutate(
                                   diff=((area1-area2)/scalingconstant) #If you're going to convert units, make sure everything is on commensurable scales, ok? For now you're just dividing everything by a constant, that's legit, right?
                               )

##triads model wants to know what calc and ord obs are available (and their values)
triadsdata.df <- triadsdata.df%>%mutate(
                                     scaled.area1=area1/scalingconstant,
                                     scaled.area2=area2/scalingconstant,
                                     scaled.area3=area3/scalingconstant,
                                     scaled.NS1=NorthSouth1/sqrt(scalingconstant),
                                     scaled.NS2=NorthSouth2/sqrt(scalingconstant),
                                     scaled.NS3=NorthSouth3/sqrt(scalingconstant),
                                     scaled.EW1=EastWest1/sqrt(scalingconstant),
                                     scaled.EW2=EastWest2/sqrt(scalingconstant),
                                     scaled.EW3=EastWest3/sqrt(scalingconstant)
                                 )
triadsdata.df$choicenumber <- as.numeric(ordered(triadsdata.df$rolechosen,levels=c("targ","comp","decoy")))

calcobs <- matrix(,nrow=nrow(triadsdata.df),ncol=3)
ordobs.df <- data.frame()
ordobs_matches.df <- data.frame()

for(i in 1:nrow(triadsdata.df)){
    calcobs[i,1]=triadsdata.df[i,"scaled.area1"]
    calcobs[i,2]=triadsdata.df[i,"scaled.area2"]
    calcobs[i,3]=triadsdata.df[i,"scaled.area3"]

    ##North-South attribute:
    ##ord 1-2
    ordNS12 <- data.frame(trialid=i,
               option1id=1,
               option2id=2,
               ord_attribute=1,
               ord_status=triadsdata.df[i,"scaled.NS1"]-triadsdata.df[i,"scaled.NS2"],
               matchstatus=triadsdata.df[i,"templatetype1"]==triadsdata.df[i,"templatetype2"]
               )
    ##ord 1-3
    ordNS13 <- data.frame(trialid=i,
               option1id=1,
               option2id=3,
               ord_attribute=1,
               ord_status=triadsdata.df[i,"scaled.NS1"]-triadsdata.df[i,"scaled.NS3"],
               matchstatus=triadsdata.df[i,"templatetype1"]==triadsdata.df[i,"templatetype3"])
    ##ord 2-3
    ordNS23 <- data.frame(trialid=i,
               option1id=2,
               option2id=3,
               ord_attribute=1,
               ord_status=triadsdata.df[i,"scaled.NS2"]-triadsdata.df[i,"scaled.NS3"],
               matchstatus=triadsdata.df[i,"templatetype2"]==triadsdata.df[i,"templatetype3"])
##East-West attribute:
        ##ord 1-2
    ordEW12 <- data.frame(trialid=i,
               option1id=1,
               option2id=2,
               ord_attribute=2,
               ord_status=triadsdata.df[i,"scaled.EW1"]-triadsdata.df[i,"scaled.EW2"],
               matchstatus=triadsdata.df[i,"templatetype1"]==triadsdata.df[i,"templatetype2"])
    ##ord 1-3
    ordEW13 <- data.frame(trialid=i,
               option1id=1,
               option2id=3,
               ord_attribute=2,
               ord_status=triadsdata.df[i,"scaled.EW1"]-triadsdata.df[i,"scaled.EW3"],
               matchstatus=triadsdata.df[i,"templatetype1"]==triadsdata.df[i,"templatetype3"])
    ##ord 2-3
    ordEW23 <- data.frame(trialid=i,
               option1id=2,
               option2id=3,
               ord_attribute=2,
               ord_status=triadsdata.df[i,"scaled.EW2"]-triadsdata.df[i,"scaled.EW3"],
               matchstatus=triadsdata.df[i,"templatetype2"]==triadsdata.df[i,"templatetype3"])

    
    ordobs.df <- rbind(ordobs.df,ordNS12,ordNS13,ordNS23,ordEW12,ordEW13,ordEW23)
}##end for each triad

ordobs_matches.df <- filter(ordobs.df,matchstatus==TRUE)


## datalist_pairs <- list(
##     N=nrow(pairsdata.df),
##     diff = pairsdata.df$diff,
##     choice = pairsdata.df$choice#,
## )

## fit <- stan(file="seepairs_getests.stan",
##             data=datalist_pairs,
##             iter=1000,
##             chains=4
##             )

## pairsamples <- as.data.frame(rstan::extract(fit,permuted=TRUE))

pairsamples <- data.frame(sigma=.1,tolerance=.1) #DEV CHEAT

datalist <- list(
    sigma=mean(pairsamples$sigma),#POINTEST HACK
    tolerance=mean(pairsamples$tolerance),#POINTEST HACK
    hm_triads = nrow(triadsdata.df),
    calcobs=calcobs,
    hm_ordobs=nrow(ordobs.df),
    ord_trialid=ordobs.df$trialid,
    ord_option1=ordobs.df$option1id,
    ord_option2=ordobs.df$option2id,
    ord_attribute=ordobs.df$ord_attribute,
    ord_status=ordobs.df$ord_status,
    triad_choice=triadsdata.df$choicenumber,
    matchstatus=as.numeric(ordobs.df$matchstatus)#note this is still a todo
)

triadfit_obsuse <- stan(file="seetriads_predictobsuse.stan",
            data=datalist,
            iter=1000,
            chains=4,
            init=function(){
                initattrs <- rep(1,nrow(triadsdata.df)*3*2) #trials * options * attributes. Need to consider what counts as a good init value!
                dim(initattrs)=c(nrow(triadsdata.df),3,2)
                list(est_trial_option_attribute=initattrs)
            },##Sanity check on these inits: hist(with(triadsdata.df,c(scaled.NS1,scaled.NS2,scaled.NS3,scaled.EW1,scaled.EW2,scaled.EW3)))
            control=list(max_treedepth=15,adapt_delta=.99)
            )

save.image(file="ordusefit2_consans.RData")
