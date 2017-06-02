const CLI = require('./CLI');
const HttpLoader = require('./Loader/HttpLoader');

class GithubAgileDashboard {
    /**
     * @param {Sring} owner
     * @param {String} repo
     * @param {String} username
     * @param {String} password
     */
    constructor(owner, repo, username, password) {
        this.cli = new CLI('📉  GAD> ');
        this.project = null;

        this.setProject = this.setProject.bind(this);
        this.helpCommand = this.helpCommand.bind(this);
        this.statusCommand = this.statusCommand.bind(this);
        this.sprintCommand = this.sprintCommand.bind(this);
        this.sprintsCommand = this.sprintsCommand.bind(this);
        this.backlogCommand = this.backlogCommand.bind(this);

        this.cli.on('help', this.helpCommand);
        this.cli.on('status', this.statusCommand);
        this.cli.on('sprint', this.sprintCommand);
        this.cli.on('sprints', this.sprintsCommand);
        this.cli.on('backlog', this.backlogCommand);
        this.cli.on('unknown', this.helpCommand);

        this.cli.write(`⏳  Fetching issues...`);

        new HttpLoader(this.setProject, owner, repo, username, password);
    }

    setProject(project) {
        this.project = project;
        this.statusCommand();
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
