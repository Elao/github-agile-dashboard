const GitHubApi = require('github');
const GitHubCache = require('github-cache');
const Project = require('../GitHub/Project');

class HttpLoader {
    /**
     * @param {Function} callback
     * @param {String} owner
     * @param {String} repo
     * @param {String} username
     * @param {String} password
     */
    constructor(callback, owner, repo, username, password) {
        this.callback = callback;
        this.owner = owner;
        this.repo = repo;
        this.username = username;
        this.password = password;
        this.page = 0;
        this.data = [];
        this.api = new GitHubCache(
            new GitHubApi({
                headers: { 'user-agent': 'GitHub-Agile-Dashboard' },
                validateCache: true,
                timeout: 5000,
                //followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
            }),
            {
                prefix: `${owner}/${repo}`,
                //cachedb: 'redis://',
            }
        );

        this.load = this.load.bind(this);
        this.onIssues = this.onIssues.bind(this);

        this.load();
    }

    static date(days = 0) {
        const date = new Date();

        date.setDate(date.getDate() + days);

        return date;
    }

    authenticate() {
        const { username, password } = this;

        this.api.api.authenticate({ type: 'basic', username, password });
    }

    load(state = 'all', per_page = 100, since = HttpLoader.date(-365)) {
        console.info(`⏳  Fetching issues...`);

        const { owner, repo } = this;
        const options = { owner, repo, state, per_page };

        if (since) {
            options.since = since;
        }

        this.authenticate();
        this.api.issues.getForRepo(options, this.onIssues);
    }

    onIssues(error, response) {
        if (error) {
            return console.error(error);
        }

        this.data = this.data.concat(response.data);

        if (this.api.api.hasNextPage(response)) {
            this.api.api.getNextPage(response, this.onIssues);
        } else {
            this.resolve();
        }
    }

    resolve() {
        this.callback(new Project(this.data));
    }
}

module.exports = HttpLoader;
