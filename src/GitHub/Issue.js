const DateUtil = require('../Util/DateUtil');
const { cyan, yellow } = require('../Util/colors');

class Issue {
    /**
     * Create from GitHub API data
     *
     * @param {Object} data
     */
    static create(data) {
        const { id, number, body, state, labels, milestone, created_at, closed_at } = data;
        const { title, points } = this.parseTitle(data.title);

        return new this(
            parseInt(id, 10),
            parseInt(number, 10),
            title.trim(),
            points,
            body,
            state,
            labels,
            milestone,
            DateUtil.day(created_at),
            closed_at ? DateUtil.day(closed_at) : null
        );
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
            return { title, points: null };
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

    /**
     * Sort issues by point (heavy top)
     *
     * @param {Issue} a
     * @param {Issue} b
     *
     * @return {Number}
     */
    static sortByPoint(a, b) {
        if (a.points === b.points) {
            return a.createdAt < b.createdAt ? 1 : -1;
        }

        return a.points < b.points ? 1 : -1;
    }

    constructor(id, number, title, points, body, state, labels, milestone, createdAt, closedAt) {
        this.id = id;
        this.number = number;
        this.title = title;
        this.points = points;
        this.body = body;
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
        return sum + (issue.points || 0);
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

    /**
     * Is story estimated?
     *
     * @return {Boolean}
     */
    isEstimated() {
        return this.points !== null;
    }

    /**
     * Display an issue
     *
     * @return {String}
     */
    display(full = false) {
        const { number, title, body, createdAt } = this;

        return `${cyan(number)} ${title} ${yellow(createdAt.toLocaleDateString())}${full ? '\r\n' + body : ''}`;
    }
}

module.exports = Issue;
