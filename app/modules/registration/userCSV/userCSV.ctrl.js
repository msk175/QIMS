angular.module('registration')
.controller('userCSVCtrl', function(API,APIError,Base,localStorageService,$scope,$state,$http) {

    const userCSV = this

    userCSV.submitError = false
    userCSV.initializing = true
    APIError.offFor('userCSV.initializing')
	var organization_id='OIESO-CLOUD13807765';
		
	if (!Base.user.entitlements.length>0) {
		userCSV.initializing = false;
		$state.go('misc.notAuth');	
	}
	
	 API.cui.initiateNonce()
    .then(res => {
        return API.cui.getSecurityQuestionsNonce()
    })
    .then(res => {
        res.splice(0, 1) // Split questions
        let numberOfQuestions = res.length
        let numberOfQuestionsFloor = Math.floor(numberOfQuestions/2)

		var challengeQuestions1 = res.slice(0, numberOfQuestionsFloor)
        var challengeQuestions2 = res.slice(numberOfQuestionsFloor)

		
		var securityQuestionAccount = {
			version: '1',
			questions: [{
				question: {
					id: challengeQuestions1[0].id,
					type: 'question',
					realm: 'IESO-CLOUD'
				},
				answer: 'test',
				index: 1
			},
			{
				question: {
					id: challengeQuestions2[0].id,
					type: 'question',
					realm: 'IESO-CLOUD'
				},
				answer: 'test',
				index: 2
			}]
		}
		$scope.security = JSON.stringify(securityQuestionAccount);
        return API.cui.getOrganizationNonce({organizationId: organization_id})
    })
	.then(res => {
		$scope.organization = JSON.stringify(res);	
	})


    userCSV.submit = () => {
	   userCSV.submitting=true;
	   var csvfile = $scope.csvFile;
	   
	   if (typeof csvfile == 'undefined') {
			userCSV.errorMessage="No file found, please try again.";
			userCSV.submitError=true;
	   } else {
		   if ((csvfile.name).match(/.csv$/i)) {
				userCSV.errorMessage="";
				$http({
					'method'  : 'POST',
					'url'     : 'http://localhost:3000/upload/csv',
					'headers' : {
						'Content-Type': undefined
					},
					'data'    : { 
						'security' : $scope.security,
						'organization' : $scope.organization,
						'csvfile' : $scope.csvFile
					},
					transformRequest: function (data, headersGetter) {
						var formData = new FormData();
						angular.forEach(data, function (value, key) {
							formData.append(key, value);
						});

						var headers = headersGetter();
						delete headers['Content-Type'];

						return formData;
					}
				}).then(function(data) {
					$state.go('misc.success-csv');
				});	
		   } else {
				userCSV.errorMessage="You have chosen a file that is not a .csv file";
				userCSV.submitError=true;
		   }
	   }
	   userCSV.submitting=false;
    }
})