const DateUtil = require('../Util/DateUtil');

class Issue {
    /**
     * Create from GitHub API data
     *
     * @param {Object} data
     */
    static create(data) {
        const { id, number, state, labels, milestone, created_at, closed_at } = data;
        const { title, points } = this.parseTitle(data.title);

        return new this(parseInt(id, 10), parseInt(number, 10), title, points, state, labels, milestone, new Date(created_at), closed_at ? DateUtil.day(closed_at) : null);
    }

    /**
     * Parse title to extract points
     *
     * @param {String} title
     *
     * @return {Object}
     */
    static parseTitle(title) {
        const result = this.titleParser.exec(title);

        if (!result) {
            return { title, points: 0 };
        }

        return {
            title: result[1] + result[3],
            points: parseFloat(result[2].replace(',', '.')),
        };
    }

    /**
     * Title parser (extract points value)
     *
     * @return {RegExp}
     */
    static get titleParser() {
        return new RegExp('(.*)\\[([\\d\\.\\,]+)\\](.*)', 'gi');
    }

    constructor(id, number, title, points, state, labels, milestone, createdAt, closedAt) {
        this.id = id;
        this.number = number;
        this.title = title;
        this.points = points;
        this.state = state;
        this.labels = labels;
        this.milestone = milestone;
        this.createdAt = createdAt;
        this.closedAt = closedAt;
        this.pullRequest = null;

        if (this.milestone) {
            this.milestone.issues.push(this);
        }
    }

    static sum(sum, issue) {
        return sum + issue.points;
    }

    get status() {
        if (this.state === 'closed') {
            return 'done';
        }

        if (this.pullRequest) {
            return this.pullRequest.status;
        }

        return 'todo';
    }
}

module.exports = Issue;
