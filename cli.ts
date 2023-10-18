import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { init, insertOne } from './index.js';

process.argv[0] = "db";

yargs(hideBin(process.argv))
    .command(['init'], 'init the db', () => { }, () => {
        init()
    })
    .command(['test'], 'test insertion', () => { }, () => {
        insertOne('test', { name: 'test' })
    })
    .parseSync()