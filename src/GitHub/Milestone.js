const Issue = require('./Issue');
const BurnDownChart = require('../Display/BurnDownChart');
const DateUtil = require('../Util/DateUtil');
const { green, yellow } = require('../Util/colors');

class Milestone {
    /**
     * Create from GitHub API data
     *
     * @param {Object} data
     */
    static create(data) {
        const { id, title, description, state, created_at, due_on } = data;

        return new this(parseInt(id, 10), title.trim(), description, state, DateUtil.day(created_at), due_on ? DateUtil.day(due_on) : null);
    }

    /**
     * Sort milestones by date (old first)
     *
     * @param {Milestone} a
     * @param {Milestone} b
     *
     * @return {Number}
     */
    static sort(a, b) {
        if (a.dueOn < b.dueOn) {
            return -1;
        }

        if (a.dueOn > b.dueOn) {
            return 1;
        }

        return 0;
    }

    /**
     * @param {Number} id
     * @param {String} title
     * @param {String} description
     * @param {String} state
     * @param {Date} createdAt
     * @param {Date|null} dueOn
     */
    constructor(id, title, description, state, createdAt, dueOn) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.state = state;
        this.createdAt = createdAt;
        this.dueOn = dueOn;
        this.issues = [];
        this.pullRequests = [];
        this.previous = null;
    }

    get length() {
        return this.issues.length;
    }

    get points() {
        return this.issues.reduce(Issue.sum, 0);
    }

    get done() {
        return this.getIssueByStatus('done').reduce(Issue.sum, 0);
    }

    get inProgress() {
        return this.getIssueByStatus('in-progress').reduce(Issue.sum, 0);
    }

    get readyToReview() {
        return this.getIssueByStatus('ready-to-review').reduce(Issue.sum, 0);
    }

    get todo() {
        return this.getIssueByStatus('todo').reduce(Issue.sum, 0);
    }

    get progress() {
        return this.done / this.points;
    }

    get startAt() {
        return this.previous ? DateUtil.day(this.previous.dueOn, 1) : this.createdAt;
    }

    get days() {
        return Math.abs(Math.ceil((this.dueOn - this.startAt) / (1000 * 60 * 60 * 24)));
    }

    /**
     * Get all issues that match the given status
     *
     * @param {String} status
     *
     * @return {Issues[]}
     */
    getIssueByStatus(status) {
        return this.issues.filter(issue => issue.status === status);
    }

    getTodoAt(date) {
        return this.issues.filter(issue => !issue.closedAt || issue.closedAt > date).reduce(Issue.sum, 0);
    }

    /**
     * Does this Milestone correspond to the current sprint?
     *
     * @param {Date} date
     *
     * @return {Boolean}
     */
    isCurrent(date = DateUtil.day()) {
        return this.state === 'open'
            && this.dueOn
            && this.dueOn >= date;
    }

    /**
     * Does this Milestone correspond to the backlog?
     *
     * @return {Boolean}
     */
    isBacklog() {
        return !this.dueOn;
    }

    /**
     * Display the Milestone
     *
     * @return {String}
     */
    display() {
        return this.isBacklog() ? this.displayBacklog() : `${this.displaySprint()}\r\n\r\n${this.displayChart()}`;
    }

    /**
     * Display the Milestone as a Sprint
     *
     * @return {String}
     */
    displaySprint() {
        const { title, length, done, todo, inProgress, readyToReview, progress, points } = this;

        return [
            title,
            `${green(length)} stories`,
            `${yellow(points)} points`,
            `📉  ${(progress * 100).toFixed(2)}%`,
            `📫  ${todo}pts`,
            `🚧  ${inProgress}pts`,
            `🔍  ${readyToReview}pts`,
            `✅  ${done}pts`,
        ].join(' ・ ');
    }

    /**
     * Display the Milestone as a Backlog
     *
     * @return {String}
     */
    displayBacklog() {
        const { title, length, points } = this;

        return `${title} ・ 📇  ${green(length)} stories ・ ${yellow(points)} points`;
    }

    /**
     * Display the burndown chart
     *
     * @return {[type]}
     */
    displayChart() {
        return new BurnDownChart(this).display();
    }

    /**
     * Returns a changelog of the sprint
     *
     * @param {Boolean} all Display all issue (and not just those that are done)
     *
     * @return {Array}
     */
    displayChangelog(all = false) {
        const issues = all ? this.issues : this.getIssueByStatus('done');

        return [`# ${this.title}`, '## Changelog '].concat(
            issues
            .sort(Issue.sortByPoint)
            .map(issue => `- ${issue.title}`)
        ).join('\r\n');
    }

}

module.exports = Milestone;
