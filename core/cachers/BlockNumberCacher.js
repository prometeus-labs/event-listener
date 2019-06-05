'use strict';
require('app-module-path').addPath(process.env.baseDir);
const fs = require('fs');
const SUBJECT = 'BlockNumberCacher';
const LAST_BLOCK_FILE = process.env.LAST_BLOCK_FILE;
class BlockNumberCacher{
    constructor(app){
        this.app = app;
        this.logger = app.logger;
        this.validator = app.validator;
    }
    getLastCheckedBlock(){
        return new Promise((resolve,reject)=>{
            try{
                var result = fs.readFileSync(LAST_BLOCK_FILE,'utf8');
                if(result){
                    this.validator.validateNumber(result,'Last checked block number');
                    return resolve(result);
                }else{
                    throw new Error('Error Reading Last checked block number');
                }
            }catch(e){
                this.logger.logError(SUBJECT,e);
                return reject(e);
            }
        });
    }
    rememberLastCheckedBlock(blockNumber){
        return new Promise((resolve,reject)=>{
            try{
                var result = fs.writeFileSync(LAST_BLOCK_FILE,blockNumber);
                // if(result){
                return resolve(result);
                // }else{
                //  throw new Error('Error Writing Last checked block number');
                // }
            }catch(e){
                this.logger.logError(SUBJECT,e);
                return reject(e);
            }
        });
    }
}

module.exports = BlockNumberCacher;