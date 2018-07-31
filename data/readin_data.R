library(tidyverse)
rm(list=ls())
rawdata.df <- read.csv("raw_data/responsedata.csv",header=TRUE)
demographics.df <- read.csv("raw_data/demographicsdata.csv",header=TRUE)
##stimplot: you need: the ns and ew of each triangle, which one was chosen, and their shapetype

pairs.df <- filter(rawdata.df,NorthSouth3=="pairtrial")#new bit
pairs.df$areachosen <- with(pairs.df,
                           ifelse(positionchosen==0, ifelse(presentation1==0,area1,area2), ifelse(presentation1==1,area2,area1)))#ugh!
rawdata.df <- filter(rawdata.df,NorthSouth3!="pairtrial") #pull out pairs and procede as before. Ugly but accomodates late trial-type addition.
#These numeric cols are forced to factors by 'pairtrial' placeholders. The placeholders are useful, so just convert back as needed? Ugh.
rawdata.df$area3 <- as.numeric(as.character(rawdata.df$area3))
rawdata.df$NorthSouth3 <- as.numeric(as.character(rawdata.df$NorthSouth3))
rawdata.df$EastWest3 <- as.numeric(as.character(rawdata.df$EastWest3))
rawdata.df$orientation3 <- as.integer(as.character(rawdata.df$orientation3))
rawdata.df$presentation3 <- as.integer(as.character(rawdata.df$presentation3))

    
##derived data:
rawdata.df$trialtype = substr(rawdata.df$stimid,1,3)
rawdata.df$stimid <- as.character(rawdata.df$stimid)
rawdata.df$shapeflavour = substr(rawdata.df$stimid,nchar(rawdata.df$stimid)-2,nchar(rawdata.df$stimid)) #ASSUMES stimid format with shape-flavor on the end! ouch. Can check for consistency with templatetype
rawdata.df$trialtime <- with(rawdata.df,responsetime-drawtime)

##attention checks? Note no filtering done here at the moment: still need to filter on badID.
attnchecks.df <- rawdata.df%>%filter(trialtype=="win" & decoydist>=1.15)%>%group_by(ppntID)%>%summarize(correct=sum(rolechosen=="decoy")/n())
badID <- filter(attnchecks.df,correct<.8) ##Maybe also eliminate super fast responders?
##ggplot(rawdata.df)+geom_density(aes(x=trialtime,color=as.factor(ppntID)))+theme_bw()

hm_ppnts <- length(unique(rawdata.df$ppntID))

endorsement.df <- rawdata.df%>%group_by(stimid,trialtype,decoydist,shapeflavour)%>%
    summarize(choseTarg=sum(rolechosen=="targ"), choseComp=sum(rolechosen=="comp"),choseDecoy=sum(rolechosen=="decoy"))%>%
    ungroup()%>%mutate(targProp=choseTarg/hm_ppnts,compProp=choseComp/hm_ppnts,decoyProp=choseDecoy/hm_ppnts)

##some init plotting stuff:
viz.trial <- function(rowid){
    atrial = rawdata.df[rowid,]
    atrial$chosenX = atrial[,paste0("EastWest",(atrial[,"positionchosen"]+1))]
    atrial$chosenY = atrial[,paste0("NorthSouth",(atrial[,"positionchosen"]+1))]
    return(
        ggplot(atrial)+
        geom_point(aes(x=chosenX,y=chosenY),size=7,color="black")+
        geom_point(aes(x=EastWest1,y=NorthSouth1,color="1",shape=templatetype1),size=5)+
        geom_point(aes(x=EastWest2,y=NorthSouth2,color="2",shape=templatetype2),size=5)+
        geom_point(aes(x=EastWest3,y=NorthSouth3,color="3",shape=templatetype3),size=5)+
        ggtitle(paste(atrial$stimid,"chose",atrial$rolechosen))+
        theme_bw()+xlab("")+ylab("")
    )
}

viz.rawbars <- function(atrialtype){
    somedata <- endorsement.df%>%filter(trialtype==atrialtype)%>%
        gather(option,endorsement, choseTarg:choseDecoy)
    return(
        ggplot(somedata,aes(x=option,y=endorsement))+geom_bar(position="dodge",stat="identity")+facet_grid(shapeflavour~decoydist)+
        ggtitle(atrialtype)+
        theme_bw()
    )
}

viz.TClines <- function(atrialtype){
TCtracker.df <- endorsement.df%>%filter(trialtype==atrialtype)%>%mutate(TCratio = choseTarg/(choseTarg+choseComp))
return(
    ggplot(TCtracker.df,aes(x=decoydist,y=TCratio,color=shapeflavour))+
    geom_point()+
    geom_line()+
    theme_bw()+ggtitle(atrialtype)
    )
}                        

## for(atrialtype in unique(rawdata.df$trialtype)){
##     x11();print(viz.TClines(atrialtype));
## }


## library("Ternary") ##ugh. Well, learn to use this or wait for ggtern/ggplot2 compatibility fix to come through?
## showEndorsements <- function(somedata){
## TernaryPlot()
## data_point_names = somedata$stimid;
## data_points <- vector("list", length(data_point_names))
## names(data_points) <- data_point_names
## for(aname in data_point_names){
##     data_points[[aname]]=as.numeric(as.data.frame(somedata[somedata$stimid==aname,c("choseTarg","choseComp","choseDecoy")]))*255
## }

## AddToTernary(points, data_points, bg=vapply(data_points, function (x) rgb(x[1], x[2], x[3], 128, maxColorValue=255), character(1)), pch=21, cex=2.8)
## #AddToTernary(text, data_points, names(data_points), cex=0.8, font=2)
## legend('bottomright', 
##        pch=21, pt.cex=1.8,
##        ## pt.bg=c(rgb(255, 0, 0,   128, NULL, 255), 
##        ##       rgb(240, 180,  52, 128, NULL, 255),
##        ##       rgb(210, 222, 102, 128, NULL, 255),
##        ##       rgb(111, 222,  16, 128, NULL, 255)),
##         legend=c('endorsement'), 
##        cex=0.8, bty='n')
## }

## showEndorsements(filter(endorsement.df,trialtype=="win"))
