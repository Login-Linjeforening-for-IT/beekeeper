import prettyDate from './prettyDate.ts'

export default function smallDate(input: string, hourOnly?: boolean | 'noYear') {
    const pretty = prettyDate(input, hourOnly === 'noYear')
    const date = new Date(input)
    const now = new Date()

    if (hourOnly === true) {
        return pretty.split(' ')[1]
    }

    if (date.getDate() !== now.getDate()) {
        return pretty
    }

    return pretty.split(' ')[1]
}
