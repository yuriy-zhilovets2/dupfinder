#!/usr/bin/python3

from imagededup.methods import CNN
hasher = CNN()

sim = hasher.find_duplicates("../samples/set2", min_similarity_threshold=0.8)

for key in sim.keys():
  if len(sim[key]):
    print(key, " -- ", sim[key])
