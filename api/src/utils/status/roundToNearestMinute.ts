export default function roundToNearestMinute(date: Date) {
    const ms = 1000 * 60
    return new Date(Math.round(date.getTime() / ms) * ms)
}
