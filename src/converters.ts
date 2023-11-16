export const Z21XBusRecordToArray = (xHeader: number, ...data: number[]): number[] => {
    return [
        xHeader & 0xFF,
        ...data.map(d => d & 0xFF),
        [
            xHeader,
            ...data.map(d => d & 0xFF)
        ].reduce((prev, curr) => prev ^ curr & 0xFF, 0) & 0xFF
    ];
}

export const Z21RecordToBuffer = (header: number, ...data: number[]): Buffer =>
    Buffer.from([
        data.length + 4 & 0xFF, 0,
        header & 0xFF, 0,
        ...data]);

export const createBufferFrom = (source: Buffer, start: number, length = -1): Buffer => {
    if (length < 0)
        length = source.length - start;

    const result = Buffer.allocUnsafe(length);
    result.set(source.subarray(start, start + length));
    return result;
}
