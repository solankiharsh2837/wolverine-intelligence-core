# VeriDark Authorship Verification Dataset

## Overview
This directory contains ground-truth cross-forum text pairs used to train and evaluate classical stylometric baselines (character n-grams, word n-grams, function word distributions, punctuation profiles, and sentence length statistics).

## Data Leakage Prevention Policy
- **Author-Disjoint Splitting**: Author IDs in training splits MUST NEVER appear in validation or test splits.
- **Cross-Domain Evaluation**: Model generalization is benchmarked across distinct forum sources.
