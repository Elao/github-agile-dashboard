const CLI = require('./CLI');
const Project = require('./GitHub/Project');
const Issue = require('./GitHub/Issue');
const HttpLoader = require('./Loader/HttpLoader');
const { green, yellow } = require('./Util/colors');

class GithubAgileDashboard {
    /**
     * @param {String} owner
     * @param {String} repo
     * @param {String} username
     * @param {String} password
     * @param {String} cacheDir
     * @param {String} command
     */
    constructor(owner, repo, username, password, cacheDir, command = 'status') {
        this.cli = new CLI('gad> ', [command]);
        this.loader = new HttpLoader(this.setProject.bind(this), owner, repo, username.trim(), password, cacheDir);
        this.user = username.trim();
        this.project = null;

        this.helpCommand = this.helpCommand.bind(this);
        this.statusCommand = this.statusCommand.bind(this);
        this.sprintCommand = this.sprintCommand.bind(this);
        this.sprintsCommand = this.sprintsCommand.bind(this);
        this.backlogCommand = this.backlogCommand.bind(this);
        this.reviewCommand = this.reviewCommand.bind(this);
        this.changelogCommand = this.changelogCommand.bind(this);
        this.estimateCommand = this.estimateCommand.bind(this);
        this.sumCommand = this.sumCommand.bind(this);

        this.loader.load();
    }

    /**
     * Init CLI (if not already done)
     */
    onInit() {
        if (!this.cli.ready) {
            this.cli.on('status', this.statusCommand);
            this.cli.on('sprint', this.sprintCommand, { sprint: 0 });
            this.cli.on('sprints', this.sprintsCommand, { limit: null });
            this.cli.on('backlog', this.backlogCommand);
            this.cli.on('review', this.reviewCommand);
            this.cli.on('changelog', this.changelogCommand, { sprint: 0, all: false });
            this.cli.on('estimate', this.estimateCommand);
            this.cli.on('sum', this.sumCommand, { label: null });
            this.cli.on('unknown', this.helpCommand);
            this.cli.on('refresh', this.loader.load);
            this.cli.on('reset', this.loader.reset);
            this.cli.setReady();
        }
    }

    /**
     * Load projet from data
     *
     * @param {Array} data
     */
    setProject(data) {
        this.project = new Project(data);
        this.statusCommand();
        this.onInit();
    }

    /**
     * Show the status of the repository
     */
    statusCommand() {
        const { pullRequests, issues } = this.project;

        this.cli.result(`✅  ${issues.size} issues and ${pullRequests.size} PR fetched.`);
    }

    /**
     * Show the state of the backlog
     */
    backlogCommand() {
        const milestones = this.project.getBacklogs();

        this.cli.result(milestones.map(milestone => '  ' + milestone.display()));
    }

    /**
     * Show the state of the current sprint
     */
    sprintCommand(options) {
        const { sprint } = options;
        this.cli.result(this.project.getSprint(sprint).display());
    }

    /**
     * Generate a markdown changelog of the current sprint
     */
    changelogCommand(options) {
        const { all, sprint } = options;
        this.cli.result(this.project.getSprint(sprint).displayChangelog(all));
    }

    /**
     * Show the state of all sprints
     */
    sprintsCommand(options) {
        const { limit } = options;
        const milestones = this.project.getSprints().reverse().slice(0, limit || undefined);
        this.cli.result(milestones.map(milestone => milestone.display()));
    }

    /**
     * Display PullRequest that are awaiting your review
     */
    reviewCommand() {
        const pullRequests = this.project.getPullRequestsAwaitingReview(this.user);
        const { length } = pullRequests;

        if (length === 0) {
            return this.cli.result('Nothing to review. Good job! 👍');
        }

        this.cli.result(
            [`🔍  ${green(length)} pull request(s) awaiting your review:`]
                .concat(pullRequests.map(pullRequest => '  ' + pullRequest.display()))
                .join('\r\n')
        );
    }

    /**
     * Show stories that are missing estimation
     */
    estimateCommand() {
        const issues = this.project.getIssuesMissingEstimation();
        const { length } = issues;

        if (length === 0) {
            return this.cli.result('Nothing to estimate. Good job! 👍');
        }

        this.cli.result(
            [`🔍  ${green(length)} issue(s) awaiting estimation:`]
                .concat(issues.map(issue => '  ' + issue.display()))
                .join('\r\n')
        );
    }

    /**
     * Calculate the sum of the stories matching the given filters
     */
    sumCommand(options) {
        const issues = this.project.getIssues(options);
        const { length } = issues;

        if (length === 0) {
            return this.cli.result('No issue matching the given filter.');
        }

        const points = issues.reduce(Issue.sum, 0);

        this.cli.result(
            [`= ${green(points)} pts in ${yellow(length)} issue(s).`]
                .join('\r\n')
        );
    }

    /**
     * Display help
     */
    helpCommand() {
        this.cli.result(`Available commands: ${Array.from(this.cli.commands.keys()).join(', ')}`);
    }
}

module.exports = GithubAgileDashboard;
