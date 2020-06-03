# dgraph-load-test

Testing Dgraph's bulk loading performance. 

# Note

1. This was built in a few hours and initially it was meant for a small machine so there's no multi-threading with workers.
2. The branch `multicore` is not ready for use.
3. The file `genJSONs.ts` is also not ready for use.

# Usage

1. Just clone this repository and run `yarn`.
2. Then run `genRDFs.ts` with [`tsnode`](https://github.com/TypeStrong/ts-node) (you can install this globally) and the node program will write RDFs into files in the `dist` folder.
