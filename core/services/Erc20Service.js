'use strict';
require('app-module-path').addPath(process.env.baseDir);
const SUBJECT = 'ERC20Service';
const Erc20Lib = require('core/contracts/ethereum/token/ContractLib');
const WeiConverter = require('core/helpers/WeiConverter');
const BlockNumberCacher = require('core/cachers/BlockNumberCacher')

const TRANSFER_EVENT = 'Transfer';
const LINK_EVENT = 'LinkValidatorOwner';
class Erc20Service{
    constructor(app){
        this.app = app;
        this.validator=app.validator;
        this.logger = app.logger;
        this.ethService = app.ethService;
        this.ethLib = app.ethService.ethLib;
        this.eventManager = app.eventManager;
        this.blockNumberCacher = new BlockNumberCacher(app);
        this.erc20Lib = new Erc20Lib(this);
    }
    init(){
        return new Promise(async(resolve,reject)=>{
            try{
                this.httpProvider=this.app.httpProvider;
                this.wsProvider = this.app.wsProvider;
                this.provider = this.ethService.provider;
                this.admin = this.ethService.admin;
                this.erc20Lib = await this.erc20Lib.init();
                return resolve(this);
            }catch (e) {
                return reject(e);
            }
        })
    }
    run(){
        this.reportAllNewEvents();
        this.listenToEvents();

    }
    reportTransferEvent(_from,_to,_amount,_hash,_blockNumber){
        return new Promise(async(resolve,reject)=>{
            try{
                _amount = WeiConverter.formatToDecimals(_amount);
                this.validator.validateString(_from);
                this.validator.validateString(_to);
                this.validator.validateNumber(_amount);
                this.validator.validateString(_hash);
                this.validator.validateNumber(_blockNumber);

                let data = {"sender":{"address":_from}, "receiver":{"address":_to}, "tx_hash":_hash, "volume":_amount};

                var url = this.app.urlMap.server+'/'+this.app.urlMap.transfer_event_post_url;

                var result = await this.app.postEventData(url,data);
                if(result){
                    this.logger.logEvent(SUBJECT,'Delivered Transfer Event Data',result);
                    return resolve(true);
                }else{
                    return resolve(false);
                    //throw new Error('Reporting error')
                }
            }catch(e){
                return reject(e);
            }
        });
    }
    reportLinkEvent(_owner,_validator,_price,_hash,_blockNumber){
        return new Promise(async(resolve,reject)=>{
            try{
                _price = WeiConverter.formatToDecimals(_price);
                this.validator.validateString(_owner);
                this.validator.validateString(_validator);
                this.validator.validateNumber(_price);
                this.validator.validateString(_hash);
                this.validator.validateNumber(_blockNumber);
                var data = {"blockchain":{owner:_owner,validator:_validator,price:_price,blockNumber:_blockNumber,transactionHash:_hash}};
                var url = this.app.urlMap.server+'/'+this.app.urlMap.link_event_post_url;
                console.log('report data ',_owner,_validator,_price,_hash,_blockNumber);
                var result = await this.app.postEventData(url,data);
                if(result){
                    this.logger.logEvent(SUBJECT,'Delivered Link Event Data',result);
                    return resolve(true);
                }else{
                    return resolve(false);
                    //throw new Error('Reporting error')
                }
            }catch(e){
                return reject(e);
            }
        });
    }
    reportAllNewEvents(){
        setInterval(async()=>{
            console.log('reportAllNewEvents');
            let events = await this.eventManager.getUnreportedEvents();
            for(let eventKey in events){
                let event = events[eventKey];
                try{
                    let result = {};
                    let eventData = event.eventData;
                    if(event.isTransfer()){
                        result = await this.reportTransferEvent(
                            eventData.fromAddress,
                            eventData.toAddress,
                            eventData.value,
                            event.txHash,
                            event.blockNumber
                        );
                    }else{
                        if(event.isLink()){
                            result = await this.reportLinkEvent(
                                eventData.ownerAddress,
                                eventData.validatorAddress,
                                eventData.price,
                                event.txHash,
                                event.blockNumber
                            );
                        }
                    }
                    if(result===true){
                        this.eventManager.setReported(event.txHash);
                    }
                    console.log("RESULT ",result)

                }catch(e){
                    this.logger.logError(SUBJECT,e);
                }
            }
        },11000);
    }
    listenToEvents(){
        console.log('listenToTransferEvents')
        setInterval(async()=>{
            let startBlock = parseInt(await this.blockNumberCacher.getLastCheckedBlock());
            if(!startBlock){
                startBlock = 1;
            }
            let transferEvents = await this.getAllTransferEvents(startBlock-1);
            let linkEvents = await this.getAllLinkEvents(startBlock-1);
            let lastBlock = startBlock;

            for(let eventKey in transferEvents){
                let event = transferEvents[eventKey];
                let blockNumber = event.blockNumber;
                if(!await this.eventManager.eventStored(event.txHash,TRANSFER_EVENT)){
                    let eventData = {
                        fromAddress:event.fromAddress,
                        toAddress:event.toAddress,
                        value:event.value
                    };
                    await this.eventManager.addEvent(
                        TRANSFER_EVENT,
                        eventData,
                        event.blockNumber,
                        event.txHash
                    );
                }
                if(blockNumber > lastBlock){
                    lastBlock = blockNumber;
                }
            }

            for(let eventKey in linkEvents){
                let event = linkEvents[eventKey];
                let blockNumber = event.blockNumber;
                if(!await this.eventManager.eventStored(event.txHash,LINK_EVENT)){
                    let eventData = {
                        validatorAddress:event.validatorAddress,
                        ownerAddress:event.ownerAddress,
                        price:event.price,
                    };
                    await this.eventManager.addEvent(
                        LINK_EVENT,
                        eventData,
                        event.blockNumber,
                        event.txHash
                    );
                }
                if(blockNumber > lastBlock){
                    lastBlock = blockNumber;
                }
            }
            this.blockNumberCacher.rememberLastCheckedBlock(lastBlock);
        },10000);
    }




