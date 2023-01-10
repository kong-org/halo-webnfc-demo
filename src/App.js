import './App.css';
import {useEffect, useState} from 'react';
import Scan from "./Scan";
import {arr2hex} from "./Utils";

function App() {
    const [challenge, setChallenge] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        let tmp = new Uint8Array(32);
        crypto.getRandomValues(tmp);
        setChallenge(arr2hex(tmp));
    }, []);

    function onScanResult(res) {
        setResult(res);
    }

    function onScanError(err) {
        alert(err);
    }

    let resBody;

    if (result) {
        resBody = <div>
            <strong>Public keys:</strong><br />
            {result.pkeys.map((pkey) => <div style={{fontFamily: "monospace"}}>{pkey}<br /></div>)}
            <strong>Challenge:</strong><br />
            <div style={{fontFamily: "monospace"}}>{result.challenge}</div>
            <strong>Signature:</strong><br />
            <div style={{fontFamily: "monospace"}}>{result.signature}</div>
            <strong>Latch 1:</strong><br />
            <div style={{fontFamily: "monospace"}}>{result.latch1}</div>
            <strong>Latch 2:</strong><br />
            <div style={{fontFamily: "monospace"}}>{result.latch2}</div>
        </div>;
    } else {
        resBody = null;
    }

    return (
        <div className="App">
            <div>
                <strong>Generated challenge:</strong>
                <div style={{fontFamily: "monospace"}}>{challenge}</div>
            </div>
            <Scan
                challenge={challenge}
                onScanResult={(res) => onScanResult(res)}
                onScanError={(res) => onScanError(res)} />
            {resBody}
        </div>
    );
}

export default App;
