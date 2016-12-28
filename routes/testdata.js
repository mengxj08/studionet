var express = require('express');
var router = express.Router();
var path = require('path');

router.route('/')

	.get(function(req, res){

		console.log('received');
		
		res.sendFile(path.resolve(__dirname + '/../test/testdata.csv'));

	})


module.exports = router;
