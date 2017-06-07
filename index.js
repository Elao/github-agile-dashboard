#!/usr/bin/env node

const stdout = require('child_process').execSync('git -C . config --get remote.origin.url').toString();
const result = new RegExp('git@github.com:(.+)\\/(.+)\\.git', 'ig').exec(stdout);
const { owner, repo, user, password } = require('minimist')(process.argv.slice(2), {
    default: {
        owner: result ? result[1] : null,
        repo: result ? result[2] : null,
        user: process.env.USER,
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
