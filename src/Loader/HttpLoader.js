const GitHubApi = require('github');
const Cache = require('./Cache');

class HttpLoader {
    /**
     * @param {Function} callback
     * @param {String} owner
     * @param {String} repo
     * @param {String} username
     * @param {String} password
     * @param {String} cacheDir
     */
    constructor(callback, owner, repo, username, password, cacheDir) {
        this.callback = callback;
        this.owner = owner;
        this.repo = repo;
        this.credentials = { type: 'basic', username, password };
        this.data = [];
        this.cache = new Cache(owner, repo, cacheDir);
        this.api = new GitHubApi({
            headers: { 'user-agent': 'GitHub-Agile-Dashboard' },
            timeout: 5000,
            //followRedirects: false, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
        });

        this.load = this.load.bind(this);
        this.addIssue = this.addIssue.bind(this);
        this.onIssues = this.onIssues.bind(this);
    }

    /**
     * Authenticate against GitHub API
     */
    authenticate() {
        this.api.authenticate(this.credentials);
    }

    /**
     * Load data
     *
     * @param {String} state
     * @param {Number} per_page
     * @param {Date} since
     */
    load(state = 'all', per_page = 100, since = this.cache.lastModified) {
        console.info(`⏳  Fetching issues...`);

        this.data = this.cache.load();

        const { owner, repo } = this;
        const options = { owner, repo, state, per_page };

        if (since) {
            options.since = since;
        }

        this.authenticate();
        this.api.issues.getForRepo(options, this.onIssues);
    }

    /**
     * On issues received
     *
     * @param {Error} error
     * @param {Response} response
     */
    onIssues(error, response) {
        if (error) {
            return console.error(error);
        }

        response.data.forEach(this.addIssue);

        if (this.api.hasNextPage(response)) {
            this.api.getNextPage(response, this.onIssues);
        } else {
            this.resolve();
        }
    }

    /**
     * Add an issue to the list
     *
     * @param {Object} data
     */
    addIssue(data) {
        const index = this.data.findIndex(issue => issue.id === data.id);

        if (index === -1) {
            this.data.push(data);
        } else {
            this.data[index] = data;
        }
    }

    /**
     * Callback when done
     */
    resolve() {
        this.cache.save(this.data);
        this.callback(this.data);
    }
}

module.exports = HttpLoader;
