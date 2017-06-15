#!/usr/bin/env node

const { execSync } = require('child_process');
const { homedir } = require('os');

function lookup(command) { try { return execSync(command).toString().trim(); } catch (error) { return ''; } }
function remote(url) { return new RegExp('git@github.com:(.+)\\/(.+)\\.git', 'ig').exec(url) || [null, null]; }

const [defaultOwner, defaultRepo] = remote(lookup('git -C . config --get remote.origin.url'));
const { owner, repo, user, password, cacheDir, _: commands} = require('minimist')(process.argv.slice(2), {
    default: {
        owner: defaultOwner,
        repo: defaultRepo,
        user: lookup('git config --global github.user') || process.env.USER,
        password: lookup('git config --global github.token'),
        cacheDir: `${__dirname}/cache`
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

module.exports = new (require('./src/GithubAgileDashboard'))(owner, repo, user, password, cacheDir, commands);
