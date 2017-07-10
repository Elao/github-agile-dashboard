const DateUtil = require('../Util/DateUtil');
const { cyan, yellow } = require('../Util/colors');

class PullRequest {
    /**
     * Create from GitHub API data
     *
     * @param {Object} data
     */
    static create(data) {
        const { id, number, title, state, user, labels, issues, reviews, created_at } = data;

        return new this(
            parseInt(id, 10),
            parseInt(number, 10),
            title.trim(),
            state,
            user.login,
            labels,
            issues,
            reviews,
            DateUtil.day(created_at)
        );
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
     * @param {Issue[]} issues
     * @param {Date} createdAt
     */
    constructor(id, number, title, state, user, labels, issues = [], reviews = [], createdAt) {
        this.id = id;
        this.number = number;
        this.title = title;
        this.state = state;
        this.user = user;
        this.labels = labels;
        this.issues = issues;
        this.reviews = reviews;
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
        if (this.labels.some(label => label.status === 'in-progress')) {
            return 'in-progress';
        }

        if (this.labels.some(label => label.status === 'ready-to-review')) {
            return 'ready-to-review';
        }

        return this.state === 'open' ? 'in-progress' : 'done';
    }

    isOpenAt(date) {
        return this.createdAt <= date;
    }

    /**
     * Display the Pull Request
     *
     * @return {String}
     */
    display() {
        const { number, title, user } = this;

        return `${cyan(number)} by ${yellow(user)} "${title}"`;
    }

    /**
     * Is this pull request awaiting review from the given user?
     *
     * @param {String} user
     *
     * @return {Boolean}
     */
    isAwaitingReview(user) {
        // Merged
        if (this.state === 'closed') {
            return false;
        }

        // Not ready to review yet
        if (!this.labels.some(label => label.status === 'ready-to-review')) {
            return false;
        }

        // Submitted by the user
        if (this.user === user) {
            return false;
        }

        // Not reviewed yet by the user
        return !this.reviews.some(review => review.user === user);
    }
}

module.exports = PullRequest;
