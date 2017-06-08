const DateUtil = require('../Util/DateUtil');

class PullRequest {
    /**
     * Create from GitHub API data
     *
     * @param {Object} data
     */
    static create(data) {
        const { id, number, title, state, user, labels, issues, created_at } = data;

        return new this(parseInt(id, 10), parseInt(number, 10), title, state, user, labels, issues, DateUtil.day(new Date(created_at)));
    }

    /**
     * Issue parser(extract issues number)
     *
     * @return {RegExp}
     */
    static get issueParser() {
        return new RegExp('(fixes|fixe|fix|close|closes) #(\\d+)', 'gi');
    }

    /**
     * @param {Number} id
     * @param {Number} number
     * @param {String} title
     * @param {String} state
     * @param {User} user
     * @param {Label[]} labels
     * @param {Array} issues
     * @param {Date} createdAt
     */
    constructor(id, number, title, state, user, labels, issues = [], createdAt) {
        this.id = id;
        this.number = number;
        this.title = title;
        this.state = state;
        this.user = user;
        this.labels = labels;
        this.issues = issues;
        this.createdAt = createdAt;

        if (this.issues) {
            this.issues.forEach(issue => {
                if (typeof issue !== 'number') {
                    issue.pullRequest = this;
                }
            });
        }
    }

    get status() {
        if (this.labels.find(label => label.status === 'in-progress')) {
            return 'in-progress';
        }

        if (this.labels.find(label => label.status === 'ready-to-review')) {
            return 'ready-to-review';
        }

        return 'in-progress';
    }
}

module.exports = PullRequest;
