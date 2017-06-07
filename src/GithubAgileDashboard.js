const CLI = require('./CLI');
const HttpLoader = require('./Loader/HttpLoader');

class GithubAgileDashboard {
    /**
     * @param {Sring} owner
     * @param {String} repo
     * @param {String} username
     * @param {String} password
     * @param {Array} commands
     */
    constructor(owner, repo, username, password, commands = ['status']) {
        this.cli = new CLI('gad> ', commands);
        this.loader = new HttpLoader(this.setProject.bind(this), owner, repo, username, password);
        this.project = null;

        this.helpCommand = this.helpCommand.bind(this);
        this.statusCommand = this.statusCommand.bind(this);
        this.sprintCommand = this.sprintCommand.bind(this);
        this.sprintsCommand = this.sprintsCommand.bind(this);
        this.backlogCommand = this.backlogCommand.bind(this);
    }

    onInit() {
        if (!this.cli.ready) {
            this.cli.on('help', this.helpCommand);
            this.cli.on('status', this.statusCommand);
            this.cli.on('sprint', this.sprintCommand);
            this.cli.on('sprints', this.sprintsCommand);
            this.cli.on('backlog', this.backlogCommand);
            this.cli.on('unknown', this.helpCommand);
            this.cli.on('reset', this.loader.load);
            this.cli.setReady();
        }
    }

    setProject(project) {
        this.project = project;
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

    helpCommand() {
        this.cli.result(`Available commands: ${Array.from(this.cli.commands).join(', ')}`);
    }
}

module.exports = GithubAgileDashboard;
