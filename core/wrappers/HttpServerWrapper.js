'use strict';
require('app-module-path').addPath(process.env.baseDir);
const express = require('express');
const bodyParser=require('body-parser');
const Http = require('http');

class HttpServerWrapper{
    constructor(application){
        this.application = application;
        this.server = express();
        this.logger = application.logger;
        this.validator = application.validator;
        this.httpServer = Http.createServer(this.server);
        this.apiAuthService = application.apiAuthService;
        this.server.use(bodyParser.urlencoded({ extended: true }));
        this.server.use(bodyParser.json());
    }
    
    run(){
        this.httpServer.listen(process.env.PORT, (err) => {
            if (err) {
                return this.logger.debug('something bad happened', err)
            }
            this.logger.debug(`server is listening on `+process.env.PORT)
        });
    }

    post(url,callback){
        this.server.post(url,callback);
    }
    get(url,callback){
        this.server.get(url,callback);
    }


    processRequestData(request){
        return new Promise(async(resolve,reject)=>{
            try{
                if(this.apiAuthService){
                    if(await this.apiAuthService.checkAuthorization(request)){
                        return resolve(request.body);
                    }
                }
            }catch(e){
                return reject(e);
            }
        });
    }
    processResponseData(response,result,data){
        let code = 200;
        if(!result){
            code = 400;
        }
        if(result){
            response.setHeader('Content-Type','application/json');
        }
        let all = data;
        return response.send(all);
    }
    processResponseDataWithCodes(response,result,data){
        let code = 200;
        if(!result){
            code = 400;
            response.statusCode = code;
            if(data instanceof Error_401){
                response.statusCode = data.code;
            }
            if(data instanceof Error_404){
                response.statusCode = data.code;
            }
        }

        if(result){
            response.setHeader('Content-Type','application/json');
        }
        let all = data;
        return response.send(all);
    }
}
module.exports = HttpServerWrapper;