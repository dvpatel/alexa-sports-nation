/*
 *   Application utility.
 */

var async = require('async');
var dbm = require('../dbutil');

module.exports = function(awsConfig) {

	var dbutil = dbm(awsConfig) ;
	var module = {} ;
	
	
	
	
	
	/*
	 * Return top homeruns hitter for a given start and end year range
	 */
	module.maxHomerunByYears = function(startYear, endYear, appCallback) {
		
		if (startYear > endYear) {
			var error = "ERROR:  start year cannot be greater than end year." ;
			appCallback(error, null) ;
			return ;
		}

		// Return today's date and time
		var currentTime = new Date()
		var currentYear = currentTime.getFullYear()
		if (endYear > currentYear) {
			var error = "ERROR:  Current year is " + currentYear + ", not " + endYear + ".  Not there yet." ;
			appCallback(error, null) ;		
			return ;
		}
		
		if (startYear < 1871) {
			var error = "ERROR:  Basbeall did not exisit before " + startYear + ".  Please enter value greater than 1871." ;
			appCallback(error, null) ;		
			return ;			
		}
		
		/*
		 * Chain 1:  get home runs and playerID for given range
		 */
		function homeruns(callback) {
		    var yrRange = [] ;
		    var n = endYear - startYear ; 

		    for (var i = 0; i < n; i++) {
		    	yrRange.push(endYear - i) ;	
		    }

		    var results = [] ;
		    async.each(yrRange,
		        function(yr, cb) {

		            dbutil.topHomerunsByYear(yr, function(err, data) {
		                if (err) {
		                    console.error(err) ;
		                } else {
				    if (data.Items.length > 0) {
			                results.push(data.Items[0]) ;
		                    }
		                }
		                cb() ;
		            }) ;

		        }, function(err) {
			    callback(null, results) ;
			}
		    ) ;
		}
		
		/*
		 * Chain 2:  for each playerID, lookup player name from Players table
		 */
		function playerLookup(results, callback) {

		    async.each(results,
		        function(item, cb) {
		            dbutil.playerLookup(item.playerID, function(err, data) {
		                if (err) {
		                    console.error(err) ;
		                } else {
		                    item.fullName = data.Item.fullName ;
		                }
		            }) ;
		            cb() ;               
		        }, function(err) {
		            callback(null, results) ;
		        }
		    ) ;
		}

		/*
		 * Chain 3:  function to lookup team name based on playerID and yearID 
		 */
		function teamNameLookup(hr_items, callback) {
		    var r = {} ;
		    async.each(hr_items,
		        function(item, cb) {
		            dbutil.teamNameLookup(item.teamID, item.yearID, function(err, data) {
		                if (err) {
		                    console.error(err) ;
		                } else {
		                    item.franchiseName = data.Item.franchiseName ;
		                }
		                cb() ;
		            }) ;
		        }, function(err) {
		                callback(null, hr_items) ;
		        }
		    ) ;
		}
		
	    async.waterfall([ 
	        homeruns,
	        playerLookup,
	        teamNameLookup
	    ], function(error, nr) {
	    	
	    	//  Sort the results and return ;
	    	nr.sort(function(a,b) { return b.HR - a.HR ; } ) ;	    	
	    	
	    	appCallback(error, nr) ;
	    }) ;		
	}
	
	
	

	return module ;
} ;
