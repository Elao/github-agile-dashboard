const Issue = require('./Issue');

class Milestone {
    /**
     * Create from GitHub API data
     *
     * @param {Object} data
     */
    static create(data) {
        const { id, title, description, state, created_at, due_on } = data;

        return new this(parseInt(id, 10), title, description, state, new Date(created_at), due_on ? new Date(due_on) : null);
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
    }

    get length() {
        return this.issues.length;
    }

    get points() {
        return this.issues.reduce(Issue.sum, 0);
    }

    get done() {
        return this.issues.filter(issue => issue.status === 'done').reduce(Issue.sum, 0);
    }

    get inProgress() {
        return this.issues.filter(issue => issue.status === 'in-progress').reduce(Issue.sum, 0);
    }

    get readyToReview() {
        return this.issues.filter(issue => issue.status === 'ready-to-review').reduce(Issue.sum, 0);
    }

    get todo() {
        return this.issues.filter(issue => issue.status === 'todo').reduce(Issue.sum, 0);
    }

    get progress() {
        return this.done / this.points;
    }

    /**
     * Does this Milestone correspond to the current sprint?
     *
     * @param {Date} date
     *
     * @return {Boolean}
     */
    isCurrent(date = Date.now()) {
        return this.state === 'open'
            && this.dueOn
            && this.dueOn.getTime() >= date;
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
        return this.isBacklog() ? this.displayBacklog() : this.displaySprint();
    }

    /**
     * Display the Milestone as a Sprint
     *
     * @return {String}
     */
    displaySprint() {
        const { title, length, done, todo, inProgress, readyToReview, progress } = this;

        return `${title}  ・ 📉  ${(progress * 100).toFixed(2)}% ・ 📫  ${todo}pts ・ 🚧  ${inProgress}pts ・ 🔍  ${readyToReview}pts ・ ✅  ${done}pts ・  (${length} stories)`;
    }

    /**
     * Display the Milestone as a Backlog
     *
     * @return {String}
     */
    displayBacklog() {
        const { title, length, points } = this;

        return `${title}  ・ 📇  ${length} stories ・ ${points} points`;
    }
}

module.exports = Milestone;
