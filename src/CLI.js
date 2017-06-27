const EventEmitter = require('events');
const Readline = require('readline');
const minimist = require('minimist');

class CLI extends EventEmitter {
    /**
     * Reserved commands
     */
    static get RESERVED() { return ['unknown']; }

    /**
     * @param {String} prompt
     * @param {Array} commandStack command stack
     */
    constructor(prompt = '', commandStack = []) {
        super();

        const { stdin, stdout } = process;

        this.commands = new Map();
        this.readline = Readline.createInterface({ input: stdin, output: stdout, prompt });
        this.commandStack = commandStack;
        this.ready = false;

        this.onClose = this.onClose.bind(this);
        this.onLine = this.onLine.bind(this);
        this.onLineStack = this.onLineStack.bind(this);
        this.close = this.close.bind(this);

        this.readline.on('close', this.onClose);
        this.readline.on('line', this.onLineStack);

        this.on('exit', this.close);
    }

    /**
     * Register a new command
     *
     * @param {String} name
     * @param {Function} callback
     * @param {Object} options
     */
    on(name, callback, options = {}) {
        super.on(name, callback);

        if (CLI.RESERVED.indexOf(name) < 0) {
            this.commands.set(name, { default: options, alias: this.getAlias(options) });
        }
    }

    /**
     * Create alias automatically
     *
     * @param {Object} options
     *
     * @return {Object}
     */
    getAlias(options) {
        const alias = {};

        Object.keys(options).forEach(option => alias[option[0]] = option);

        return alias;
    }

    /**
     * Mark as ready
     */
    setReady() {
        if (!this.ready) {
            this.ready = true;

            this.readline.removeListener('line', this.onLineStack);
            this.readline.on('line', this.onLine);

            let line;

            while (line = this.commandStack.shift()) {
                this.readline.prompt();
                this.readline.write(`${line.trim()}\r\n`);
            }
        }
    }

    /**
     * Write a message
     *
     * @param {String} message
     */
    write(message) {
        console.info(message);
    }

    /**
     * Display command result
     */
    result(message) {
        this.write('\r\n' + (typeof message === 'string' ? message : message.join('\r\n')) + '\r\n');
        setImmediate(this.close);
    }

    /**
     * Close the CLI
     */
    close() {
        process.exit(0);
    }

    /**
     * Get the command corresponding to the given user input
     *
     * @param {String} input
     *
     * @return {String}
     */
    getCommand(input) {
        const [ command, ...options] = input.split(' ');

        if (!this.commands.has(command)) {
            return { command: 'unknown' };
        }

        return { command, options: minimist(options, this.commands.get(command)) };
    }

    /**
     * Stack commands that occur before ready
     *
     * @param {String} line
     */
    onLineStack(line) {
        this.commandStack.push(line);
    }

    /**
     * When a new user input occur
     *
     * @param {String} line
     */
    onLine(line) {
        const { command, options } = this.getCommand(line);

        this.emit(command || 'unknown', options);
    }

    /**
     * When user close the cli
     */
    onClose() {
        this.close();
    }
}

module.exports = CLI;
