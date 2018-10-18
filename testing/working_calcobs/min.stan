data{
  int hm_stim; //individual observables, ie options, not trials.
  real calcobs[hm_stim];//of each option
  real calcobs_noise;// assume this fit is for one ppnt and they know own noise.
}
parameters{
  vector<lower=0>[2] est_option_attribute[hm_stim]; //don't care about trials yet.
}
model{
  for(i in 1:hm_stim){
    est_option_attribute[i,1]~normal(1,1.5);//prior
    est_option_attribute[i,2]~normal(1,1.5);//prior
    calcobs[i]~normal(est_option_attribute[i,1]*est_option_attribute[i,2]*0.5,calcobs_noise);//calcobs info constrains attribute estimates
  }
}
generated quantities{
  real estval[hm_stim];
  for(i in 1:hm_stim){
    estval[i]=est_option_attribute[i,1]*est_option_attribute[i,2]*0.5;
  }
}
