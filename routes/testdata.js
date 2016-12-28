var express = require('express');
var router = express.Router();
var path = require('path');

router.route('/')

	.get(function(req, res){
		res.set("Content-Disposition", "inline;filename=testdata.csv");
		res.set('Content-Type', 'text/csv');
		res.sendFile(path.resolve(__dirname + '/../test/testdata.csv'));
	})


module.exports = router;
