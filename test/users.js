//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.SERVER_URL = 'http://localhost:7474/'; // run tests on local db
process.env.DB_USER = 'neo4j';
process.env.DB_PASS = 'password';

var db = require('seraph')({
	server: process.env.SERVER_URL || 'http://localhost:7474/', // 'http://studionetdb.design-automation.net'
	user: process.env.DB_USER,
	pass: process.env.DB_PASS
});

// remember to load a temporary database

//Require the dev-dependencies
var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var app = require('../app');
var should = chai.should();
var assert = chai.assert;
var expect = chai.expect;
var request = require('supertest');
var agent = request.agent(app);

var inspect = require('eyespect').inspector();


describe('API Test: /api/users', function() {

	// Before each test we empty the database
	
	beforeEach(function(done) {

		var query = [ 
			'START n=node(*)',
			'OPTIONAL MATCH (n)-[r]-()',
			'DELETE n,r'
		].join('\n');

		db.query(query, function(error, result) {
			if (error)
				console.log('error');
			return;
		});

		var query = [ 
			'START n=node(*)',
			'OPTIONAL MATCH (n)-[r]-()',
			'DELETE n,r'
		].join('\n');

		db.query(query, function(error, result) {
			if (error)
				console.log('error');
			return;
		});

	});
	

	/**
	 * GET /api/profile
	 */
	describe('GET /api/users', function() {
		it('It should allow me to login', function(done){
				agent
					.get('/auth/basic')
					.auth('USER1', '123')	// openid of test acc, any pw
					.then(function(res){
						expect(res).to.have.status(302);
						expect(res).to.redirectTo('/');
						done();
					});
		});

		/*
		it('it should GET information about the current user', function(done) {
			chai.request(server)
					.get('/api/profile')
					.end(function(err, res) {
						res.should.have.status(200);
						res.body.should.be.an.Object();
					});
		});
		*/
	});


});