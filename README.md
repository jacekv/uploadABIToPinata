# Upload ABI To Pinata

During the development of Smart Contracts using Hardhat I started to think on how to share the Contract's ABI with the backend and frontend part. Copy and paste seemed stupido.
So, `Upload ABI to Pinata` was born.

## Create Api Key at Pinata
In order to use it, you have to create a Pinata account. Go to [Pinata](https://pinata.cloud) and create an account. Once this is done, you will have to create an API key.
You will require the following permissions:

    * pinJSONToIPFS
    * unpin
    * pinList

Copy the api key and secret. You will have to export those values in your Terminal:
````
export PINATA_API_KEY="Key Value" 
export PINATA_API_SECRET="Secret Value"
````
and you are good to go :)

## Use in Hardhat
`Upload ABI to Pinata` is currently written for [Hardhat](https://https://hardhat.org/) to be used as a task.

In order to use it in Hardhat, go tyou your `.config.js`file and add it as a task:

```
const { uploadABIToPinata } = require("upload-abi-to-pinata");

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

In order to pick which ABIs you want to upload, create a `.uploadABI.json` file in your root folder of your hardhat project:
```
{
    "files": [
        "Greeter.sol" # this represents the artifacts/contracts/Greeter.sol/ directory structure
    ]
}
```
Enjoy and I hope it is usefull :)