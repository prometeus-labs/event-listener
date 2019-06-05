'use strict';
require('app-module-path').addPath(process.env.baseDir);
const Validator = require('core/utilites/Validator');
const SUBJECT = 'EthRequestHandlers';
let validator = new Validator();
class Configurator{
    check(subject, config){
        try{
            validator.validateObject(subject);
            for(let key in config){
                if(subject[key]){
                    validator.validateObject(subject[key]);
                }else{
                    throw new Error('Cannot find module '+key+' in '+typeof subject);
                }
            }
        }catch (e) {
            console.error(e)
        }
    }

    configure(subject,parent,config){
        try{
            validator.validateObject(subject,'Subject');
            validator.validateObject(parent,'Parent');
            validator.validateObject(config,'config');
            for(let key in config){
                if(parent[key]){
                    subject[key]=parent[key];
                }else{
                    throw new Error('Cannot find module '+key+' in parent '+typeof parent);
                }
            }
        }catch (e) {

        }
    }
}

module.exports=Configurator;