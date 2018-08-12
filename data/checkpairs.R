source("readin_data.R")

pairs.df$area_diff <- pairs.df$area1-pairs.df$area2
pairs.df$correct <- sapply(1:nrow(pairs.df),function(i){pairs.df[i,"areachosen"]==max(pairs.df[i,c("area1","area2")])})

#ggplot(pairs.df,aes(x=templatechosen))+geom_bar()+theme_bw()
ggplot(pairs.df,aes(x=templatechosen,fill=correct))+geom_bar()+theme_bw() #Expected: even bars, even error rates. OR even correct bars, uneven incorrect ones.

#summary(glm(positionchosen~area_diff+templatetype1+templatetype2,data=pairs.df,family=binomial(link='logit')))#does this make any sense? This can't be the best way to handle templatetype comparison. Consider also 'comparisontype' of both templates... but then have to link back to positionchosen in a consistent way? 
