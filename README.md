# PinABI

During the development of Smart Contracts using Hardhat I started to think on how to share the Contract's ABI with the backend and frontend part. Copy and paste seemed stupido.
So, `PinABI` was born. With `PinABI` you are able to up- and download your smart contracts ABI to/from IPFS and pin with Pinata.

## Create Api Key at Pinata
In order to use it, you have to create a Pinata account. Go to [Pinata](https://pinata.cloud) and create an account. 
Once this is done, you should create ideally two API keys - one for uploading an ABI and one for downloading.
Your uploading API Key will require the following permissions:

    * pinJSONToIPFS
    * unpin
    * pinList

Your downloading API Key will require the following permissions:

    * pinList

Copy the api key and secret. You will have to export those values in your Terminal:
````bash
export PINATA_API_KEY="Key Value" 
export PINATA_API_SECRET="Secret Value"
````
and you are good to go :)

## Use in Hardhat
`PinABI` is currently written for [Hardhat](https://https://hardhat.org/) to be used as a task.

In order to use it in Hardhat, go to your `.config.js`file and add it as a task:

```javascript
const { uploadABIToPinata } = require("pin-abi");

task("upload", "Upload Smart Contracts ABI to Pinata")
  .addParam("name", "The name for the Pinata Pin")
  .setAction(async (taskArgs) => {
    const c = await uploadABIToPinata(taskArgs.name);
    console.log(c);
  });
```
Now you will be able to upload your Smart Contracts ABI using the following command:
```
npx hardhat upload --name [some pinning name]
```

## Which Smart Contracts ABIs to upload?

In order to pick which ABIs you want to upload, create a `.uploadABI.json` file in your root folder of your Hardhat project:
```json
{
    "files": [
        "Greeter.sol" # this represents the artifacts/contracts/Greeter.sol/ directory structure
    ]
}
```

## Download ABIs
If you want to download your Smart Contracts ABIs in a different project, you can do the following:
```javascript
const { downloadABIFromPinata } = require("pin-abi");

const pinName = "A name you used during the upload"
await downloadABIFromPinata(pinName);
```
Enjoy and I hope it is usefull :)