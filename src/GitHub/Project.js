const Issue = require('./Issue');
const PullRequest = require('./PullRequest');
const Milestone = require('./Milestone');
const Label = require('./Label');
const Review = require('./Review');

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
     * Get current milestone
     *
     * @param {Date} date
     *
     * @return {Milestone}
     */
    getCurrentMilestone(date = Date.now()) {
        return this.getSprints().find(milestone => milestone.isCurrent(date));
    }

    /**
     * Get all sprints
     *
     * @return {Milestone[]}
     */
    getSprints() {
        return this.milestones.sort(Milestone.sort).filter(milestone => !milestone.isBacklog());
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
     * @return {Array}
     */
    getPullRequestsAwaitingReview(user) {
        return Array.from(this.pullRequests.values())
            .filter(pullRequest => pullRequest.isAwaitingReview(user));
    }

    /**
     * Load issues and PR from Github API
     *
     * @param {Array} issues
     */
    load(issues) {
        issues.filter(data => typeof data.pull_request === 'undefined').forEach(this.loadIssue);
        issues.filter(data => typeof data.pull_request !== 'undefined').forEach(this.loadPullRequest);
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

        this.addPullRequest(PullRequest.create(Object.assign(data, { milestone, labels, issues, reviews })));
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
