'use strict';
const dotenv = require('dotenv');
dotenv.config();

require('./enviroment');
const Application = require('./Application');

console.log(process.env.NODE_ENV);

let proxy = new Application();