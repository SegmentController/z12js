import { Z21Client } from '../src';

const start = async () => {
    const z21cli = new Z21Client();

    // z21cli.on('debug', (event, debugData) => {
    //     console.log(event, debugData);
    // })

    z21cli.on('error', (error: Error) => {
        console.log('Error: ' + error);
    })

    z21cli.on('locoInfo', (locoInfo) => {
        console.log(Date.now())
        console.log(locoInfo);
    })
    z21cli.setBroadcastFlag(true);



    console.log('some awaits');
    try {
        const version = await z21cli.getSerialNumber();
        console.log(version);
    }
    catch (error) { console.log(error) }

    try {
        const hwInfo = await z21cli.getHWInfo();
        console.log(hwInfo);
    }
    catch (error) { console.log(error) }

    try {
        const status = await z21cli.getStatus();
        console.log(status);
    }
    catch (error) { console.log(error) }

    try {
        const locoInfo = await z21cli.getLocoInfo(3);
        console.log(locoInfo);
    }
    catch (error) { console.log(error) }
    // try {
    //     const locoInfo = await z21cli.getLocoInfo(15);
    //     console.log(locoInfo);
    // }
    // catch (error) { console.log(error) }
    // try {
    //     const locoInfo = await z21cli.getLocoInfo(12);
    //     console.log(locoInfo);
    // }
    // catch (error) { console.log(error) }


    console.log()
    console.log('same as thenables');
    z21cli.getSerialNumber()
        .then((result) => console.log(result))
        .catch((error) => console.log(error));

    z21cli.getHWInfo()
        .then((result) => console.log(result))
        .catch((error) => console.log(error));

    z21cli.getStatus()
        .then((result) => console.log(result))
        .catch((error) => console.log(error));

    // z21cli.getLocoInfo(3)
    //     .then((result) => console.log(result))
    //     .catch((error) => console.log(error));

    void z21cli.subscribeLocoInfo(3);

    let speed = 0;
    setInterval(() => {
        if (speed > 0)
            speed = 0;
        else
            speed = 40;
        z21cli.driveLoco(3, true, speed);
        z21cli.toggleLocoFunctions(3, 0);
    }, 2500);


    // setTimeout(() => {
    //     console.log()
    //     console.log('close');
    //     z21cli.close();
    // }, 3000);
}

start();
