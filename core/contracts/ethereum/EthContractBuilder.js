require('app-module-path').addPath(process.env.baseDir);
class ContractBuilder{
	constructor(app){
		this.app = app;
		this.validator = app.validator;
		this.ethLib=app.ethLib;
		this.httpProvider = this.ethLib.httpProvider;
		this.wsProvider = this.ethLib.wsProvider;
		this.providers = {};
		this.providers['http'] = this.httpProvider;
		this.providers['ws'] = this.wsProvider;
		//this.fetcher = new FileFetcher();
	}

	build(address,abi,provider="http"){
		return new Promise(async(resolve,reject)=>{
			try{
				let contract= new this.providers[provider].eth.Contract(
                    abi);
                contract.options.address=address;
                this.validator.validateObject(contract, 'Smart Contract');
				return resolve(contract);
			}catch(e){
				return reject(e);
			}			
		})
	}
}

module.exports = ContractBuilder;
