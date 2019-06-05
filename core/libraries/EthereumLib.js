'use strict';
require('app-module-path').addPath(process.env.baseDir);
const SUBJECT='EthLib';
let Web3 = require('web3');
let EthereumTx  = require('ethereumjs-tx');
const NonceService = require('core/services/NonceService');
const BigNumberHelper = require('core/helpers/BigNumberHelper');
const EthAddressHelper = require('core/helpers/EthAddressHelper');
const WeiConverter = require('core/helpers/WeiConverter');
const Web3Wrapper = require('core/wrappers/Web3Wrapper')
class EthereumLibClass{
    constructor(application){
        console.log('Ethereum Active');
        this.app = application;
        //this.generateAddAndPriv = wallet.generateAddressAndPrivkey;
        let web3Wrapper = new Web3Wrapper(this.app);
        web3Wrapper = web3Wrapper.init();
        this.wsProvider = web3Wrapper.web3ws;
        this.httpProvider = web3Wrapper.web3http;
        // this is main provider
        this.provider = this.httpProvider;

        this.logger = application.logger;
        this.validator = application.validator;
        this.nonceService = new NonceService(this.provider,this.validator,this.logger);
    }
    getBalance(address,raw=true){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateEthAddress(address)
                let balance = await this.provider.eth.getBalance(address);
                if(!raw){
                    balance = this.toDecimals(balance);
                }
                return resolve(balance);
            }catch (e) {
                return reject(e);
            }
        });
    }
    transfer(from_address,to_address,amount,privateKey){
        return new Promise(async(resolve, reject)=> {
            try{
                this.validator.validateString(privateKey,'Private Key String',true);
                this.validator.validateEthAddress(from_address,'From Address');
                this.validator.validateEthAddress(to_address,'To Address');
                //this.debug(amount)
                this.validator.validateNumber(amount,'Amount Transferred');
                if(from_address===to_address){
                    throw new Error('To and From Addresses are the same');
                }
                let params=this.formatTransactionParams(from_address, to_address, privateKey,amount);
                let hash = await this.makeTransaction(params);
                console.log('ETHLIB '+ hash)
                return resolve(hash);
            }catch(e)
            {
                this.logger.logError(SUBJECT,e);
                return reject(e);
            }
        });
    }
    createAccount(){
        return new Promise(async(resolve,reject)=>{
            try{
                let result = await this.provider.eth.accounts.create('');
                return resolve(result)
            }catch (e) {
                return reject(e);
            }

        })
    }

    formatTransactionParams(_from,_to,_privkey,_value='0',_gasPrice='5',_gasLimit=100000,_data=''){
        this.validator.validateEthAddress(_from,'_From Address');
        this.validator.validateEthAddress(_to,'_To Address');
        this.validator.validateString(_privkey,'Private Key',true);
        try{
            this.validator.validateString(_value,'Value');
        }catch(e){
            _value = _value.toString();
            this.validator.validateString(_value,'Value');
        }
        try{
            this.validator.validateString(_gasLimit,'Gas Limit');
        }catch(e){
            _gasLimit = _gasLimit.toString();
            this.validator.validateString(_gasLimit,'Gas Limit');
        }
        try{
            this.validator.validateString(_gasPrice,'Gas Price');
        }catch(e){
            _gasPrice = _gasPrice.toString();
            this.validator.validateString(_gasPrice,'Gas Price');
        }
        return {
            from:_from,
            to:_to,
            privateKey:_privkey,
            gasLimit:parseInt(_gasLimit),
            gasPrice:this.provider.utils.numberToHex(this.provider.utils.toWei(_gasPrice, 'gwei')),
            data:_data,
            value:this.provider.utils.numberToHex(_value)
        }
    }

    makeTransaction(params){
        return new Promise(async (resolve,reject)=>
        {
            try{
                let privKeyBuffer = new Buffer.from(params.privateKey,'hex');
                let nonce = await this.nonceService.getNextNonce(params.from);
                let txParams = {
                    nonce: nonce,
                    gasPrice: params.gasPrice,
                    gasLimit: params.gasLimit,
                    to: params.to,
                    value: params.value,
                    data: params.data,
                };
                console.log(txParams)
                let tx = new EthereumTx(txParams);
                tx.sign(privKeyBuffer);
                let raw = '0x' + tx.serialize().toString('hex');
                let result = await this.sendTransactionWithHash(raw);
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        });
    }

    sendTransactionWithHash(raw_tx){
        return new Promise(async (resolve,reject)=>{
            await this.provider.eth.sendSignedTransaction(raw_tx).on('transactionHash', (hash)=>{
                return resolve(hash);
            }).on('error',(data)=>{
                return reject(data);
            });
        })
    }
    fetchRecommendedGasPrice(){
        return new Promise(async(resolve,reject)=>{
            try{
                let url = `https://ethgasstation.info/json/ethgasAPI.json`;
                let result = await fetch(url).then(response=>response.json())
                result = result.fast/10
                return resolve(result);
            }catch(e){
                return reject(e)
            }
        })
    }
    toDecimals(amount){
        return WeiConverter.formatToDecimals(amount);
    }
    fromDecimals(amount){
        return WeiConverter.formatFromDecimals(amount);
    }
}
module.exports = EthereumLibClass;
