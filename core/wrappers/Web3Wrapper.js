'use strict';
require('app-module-path').addPath(process.env.baseDir);
const SUBJECT = 'Web3Wrapper';
const Web3 = require('web3');

class Web3Wrapper{
    constructor(app){
        this.validator = app.validator;
        this.logger = app.logger;
    }
    init(){
        this.web3ws = new Web3(new Web3.providers.WebsocketProvider(this.getWsProviderAddress()),{
            headers: {
                Origin: "some_meaningful_name"
            }
        });
        this.web3http = new Web3(new Web3.providers.HttpProvider(this.getHttpProviderAddress()));
        return this;
    }
    getWsProvider(){
        return this.web3ws;
    }
    getHttpProvider(){
        return this.web3http;
    }
    getWsProviderAddress(){
        let result = process.env.node_address_ws;
        this.validator.validateString(result,'Ws Provider Address');
        return result;
    }

    getHttpProviderAddress(){
        let result = process.env.node_address_http;
        this.validator.validateString(result,'Http Provider Address');
        return result;
    }
}

module.exports = Web3Wrapper;