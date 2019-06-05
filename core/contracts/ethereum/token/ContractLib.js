require('app-module-path').addPath(process.env.baseDir);
const ContractBuilder = require('core/contracts/ethereum/EthContractBuilder');
const ContractData = require('core/contracts/ethereum/token/ContractData.js');
const BigNumberHelper = require('core/helpers/BigNumberHelper');
class TokenLib{
    constructor(app){
        this.app = app;
        this.validator=app.validator;
        this.logger = app.logger;
        this.eth = app.ethLib;
        this.contractBuilder = new ContractBuilder(this);
    }
    init(){
        return new Promise(async(resolve,reject)=>{
            try{
                this.httpProvider=this.ethLib.httpProvider;
                this.wsProvider = this.ethLib.wsProvider;
                this.provider = this.ethLib.provider;
                this.admin = this.ethLib.admin;
                this.contractData = new ContractData();
                this.contract = await this.contractBuilder.build(
                    this.contractData.getAddress(),
                    this.contractData.getAbi(),
                    this.contractData.getRecommendedProvider(),
                );
                return resolve(this);
            }catch (e) {
                return reject(e);
            }
        })
    }
    transferTokens(from_address,to_address,amount,privateKey){
        return new Promise(async(resolve, reject)=> {
            try{
                this.validator.validateString(privateKey,'Private Key String',true);
                this.validator.validateEthAddress(from_address,'From Address');
                this.validator.validateEthAddress(to_address,'To Address');
                amount = this.provider.utils.toHex(amount);
                this.validator.validateNumber(amount,'Amount Transferred');
                if(from_address===to_address){
                    throw new Error('To and From Addresses are the same');
                }
                let params=this.ethLib.formatTransactionParams(from_address,this.contract.options.address, privateKey);
                params.data=this.contract.methods.transfer(to_address, amount).encodeABI();
                let result = await this.ethLib.makeTransaction(params);
                return resolve(result);
            }catch(e)
            {
                return reject(e);
            }
        });
    }

    approveTokenTransfer(from_address, adminAccount,amount,privateKey){
        //this.logger.debug("approvteToken: "+from_address + ' ' + amount);
        return new Promise(async(resolve, reject)=> {
            try{
                this.validator.validateString(privateKey,'Private Key String',true);
                this.validator.validateString(adminAccount,'To Address');
                amount = BigNumberHelper.toFixedBigValue(amount);
                //this.logger.debug("decimals - " + amount);
                amount = this.httpProvider.utils.toHex(amount);
                //this.logger.debug("hex - " + amount);
                this.validator.validateNumber(amount,'Amount Transferred');
                if(from_address===adminAccount){
                    throw  new Error('To and From Addresses are the same');
                }
                var data=this.contract.methods.approve(adminAccount, amount).encodeABI();
                var params=this.ethLib.formatTransactionParams(from_address,this.contract.options.address, privateKey,0,data);
                var hash = await this.ethLib.makeTransaction(params);
                return resolve(hash);
            }catch(e)
            {
                return reject(e);
            }
        });
    }

    allowanceTokens(from_address,adminAccount){
        return new Promise(async(resolve, reject) => {
            try{
                this.validator.validateString(from_address,'From Address');
                this.validator.validateString(adminAccount,'To Address');
                if(from_address===adminAccount){
                    throw  new Error('To and From Addresses are the same');
                }
                var result = await this.contract.methods.allowance(from_address, adminAccount).call();
                return resolve(result);
            }catch(e)
            {
                return reject(e);
            };
        })
    }

    transferFromTokens(from_address,to_address,amount,privateKey){
        return new Promise(async(resolve, reject)=> {
            try{
                this.validator.validateString(privateKey,'Private Key String',true);
                this.validator.validateString(to_address,'To Address');
                this.validator.validateString(from_address,'From Address');
                amount = BigNumberHelper.toFixedBigValue(amount);
                //this.logger.debug("amount decimals - " + amount);
                amount = this.httpProvider.utils.toHex(amount);
                this.validator.validateNumber(amount,'Amount Transferred');
                if(from_address===to_address){
                    throw new Error('To and From Addresses are the same');
                }
                let data=this.contract.methods.transferFrom(from_address,to_address, amount).encodeABI();
                var params=this.ethLib.formatTransactionParams(to_address, this.contract.options.address, privateKey,0,data);
                var hash = await this.ethLib.makeTransaction(params);
                return resolve(hash);
            }catch(e)
            {
                return reject(e);
            }
        });
    }

    getSingleBalance(user_address){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateEthAddress(user_address,'User Address');
                let result = await this.contract.methods.balanceOf(user_address).call();
                this.validator.validateNumber(result,'User Token Balance');
                result = parseInt(result);
                return resolve(result);
            }catch(e){
                return reject(e);
            }
        })
    }

    Transfer(filter,callback){
        this.contract.events.Transfer(filter,
            callback);
    }
}

module.exports = TokenLib;