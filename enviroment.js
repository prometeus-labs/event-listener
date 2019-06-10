process.env.NODE_ENV = 'development';
if(!process.env.NODE_ENV){
    console.error("NODE ENVIROMENT is not defined. Create .env file at root of the project");
    process.exit(1);
}
process.env.baseDir = '.';
process.env.LAST_BLOCK_FILE='./blocknumber.txt';
process.env.SERVER = "http://127.0.0.1";
process.env.node_address_http='http://95.217.45.242:5545';
process.env.node_address_ws='ws://95.217.45.242:6545';
process.env.MONGODB_URL ='172.17.0.1:47017';
process.env.MONGODB_DB = 'mydb';
process.env.logDir = '.';
process.env.fileMode='0666';
process.env.PORT=3000;
process.env.ADMIN_ADDRESS="0x82a7fc1c127a04bf1e261d71055c07ed5ad28855";
