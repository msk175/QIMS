angular.module('common')
.factory('UserProfileV2', function(API, APIError, LocaleService, Timezones, $filter, $q, $timeout, $window) {

    const errorName = 'userProfileFactory.'
    const facebook = 'facebook'
    const google = 'google'
    const twitter = 'twitter'

    const UserProfile = {
        
        setSocialAccount:function(type,index){
            var socialAccount={};
            socialAccount.socialName=type;
            socialAccount.linked="";
            return socialAccount;
        },

        initUser: function(userId) {
            let defer = $q.defer()
            let user = {}

            API.cui.getPerson({ personId: userId })
            .done(res => {
                // If the person object has no addresses we need to initialize it
                if (!res.addresses) res.addresses = [{streets: []}]
                user.user = Object.assign({}, res)
                user.tempUser = Object.assign({}, res)
                defer.resolve(user)
            })
            .fail(err => {
                console.error('Failed getting user information', err)
                APIError.onFor(errorName + 'initUser')
                $timeout(() => {
                    APIError.offFor(errorName + 'initUser')
                }, 5000)
                defer.reject(err)
            })
            return defer.promise
        },

        initSecurityQuestions: function(userId) {
            let defer = $q.defer()
            let securityQuestions = {
                userSecurityQuestions: {},
                tempUserSecurityQuestions: {},
                allSecurityQuestions: [],
                allSecurityQuestionsDup: []
            }

            $q.all([
                API.cui.getSecurityQuestionAccount({ personId: userId }), 
                API.cui.getSecurityQuestions()
            ])
            .then(res => {
                angular.copy(res[0], securityQuestions.userSecurityQuestions)
                angular.copy(res[0], securityQuestions.tempUserSecurityQuestions)
                angular.copy(res[1], securityQuestions.allSecurityQuestions) 
                angular.copy(res[1], securityQuestions.allSecurityQuestionsDup)

                securityQuestions.allSecurityQuestions.splice(0, 1)

                let numberOfQuestions = securityQuestions.allSecurityQuestions.length
                let numberOfQuestionsFloor = Math.floor(numberOfQuestions/2)

                securityQuestions.allChallengeQuestions0 = securityQuestions.allSecurityQuestions.slice(0, numberOfQuestionsFloor)
                securityQuestions.allChallengeQuestions1 = securityQuestions.allSecurityQuestions.slice(numberOfQuestionsFloor)

                securityQuestions.challengeQuestionsTexts = UserProfile.selectTextsForQuestions(securityQuestions)

                defer.resolve(securityQuestions)
            })
            .catch(err => {
                console.error('Failed getting security question data', err)
                APIError.onFor(errorName + 'initSecurityQuestions')
                $timeout(() => {
                    APIError.offFor(errorName + 'initSecurityQuestions')
                }, 5000)
                defer.reject(err)
            })
            return defer.promise
        },

        selectTextsForQuestions: function(securityQuestions) {
            let challengeQuestionsTexts = []

            angular.forEach(securityQuestions.userSecurityQuestions.questions, (userQuestion) => {
                let question = _.find(securityQuestions.allSecurityQuestionsDup, (question) => {
                    return question.id === userQuestion.question.id
                })
                challengeQuestionsTexts.push($filter('cuiI18n')(question.question))
            })
            return challengeQuestionsTexts
        },
        
        initSocialLogin: function(userId) {
            let defer = $q.defer()
            let user = {}
            let socialLoginAccounts = [];


            API.cui.getSocialLoginAccounts({ personId: userId })
            .done(res => {
                
                //console.log("socialLoginAccounts:::"+res.length);
                res.forEach(function(respons){
                        console.log(respons);
                        socialLoginAccounts.push(respons); 
                    });
                console.log("socialLoginAccounts:::444"+socialLoginAccounts);
                socialLoginAccounts.forEach(function(respons1){
                        console.log(respons1);
                    });
                user.socialLoginAccounts=socialLoginAccounts;

                defer.resolve(user)
            })
            .fail(err => {
                console.error('Failed getting user SocialLoginAccounts information', err)
                APIError.onFor(errorName + 'initSocialLogin')
                $timeout(() => {
                    APIError.offFor(errorName + 'initSocialLogin')
                }, 5000)
                defer.reject(err)
            })
            return defer.promise
        },

        initMFA: function(userId) {
            let defer = $q.defer()
            let user = {}
            let mfaConfg={}
            API.cui.getPersonAttributes({personId: userId})
            .done(function(res){
                UserProfile.userAttributesTemplate=angular.copy(res);
                UserProfile.userAttributesTemplate.attributes.forEach(function(attribute){
                console.log("In initMFA attributes" + JSON.stringify(attribute))
                if (attribute.value!="null") {
                console.log("mfa: attribute.value::"+attribute.value);

                    switch(attribute.name){
                        case 'TWO_FACTOR_AUTH_TYPE':mfaConfg=attribute.value;
                        break;
                    }// end if for switch
                }// end if for attribute.value
                })                
                console.log("mfa: user.mfaConfg::"+mfaConfg);
                user.mfaConfg=mfaConfg;

                defer.resolve(user)
            })
            .fail(err => {
                console.error('Failed getting user initMFA information', err)
                APIError.onFor(errorName + 'initMFA')
                $timeout(() => {
                    APIError.offFor(errorName + 'initMFA')
                }, 5000)
                defer.reject(err)
            })
            return defer.promise
        },// initMFA 

        initPasswordPolicy: function(organizationId) {
            let defer = $q.defer()
            let passwordPolicy = {}

            API.cui.getOrganization({ organizationId: organizationId })
            .then(res => {
                passwordPolicy.organization = res
                return API.cui.getPasswordPolicy({policyId: res.passwordPolicy.id})
            })
            .then(res => {
                passwordPolicy.passwordRules = res.rules
                defer.resolve(passwordPolicy)
            })
            .fail(err => {
                console.error('Failed getting password policy data', err)
                APIError.onFor(errorName + 'initPasswordPolicy')
                $timeout(() => {
                    APIError.offFor(errorName + 'initPasswordPolicy')
                }, 5000)
                defer.reject(err)
            })
            return defer.promise
        },

        initUserProfile: function(userId, organizationId) {
            let defer = $q.defer()
            let profile = {}
            let callsCompleted = 0

            console.log("user id "+userId+", org id "+organizationId);

            UserProfile.initUser(userId)
            .then(res => {
                angular.merge(profile, res)
                console.log(" initUser callsCompleted : "+callsCompleted)
            })
            .finally(() => {
                callsCompleted++
                if (callsCompleted === 4) defer.resolve(profile)
            })

            UserProfile.initSecurityQuestions(userId)
            .then(res => {
                angular.merge(profile, res)
                console.log(" initSecurityQuestions callsCompleted : "+callsCompleted)
            })
            .finally(() => {
                callsCompleted++
                if (callsCompleted === 4) defer.resolve(profile)
            })

            UserProfile.initPasswordPolicy(organizationId)
            .then(res => {
                angular.merge(profile, res)
                console.log(" initPasswordPolicy callsCompleted : "+callsCompleted)
            })
            .finally(() => {
                callsCompleted++
                if (callsCompleted === 4) defer.resolve(profile)
            })

            //Added for integration for Social login and MFA
            UserProfile.initSocialLogin(userId)
            .then(res => {
                angular.merge(profile, res)
                console.log(" initSocialLogin : "+callsCompleted)
                //alert(JSON.stringify(profile));
                //console.log("----")
                //console.log(JSON.stringify(profile))
            })
            .finally(() => {
                callsCompleted += 1
                if (callsCompleted === 4) defer.resolve(profile)
            })
        
            UserProfile.initMFA(userId)
            .then(res => {
                angular.merge(profile, res)
                //profile['mfaConfg'] = res
                //angular.merge(profile, res)
                //alert(JSON.stringify(profile));
                //console.log("----")
                // profile.user.confg='push'
                console.log(" initMFA callsCompleted : "+callsCompleted)
                console.log(" initMFA in UserProfileV2 function after mfa merge "+JSON.stringify(profile))
            })
            .finally(() => {
                callsCompleted += 1
                if (callsCompleted === 4) defer.resolve(profile)
            })

            return defer.promise
        },

        buildPersonPasswordAccount: function(user, passwordAccount, organization) {
            return {
                version: '1',
                username: user.username,
                currentPassword: passwordAccount.currentPassword,
                password: passwordAccount.password,
                passwordPolicy: organization.passwordPolicy,
                authenticationPolicy: organization.authenticationPolicy
            }
        },

        injectUI: function(profile, $scope, personId) {
            let userId

            personId
                ? userId = personId
                : userId = API.getUser()

            profile.saving = false
            profile.fail = false
            profile.success = false
            profile.timezoneById = Timezones.timezoneById
            profile.toggleOffFunctions = {}

            profile.resetAllData = () => {
                angular.copy(profile.userSecurityQuestions, profile.tempUserSecurityQuestions)
                angular.copy(profile.user, profile.tempUser)
            }

            profile.toggleAllOff = () => {
                angular.forEach(profile.toggleOffFunctions, function(toggleOff) {
                    toggleOff()
                })
                profile.resetAllData()
            }

            profile.pushToggleOff = (toggleOffObject) => {
                if (!profile.toggleOffFunctions) profile.toggleOffFunctions = {}
                profile.toggleOffFunctions[toggleOffObject.name] = toggleOffObject.function
            }

            profile.resetPasswordFields = () => {
                profile.userPasswordAccount = {
                    currentPassword: '',
                    password: ''
                }
                profile.passwordRe = ''
            }

            profile.checkIfRepeatedSecurityAnswer = (securityQuestions, formObject) => {
                securityQuestions.forEach((secQuestion, i) => {
                    let securityAnswerRepeatedIndex = _.findIndex(securityQuestions, (secQuestionToCompareTo, z) => {
                        return z !== i && secQuestion.answer && secQuestionToCompareTo.answer && secQuestion.answer.toUpperCase() === secQuestionToCompareTo.answer.toUpperCase()
                    })
                    if (securityAnswerRepeatedIndex > -1) {
                        if (formObject['answer' + securityAnswerRepeatedIndex]) {
                            formObject['answer' + securityAnswerRepeatedIndex].$setValidity('securityAnswerRepeated', false)
                        }
                        if (formObject['answer' + i]) {
                            formObject['answer' + i].$setValidity('securityAnswerRepeated', false)
                        }
                    }
                    else {
                        if (formObject['answer' + i]) {
                            formObject['answer' + i].$setValidity('securityAnswerRepeated', true)
                        }
                    }
                })
            }

            profile.updatePerson = (section, toggleOff) => {
                if (section) profile[section] = { submitting: true }

                if (!profile.userCountry) profile.tempUser.addresses[0].country = profile.user.addresses[0].country
                else profile.tempUser.addresses[0].country = profile.userCountry.originalObject.code

                // [7/20/2016] Note: Can't pass in 'activatedDate' anymore when updating a person
                delete profile.tempUser['activatedDate']

                API.cui.updatePerson({personId: userId, data:profile.tempUser})
                .always(() => {
                    if (section) profile[section].submitting = false
                    $scope.$digest()
                })
                .done(() => {
                    angular.copy(profile.tempUser, profile.user)
                    LocaleService.setLocaleByDisplayName(appConfig.languages[profile.user.language])
                    if (toggleOff) toggleOff()
                })
                .fail((err) => {
                    console.error('Failed to update user profile:', err)
                    if (section) profile[section].error = true
                })
            }

            profile.updatePassword = function(section, toggleOff) {
                if (section) {
                    profile[section] = { submitting: true }
                }

                API.cui.updatePersonPassword({ 
                    personId: userId, 
                    data: UserProfile.buildPersonPasswordAccount(profile.user, profile.userPasswordAccount, profile.organization) 
                })
                .always(() => {
                    if (section) {
                        profile[section].submitting = false
                    }
                })
                .done(() => {
                    if (toggleOff) {
                        toggleOff()
                    }
                    profile.passwordUpdateSuccess = true
                    $timeout(() => {
                        profile.passwordUpdateSuccess = false
                    }, 5000)
                    profile.resetPasswordFields()
                    $scope.$digest()
                })
                .fail((err) => {
                    console.error('Error updating password', err)
                    if (section) {
                        profile[section].error = true
                    }
                    $scope.$digest()
                })
            }

            profile.saveChallengeQuestions = (section, toggleOff) => {
                if (section) profile[section] = { submitting: true }
                profile.userSecurityQuestions = angular.copy(profile.tempUserSecurityQuestions)

                API.cui.updateSecurityQuestionAccount({
                    personId: userId,
                    data: {
                        version: '1',
                        id: userId,
                        questions: profile.userSecurityQuestions.questions
                    }
                })
                .always(() => {
                    if (section) profile[section].submitting = false
                })
                .done(() => {
                    if (toggleOff) toggleOff()
                    profile.challengeQuestionsTexts = UserProfile.selectTextsForQuestions(profile)
                    $scope.$digest()
                })
                .fail(err => {
                    console.error('Error updating security questions', err)
                    if (section) profile[section].error = true
                    $scope.$digest()
                })
            }

            profile.updatePersonMFAConfig = (section, toggleOff) => {
                if (section) {
                    profile[section] = { submitting: true }
                    //console.log("In updatePersonMFAConfig" + JSON.stringify(profile))
                    console.log("In updatePersonMFAConfig 2" + profile.mfa.confg);

                        API.cui.getPersonAttributes({personId: userId})
                        .then(function(res){
                            UserProfile.userAttributesTemplate=angular.copy(res);
                            console.log("In updatePersonMFAConfig attributes response: " + JSON.stringify(UserProfile.userAttributesTemplate))

                            UserProfile.userAttributesTemplate.attributes.forEach(function(attribute){
                            console.log("In updatePersonMFAConfig attributes" + JSON.stringify(attribute))
                            if (attribute.value!="null") {
                                switch(attribute.name){
                                    case 'TWO_FACTOR_AUTH_TYPE':attribute.value=profile.mfa.confg;
                                    break;
                                }// end if for switch
                            }// end if for attribute.value
                            })
                            console.log("In updatePersonMFAConfig attributes response after: " + JSON.stringify(UserProfile.userAttributesTemplate))
                             API.cui.updatePersonAttributes({personId: API.getUser(), useCuid:true , data:UserProfile.userAttributesTemplate})
                            .then(function(res){
                                //angular.copy(userProfile.tempUserAttributes, userProfile.userAttributes);
                                if (section) {
                                    profile[section].submitting = false;
                                }
                                if (toggleOff) {
                                    toggleOff();
                                }
                                $scope.$digest();
                                console.log("In updatePersonMFAConfig attributes response of get attributes : " + JSON.stringify(res));
                            })
                            .fail(function(err){
                                console.log(err);
                                if (section) {
                                    profile[section].submitting = false;
                                    profile[section].error = true;
                                }
                                $scope.$digest();
                            })                

                        })//end for getPersonAttributes.
                                    
                } // end if section
            } // end for function  
            
            profile.unlinkSocialLogin = (section, name) => {
                if (section) {
                    profile[section] = { submitting: true }
                    console.log("In unlink "+name)
                    API.cui.unlinkSocialLoginAccount({
                        personId: userId,
                        configId: name
                    })
                    .always(() => {
                        if (section) {
                            profile[section].submitting = false;
                            UserProfile.initSocialLogin(userId)
                            .then(res => {
                                angular.merge(profile, res)
                                //alert(JSON.stringify(profile));
                                //console.log("----")
                                //console.log(JSON.stringify(profile))
                            })
                            .finally(() => {})                        
                        }
                    })
                    .done(() => {
//                        if (toggleOff) {
//                            toggleOff();
//                        }
                        $scope.$digest()
                    })
                    .fail(err => {
                        console.error('Error updating security questions', err)
                        if (section) {
                            profile[section].error = true;
                        }
                        $scope.$digest()
                    })
                }
            }
            
            // Link a social profile, where name is the social name, like "facebook" or "twitter"
            profile.updateSocialLogin = (section, name) => {
                if (section) {
                    profile[section] = { submitting: true }
                    console.log("In SocialLoginAccounts00")
                    var socialLoingUrl=appConfig.serviceUrl;
                    var sid=localStorage.getItem("cui.sii");
                    console.log("solutionInstanceId : "+sid)
//                    socialLoingUrl= socialLoingUrl+'/social-accounts/v1/social/authorize/facebook?solutionInstanceId='+sid+'&type=link';
                    socialLoingUrl= socialLoingUrl+'/social-accounts/v1/social/authorize/'+name+'?solutionInstanceId='+sid+'&type=link';
                    console.log(socialLoingUrl)
                    $window.location.href=socialLoingUrl;
                    //$window.location.href='https://q-joe-soln-acme.idm.qa.covapp.io/p/apiProxy/social-accounts/v1/social/authorize/facebook?solutionInstanceId=aabae226-3841-4dfe-b703-e769ce01275b&type=link'                    
                    //$window.location.href='https://q-joe-soln-dev01.idm.qa.covapp.io/p/apiProxy/social-accounts/v1/social/authorize/facebook?solutionInstanceId=b41deeb0-4888-4c97-85cf-1bf64fc5230f&type=link'
                    //$window.location.href='https://q-joe-soln-dev01.idm.qa.covapp.io/p/apiProxy/social-accounts/v1/social/authorize/facebook?solutioInstanceId=b41deeb0-4888-4c97-85cf-1bf64fc5230f';
                    //$location.path('https://q-joe-soln-dev01.idm.qa.covapp.io/p/apiProxy/social-accounts/v1/social/authorize/facebook?solutioInstanceId=b41deeb0-4888-4c97-85cf-1bf64fc5230f')
                }
            }            

//            profile.updatePersonMFAConfig = (section, toggleOff) => {
//                if (section) {
//                    profile[section] = { submitting: true }
//                    //console.log("In updatePersonMFAConfig" + JSON.stringify(profile))
//                    console.log("In updatePersonMFAConfig 2" + profile.mfa.confg);
//
//                    API.cui.getPersonAttributes({personId: userId})
//                    .then(function(res){
//                        UserProfile.userAttributesTemplate=angular.copy(res);
//                        console.log("In updatePersonMFAConfig attributes response: " + JSON.stringify(UserProfile.userAttributesTemplate))
//
//                        UserProfile.userAttributesTemplate.attributes.forEach(function(attribute){
//                        console.log("In updatePersonMFAConfig attributes" + JSON.stringify(attribute))
//                        if (attribute.value!="null") {
//                            switch(attribute.name){
//                                case 'TWO_FACTOR_AUTH_TYPE':attribute.value=profile.mfa.confg;
//                                break;
//                            }// end if for switch
//                        }// end if for attribute.value
//                        })
//                        console.log("In updatePersonMFAConfig attributes response after: " + JSON.stringify(UserProfile.userAttributesTemplate))
//                         API.cui.updatePersonAttributes({personId: API.getUser(), useCuid:true , data:UserProfile.userAttributesTemplate})
//                        .then(function(res){
//                            //angular.copy(userProfile.tempUserAttributes, userProfile.userAttributes);
//                            if (section) {
//                                profile[section].submitting = false;
//                            }
//                            if (toggleOff) {
//                                toggleOff();
//                            }
//                            $scope.$digest();
//                        })
//                        .fail(function(err){
//                            console.log(err);
//                            if (section) {
//                                profile[section].submitting = false;
//                                profile[section].error = true;
//                            }
//                            $scope.$digest();
//                        })                
//                    })//end for getPersonAttributes.
//                } // end if section
//            } // end for function     
        }
    }

    return UserProfile
})
