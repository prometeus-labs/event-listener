'use strict';
require('app-module-path').addPath(process.env.baseDir);
const SUBJECT = 'EthService';
const EthAddressHelper = require('core/helpers/EthAddressHelper');
const EthereumLib = require('core/libraries/EthereumLib');
const Web3Wrapper = require('core/wrappers/Web3Wrapper')
class EthService{
    constructor(app){
        this.app = app;
        this.urlMap=app.urlMap;
        this.validator=app.validator;
        this.logger=app.logger;
        this.supervisedTransactionManager = app.supervisedTransactionManager;
        this.httpService=app.httpService;
        this.provider = false;
        this.ethLib = new EthereumLib(app);
        this.userAccountManager = app.userAccountManager;
    }
    init(){
        return new Promise(async(resolve,reject)=>{
            try{
                let web3Wrapper = new Web3Wrapper(this.app);
                web3Wrapper = await web3Wrapper.init();
                this.wsProvider = web3Wrapper.web3ws;
                this.httpProvider = web3Wrapper.web3http;
                // this is main provider
                this.provider = this.httpProvider;

                await this.setAdminAccount();
                this.logger.logEvent(SUBJECT,'API IS INITIALIZED');
                return resolve(this);
            }catch (e) {
                this.logger.logError(SUBJECT,e);
                return reject(e);
            }
        })
    }
    setAdminAccount(){
        return new Promise(async(resolve,reject)=>{
            try{
                let adminAccount = await this.getAdminAccount();
                this.admin={};
                this.admin.address=adminAccount;
                // try{
                //     this.admin.key= await this.getAdminKey();
                // }catch(e){
                //     this.logger.logError(SUBJECT,'Error fetching admin key',e);
                // }
                return resolve(true);
            }catch (e) {
                return reject(e);
            }
        });
    }
    createAccount(){
        return new Promise(async(resolve,reject)=>{
            try{
                let account = await this.ethLib.createAccount();
                let result = await this.userAccountManager.addAccount(account.address,'eth', account.privateKey)
                return resolve(result);
            }catch (e) {
                return reject(e);
            }
        })
    }
    listAccounts(){
        return new Promise(async(resolve,reject)=>{
            try{
                let accounts = await this.userAccountManager.getAllActiveAccounts('eth')
                return resolve(accounts);
            }catch (e) {
                return reject(e);
            }
        })
    }
    transfer(from_address,to_address,amount,privateKey,reportable=true){
        return new Promise(async(resolve, reject)=> {
            try{
                let result = await this.ethLib.transfer(from_address,to_address,amount,privateKey)
                return resolve(result);
            }catch(e)
            {
                this.logger.logError(SUBJECT,e);
                return reject(e);
            }
        });
    }
    getBalance(address){
        this.validator.validateEthAddress(address)
        return new Promise(async(resolve,reject)=>{
            try{
                let balance = await this.ethLib.getBalance(address)
                return resolve(balance);
            }catch (e) {
                return reject(e);
            }
        })
    }

    getAdminAccount(){
        return new Promise((resolve,reject)=>{
            try{
                let result = process.env.ADMIN_ADDRESS;
                this.validator.validateString(result,'Admin Address');
                return resolve(result);
            }catch(e){
                this.logger.logError(SUBJECT,e);
                return reject(e);
            }
        });
    }
    getAdminKey(){
        return new Promise(async(resolve,reject)=>{
            try{
                let privKey = await this.getPrivateKey(this.admin.address);//httpService.getRequest(req_url,data);
                return resolve(privKey);
            }catch(e){
                this.logger.logError(SUBJECT,e);
                return reject(e);
            }
        });
    }
    getPrivateKey(user_address){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateEthAddress(user_address);
                let url = this.urlMap.server+this.urlMap.get_private_key_url;
                let data ={address:user_address};
                let headers = {"Content-Type":"application/json"};
                let result = false;
                let privateKey = '';
                try{
                    try{
                        console.log('---------------------'+user_address)
                        // if(!EthAddressHelper.compareEthAddresses(user_address,this.admin.address)){
                        //     this.logger.logError(SUBJECT,'HARDCODED PRIVATEKEY IN EthService 137 row');
                        //     privateKey= "34e971d425c7b409a15566bbf7e118cfc5f320e0e7dbff373d0b4b7ff8a8813c";//await this.httpService.getRequest(url,data,headers);
                        // }else{
                            privateKey= await this.httpService.getRequest(url,data,headers);
//                        }
                    }catch(error){
                        throw new Error('Address Not Found');
                    }
                    try{
                        this.validator.validateString(privateKey);
                        result = privateKey;
                    }catch(error){
                        throw new Error('Private Key is not a string');
                    }
                }catch(err){
                    this.logger.logError(SUBJECT,err.message,err);
                    result = false;
                }
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        });
    };

    formatTransactionParams(_from,_to,_privkey,_value=0, _data='',_gasLimit=100000,_gasPrice='5'){
        return this.ethLib.formatTransactionParams(_from,_to,_privkey,_value, _data,_gasLimit,_gasPrice)
    }
    makeTransaction(params)
    {
        return new Promise(async (resolve,reject)=>
        {
            try{
                let result = this.ethLib.makeTransaction(params);
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        });
    }
}

module.exports = EthService;