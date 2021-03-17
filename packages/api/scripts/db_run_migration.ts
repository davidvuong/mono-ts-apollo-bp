/* eslint-disable no-console */
import { getDefaultDatabaseConfig, migrateDatabase } from '../src/__tests__/Repository';
import { logger } from '../src/common/logger';

const main = async () => {
  const config = getDefaultDatabaseConfig({
    name: 'monots',
    username: 'postgres',
    password: 'password',
  });

  try {
    const { stdout, stderr } = await migrateDatabase(config);
    console.log(stdout);
    if (stderr) {
      console.log(stderr);
    }
    logger.info('Successful! 🎉');
  } catch (err) {
    console.log('Failed to execute database migration');
    console.log(err.stdout);
    console.log(err.stderr);
  }
};

main();
