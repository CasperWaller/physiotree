import { runSeed } from './seedLib.js';

// Körs vid uppstart i deploy: seedar bara om databasen är tom,
// så admin-ändringar aldrig skrivs över vid en ny deploy.
runSeed(true)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
