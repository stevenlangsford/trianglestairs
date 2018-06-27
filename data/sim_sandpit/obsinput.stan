data{
  int hm_trials;

  int hm_options;
  int hm_attributes;
  int hm_calcobs; 
  int hm_ordobs;

  int ord_trialid[hm_ordobs];
  int ord_option1[hm_ordobs];
  int ord_option2[hm_ordobs];
  int ord_attribute[hm_ordobs];
  int ord_value[hm_ordobs]; //true ord relations, coded 1='<',2='=',3='>'
  real ord_noisesd[hm_ordobs];
  real ord_tolerance[hm_ordobs];

  int calc_trialid[hm_calcobs];
  int calc_optionid[hm_calcobs];
  real calc_noisesd[hm_calcobs];
  real calc_value[hm_calcobs];
}

parameters{
  matrix<lower=0>[hm_options,hm_attributes] est_trial_option_attribute[hm_trials];//beware that lower bound. Placeholder priors, need some consideration here.
  vector[hm_options] calcobs[hm_trials];

}

model{
  vector[3] ordprob_status[hm_ordobs];
  //populate attributes from priors:
  for(atrial in 1:hm_trials){
    for(anoption in 1:hm_options){
      for(anattribute in 1:hm_attributes){
	est_trial_option_attribute[atrial,anoption,anattribute]~normal(0,1); //attribute priors: was N(0,1)
      }
    }
  }

  //apply the calculation observation
  for(anobs in 1:hm_calcobs){
    calcobs[calc_trialid[anobs],calc_optionid[anobs]]~normal(est_trial_option_attribute[calc_trialid[anobs],calc_optionid[anobs],1]*est_trial_option_attribute[calc_trialid[anobs],calc_optionid[anobs],2],calc_noisesd[anobs]);//est-calcobs consistency is good
    calcobs[calc_trialid[anobs],calc_optionid[anobs]]~normal(calc_value[anobs],calc_noisesd[anobs]);//truth-calcobs consistency is good
  }

  //apply the ordinal observation
  for(anobs in 1:hm_ordobs){
    //prob of status '<': phi(-tolerance) (note fudge factor, there to prevent 0 prob of actual status for fringe ests)
    ordprob_status[anobs,1]=0.001+normal_cdf(-ord_tolerance[anobs],est_trial_option_attribute[ord_trialid[anobs],ord_option1[anobs],ord_attribute[anobs]]-est_trial_option_attribute[ord_trialid[anobs],ord_option2[anobs],ord_attribute[anobs]],ord_noisesd[anobs]);
    //prob of status '=':phi(tolerance)-phi(-tolerance)
    ordprob_status[anobs,2]=0.001+normal_cdf(ord_tolerance[anobs],est_trial_option_attribute[ord_trialid[anobs],ord_option1[anobs],ord_attribute[anobs]]-est_trial_option_attribute[ord_trialid[anobs],ord_option2[anobs],ord_attribute[anobs]],ord_noisesd[anobs])-ordprob_status[anobs,1];
    //prob of status '>': 1-phi(tolerance)
    ordprob_status[anobs,3]=0.001+1-normal_cdf(ord_tolerance[anobs],est_trial_option_attribute[ord_trialid[anobs],ord_option1[anobs],ord_attribute[anobs]]-est_trial_option_attribute[ord_trialid[anobs],ord_option2[anobs],ord_attribute[anobs]],ord_noisesd[anobs]);

    ordprob_status[anobs] = ordprob_status[anobs]/sum(ordprob_status[anobs]); //normalize necessary after adding fudge factor...
    target += categorical_lpmf(ord_value[anobs] | ordprob_status[anobs]);//Before the pipe:  true relation between options 1 & 2 on target attribute {1:'<',2:'=',3:'>'}, passed in as data. After pipe: the probability of each outcome given the current attribute estimates. Results in a reward being added to target when ests are consistent with true ordinal relations.
  }//end for each ordobs
  
}//end model

generated quantities{
  int generated_choice[hm_trials];//required: return value.
  vector[hm_options] estval_tracker[hm_trials];//required to generate choices
  vector[3] ordprob_status_tracker[hm_ordobs]; //diag only, for inspection
  for(atrial in 1:hm_trials){
    for(anoption in 1:hm_options){
      estval_tracker[atrial,anoption]= (est_trial_option_attribute[atrial,anoption,1]*est_trial_option_attribute[atrial,anoption,2]*10)^5;//note extremification
    }
    generated_choice[atrial]=categorical_logit_rng(estval_tracker[atrial]);
  }

  //diag ordobs tracker, mirrors model code.
    for(anobs in 1:hm_ordobs){
    //prob of status '<': phi(-tolerance)
    ordprob_status_tracker[anobs,1]=normal_cdf(-ord_tolerance[anobs],est_trial_option_attribute[ord_trialid[anobs],ord_option1[anobs],ord_attribute[anobs]]-est_trial_option_attribute[ord_trialid[anobs],ord_option2[anobs],ord_attribute[anobs]],ord_noisesd[anobs]);
    //prob of status '=':phi(tolerance)-phi(-tolerance)
    ordprob_status_tracker[anobs,2]=normal_cdf(ord_tolerance[anobs],est_trial_option_attribute[ord_trialid[anobs],ord_option1[anobs],ord_attribute[anobs]]-est_trial_option_attribute[ord_trialid[anobs],ord_option2[anobs],ord_attribute[anobs]],ord_noisesd[anobs])-ordprob_status_tracker[anobs,1];
    //prob of status '>': 1-phi(tolerance)
    ordprob_status_tracker[anobs,3]=1-normal_cdf(ord_tolerance[anobs],est_trial_option_attribute[ord_trialid[anobs],ord_option1[anobs],ord_attribute[anobs]]-est_trial_option_attribute[ord_trialid[anobs],ord_option2[anobs],ord_attribute[anobs]],ord_noisesd[anobs]);
    }
    
}
