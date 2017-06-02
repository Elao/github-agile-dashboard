const Issue = require('./Issue');
const PullRequest = require('./PullRequest');
const Milestone = require('./Milestone');
const Label = require('./Label');

class Project {
    /**
     * @param {Array} data
     */
    constructor(data) {
        this.issues = new Map();
        this.pullRequests = new Map();
        this.labels = new Map();
        this.milestones = new Map();

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
        return Array.from(this.milestones.values())
            .find(milestone => milestone.isCurrent(date));
    }

    /**
     * Get all sprints
     *
     * @return {Milestone[]}
     */
    getSprints() {
        return Array.from(this.milestones.values()).filter(milestone => !milestone.isBacklog());
    }

    /**
     * Get all backlogs
     *
     * @return {Milestone[]}
     */
    getBacklogs() {
        return Array.from(this.milestones.values()).filter(milestone => milestone.isBacklog());
    }

    /**
     * Load issues and PR from Github API
     *
     * @param {Array} issues
     */
    load(issues) {
        issues.filter(data => typeof data.pull_request === 'undefined').forEach(this.loadIssue);
        issues.filter(data => typeof data.pull_request !== 'undefined').forEach(this.loadPullRequest);
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

        this.addPullRequest(PullRequest.create(Object.assign(data, { milestone, labels, issues })));
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
        let result;

        while ((result = PullRequest.issueParser.exec(body)) !== null) {
            const number = parseInt(result[2], 10);

            if (this.issues.has(number)) {
                issues.push(this.issues.get(number));
            } else {
                //console.error(`Issue #${number} not found for PR #${pullRequestNumber}`);
            }
        }

        return issues;
    }

    /**
     * Create Milestone for GithubAPI (or return existing Milestone)
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

        if (!this.milestones.has(id)) {
            this.milestones.set(id, Milestone.create(data));
        }

        return this.milestones.get(id);
    }

    /**
     * Create Label for GithubAPI (or return existing Label)
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
