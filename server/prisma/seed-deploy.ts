import { runSeed } from './seedLib.js';

// Körs vid varje deploy: additivt – lägger bara till nya regioner/tester/
// diagnoser och rör aldrig befintliga rader (admin-ändringar bevaras).
runSeed(false)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
