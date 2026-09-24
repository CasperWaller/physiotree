import { runSeed } from './seedLib.js';

// Full seed (skriver över från content/). Kör: npm run seed
runSeed(true)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
