var apiCall = require('./apicall');

//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// remember to load a temporary database

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

chai.use(chaiHttp);

describe('Profile', function() {

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
			done();
		})

	});

	/**
	 * GET /api/profile
	 */
	describe('GET /api/profile', function() {
		it('it should GET information about the current user', function(done) {
			chai.request(server)
					.get('/api/profile')
					.end(function(err, res) {
						res.should.have.status(200);
						res.body.should.be.an.Object()
					});
		});
	});


})