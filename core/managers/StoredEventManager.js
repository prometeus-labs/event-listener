'use strict';
const StoredEthEvent = require('../models/mongoModels/StoredEthEvent.js');
const NotFoundException = 'notFound';

const TYPE_TRANSFER = 'Transfer';
const TYPE_LINK = 'Link';
const TYPE_ALL = 'All';

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
    addEvent(_topic='Transfer',_eventData,_blockNumber,_txHash){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateObject(_eventData);
                this.validator.validateString(_txHash);
                this.validator.validateNumber(_blockNumber);
                //let assetsMaps = (new this.StoredEthEvent().getAssetsMaps());
                var newEvent = new this.StoredEthEvent({
                    topic:_topic,
                    eventData:_eventData,
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
    getEvent(txHash,type='Transfer'){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateString(txHash);
                var result = await this.StoredEthEvent.findOne({ txHash: txHash},{type:type});
                return resolve(result);
            }catch(e){
                return reject(e)
            }
        });
    };
    eventStored(txHash,type='Transfer'){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateString(txHash);
                var event = await this.getEvent(txHash,type);
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
    getAllEvents(type='Transfer'){
        return new Promise(async(resolve,reject)=>{
            try{
                var result = await this.StoredEthEvent.find({type:type});
                return resolve(result);
            }catch(e){
                return reject(e)
            }

        });
    };
    getUnreportedEvents(type='All'){
        return new Promise(async(resolve,reject)=>{
            try{
                let filter = {reported:0};
                if(type===TYPE_ALL){
                    filter[type]=type;
                }else{
                    filter[type]=type;
                }

                var result = await this.StoredEthEvent.find(filter);
                return resolve(result);
            }catch(e){
                return reject(e)
            }

        });
    };
    getReportedEvents(type='All'){
        return new Promise(async(resolve,reject)=>{
            try{
                let filter = {reported:1};
                if(type===TYPE_ALL){
                    filter[type]=type;
                }else{
                    filter[type]=type;
                }
                var result = await this.StoredEthEvent.find(filter);
                return resolve(result);
            }catch(e){
                return reject(e)
            }

        });
    };
    setReported(txHash,type='Transfer'){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateString(txHash);
                var result = await this.StoredEthEvent.findOneAndUpdate({txHash: txHash},{type:type},{reported:1},{new:true});
                return resolve(result);
            }catch(e){
                return reject(e)
            }
        });
    }

    deleteEvent(txHash,type='Transfer'){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateString(txHash);
                var result = await this.StoredEthEvent.deleteOne({txHash: txHash},{type:type});
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