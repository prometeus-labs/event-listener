'use strict';
const StoredEthEvent = require('../models/mongoModels/StoredEthEvent.js');
const NotFoundException = 'notFound';

class StoredEventManager{
    constructor(app){
        // this.mSAuthService = app.mSAuthService;
        this.db = app.mongoDb;
        this.logger = app.logger;
        this.validator = app.validator;
        this.currencyManager = app.currencyManager;
        return this;
    };
    init(){
        this.StoredEthEvent = this.db.getModel(StoredEthEvent);
    }
    addEvent(_topic='Transfer',_fromAddress,_toAddress,_value,_blockHash,_blockNumber,_txHash){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateEthAddress(_fromAddress);
                this.validator.validateEthAddress(_toAddress);
                this.validator.validateNumber(_value);
                this.validator.validateString(_blockHash);
                this.validator.validateString(_txHash);
                this.validator.validateNumber(_blockNumber);
                //let assetsMaps = (new this.StoredEthEvent().getAssetsMaps());
                var newEvent = new this.StoredEthEvent({
                    topic:_topic,
                    fromAddress:_fromAddress,
                    toAddress:_toAddress,
                    value:_value,
                    blockHash:_blockHash,
                    blockNumber:_blockNumber,
                    txHash:_txHash,
                    reported: 0
                });
                newEvent.save((err,result)=>{
                    if(err) return reject(err);
                    console.log('New event '+ _txHash+' stored');
                    return resolve(result);
                });
            }catch(e){
                console.log(e)
                return reject(e);
            }
        });
    };
    getEvent(txHash){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateString(txHash);
                var result = await this.StoredEthEvent.findOne({ txHash: txHash });
                return resolve(result);
            }catch(e){
                return reject(e)
            }
        });
    };
    eventStored(txHash){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateString(txHash);
                var event = await this.getEvent(txHash);
                if(event){
                    return resolve(true);                    
                }else{
                    return resolve(false);
                }
            }catch(e){
                return reject(e)
            }
        })
    }
    getAllEvents(){
        return new Promise(async(resolve,reject)=>{
            try{
                var result = await this.StoredEthEvent.find({});
                return resolve(result);
            }catch(e){
                return reject(e)
            }

        });
    };
    getUnreportedEvents(){
        return new Promise(async(resolve,reject)=>{
            try{
                var result = await this.StoredEthEvent.find({reported:0});
                return resolve(result);
            }catch(e){
                return reject(e)
            }

        });
    };
    getReportedEvents(){
        return new Promise(async(resolve,reject)=>{
            try{
                var result = await this.StoredEthEvent.find({reported:1});
                return resolve(result);
            }catch(e){
                return reject(e)
            }

        });
    };
    setReported(txHash){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateString(txHash);
                var result = await this.StoredEthEvent.findOneAndUpdate({txHash: txHash},{reported:1},{new:true});
                return resolve(result);
            }catch(e){
                return reject(e)
            }
        });
    }

    deleteEvent(txHash){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateString(txHash);
                var result = await this.StoredEthEvent.deleteOne({txHash: txHash});
                return resolve(result);
            }catch(e){
                return reject(e)
            }

        })
    };
    deleteAllEvents(){
        return new Promise(async(resolve,reject)=>{
            try{
                var result = await this.StoredEthEvent.deleteMany({});
                return resolve(result);
            }catch(e){
                return reject(NotFoundException)
            }
        })
    };
}

module.exports=StoredEventManager;