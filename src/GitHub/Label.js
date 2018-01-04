class Label {
    /**
     * Create from GitHub API data
     *
     * @param {Object} data
     */
    static create(data) {
        const { id, name, color } = data;

        return new this(parseInt(id, 10), name.trim(), color);
    }

    /**
     * @param {Number} id
     * @param {String} name
     * @param {String} color
     */
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
    }

    get status() {
        switch (this.name.toLowerCase()) {
            case 'ready to review':
                return 'ready-to-review';

            case 'in progress':
                return 'in-progress';

            default:
                return null;
        }
    }
}

module.exports = Label;
