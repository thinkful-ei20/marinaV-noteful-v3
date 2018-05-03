'use strict';
//NOTE: we are using MONGODB_URI here, instead of DATABASE_URL mentioned in the curriculum, because it syncs up
// with Heroku's mLab Add-On
//minimum needed to connect the noteful database running locally on the default port (27017)
exports.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/noteful';
exports.TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost/noteful-test';
exports.PORT = process.env.PORT || 8080;
