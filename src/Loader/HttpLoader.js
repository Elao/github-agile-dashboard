const fs = require('fs');
const GitHubApi = require('github');
const Project = require('../GitHub/Project');

class HttpLoader {
    /**
     * @param {Function} callback
     * @param {String} owner
     * @param {String} repo
     * @param {String} username
     * @param {String} password
     */
    constructor(callback, owner, repo, username, password, cache = './cache') {
        this.callback = callback;
        this.owner = owner;
        this.repo = repo;
        this.username = username;
        this.password = password;
        this.cache = cache;
        this.page = 0;
        this.data = [];
        this.api = new GitHubApi({
            headers: { 'user-agent': 'GitHub-Agile-Dashboard' },
            timeout: 5000,
            //followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
        });

        this.load = this.load.bind(this);
        this.onIssues = this.onIssues.bind(this);
    }

    static date(days = 0) {
        const date = new Date();

        date.setDate(date.getDate() + days);

        return date;
    }

    authenticate() {
        const { username, password } = this;

        this.api.authenticate({ type: 'basic', username, password });
    }

    load(state = 'all', per_page = 100, since = HttpLoader.date(-365)) {
        console.info(`⏳  Fetching issues...`);

        const { owner, repo } = this;
        const options = { owner, repo, state, per_page };

        if (since) {
            options.since = since;
        }

        this.authenticate();
        this.page = 0;
        this.api.issues.getForRepo(options, this.onIssues);
    }

    onIssues(error, response) {
        if (error) {
            return console.error(error);
        }

        if (this.cache) {
            fs.writeFileSync(`${this.cache}/issues.${this.getPage(response)}.json`, JSON.stringify(response, undefined, 2));
        }

        this.data = this.data.concat(response.data);

        if (this.api.hasNextPage(response)) {
            this.api.getNextPage(response, this.onIssues);
        } else {
            this.resolve();
        }
    }

    getPage(response) {
        const result = new RegExp('(\\&|\\?)page=(\\d+)', 'gi').exec(response.meta.link);

        return result ? result[2] : 1;
    }

    resolve() {
        this.callback(new Project(this.data));
    }
}

module.exports = HttpLoader;
