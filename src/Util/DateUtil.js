class DateUtil {
    static day(value = new Date()) {
        const date = value instanceof Date ? value : new Date(value);

        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    }
}

module.exports = DateUtil;
