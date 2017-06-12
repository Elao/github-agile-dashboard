const control = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
};

const text = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
};

const background = {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
};

function applyText(message, color) {
    return `${text[color]}${message}${control.reset}`;
}

function applyBackground(message, color) {
    return `${background[color]}${message}${control.reset}`;
}

module.exports = {
    color: applyText,
    background: applyBackground,
    black: (message) => applyText(message, 'black'),
    red: (message) => applyText(message, 'red'),
    green: (message) => applyText(message, 'green'),
    yellow: (message) => applyText(message, 'yellow'),
    blue: (message) => applyText(message, 'blue'),
    magenta: (message) => applyText(message, 'magenta'),
    cyan: (message) => applyText(message, 'cyan'),
    white: (message) => applyText(message, 'white'),
};
