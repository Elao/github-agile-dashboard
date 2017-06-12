const fs = require('fs');

class Cache {
    /**
     * @param {String} owner
     * @param {String} repo
     * @param {String} directory
     */
    constructor(owner, repo, directory) {
        this.owner = owner;
        this.repo = repo;
        this.directory = directory;
        this.data = [];
    }

    get root() {
        return `${this.directory}/${this.owner}/${this.repo}`;
    }

    get path() {
        return `${this.root}/issues.json`;
    }

    get lastModified() {
        if (!fs.existsSync(this.path)) {
            return null;
        }

        return fs.statSync(this.path).mtime;
    }

    /**
     * Load data from cache
     *
     * @return {Array}
     */
    load() {
        this.ensureDirectoryExists(this.root);

        if (fs.existsSync(this.path)) {
            return JSON.parse(fs.readFileSync(this.path));
        }

        return [];
    }

    /**
     * Save data to cache
     *
     * @param {Array} data
     */
    save(data) {
        this.ensureDirectoryExists(this.root);
        fs.writeFileSync(this.path, JSON.stringify(data));
    }

    /**
     * Clear cache
     */
    clear() {
        fs.unlinkSync(this.path);
    }

    /**
     * Ensure directory exists (create it if not)
     *
     * @param {String} fullPath
     */
    ensureDirectoryExists(fullPath) {
        fullPath.split('/').reduce((path, directory) => {
            const local = `${path}/${directory}`;

            if (!fs.existsSync(local)) {
                fs.mkdirSync(local);
            }

            return local;
        }, '');
    }
}

module.exports = Cache;
