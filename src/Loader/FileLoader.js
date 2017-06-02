const fs = require('fs');
const Project = require('../GitHub/Project');

class FileLoader {
    constructor(callback, path = './cache') {
        this.callback = callback;
        this.path = path;
        this.page = 0;
        this.data = [];

        this.load();
    }

    load() {
        let filename;

        while ((filename = `${this.path}/issues.${this.page++}.json`) && (fs.existsSync(filename))) {
            const response = JSON.parse(fs.readFileSync(filename));
            this.data = this.data.concat(response.data);
        }

        this.callback(new Project(this.data));
    }
}

module.exports = FileLoader;
