'use strict';
require('app-module-path').addPath(process.env.baseDir);
const SUBJECT = 'ERC20Service';
const Erc20Lib = require('core/contracts/ethereum/token/ContractLib');
const WeiConverter = require('core/helpers/WeiConverter');
const BlockNumberCacher = require('core/cachers/BlockNumberCacher')
class Erc20Service{
    constructor(app){
        this.app = app;
        this.validator=app.validator;
        this.logger = app.logger;
        this.ethService = app.ethService;
        this.ethLib = app.ethService.ethLib;
        this.eventManager = app.eventManager;
        this.blockNumberCacher = new BlockNumberCacher(app);
    }
    init(){
        return new Promise(async(resolve,reject)=>{
            try{
                this.httpProvider=this.app.httpProvider;
                this.wsProvider = this.app.wsProvider;
                this.provider = this.ethService.provider;
                this.admin = this.ethService.admin;
                this.erc20Lib = new Erc20Lib(this);
                return resolve(this);
            }catch (e) {
                return reject(e);
            }
        })
    }
    run(){
        this.reportAllNewEvents();
        this.listenToTransferEvents();
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
                var data = {"blockchain":{fromAddress:_from,toAddress:_to,value:_amount,blockNumber:_blockNumber,transactionHash:_hash}};
                var url = this.app.urlMap.server+'/'+this.app.urlMap.transfer_event_post_url;
                console.log('report data ',_from,_to,_amount,_hash,_blockNumber);
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
    reportAllNewEvents(){
        setInterval(async()=>{
            let events = await this.eventManager.getUnreportedEvents();
            for(let eventKey in events){
                let event = events[eventKey];
                try{
                    let result = await this.reportTransferEvent(
                        event.fromAddress,
                        event.toAddress,
                        event.value,
                        event.txHash,
                        event.blockNumber
                    );
                    if(result===true){
                        this.eventManager.setReported(event.txHash);
                    }
                    console.log("RESULT ",result)

                }catch(e){
                    this.logger.logError(SUBJECT,e);
                }
            }
        },1100);
    }
    listenToTransferEvents(){
        console.log('listenToTransferEvents')
        setInterval(async()=>{
            let startBlock = parseInt(await this.blockNumberCacher.getLastCheckedBlock());
            if(!startBlock){
                startBlock = 1;
            }
            let events = await this.getAllTransferEvents(startBlock-1);
            let lastBlock = startBlock;
            for(let eventKey in events){
                let event = events[eventKey];
                let blockNumber = event.blockNumber;
                if(!await this.eventManager.eventStored(event.txHash)){
                    await this.eventManager.addEvent(
                        'Transfer',
                        event.fromAddress,
                        event.toAddress,
                        event.value,
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
                this.erc20Lib.contract.getPastEvents('Transfer', {
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
}

module.exports = Erc20Service;