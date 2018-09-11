data{
  int N;
  real diff[N]; //value1 - value2, standardized. Is this appropriate input?
  int choice[N]; //1,2,3 === <,=,>
}
parameters{
  real<lower=0> sigma; //single-ppnt version: consider hierarchical to pool over ppnts!
  real<lower=0> tolerance;
}
model{
  vector[3] ordprob_status[N];
  sigma~student_t(3,0,1);//somewhat-heavy-tailed folded-t noise prior.
  tolerance~student_t(3,0,1); //What's a good prior for this?
  for(i in 1:N){
    ordprob_status[i,1] = normal_cdf(-tolerance,diff[i],sigma);
    ordprob_status[i,2] = normal_cdf(tolerance,diff[i],sigma)-ordprob_status[i,1];
    ordprob_status[i,3] = 1-normal_cdf(tolerance,diff[i],sigma);
    choice[i]~categorical(ordprob_status[i]);
      }
}