    getAllTransferEvents(fromBlock=0, toBlock='latest'){
        console.log(fromBlock,toBlock);
        return new Promise(async(resolve,reject)=>{
            try{
                console.log('getting events')
                this.erc20Lib.contract.getPastEvents(TRANSFER_EVENT, {
                    fromBlock: 0,
                    toBlock: 'latest'
                })
                    .then((events) => {
                        var result = {};
                        for(var eventNumber in events){
                            var event = events[eventNumber];
                            let eventData = event.returnValues;
                            result[event.transactionHash]={
                                txHash:event.transactionHash,
                                blockNumber:parseInt(event.blockNumber),
                                fromAddress:eventData['from'],
                                toAddress:eventData['to'],
                                value:parseInt(eventData['value'])
                            };
                        }
                        return resolve(result);
                    });
            }catch(e){
                return reject(e);
            }
        })
    }

    getAllLinkEvents(fromBlock=0, toBlock='latest'){
        console.log(fromBlock,toBlock);
        return new Promise(async(resolve,reject)=>{
            try{
                console.log('getting events')
                this.erc20Lib.contract.getPastEvents(LINK_EVENT, {
                    fromBlock: 0,
                    toBlock: 'latest'
                })
                    .then((events) => {
                        var result = {};
                        for(var eventNumber in events){
                            var event = events[eventNumber];
                            let eventData = event.returnValues;
                            result[event.transactionHash]={
                                txHash:event.transactionHash,
                                blockNumber:parseInt(event.blockNumber),
                                validatorAddress:eventData['validator'],
                                ownerAddress:eventData['owner'],
                                price:parseInt(eventData['price'])
                            };
                        }
                        return resolve(result);
                    });
            }catch(e){
                return reject(e);
            }
        })
    }
}

module.exports = Erc20Service;
