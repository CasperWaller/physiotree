import { runSeed } from './seedLib.js';

// Full seed (manuell). Kör: npm run seed
runSeed(false)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
