module.exports.relationships = [

	// contribution -> contribution
	{
		"src_type" : "contribution",
		"target_type" : "contribution",
		"name" : "QUESTION_FOR"
	},

	{
		"src_type" : "contribution",
		"target_type" : "contribution",
		"name" : "ANSWER_FOR"
	},

	{
		"src_type" : "contribution",
		"target_type" : "contribution",
		"name" : "COMMENT_FOR"
	},

	{
		"src_type" : "contribution",
		"target_type" : "contribution",
		"name" : "RESOURCE_FOR",
		"createdBy": "__"
	},

	{
		"src_type" : "contribution",
		"target_type" : "contribution",
		"name" : "INSPIRED_FROM",
		"createdBy": "__"
	},

	{
		"src_type" : "contribution",
		"target_type" : "contribution",
		"name" : "RELATED_TO",
		"createdBy": "__",
		"note": "__"
	},

	// user -> contribution
	{
		"src_type" : "user",
		"target_type" : "contribution",
		"name" : "LIKED",
		"properties": [
				{
					"name": "count",
					"type" : 0
			    }
		]
	},
	{
		"src_type" : "user",
		"target_type" : "contribution",
		"name" : "VIEWED",
		"properties": [
				{
					"name": "count",
					"type" : 0
			    },
				{
					"name": "last_viewed",
					"type" : new Date()
			    }
		]
	}


]