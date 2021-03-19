# Upload ABI To Pinata

During the development of Smart Contracts I started to think on how to share the Contract's ABI with the backend and frontend part. Copy and paste seemed stupido.
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
`Upload ABI to Pinata`is currently written for [Hardhat](https://https://hardhat.org/).