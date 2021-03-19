const fs = require('fs');
const { exit } = require("process");
const pinataSDK = require('@pinata/sdk');

const HARDHAT_CONTRACT_PATH='./artifacts/contracts/';

let pinata;

/**
 * Reads the content of file at the given path
 * @param {*} path - Path to file to be read 
 * @returns  UTF-8 content of the read file
 */
function readFile(path) {
    return fs.readFileSync(path, "utf-8");
}

/**
 * Loads a Pinata object using the Pianata api key and Pianata api secret
 * @returns Pianta object
 */
function loadPinata() {
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
        console.log("PINATA_API_KEY or PINATA_API_SECRET is not set");
        exit(1);
    }
    return pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);
}

/**
 * Based on the given name, the currently pinned objects on pianata are returned.
 * @param {*} name - Name to filter pinned objects on Pinata
 * @returns An object of pinned object using the given name
 */
async function getPinList(name) {
    const filter = {
        status: 'pinned',
        metadata: {
            name
        }
    }
    return pinata.pinList(filter);
}

/**
 * Checks if a pin on Pinata with the given name exists
 * @param {*} name - Name of the pinned object to be checked
 * @returns Boolean based if it exists or not
 */
async function checkIfPinExists(name) {
    const r = await getPinList(name);
    return (r.count > 0 ? true: false);
}

/**
 * Takes the name of an pinned object and unpins those
 * @param {*} name - Name of the object to be unpinned
 */
async function unpin(name) {
    const pins = await getPinList(name);
    for (ipfs_pin of pins.rows) {
        await pinata.unpin(ipfs_pin['ipfs_pin_hash']);
    }
}

/**
 * Function which does all the work. Checks a pin on Pinata exists, and unpins it.
 * Than takes the abi of smart contracts and uploads those to Pinata.
 * @param {*} name - Name to be given to the pinned object
 * @returns Object with ipds hash
 */
async function uploadABIToPinata(name) {
    if (name === "" || name === undefined) {
        console.log("Parameter name is not set");
        exit(1);
    }
    // credentials are stored in PINATA_API_KEY and PINATA_API_SECRET
    pinata = loadPinata();
    if (await checkIfPinExists(name)) {
        console.log(`A pin with ${name} exists. We are going to unpin it first`);
        await unpin(name);
        exit(1);
    }
    const uploadContracts = JSON.parse(readFile(".uploadAbi.json"));
    let pinataBody = {
        contracts: {}
    }
    let file;
    let content;
    uploadContracts.files.forEach((contract) => {
        if (contract.includes('/')) {
            file = `${HARDHAT_CONTRACT_PATH}${contract}/${contract.split('/')[1].split('.')[0]}.json`;
        } else {
            file = `${HARDHAT_CONTRACT_PATH}${contract}/${contract.split('.')[0]}.json`;
        }
        if (fs.existsSync(file)) {
            content = JSON.parse(readFile(file));
            pinataBody.contracts[content.contractName] = content.abi;
        } else {
            console.log(`${file} doesn't exist`);
            exit(1);
        }
    });
    const options = {
        pinataMetadata: {
            name
        },
        pinataOptions: {
            cidVersion: 0
        }
    };
    return pinata.pinJSONToIPFS(pinataBody, options);
}

module.exports = {
    uploadABIToPinata
}