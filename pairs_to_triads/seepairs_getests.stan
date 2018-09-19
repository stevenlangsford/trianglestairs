data{
  //pairs info
  int N;
  real diff[N]; //value1 - value2. Check the units are ok! (they should be on stan-scale, ie near 1)
  int choice[N]; //1,2,3 === <,=,> for order area1 vs area2
}
parameters{
  real<lower=0> sigma; //single-ppnt version: consider hierarchical to pool over ppnts!
  real<lower=0> tolerance; //sigma and tolerance estimated from pairs data, applied to triad predictions
}
model{
  //pair vars
  vector[3] ordprob_pairs[N];//For pair discrimination
  
  //pair model
  sigma~student_t(3,0,1);//somewhat-heavy-tailed folded-t noise prior. Ok?
  tolerance~student_t(3,0,1); //Um. What's a good prior for this?
  for(i in 1:N){
    ordprob_pairs[i,1] = normal_cdf(-tolerance,diff[i],sigma);
    ordprob_pairs[i,2] = normal_cdf(tolerance,diff[i],sigma)-ordprob_pairs[i,1];
    ordprob_pairs[i,3] = 1-normal_cdf(tolerance,diff[i],sigma);
    choice[i]~categorical(ordprob_pairs[i]);
  }

}//end model block
