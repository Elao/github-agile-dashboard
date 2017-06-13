const CLI = require('./CLI');
const Project = require('./GitHub/Project');
const HttpLoader = require('./Loader/HttpLoader');
const { green } = require('./Util/colors');

class GithubAgileDashboard {
    /**
     * @param {Sring} owner
     * @param {String} repo
     * @param {String} username
     * @param {String} password
     * @param {String} cacheDir
     * @param {Array} commands
     */
    constructor(owner, repo, username, password, cacheDir, commands = ['status']) {
        this.cli = new CLI('gad> ', commands);
        this.loader = new HttpLoader(this.setProject.bind(this), owner, repo, username.trim(), password, cacheDir);
        this.user = username.trim();
        this.project = null;

        this.helpCommand = this.helpCommand.bind(this);
        this.statusCommand = this.statusCommand.bind(this);
        this.sprintCommand = this.sprintCommand.bind(this);
        this.sprintsCommand = this.sprintsCommand.bind(this);
        this.backlogCommand = this.backlogCommand.bind(this);
        this.reviewCommand = this.reviewCommand.bind(this);

        this.loader.load();
    }

    /**
     * Init CLI (if not already done)
     */
    onInit() {
        if (!this.cli.ready) {
            this.cli.on('help', this.helpCommand);
            this.cli.on('status', this.statusCommand);
            this.cli.on('sprint', this.sprintCommand);
            this.cli.on('sprints', this.sprintsCommand);
            this.cli.on('backlog', this.backlogCommand);
            this.cli.on('review', this.reviewCommand);
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

    statusCommand() {
        const { pullRequests, issues } = this.project;

        this.cli.result(`✅  ${issues.size} issues and ${pullRequests.size} PR fetched.`);
    }

    backlogCommand() {
        const milestones = this.project.getBacklogs();

        this.cli.result(milestones.map(milestone => milestone.display()));
    }

    sprintCommand() {
        this.cli.result(this.project.getCurrentMilestone().display());
    }

    sprintsCommand() {
        const milestones = this.project.getSprints();

        this.cli.result(milestones.map(milestone => milestone.display()));
    }

    reviewCommand() {
        const pullRequests = this.project.getPullRequestsAwaitingReview(this.user);
        const { length } = pullRequests;

        if (length === 0) {
            return this.cli.result('Nothing to review. Good job! 👍');
        }

        this.cli.result([`🔍  ${green(length)} pull requests awaiting your review:`]
            .concat(pullRequests.map(pullRequest => pullRequest.display()))
            .join('\r\n'));
    }

    helpCommand() {
        this.cli.result(`Available commands: ${Array.from(this.cli.commands).join(', ')}`);
    }
}

module.exports = GithubAgileDashboard;
