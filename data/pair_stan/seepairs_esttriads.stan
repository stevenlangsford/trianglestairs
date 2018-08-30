data{
  int N;
  real diff[N]; //value1 - value2, standardized. Is this appropriate input?
  int choice[N]; //1,2,3 === <,=,>

  //Triad info:
  int hm_triads;
  vector[3] calcobs[hm_triads]; //true values, ie this supplies the mu, sigma estimated from pairs.
  int hm_ordobs;
  int trialid[hm_ordobs];
  int option1id[hm_ordobs];
  int option2id[hm_ordobs];
  int ord_status[hm_ordobs];
}
parameters{
  real<lower=0> sigma; //single-ppnt version: consider hierarchical to pool over ppnts!
  real<lower=0> tolerance; //sigma and tolerance estimated from pairs data, applied to triad predictions

  vector[3] estval[hm_triads];//triad option estimated values
  matrix[3,2] est_trial_option_attribute[hm_triads];
}
model{
  //pair vars
  vector[3] ordprob_status[N];//For pair discrimination

  //triad model
  for(atrial in 1:hm_triads){
    for(anoption in 1:3){
      for(anattribute in 1:2){
	est_trial_option_attribute[atrial, anoption, anattribute]~normal(0,1); //Prior. Better make sure all your input is on this scale.
      }
    }
  }//end init attribute ests

  //calculation observation:
  for(atrial in 1:hm_triads){
    for(anoption in 1:3){
      estval[atrial,anoption]~normal(calcobs[atrial],sigma); //Informed by true value: calcobs
      estval[atrial,anoption]~normal(est_trial_option_attribute[atrial,anoption,1]*est_trial_option_attribute[atrial,anoption,1]*0.5,sigma); //informs attr ests.
    }
  }
  //TODO: ordinal observation goes here
  
  //pair model
  sigma~student_t(3,0,1);//somewhat-heavy-tailed folded-t noise prior.
  tolerance~student_t(3,0,1); //What's a good prior for this?
  for(i in 1:N){
    ordprob_status[i,1] = normal_cdf(-tolerance,diff[i],sigma);
    ordprob_status[i,2] = normal_cdf(tolerance,diff[i],sigma)-ordprob_status[i,1];
    ordprob_status[i,3] = 1-normal_cdf(tolerance,diff[i],sigma);
    choice[i]~categorical(ordprob_status[i]);
  }
}

generated quantities{
  int triad_choice[hm_triads];
  //TODO generate a choice based on estval
  for( atrial in 1:hm_triads){
    triad_choice[atrial]=categorical_logit_rng(estval[atrial]); //this is softmax, consider ^alpha to shift towards hardmax.
  }
}//end gen quantities
