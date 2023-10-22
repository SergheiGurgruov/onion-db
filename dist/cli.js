import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { init } from './index.js';
process.argv[0] = "db";
yargs(hideBin(process.argv))
    .command(['init'], 'init the db', () => { }, () => {
    init();
})
    .parseSync();
