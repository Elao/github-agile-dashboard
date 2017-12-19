const DateUtil = require('../Util/DateUtil');
const { green, red, cyan, yellow } = require('../Util/colors');

class BurnDownChart {
    /**
     * @param {Milestone} milestone
     */
    constructor(milestone, workDays = [1, 2, 3, 4, 5]) {
        this.milestone = milestone;
        this.workDays = workDays;
    }

    static get dayWidth() { return 4; }

    static prefix(value, zero = '0') {
        return value < 10 ? `${zero}${value}` : value.toString();
    }

    static gutter(value, space = ' ', size = BurnDownChart.dayWidth) {
        return `${space.repeat(size - (value ? value.toString().length : 0))}${value}`;
    }

    getBurnDown(milestone, now = DateUtil.day()) {
        const { prefix } = BurnDownChart;
        const { startAt, dueOn } = milestone;
        const burnDown = new Map();

        for (let day = startAt; day < dueOn; day.setDate(day.getDate() + 1)) {
            if (this.workDays.includes(day.getDay())) {
                burnDown.set(
                    `${prefix(day.getDate())}/${prefix(day.getMonth())}`,
                    {
                        points: day <= now ? milestone.getTodoAt(day) : null,
                        progress: day <= now ? milestone.getInProgressAt(day) : null,
                    }
                );
            }
        }

        return burnDown;
    }

    display() {
        const { dayWidth, gutter } = this.constructor;
        const burnDown = this.getBurnDown(this.milestone);
        const labelLength = Math.max(Array.from(burnDown.keys()).reduce((max, label) => Math.max(label.length, max), 0), 1);
        const maxPoints = Math.ceil(this.milestone.points);
        const pointsPerDay = maxPoints / burnDown.size;
        const lines = [
            gutter('', ' ', labelLength - 1) + (new Array(maxPoints + 1).fill(' ').map((value, index) => gutter(index)).join('')),
            gutter('', ' ', labelLength) + ' ╔╧' + gutter('╧', '═').repeat(maxPoints)
        ];
        let lastPoints = null;

        burnDown.forEach(({ points, progress }, day) => {
            const index = lines.length - 2;
            const showLabel = index % 2 === 0;
            const label = gutter(showLabel ? day : '', ' ', labelLength);
            const border = showLabel ? '╢' : '║';
            const goal = Math.round(maxPoints - (index + 1) * pointsPerDay);
            const good = Math.min(points, goal);
            const pending =  Math.min(progress, points - good);
            const missing =  Math.max(points - good - pending, 0);
            const content = green('🀫'.repeat(dayWidth * good)) + red('🀫'.repeat(dayWidth * missing)) + yellow('🀫'.repeat(dayWidth * pending));
            const note = points && lastPoints !== points ? ' ‣ ' + cyan(points.toString()) : '';
            lastPoints = points;
            lines.push(label + ' ' + border + content + note);
        });

        return lines.join('\r\n') + '\r\n';
    }
}

module.exports = BurnDownChart;
