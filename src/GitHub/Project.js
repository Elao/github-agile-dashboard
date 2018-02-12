const Issue = require('./Issue');
const PullRequest = require('./PullRequest');
const Milestone = require('./Milestone');
const Label = require('./Label');
const Review = require('./Review');
const DateUtil = require('../Util/DateUtil');

class Project {
    /**
     * @param {Array} data
     */
    constructor(data) {
        this.issues = new Map();
        this.pullRequests = new Map();
        this.labels = new Map();
        this.milestones = [];

        this.fetchLabel = this.fetchLabel.bind(this);
        this.fetchMilestone = this.fetchMilestone.bind(this);
        this.loadIssue = this.loadIssue.bind(this);
        this.loadPullRequest = this.loadPullRequest.bind(this);

        this.load(data);
    }

    /**
     * Get sprint by index
     *
     * @param {Number} index If null: current sprint. If negative: previous sprint from current. If position: number of the sprint.
     * @param {Date} date
     *
     * @return {Milestone}
     */
    getSprint(number = null, date = DateUtil.day()) {
        const sprints = this.getSprints();

        if (!number) {
            return sprints.find(milestone => milestone.isCurrent(date));
        }

        if (number > 0) {
            if (typeof sprints[number - 1] === 'undefined') {
                throw new Error(`No sprint ${number}: only ${sprints.length} sprints found.`);
            }

            return sprints[number - 1];
        } else {
            const date = DateUtil.day();
            const current = sprints.findIndex(milestone => milestone.isCurrent(date));

            if (typeof sprints[current + number] === 'undefined') {
                throw new Error(`No sprint ${number}.`);
            }

            return sprints[current + number];
        }
    }

    /**
     * Get all sprints
     *
     * @return {Milestone[]}
     */
    getSprints() {
        return this.milestones.filter(milestone => !milestone.isBacklog());
    }

    /**
     * Get all backlogs
     *
     * @return {Milestone[]}
     */
    getBacklogs() {
        return this.milestones.filter(milestone => milestone.isBacklog());
    }

    /**
     * Get Pull Requests that are awaiting review from the given user
     *
     * @param {String} user
     *
     * @return {PullRequest[]}
     */
    getPullRequestsAwaitingReview(user) {
        return Array.from(this.pullRequests.values())
            .filter(pullRequest => pullRequest.isAwaitingReview(user));
    }

    /**
     * Get all issues
     *
     * @param {Object} filters
     *
     * @return {Array}
     */
    getIssues(filters = {}) {
        const { label } = filters;
        let issues = Array.from(this.issues.values());

        if (label) {
            issues = issues.filter(issue => issue.hasLabel(label));
        }

        return issues;
    }

    /**
     * Get Issues that are missing an estimation
     *
     * @return {Array}
     */
    getIssuesMissingEstimation() {
        return Array.from(this.issues.values())
            .filter(issue => issue.status === 'todo' && !issue.isEstimated());
    }

    /**
     * Load issues and PR from Github API
     *
     * @param {Array} issues
     */
    load(issues) {
        issues.filter(data => typeof data.pull_request === 'undefined').forEach(this.loadIssue);
        issues.filter(data => typeof data.pull_request !== 'undefined').forEach(this.loadPullRequest);
        this.milestones.sort(Milestone.sort);
        this.getSprints().forEach((milestone, index, sprints) => milestone.previous = sprints[index - 1] || null);
    }

    /**
     * Load issue from GitHub API
     *
     * @param {Object} data
     */
    loadIssue(data) {
        const milestone = this.fetchMilestone(data.milestone);
        const labels = data.labels.map(this.fetchLabel);

        this.addIssue(Issue.create(Object.assign(data, { milestone, labels })));
    }

    /**
     * Load pull request from GitHub API
     *
     * @param {Object} data
     */
    loadPullRequest(data) {
        const milestone = this.fetchMilestone(data.milestone);
        const labels = data.labels.map(this.fetchLabel);
        const issues = this.fetchIssues(data.body, data.number);
        const reviews = data.reviews ? data.reviews.map(Review.create) : [];

        const pullRequest = this.addPullRequest(PullRequest.create(Object.assign(data, { milestone, labels, issues, reviews })));
        const { title, points } = Issue.parseTitle(pullRequest.title);


        if (points !== null) {
            const { id, number, state, labels, createdAt } = pullRequest;
            pullRequest.title = title;
            this.addIssue(new Issue(id, number, title, points, data.body, state, labels, milestone, createdAt, null, pullRequest));
        }
    }

    /**
     * Fetch issues closed/fixed by a PR
     *
     * @param {String} body
     * @param {Number} pullRequestNumber
     *
     * @return {Array}
     */
    fetchIssues(body, pullRequestNumber) {
        const issues = [];
        const { issueParser } = PullRequest;
        let result;

        while ((result = issueParser.exec(body)) !== null) {
            const number = parseInt(result[2], 10);

            if (this.issues.has(number)) {
                issues.push(this.issues.get(number));
            } else {
                console.error(`Issue #${number} not found for PR #${pullRequestNumber}`);
            }
        }

        return issues;
    }

    /**
     * Create Milestone from Github API (or return existing Milestone)
     *
     * @param {Object} data
     *
     * @return {Milestone}
     */
    fetchMilestone(data) {
        if (!data) {
            return null;
        }

        const { id } = data;
        let milestone = this.milestones.find(milestone => id === milestone.id);

        if (!milestone) {
            milestone = Milestone.create(data);
            this.milestones.push(milestone);
        }

        return milestone;
    }

    /**
     * Create Label from Github API (or return existing Label)
     *
     * @param {Object} data
     *
     * @return {Label}
     */
    fetchLabel(data) {
        const { id } = data;

        if (!this.labels.has(id)) {
            this.labels.set(id, Label.create(data));
        }

        return this.labels.get(id);
    }

    /**
     * Add an issue
     *
     * @param {Issue} issue
     */
    addIssue(issue) {
        this.issues.set(issue.number, issue);
    }

    /**
     * Add a Pull Request
     *
     * @param {PullRequest} pullRequest
     */
    addPullRequest(pullRequest) {
        this.pullRequests.set(pullRequest.number, pullRequest);

        return pullRequest;
    }

    /**
     * Clear all data
     */
    clear() {
        this.issues.clear();
        this.pullRequests.clear();
        this.milestones.clear();
        this.labels.clear();
    }
}

module.exports = Project;
