#!/usr/bin/env node

const { execSync } = require('child_process');
function lookup(command) { try { return execSync(command).toString(); } catch (error) { return ''; } }
const result = new RegExp('git@github.com:(.+)\\/(.+)\\.git', 'ig').exec(lookup('git -C . config --get remote.origin.url'));
const { owner, repo, user, password, _: commands } = require('minimist')(process.argv.slice(2), {
    default: {
        owner: result ? result[1] : null,
        repo: result ? result[2] : null,
        user: lookup('git config --global github.user') || process.env.USER,
        password: process.env.GITHUB_PERSONAL_TOKEN,
    },
    alias: {
        o: 'owner',
        r: 'repo',
        u: 'user',
        p: 'password',
        t: 'password',
        token: 'password',
    }
});
new (require('./src/GithubAgileDashboard'))(owner, repo, user, password, commands);
