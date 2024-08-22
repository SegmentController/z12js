export const Z21XBusRecordToArray = (xHeader: number, ...data: number[]): number[] => {
  return [
    xHeader & 0xff,
    ...data.map((d) => d & 0xff),
    [xHeader, ...data.map((d) => d & 0xff)].reduce((previous, current) => previous ^ (current & 0xff), 0) & 0xff
  ];
};

export const Z21RecordToBuffer = (header: number, ...data: number[]): Buffer =>
  Buffer.from([(data.length + 4) & 0xff, 0, header & 0xff, 0, ...data]);

export const createBufferFrom = (source: Buffer, start: number, length = -1): Buffer => {
  if (length < 0) length = source.length - start;

  const result = Buffer.allocUnsafe(length);
  result.set(source.subarray(start, start + length));
  return result;
};
