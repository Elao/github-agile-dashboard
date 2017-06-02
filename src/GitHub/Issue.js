const titleParser = new RegExp('(.+)\\[([\\d\\.,]+)\\](.*)', 'gi');

class Issue {
    /**
     * Create from GitHub API data
     *
     * @param {Object} data
     */
    static create(data) {
        const { id, number, state, labels, milestone, created_at } = data;
        const { title, points } = this.parseTitle(data.title);

        return new this(parseInt(id, 10), parseInt(number, 10), title, points, state, labels, milestone, new Date(created_at));
    }

    /**
     * Parse title to extract points
     *
     * @param {String} title
     *
     * @return {Object}
     */
    static parseTitle(title) {
        const result = Issue.titleParser.exec(title);

        if (!result) {
            return { title, points: 0 };
        }

        return {
            title: result[1] + result[1],
            points: parseFloat(result[2].replace(',', '.')),
        };
    }

    static get titleParser() { return titleParser; }

    constructor(id, number, title, points, state, labels, milestone, createdAt) {
        this.id = id;
        this.number = number;
        this.title = title;
        this.points = points;
        this.state = state;
        this.labels = labels;
        this.milestone = milestone;
        this.createdAt = createdAt;
        this.pullRequest = null;

        if (this.milestone) {
            this.milestone.issues.push(this);
        }
    }

    static sum(sum, issue) {
        return sum + issue.points;
    }

    get status() {
        if (this.pullRequest) {
            return this.pullRequest.status;
        }

        return this.state === 'open' ? 'todo' : 'done';
    }
}

module.exports = Issue;
