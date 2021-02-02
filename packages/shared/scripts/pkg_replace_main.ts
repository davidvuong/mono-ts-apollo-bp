import fs from 'fs';

const main = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const pkg = require('../package.json');
  pkg.main = './build/index.js';
  pkg.types = './build/index.d.ts';

  fs.writeFileSync(`${__dirname}/../package.json`, JSON.stringify(pkg, null, 2));
};

main();
