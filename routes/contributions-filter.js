var _ = require('underscore');

var filterHelper = {

  parseArrayOrNumberToInt: function(toParse) {
    return toParse instanceof Array ? toParse.map(x => parseInt(x))
                                    : parseInt(toParse);
  },

  isMatchingAllForParam: function(theParam) {
    return (typeof theParam === 'number') && (theParam === -1);
  },

  getFinalUserIdParam: function(specifiedUserIds, userIdsFromGroupQuery) {
    return specifiedUserIds instanceof Array ? _.union(specifiedUserIds, userIdsFromGroupQuery)
                                             : [];
  },

  getFinalDateParamObj: function(dateArray) {
    var isArray = dateArray instanceof Array;
    return {
      matchAllDates: !isArray,
      dateLowerParam: isArray ? dateArray[0] : -1,
      dateUpperParam: isArray ? dateArray[1] : -1
    }
  },

  getFinalRateParamObj: function(rateArray) {
    var isArray = rateArray instanceof Array;
    return {
      matchAllRatings: !isArray,
      rateLowerParam: isArray ? rateArray[0] : 0,
      rateUpperParam: isArray ? rateArray[1] : 5
    }
  },

  getFinalTagsParamObj: function(tagsArray) {
    var isArray = tagsArray instanceof Array;
    return {
      matchAllTags: !isArray,
      tagIdsParam: isArray ? tagsArray : []
    }
  },

  getQueryFilteringUsersGroupsAndTags: function(tagsParamObj, matchAllGroups, matchAllUsers, userIdsParam) {
    return 'MATCH ' + (tagsParamObj.matchAllTags ? '' : '(t:tag)<-[:TAGGED]-') + '(c:contribution)'
            + (matchAllGroups || matchAllUsers ? '' : '<-[:CREATED]-(u:user)')
            + ' WHERE true '  // important
            + (matchAllGroups || matchAllUsers ? '' : ' AND ID(u) IN [' + userIdsParam + ']')
            + (tagsParamObj.matchAllTags ? '' : ' AND ID(t) IN [' + tagsParamObj.tagIdsParam + ']');
  },

  getQueryFilteringLowerRating: function(rateParamObj) {
    return rateParamObj.matchAllRatings ? '' : ' AND toInt(c.rating) >= toInt(' + rateParamObj.rateLowerParam + ')';
  },

  getQueryFilteringUpperRating: function(rateParamObj) {
    return rateParamObj.matchAllRatings ? '' : ' AND toInt(c.rating) <= toInt(' + rateParamObj.rateUpperParam + ')';
  },

  getCombinedQueryFilteringRating: function(rateParamObj) {
    return rateParamObj.matchAllRatings ? '' : this.getQueryFilteringLowerRating(rateParamObj) + this.getQueryFilteringUpperRating(rateParamObj);
  },

  getQueryFilteringLowerDate: function(dateParamObj) {
    return dateParamObj.matchAllDates ? '' : ' AND toInt(c.dateCreated) >= toInt(' + dateParamObj.dateLowerParam + ')';
  },

  getQueryFilteringUpperDate: function(dateParamObj) {
    return dateParamObj.matchAllDates ? '' : ' AND toInt(c.dateCreated) <= toInt(' + dateParamObj.dateUpperParam + ')';
  },

  getCombinedQueryFilteringDate: function(dateParamObj) {
    return dateParamObj.matchAllDates ? '' : this.getQueryFilteringLowerDate(dateParamObj) + this.getQueryFilteringUpperDate(dateParamObj);
  }

}

module.exports = filterHelper;
