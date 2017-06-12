class Review {
    /**
     * Create from GitHub API data
     *
     * @param {Object} data
     */
    static create(data) {
        const { id, user, state } = data;

        return new Review(parseInt(id, 10), user.name, state.toLowerCase());
    }

    /**
     * @param {Number} id
     * @param {String} user
     * @param {String} state
     */
    constructor(id, user, state) {
        this.id = id;
        this.user = user;
        this.state = state;
    }
}

module.exports = Review;
