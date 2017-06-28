#!/usr/bin/env node

const { execSync } = require('child_process');
const { homedir } = require('os');
const minimist = require('minimist');
const GithubAgileDashboard = require('./src/GithubAgileDashboard');
const { red } = require('./src/Util/colors');

function lookup(command) { try { return execSync(command).toString().trim(); } catch (error) { return ''; } }
function remote(url) { return (new RegExp('git@github.com:(.+)\\/(.+)\\.git', 'ig').exec(url) || new Array(3).fill(null)).slice(1); }

process.on('uncaughtException', function onError(error) { console.error(red(error.message)); process.exit(1); });

const [defaultOwner, defaultRepo] = remote(lookup('git -C . config --get remote.origin.url'));
const { owner, repo, user, password, cacheDir, _: command} = minimist(process.argv.slice(2), {
    stopEarly: true,
    default: {
        owner: defaultOwner,
        repo: defaultRepo,
        user: lookup('git config --global github.user') || process.env.USER,
        password: lookup('git config --global github.token'),
        cacheDir: `${homedir()}/.gad/cache`
    },
    alias: {
        o: 'owner',
        r: 'repo',
        u: 'user',
        p: 'password',
        t: 'password',
        token: 'password',
        c: 'cacheDir',
    }
});

module.exports = new GithubAgileDashboard(owner, repo, user, password, cacheDir, command.join(' '));
