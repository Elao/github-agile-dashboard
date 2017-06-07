#!/usr/bin/env node

const { execSync } = require('child_process');
const remote = execSync('git -C . config --get remote.origin.url').toString();
const result = new RegExp('git@github.com:(.+)\\/(.+)\\.git', 'ig').exec(remote);
const { owner, repo, user, password } = require('minimist')(process.argv.slice(2), {
    default: {
        owner: result ? result[1] : null,
        repo: result ? result[2] : null,
        user: execSync('git config --global github.user').toString() || process.env.USER,
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
new (require('./src/GithubAgileDashboard'))(owner, repo, user, password);
