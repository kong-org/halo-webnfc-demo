import elliptic from 'elliptic';
import {arr2hex, hex2arr} from "./Utils";
import {useState} from "react";

let ec = new elliptic.ec('secp256k1');

const Scan = (props) => {
    const [isScanning, setScanning] = useState(false);

    const reportScanError = (err) => {
        setScanning(false);
        props.onScanError(err);
    }

    const writeChallenge = async (ndef) => {
        let genChallenge = arr2hex(new Uint8Array([
            1, // 0x01 - sign command
            1, // 0x01 - number of key to use (key = 1)
            ...hex2arr(props.challenge)
        ]));

        let challenge = hex2arr(genChallenge);
        await ndef.write({records: [{recordType: "unknown", data: challenge}]});
    }

    const readResponse = async (ndef) => {
        await ndef.scan();

        ndef.onreadingerror = () => {
            reportScanError("Cannot read data from the NFC tag. Try one more time?");
        };

        ndef.onreading = event => {
            onReading(event);
        };
    }

    const scan = async () => {
        setScanning(true);

        if ('NDEFReader' in window) {
            try {
                const ndef = new window.NDEFReader();
                await writeChallenge(ndef);
                await readResponse(ndef);
            } catch(error){
                console.log(`Error! Scan failed to start: ${error}.`);
            }
        } else {
            reportScanError('WebNFC not available');
        }
    }

    const parseStatic = (val) => {
        let out = [];
        let arr = hex2arr(val);
        var off = 0;

        while (true) {
            const kLen = arr[off];

            if (typeof kLen === "undefined" || kLen === 0) {
                break;
            }

            off += 1;
            const kVal = arr.slice(off, off + kLen);
            off += kLen;

            out.push(arr2hex(kVal));
        }

        return out;
    }

    const parseChallenge = (val) => {
        let arr = hex2arr(val);

        if (arr[0] !== 0x01 || arr[1] !== 0x01) {
            throw Error("Failed to parse challenge - unexpected contents.");
        }

        return arr2hex(arr.slice(2, 2 + 32));
    }

    const parseResponse = (val) => {
        console.log(val);
        let arr = hex2arr(val);

        let sigLen = arr[1];
        return arr2hex(arr.slice(0, 2 + sigLen));
    }

    const onReading = ({message, serialNumber}) => {
        let result;

        try {
            let url = new URL(new TextDecoder("utf-8").decode(message.records[0].data));
            let parsedStatic = parseStatic(url.searchParams.get("static"));
            let parsedCmd = parseChallenge(url.searchParams.get("cmd"));
            let parsedRes = parseResponse(url.searchParams.get("res"));

            let pkey = ec.keyFromPublic(parsedStatic[0], 'hex');
            if (!pkey.verify(parsedCmd, parsedRes)) {
                throw Error("Failed to verify ECDSA signature!");
            }

            result = {
                "pkeys": parsedStatic,
                "latch1": url.searchParams.get("latch1"),
                "latch2": url.searchParams.get("latch2"),
                "keySlot": 1,
                "challenge": parsedCmd,
                "signature": parsedRes,
            }
        } catch (e) {
            reportScanError("Failed to process scan result!");
            return;
        }

        setScanning(false);
        props.onScanResult(result);
    };

    return (
        <button onClick={() => scan()} className="btn" disabled={isScanning}>Scan</button>
    );
};

export default Scan;
