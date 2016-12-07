//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

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
var agent = chai.request.agent(app);



describe('User', function() {

	// Before each test we empty the database
	
	beforeEach(function(done) {

		agent
			.get('/auth/fake')
			.query({id: 'E0002744'})
			.end(function (err, res){
				expect(res).to.have.cookie('connect.sid');
				expect(res).to.redirectTo('/');
				done();
			});
			
		
		/*
		var query = [ 
			'START n=node(*)',
			'OPTIONAL MATCH (n)-[r]-()',
			'DELETE n,r'
		].join('\n');

		db.query(query, function(error, result) {
			if (error)
				console.log('error');
			done();
		})
		*/	

	});
	

	/**
	 * GET /api/profile
	 */
	describe('POST /api/user', function() {
		it('It should allow me to add an admin', function(done){
			
			var test = 'test2';

			agent
				.get('/')
			/*
				.post('/api/users')
				.send({
					nusOpenId: test,
					name: test,
					isAdmin: true
				})*/
				//.field('nusOpenId', test)
				//.field('name', test)
				//.field('isAdmin', true)
				.end(function(err, res){
					console.log(res);
					expect(res).to.have.status(200);
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


})