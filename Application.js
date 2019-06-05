'use strict';
require('app-module-path').addPath(process.env.baseDir);
const Error_401 = require('./core/exceptions/Error_401');
const Error_404 = require('./core/exceptions/Error_404');

const SUBJECT = 'EthProxy';
const DEBUG = true;

const Validator = require('./core/utilites/Validator');
const HttpService = require('./core/services/httpService');
const urlMap = require('./urlMap');
const Logger = require('./core/utilites/Logger');
const MongoDb = require('./core/services/MongoDb');
const Erc20Service = require('./core/services/Erc20Service');
const EthService = require('./core/services/EthService');
const EventManager = require('./core/managers/StoredEventManager');
const HttpServerWrapper = require('./core/wrappers/HttpServerWrapper');

class Application{
    constructor(){
        this.logger = new Logger(DEBUG);
        this.validator = new Validator();
        this.server = new HttpServerWrapper(this);
        this.urlMap = urlMap;
        this.httpService = new HttpService(this);
        this.mongoDb = new MongoDb(this);
        this.eventManager = new EventManager(this);
        this.ethService = new EthService(this);
        this.erc20Service = new Erc20Service(this);
        this.server.run();
        this.init();
    }
    init(){
        return new Promise(async(resolve,reject)=>{
            try{
                console.log('init');
                this.mongoDb = await this.mongoDb.init();
                console.log('mongodb');
                this.eventManager = await this.eventManager.init();
                this.ethService = await this.ethService.init();
                console.log('eth');
                this.erc20Service = await this.erc20Service.init();
                console.log('erc20');
                this.run();
                return resolve(true);
            }catch (e) {
                this.logger.logError(SUBJECT,e);
                return reject(e);
            }
        });
    }
    run(){
        try{
            this.logger.logEvent(SUBJECT,'API IS RUNNING');

            this.erc20Service.run();

            this.server.post('/token/test',async(request,response)=>{
                console.log(request);
                return response.send(200);
            })
        }catch(e){
            this.logger.logError(SUBJECT,e);
        }
    }
    postEventData(req_url,data){
        return new Promise(async(resolve,reject)=>{
            try{
                this.validator.validateUrl(req_url,'Request Url');
                this.validator.validateObject(data,'Request Data');
                let result = await this.httpService.postRequest(req_url, data);
                return resolve(result);
            }catch(e){
                this.logger.logError(SUBJECT,e);
                return reject(e);
            }
        });
    }
}

module.exports = Application;