library(tidyverse)
library(rstan)
library(shinystan)
rm(list=ls())

load("pair_stan/test_area.RData")

mysamples <- as.data.frame(extract(area.est),permuted=TRUE)
