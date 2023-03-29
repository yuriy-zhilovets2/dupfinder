#!/usr/bin/python3

import faiss
import numpy as np
from pathlib import Path

from imagededup.methods import CNN
hasher = CNN()

dir_path = Path("../samples/set2")
files = list(dir_path.glob("*.jpg"))

dim = 576
hashes = np.empty([len(files), dim], 'float32')

for i, file in enumerate(files):
  h = hasher.encode_image(file)[0]
  norm = np.linalg.norm(h)
  hashes[i] = h/norm
  
index = faiss.IndexFlatIP(dim)
index.add(hashes)

print("Searching...")

topn = 3
to_test = 39
D, I = index.search(hashes[:to_test], topn)  # Возвращает результат: Distances, Indices

for i in range(to_test):
  print(files[i], ":")
  for j in range(topn):
    if D[i,j] >= 0.8:
      print("-- ", files[I[i,j]], ": ", D[i,j])
