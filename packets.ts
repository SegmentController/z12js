import { Buffer } from 'node:buffer';

const HEADER_XBUS = 0x40;

export const Z21_HEADER = {
    LAN_GET_SERIAL_NUMBER: 0x10,
    LAN_GET_HWINFO: 0x1A,
    LAN_LOGOFF: 0x30,
    HEADER_XBUS: HEADER_XBUS,
    LAN_SET_BROADCASTFLAGS: 0x50,

    LAN_X_GET_STATUS: { header: HEADER_XBUS, xHeader: 0x21, db0: 0x24 },
    LAN_X_SET_TRACK_POWER_OFF: { header: HEADER_XBUS, xHeader: 0x21, db0: 0x80 },
    LAN_X_SET_TRACK_POWER_ON: { header: HEADER_XBUS, xHeader: 0x21, db0: 0x81 },
    LAN_X_SET_STOP: { header: HEADER_XBUS, xHeader: 0x80 },

    LAN_X_GET_LOCO_INFO: { header: HEADER_XBUS, xHeader: 0xE3, dbo: 0xF0 },
    LAN_X_SET_LOCO_DRIVE: { header: HEADER_XBUS, xHeader: 0xE4 },
    LAN_X_SET_LOCO_FUNCTION: { header: HEADER_XBUS, xHeader: 0xE4, dbo: 0xF8 },
}

export const ErrorResponseParser = (receivedData: Buffer): boolean => {
    const length = receivedData.readUInt16LE(0);
    const header = receivedData.readUInt16LE(2);
    if (length == 7 && header == 0x40) {
        const xHeader = receivedData.readUInt16LE(4);
        if (xHeader == 0x61)
            return true;
    }
    return false;
}

export type SerialNumberResponse = { serialNumber: number, serialNumberHex: string };
export const SerialNumberResponseParser = (receivedData: Buffer): SerialNumberResponse | null => {
    const length = receivedData.readUInt16LE(0);
    const header = receivedData.readUInt16LE(2);
    if (length == 8 && header == 0x10)
        return {
            serialNumber: receivedData.readUInt32LE(4),
            serialNumberHex: receivedData.readUInt32LE(4).toString(16),
        };
    return null;
}

export type HWInfoResponse = { hwName: string, fwVersion: string };
export const HWInfoResponseParser = (receivedData: Buffer): HWInfoResponse | null => {
    const length = receivedData.readUInt16LE(0);
    const header = receivedData.readUInt16LE(2);
    if (length == 0x0C && header == 0x1A) {
        const hwType = receivedData.readUInt32LE(4);
        let hwName = `Unknown 0x${hwType.toString(16)}`;
        switch (hwType) {
            case 0x00000200:
                hwName = "Black Z21 (old)";
                break;
            case 0x00000201:
                hwName = "Black Z21";
                break;
            case 0x00000202:
                hwName = "SmartRail";
                break;
            case 0x00000203:
                hwName = "White Z21";
                break;
            case 0x00000204:
                hwName = "Z21 start";
                break;
        }
        const fwVersion = receivedData.readUInt32LE(8);

        return {
            hwName,
            fwVersion: (fwVersion >> 8).toString(16) + '.' + (fwVersion & 0xFF).toString(16),
        };
    }
    return null;
}

export type StatusResponse = {
    emergencyStop: boolean,
    trackVoltageOff: boolean,
    shortCircuit: boolean,
    programmingModeActive: boolean,
};
export const StatusResponseParser = (receivedData: Buffer): StatusResponse | null => {
    const length = receivedData.readUInt16LE(0);
    const header = receivedData.readUInt16LE(2);
    const xHeader = receivedData.readUInt8(4);
    if (length == 8 && header == 0x40 && xHeader == 0x62) {
        const DB0 = receivedData.readUInt8(5);
        if (DB0 == 0x22) {
            const DB1 = receivedData.readUInt8(6);
            return {
                emergencyStop: DB1 & 0x01 ? true : false,
                trackVoltageOff: DB1 & 0x02 ? true : false,
                shortCircuit: DB1 & 0x04 ? true : false,
                programmingModeActive: DB1 & 0x20 ? true : false,
            };
        }
    }
    return null;
}

export type LocoResponse = {
    address: number,
    busy: boolean,
    speedSteps: number,
    direction: boolean,
    speed: number,
    functions: boolean[],
};
export const LocoResponseParser = (receivedData: Buffer, address?: number): LocoResponse | null => {
    const length = receivedData.readUInt16LE(0);
    const header = receivedData.readUInt16LE(2);
    if (length > 4) {
        const xHeader = receivedData.readUInt8(4);
        if (length >= 11 && header == 0x40 && xHeader == 0xEF) {
            const DB0 = receivedData.readUInt8(5);
            const DB1 = receivedData.readUInt8(6);
            const DB2 = receivedData.readUInt8(7);
            const DB3 = receivedData.readUInt8(8);
            const DB4 = receivedData.readUInt8(9);

            const receivedAddress = ((DB0 & 0x3F) << 8) + DB1;
            if (!address || address == receivedAddress) {
                let speedSteps = -1;
                switch (DB2 & 0x07) {
                    case 0:
                        speedSteps = 14;
                        break;
                    case 2:
                        speedSteps = 28;
                        break;
                    case 4:
                        speedSteps = 128;
                        break;
                }

                const functions: boolean[] = [
                    false, false, false, false, false,
                    false, false, false, false, false,
                    false, false, false, false, false,
                    false, false, false, false, false,
                    false,
                ];
                functions[0] = DB4 & 0x10 ? true : false;
                functions[1] = DB4 & 0x01 ? true : false;
                functions[2] = DB4 & 0x02 ? true : false;
                functions[3] = DB4 & 0x04 ? true : false;
                functions[4] = DB4 & 0x08 ? true : false;
                if (length >= 12) {
                    const DB5 = receivedData.readUInt8(10);
                    for (let i = 0; i < 8; i++)
                        functions[5 + i] = DB5 & 0x01 << i ? true : false;

                    if (length >= 13) {
                        const DB6 = receivedData.readUInt8(11);
                        for (let i = 0; i < 8; i++)
                            functions[13 + i] = DB6 & 0x01 << i ? true : false;
                    }
                }

                return {
                    address: receivedAddress,
                    busy: DB2 & 0x08 ? true : false,
                    speedSteps,
                    direction: DB3 & 0x80 ? true : false,
                    speed: DB3 & 0x7F,
                    functions,
                };
            }
        }
    }
    return null;
}
