process.env.NODE_ENV = 'development';
if(!process.env.NODE_ENV){
    console.error("NODE ENVIROMENT is not defined. Create .env file at root of the project");
    process.exit(1);
}
process.env.baseDir = '/home/max/prometeus/';
process.env.LAST_BLOCK_FILE='./blocknumber.txt';
process.env.SERVER = "http://127.0.0.1";
process.env.node_address_http='https://ropsten.infura.io/v3/d67bf7aef71d46d0b519e7941174ef9f';
process.env.node_address_ws='wss://ropsten.infura.io/ws';
process.env.MONGODB_URL ='127.0.0.1:27017';
process.env.MONGODB_DB = 'mydb';
process.env.logDir = '.';
process.env.fileMode='0666';
process.env.PORT=8632;
process.env.ADMIN_ADDRESS="0x2c5B73805753165d791a3155b45B8B87F8cCF384";