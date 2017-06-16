class DateUtil {
    static day(value = new Date(), addDays = 0) {
        const date = value instanceof Date ? value : new Date(value);

        date.setDate(date.getDate() + addDays);

        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    }
}

module.exports = DateUtil;
