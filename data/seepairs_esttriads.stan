data{
  //pairs info
  int N;
  real diff[N]; //value1 - value2. Check the units are ok! (they should be on stan-scale, ie near 1)
  int choice[N]; //1,2,3 === <,=,> for order area1 vs area2

  //Triad info:
  int hm_triads;
  vector[3] calcobs[hm_triads]; //this is true values, should be turned into a noisy calcobs locally with noise level estimated from pairs?
  int hm_ordobs;
  int ord_trialid[hm_ordobs];
  int ord_option1[hm_ordobs];
  int ord_option2[hm_ordobs];
  int ord_attribute[hm_ordobs];
  real ord_status[hm_ordobs]; //passed as (acurate) difference in value, convert to discreet ordobs with reference to tolerance value, estimated from pairs.
}
parameters{
  real<lower=0> sigma; //single-ppnt version: consider hierarchical to pool over ppnts!
  real<lower=0> tolerance; //sigma and tolerance estimated from pairs data, applied to triad predictions

  vector[3] estval[hm_triads];//triad option estimated values
  matrix[3,2] est_trial_option_attribute[hm_triads];
}
model{
  //pair vars
  vector[3] ordprob_pairs[N];//For pair discrimination
  vector[3] ordprob_triads[hm_ordobs];//for generating triad predictions.
  
  //pair model
  sigma~student_t(3,0,1);//somewhat-heavy-tailed folded-t noise prior. Ok?
  tolerance~student_t(3,0,1); //Um. What's a good prior for this?
  for(i in 1:N){
    ordprob_pairs[i,1] = normal_cdf(-tolerance,diff[i],sigma);
    ordprob_pairs[i,2] = normal_cdf(tolerance,diff[i],sigma)-ordprob_pairs[i,1];
    ordprob_pairs[i,3] = 1-normal_cdf(tolerance,diff[i],sigma);
    choice[i]~categorical(ordprob_pairs[i]);
  }
  
  //triad model
  for(atrial in 1:hm_triads){
    for(anoption in 1:3){
      for(anattribute in 1:2){
	est_trial_option_attribute[atrial, anoption, anattribute]~normal(1,1.5); //Prior. Better make sure all your input is on this scale? needs closer examination, this one. Should be limited to >0?
      }
    }
  }//end init attribute ests

  //calculation observation:
  for(atrial in 1:hm_triads){
    for(anoption in 1:3){
      estval[atrial,anoption]~normal(calcobs[atrial],sigma); //calcobs is (noisily) informed by true value
      estval[atrial,anoption]~normal(est_trial_option_attribute[atrial,anoption,1]*est_trial_option_attribute[atrial,anoption,1]*0.5,sigma); //calcobs (noisily) constrains attribute estimates.
    }
  }
  //ordinal observation:
  //ord_status in data is a diff number: up to you to check tolerance and decide if it's coded as <,=, or >.
  for(anobs in 1:hm_ordobs){
    //prob of status '<': phi(-tolerance) (note fudge factor, there to prevent 0 prob of actual status for fringe ests)
    ordprob_triads[anobs,1]=0.001+normal_cdf(-tolerance,est_trial_option_attribute[ord_trialid[anobs],ord_option1[anobs],ord_attribute[anobs]]-est_trial_option_attribute[ord_trialid[anobs],ord_option2[anobs],ord_attribute[anobs]],sigma);
    //prob of status '=':phi(tolerance)-phi(-tolerance)
    ordprob_triads[anobs,2]=0.001+normal_cdf(tolerance,est_trial_option_attribute[ord_trialid[anobs],ord_option1[anobs],ord_attribute[anobs]]-est_trial_option_attribute[ord_trialid[anobs],ord_option2[anobs],ord_attribute[anobs]],sigma)-ordprob_triads[anobs,1];
    //prob of status '>': 1-phi(tolerance)
    ordprob_triads[anobs,3]=0.001+1-normal_cdf(tolerance,est_trial_option_attribute[ord_trialid[anobs],ord_option1[anobs],ord_attribute[anobs]]-est_trial_option_attribute[ord_trialid[anobs],ord_option2[anobs],ord_attribute[anobs]],sigma);

    ordprob_triads[anobs] = ordprob_triads[anobs]/sum(ordprob_triads[anobs]); //normalize necessary after adding fudge factor...
        target += categorical_lpmf(fabs(ord_status[anobs])<tolerance ? 2 : ord_status[anobs] < 0 ? 1 : 3 | ordprob_triads[anobs]);//Before the pipe:  true relation between options 1 & 2 on target attribute {1:'<',2:'=',3:'>'}, passed in as data. After pipe: the probability of each outcome given the current attribute estimates. Results in a reward being added to target when ests are consistent with true ordinal relations.
  }//end for each ordobs
  
}//end model block

generated quantities{
  int triad_choice[hm_triads];
  //TODO generate a choice based on estval
  for( atrial in 1:hm_triads){
    triad_choice[atrial]=categorical_logit_rng(estval[atrial]); // consider ^alpha to shift towards hardmax, arbitrary?
  }
}//end gen quantities
