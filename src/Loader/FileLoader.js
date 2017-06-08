const fs = require('fs');
const Project = require('../GitHub/Project');

class FileLoader {
    constructor(callback, path = './cache') {
        this.callback = callback;
        this.path = path;
        this.data = [];

        this.load = this.load.bind(this);
    }

    load() {
        let filename;
        let page = 1;

        while ((filename = `${this.path}/issues.${page++}.json`) && (fs.existsSync(filename))) {
            this.data = this.data.concat(JSON.parse(fs.readFileSync(filename)).data);
        }

        this.callback(new Project(this.data));
    }
}

module.exports = FileLoader;
