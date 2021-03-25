const fs = require('fs');
const { exit } = require("process");
const pinataSDK = require('@pinata/sdk');
const axios = require('axios');

const HARDHAT_CONTRACT_PATH='./artifacts/contracts/';
const URL = 'https://gateway.pinata.cloud/ipfs/';
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
    console.log("Loading Pinata client");
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
function getPinList(name) {
    console.log('Getting the pin list...');
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
 * The function checks if the artifacts/contracts directiry exist. If not, they
 * will be created.
 */
function createABIDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content);
}

/**
 * Function which does all the work. Checks a pin on Pinata exists, and unpins it.
 * Than takes the abi of smart contracts and uploads those to Pinata.
 * @param {*} name - Name to be given to the pinned object
 * @returns Object with ipds hash
 */
function uploadABIToPinata(name) {
    if (name === "" || name === undefined) {
        console.log("Parameter name is not set");
        exit(1);
    }
    // credentials are stored in PINATA_API_KEY and PINATA_API_SECRET
    pinata = loadPinata();
    console.log(`Cheking if pin with name ${name} exists`);
    if (await checkIfPinExists(name)) {
        console.log(`A pin with ${name} exists. We are going to unpin it first`);
        await unpin(name);
    }
    const uploadContracts = JSON.parse(readFile(".uploadAbi.json"));
    let pinataBody = {
        contracts: {}
    }
    let file;
    let filePath;
    let extension;
    let content;
    //Currently only for .sol files. The directory has .sol in it
    uploadContracts.files.forEach((contract) => {
        if (contract.includes('.sol')) {
            extension = '.sol';
        } else {
            extension = '';
        }

        if (contract.includes('/')) {
            filePath = contract.split('/');
            filePath.pop();
            filePath = filePath.join('/');
            file = `${HARDHAT_CONTRACT_PATH}${contract}/${contract.split('/')[1].split('.')[0]}.json`;
        } else {
            filePath = '.';
            file = `${HARDHAT_CONTRACT_PATH}${contract}/${contract.split('.')[0]}.json`;
        }

        if (fs.existsSync(file)) {
            content = JSON.parse(readFile(file));
            pinataBody.contracts[`${content.contractName}`] = {
                abi: content.abi,
                path: filePath,
                extension
            };
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
    console.log("Upload and pin Smart Contract's abi in Pinata");
    return pinata.pinJSONToIPFS(pinataBody, options);
}

/**
 * downloadABIFromPinata is used in order to download Smart Contracts ABI's from IPFS
 * using Pinata's Pinning name. It's going to save those ABIs in the artifacts/contracts
 * directory.
 * @param {*} name - Pinning name used during the upload of the ABIs 
 */
function downloadABIFromPinata(name) {
    if (name === "" || name === undefined) {
        console.log("Parameter name is not set");
        exit(1);
    }
    createABIDirectory(HARDHAT_CONTRACT_PATH);
    pinata = loadPinata();
    const pinList = await getPinList(name);
    if (pinList.count == 0) {
        console.log(`Pin with name "${name}" doesn't exist`);
        exit(1);
    }
    if (pinList.count > 1) {
        console.log(`There are multiple pins with the same name. How?`);
    }

    const params = {
        url: `${URL}${pinList.rows[0]['ipfs_pin_hash']}`,
        method: 'get'
    }
    const result = await axios(params);
    const contracts = result.data.contracts;
    const contractNames = Object.keys(contracts);
    let dirPath;
    let pathToWrite;
    for (let contractName of contractNames) {
        dirPath = `${HARDHAT_CONTRACT_PATH}${contracts[contractName].path}/${contractName}${contracts[contractName].extension}`;
        createABIDirectory(dirPath);
        pathToWrite = `${dirPath}/${contractName}.json`;
        writeFile(pathToWrite, JSON.stringify({
            contractName: contractName,
            sourceName: dirPath.replace('./artifacts/', ''),
            abi: contracts[contractName].abi
        }, null, 2));
    }
    console.log('Wrote abi to files');
}

module.exports = {
    uploadABIToPinata,
    downloadABIFromPinata
}