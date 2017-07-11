'use strict';var _slicedToArray=function(){function sliceIterator(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"])_i["return"]();}finally{if(_d)throw _e;}}return _arr;}return function(arr,i){if(Array.isArray(arr)){return arr;}else if(Symbol.iterator in Object(arr)){return sliceIterator(arr,i);}else{throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();function _toConsumableArray(arr){if(Array.isArray(arr)){for(var i=0,arr2=Array(arr.length);i<arr.length;i++){arr2[i]=arr[i];}return arr2;}else{return Array.from(arr);}}(function(angular,$){

var appConfig=void 0;
var packageJson=void 0;
var i18nPackageJson=void 0;

$.get('./appConfig.json').
then(function(configData){
appConfig=Object.assign({},appConfig,configData);
return $.get('./appConfig-env.json');
}).
then(function(envConfigData){
appConfig=Object.assign({},appConfig,envConfigData);
return $.get('./package.json');
}).
then(function(packageJsonData){
packageJson=Object.assign({},packageJson,packageJsonData);
if(appConfig.languageResources.dependencyOrigin==='cui-idm-b2x'){
return $.get('./node_modules/@covisint/cui-i18n/package.json');
}else
return undefined;
}).
then(function(i18nPackageJsonData){
if(i18nPackageJsonData!==undefined){
i18nPackageJson=Object.assign({},i18nPackageJson,i18nPackageJsonData);
}
}).
always(function(){

angular.module('user',[]).
config(['$stateProvider',function($stateProvider){

var templateBase='app/modules/user/';

var returnCtrlAs=function returnCtrlAs(name,asPrefix){
return name+'Ctrl as '+(asPrefix?asPrefix:'')+(asPrefix?name[0].toUpperCase()+name.slice(1,name.length):name);
};

var loginRequired=true;

$stateProvider.
state('user',{
url:'/user',
template:'<div ui-view></div>',
access:loginRequired}).

state('user.profile',{
url:'/profile',
templateUrl:templateBase+'profile/user-profile.html',
controller:returnCtrlAs('userProfile'),
access:loginRequired}).

state('user.history',{
url:'/history',
templateUrl:templateBase+'history/user-history.html',
controller:returnCtrlAs('userHistory'),
access:loginRequired}).

state('user.appRequestHistory',{
url:'/appRequestHistory?name&page&pageSize&sortBy&status',
templateUrl:templateBase+'appHistory/app-requestHistory.html',
controller:returnCtrlAs('appRequestHistory'),
access:loginRequired}).

state('user.appGrantHistory',{
url:'/appGrantHistory?name&page&pageSize&sortBy&status',
templateUrl:templateBase+'appHistory/app-grantHistory.html',
controller:returnCtrlAs('appGrantHistory'),
access:loginRequired}).

state('user.roles',{
url:'/roles',
templateUrl:templateBase+'roles/user-roles.html',
controller:returnCtrlAs('userRoles'),
access:loginRequired});


}]);

angular.module('user').
controller('appGrantHistoryCtrl',function(Loader,User,$scope,API,APIError,$filter,$pagination,$q,$state,$stateParams){

var appGrantHistory=this;
var scopeName='appGrantHistory.';
appGrantHistory.search=Object.assign({},$stateParams);
appGrantHistory.search.page=appGrantHistory.search.page||1;
appGrantHistory.paginationPageSize=appGrantHistory.paginationPageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
appGrantHistory.search.pageSize=appGrantHistory.paginationPageSize;
appGrantHistory.searchBy='name';
/* -------------------------------------------- HELPER FUNCTIONS START --------------------------------------------- */

appGrantHistory.pageGrantedChange=function(newpage){
appGrantHistory.updateSearch('page',newpage);
};

appGrantHistory.updateSearch=function(updateType,updateValue){
switch(updateType){
case'eventdate':
switchBetween('sortBy','+eventDate','-eventDate');
break;
case'eventType':
switchBetween('sortBy','+eventType','-eventType');
break;
case'actorId':
switchBetween('sortBy','+actorId','-actorId');
break;
case'status':
appGrantHistory.search.page=1;
appGrantHistory.search['status']=updateValue;
break;
case'search':
if(appGrantHistory.searchBy==='name')
appGrantHistory.search['name']=updateValue;else

appGrantHistory.search['eventType']=updateValue;
break;}



var queryParams=[['page',String(appGrantHistory.search.page)],['pageSize',String(appGrantHistory.search.pageSize)]];
if(appGrantHistory.search.sortBy)
queryParams.push(['sortBy',appGrantHistory.search['sortBy']]);
if(appGrantHistory.search.status)
queryParams.push(['status',appGrantHistory.search['status']]);
if(appGrantHistory.search.name)
queryParams.push(['name',appGrantHistory.search['name']]);
if(appGrantHistory.search.eventType)
queryParams.push(['eventType',appGrantHistory.search['eventType']]);
var opts={
personId:User.user.id,
qs:queryParams};


// doesn't change state, only updates the url
$state.transitionTo('user.appGrantHistory',appGrantHistory.search,{notify:false});
console.log(appGrantHistory.search);
appGrantHistory.grantedHistory=[];
API.cui.getPersonApplicationsGrantHistory(opts).
then(function(res){
appGrantHistory.grantedHistory=res;
// if(appGrantHistory.grantedHistory.length>0)
//     getPkgDetailsGrant(appGrantHistory.grantedHistory);
$scope.$digest();
}).
fail(function(err){
APIError.onFor(scopeName+'initHistory');
console.log(err);
});
//onLoadGranted(true,opts)
};

var switchBetween=function switchBetween(property,firstValue,secondValue){
// helper function to switch a property between two values or set to undefined if values not passed
if(!firstValue){
appGrantHistory.search[property]=undefined;
return;
}
appGrantHistory.search[property]=appGrantHistory.search[property]===firstValue?
secondValue:
firstValue;
};

var getCountsOfStatus=function getCountsOfStatus(qsValue){
var opts={
personId:API.getUser(),
useCuid:true

//Assign query strings if any value passed 
//otherwise it will get full count
};if(qsValue){
opts.qs=[['status',qsValue]];
}
API.cui.getPersonApplicationsGrantHistory(opts).
then(function(res){
if(!qsValue){
appGrantHistory.popupGrantedCount=res.length;
console.log(appGrantHistory.popupGrantedCount);
}else if(qsValue==="active"){
appGrantHistory.activeCount=res.length;
console.log(appGrantHistory.activeCount);
}else
{
appGrantHistory.suspendedCount=res.length;
console.log(appGrantHistory.suspendedCount);
}
$scope.$digest();
}).
fail(function(err){

});
};
/* -------------------------------------------- HELPER FUNCTIONS END ----------------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

appGrantHistory.user=User.user;

var queryParams=[['page',String(appGrantHistory.search.page)],['pageSize',String(appGrantHistory.search.pageSize)]];
if(appGrantHistory.search.sortBy)
queryParams.push(['sortBy',appGrantHistory.search['sortBy']]);
var opts={
personId:User.user.id,
qs:queryParams};


Loader.onFor(scopeName+'initHistory');
API.cui.getPersonApplicationsGrantHistory(opts).
then(function(res){
appGrantHistory.grantedHistory=res;
// if(appGrantHistory.grantedHistory.length>0)
//     getPkgDetailsGrant(appGrantHistory.grantedHistory);
// if(appGrantHistory.requestedHistory.length>0)
//     getPkgDetailsRequested(appGrantHistory.requestedHistory);
//to display in popover
getCountsOfStatus("active");
getCountsOfStatus("suspended");
//To getFull count
getCountsOfStatus(undefined);

return API.cui.getPersonApplicationsGrantHistoryCount(opts);
}).
then(function(res){
console.log(res);
appGrantHistory.count=res;
Loader.offFor(scopeName+'initHistory');
$scope.$apply();
}).
fail(function(err){
APIError.onFor(scopeName+'initHistory');
console.log(err);
}).
always(function(){
Loader.offFor(scopeName+'initHistory');
$scope.$digest();
});
/* -------------------------------------------- ON LOAD END --------------------------------------------- */

});
angular.module('user').
controller('appRequestHistoryCtrl',function(Loader,User,$scope,API,APIError,$filter,$pagination,$q,$state,$stateParams){

var appRequestHistory=this;
var scopeName='appRequestHistory.';
appRequestHistory.search=Object.assign({},$stateParams);
appRequestHistory.search.page=appRequestHistory.search.page||1;
appRequestHistory.paginationPageSize=appRequestHistory.paginationPageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
appRequestHistory.search.pageSize=appRequestHistory.paginationPageSize;
/* -------------------------------------------- HELPER FUNCTIONS START --------------------------------------------- */

appRequestHistory.pageChange=function(newpage){
appRequestHistory.updateSearch('page',newpage);
};

appRequestHistory.updateSearch=function(updateType,updateValue){
switch(updateType){
case'alphabetic':
switchBetween('sortBy','+service.name','-service.name');
break;
case'requesteddate':
switchBetween('sortBy','+requestedDate','-requestedDate');
break;
case'decisiondate':
switchBetween('sortBy','+evaluationDate','-evaluationDate');
break;
case'eventdate':
switchBetween('sortBy','+eventDate','-eventDate');
break;
case'eventType':
switchBetween('sortBy','+eventType','-eventType');
break;
case'actorId':
switchBetween('sortBy','+actorId','-actorId');
break;
case'evaluator':
switchBetween('sortBy','+evaluatorId','-evaluatorId');
break;
case'status':
appRequestHistory.search.page=1;
appRequestHistory.search['grant.status']=updateValue;
break;}


var queryParams=[['page',String(appRequestHistory.search.page)],['pageSize',String(appRequestHistory.search.pageSize)]];
if(appRequestHistory.search.sortBy)
queryParams.push(['sortBy',appRequestHistory.search['sortBy']]);
var opts={
personId:User.user.id,
qs:queryParams};


// doesn't change state, only updates the url
$state.transitionTo('user.appRequestHistory',appRequestHistory.search,{notify:false});
console.log(appRequestHistory.search);
appRequestHistory.requestedHistory=[];
API.cui.getPersonApplicationsRequestHistory(opts).
then(function(res){
appRequestHistory.requestedHistory=res;
// if(appRequestHistory.requestedHistory.length>0)
//     getPkgDetailsRequested(appRequestHistory.requestedHistory);
$scope.$digest();
}).
fail(function(err){
APIError.onFor(scopeName+'initHistory');
console.log(err);
});
//onLoad(true,opts)
};

var switchBetween=function switchBetween(property,firstValue,secondValue){
// helper function to switch a property between two values or set to undefined if values not passed
if(!firstValue){
appRequestHistory.search[property]=undefined;
return;
}
appRequestHistory.search[property]=appRequestHistory.search[property]===firstValue?
secondValue:
firstValue;
};
/*
     const onLoad = (previouslyLoaded,opts) => {
        console.log(appRequestHistory.search);
        appRequestHistory.requestedHistory = [];
         API.cui.getPersonApplicationsRequestHistory({personId:User.user.id,'qs':[['sortBy',appRequestHistory.search['sortBy']]] })
         .then(res => {
            appRequestHistory.requestedHistory=res;
            // if(appRequestHistory.requestedHistory.length>0)
            //     getPkgDetailsRequested(appRequestHistory.requestedHistory);
            $scope.$digest()
         })
         .fail(err =>{
            APIError.onFor(scopeName + 'initHistory')
            console.log(err)
         })
     }*/

/*     const onLoadGranted = (previouslyLoaded) => {
        appRequestHistory.grantedHistory = [];
         API.cui.getPersonApplicationsGrantHistory({personId:User.user.id,'qs':[['sortBy',appRequestHistory.search['sortBy']]] })
         .then(res => {
           appRequestHistory.grantedHistory=res;
            // if(appRequestHistory.grantedHistory.length>0)
            //     getPkgDetailsGrant(appRequestHistory.grantedHistory);
            $scope.$digest()
         })
         .fail(err =>{
            APIError.onFor(scopeName + 'initHistory')
            console.log(err)
         })
     }*/

var getCountsOfStatus=function getCountsOfStatus(qsValue){
var opts={
personId:API.getUser(),
useCuid:true

//Assign query strings if any value passed 
//otherwise it will get full count
};if(qsValue){
opts.qs=[['status',qsValue]];
}
API.cui.getPersonApplicationsGrantHistory(opts).
then(function(res){
if(!qsValue){
appRequestHistory.popupGrantedCount=res.length;
console.log(appRequestHistory.popupGrantedCount);
}else if(qsValue==="active"){
appRequestHistory.activeCount=res.length;
console.log(appRequestHistory.activeCount);
}else
{
appRequestHistory.suspendedCount=res.length;
console.log(appRequestHistory.suspendedCount);
}
$scope.$digest();
}).
fail(function(err){

});
};

var getCountsOfApproved=function getCountsOfApproved(qsValue){
var opts={
personId:API.getUser(),
useCuid:true

//Assign query strings if any value passed 
//otherwise it will get full count
};if(qsValue){
opts.qs=[['status',qsValue]];
}
API.cui.getPersonApplicationsRequestHistory(opts).
then(function(res){
if(!qsValue){
appRequestHistory.popuprequestedCount=res.length;
console.log(appRequestHistory.popuprequestedCount);
}else if(qsValue==="active"){
appRequestHistory.yesCount=res.length;
console.log(appRequestHistory.yesCount);
}else
{
appRequestHistory.noCount=res.length;
console.log(appRequestHistory.noCount);
}
$scope.$digest();
}).
fail(function(err){

});
};
/* -------------------------------------------- HELPER FUNCTIONS END ----------------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

appRequestHistory.user=User.user;

var queryParams=[['page',String(appRequestHistory.search.page)],['pageSize',String(appRequestHistory.search.pageSize)]];
if(appRequestHistory.search.sortBy)
queryParams.push(['sortBy',appRequestHistory.search['sortBy']]);
var opts={
personId:User.user.id,
qs:queryParams};


Loader.onFor(scopeName+'initHistory');
API.cui.getPersonApplicationsRequestHistory(opts).
then(function(res){
appRequestHistory.requestedHistory=res;
// if(appRequestHistory.requestedHistory.length>0)
//     getPkgDetailsRequested(appRequestHistory.requestedHistory);
/*        //to display in popover
        getCountsOfStatus("active")
        getCountsOfStatus("suspended")
        //To getFull count
        getCountsOfStatus(undefined)*/
/*        //to display in popover
        getCountsOfStatus("active")
        getCountsOfStatus("suspended")
        //To getFull count
        getCountsOfStatus(undefined)*/
/* Loader.offFor(scopeName + 'initHistory')
        $scope.$apply();*/
return API.cui.getPersonApplicationsRequestHistoryCount(opts);
}).
then(function(res){
appRequestHistory.count=res;
Loader.offFor(scopeName+'initHistory');
$scope.$apply();
}).
fail(function(err){
APIError.onFor(scopeName+'initHistory');
console.log(err);
}).
always(function(){
Loader.offFor(scopeName+'initHistory');
$scope.$digest();
});
/* -------------------------------------------- ON LOAD END --------------------------------------------- */

});
angular.module('user').
controller('userHistoryCtrl',function(Loader,User,UserHistory,$scope){

var userHistory=this;
var scopeName='userHistory.';
/* -------------------------------------------- HELPER FUNCTIONS START --------------------------------------------- */

/* -------------------------------------------- HELPER FUNCTIONS END ----------------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */
UserHistory.injectUI(userHistory,$scope,User.user.id);
userHistory.user=User.user;//give user info to userhistory
userHistory.lastLogin=User.user.lastLoginDate;
userHistory.userName=User.user.name;
Loader.onFor(scopeName+'initHistory');
UserHistory.initUserHistory(User.user.id).
then(function(res){
angular.merge(userHistory,res);
Loader.offFor(scopeName+'initHistory');
});

/* -------------------------------------------- ON LOAD END --------------------------------------------- */

});
angular.module('user').
controller('userProfileCtrl',function(Loader,User,UserProfile,$scope){

var userProfile=this;
var scopeName='userProfile.';
//$cuiIconProvider.iconSet('cui','node_modules/@covisint/cui-icons/dist/icons/icons-out.svg','0 0 48 48')
/* -------------------------------------------- HELPER FUNCTIONS START --------------------------------------------- */

//Error handler for email inline Edit tag
//Commenting out Inline Editing changes as they might not needed
// userProfile.email=function(value){
//     let EMAIL_REGXP=/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/i
//     if (!angular.isDefined(value)) {
//         userProfile.emailError={};
//     }else{
//         userProfile.emailError={
//             required: value==="" || !value,
//             email:!EMAIL_REGXP.test(value)
//         }
//     }
//     userProfile.noSaveEmail= value==="" || !value || !EMAIL_REGXP.test(value)
// }
/* -------------------------------------------- HELPER FUNCTIONS END --------------------------------------------- */
/* -------------------------------------------- ON LOAD START --------------------------------------------- */

userProfile.maskAnswers=true;
userProfile.inputType='password';
userProfile.updateUIMasking=function(){
if(userProfile.maskAnswers){
userProfile.inputType='password';
}else
{
userProfile.inputType='text';
}
};

UserProfile.injectUI(userProfile,$scope,User.user.id);

Loader.onFor(scopeName+'initProfile');

UserProfile.initUserProfile(User.user.id,User.user.organization.id).
then(function(res){
angular.merge(userProfile,res);
Loader.offFor(scopeName+'initProfile');
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

});

angular.module('user').
controller('userRolesCtrl',function(Loader,User,UserProfile,$scope,API,APIError,$timeout,$state){
'use strict';

var userRoles=this;
var scopeName='userRoles.';
userRoles.user=User.user;
userRoles.grantedHistoryError=false;
userRoles.getRolesDetailsError=false;
userRoles.appCheckbox={};

// HELPER FUNCTIONS START ------------------------------------------------------------------------

var handleError=function handleError(err){
userRoles.loading=false;
$scope.$digest();
console.log('Error',err);
};



var init=function init(){
userRoles.success=false;
Loader.onFor(scopeName+'initHistory');
API.cui.getPersonRolesOnly({personId:User.user.id}).
then(function(res){
userRoles.rolesDetails=res;
initiGrantable();
}).
fail(function(err){
Loader.offFor(scopeName+'initHistory');
APIError.onFor(scopeName+'initHistory');
userRoles.getRolesDetailsError=true;
initiGrantable();
});
};

var initiGrantable=function initiGrantable(){
API.cui.getPersonRolesGrantable({personId:User.user.id}).
then(function(res){
userRoles.rolesGrantable=res;
Loader.offFor(scopeName+'initHistory');
$scope.$digest();
}).
fail(function(err){
Loader.offFor(scopeName+'initHistory');
APIError.onFor(scopeName+'initHistory');
userRoles.grantedHistoryError=true;
$scope.$digest();
});
};

init();

// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------
// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------
userRoles.assignRoles=function(){
var roles=[];
angular.forEach(userRoles.appCheckbox,function(dsd,appId){
/*Object.keys(userRoles.appCheckbox).forEach(function(appId) {*/
if(dsd){
var test={
"id":appId};

roles.push(test);
}
});
var rolesSubmitData={
"userId":User.user.id,
"roles":roles};

console.log(rolesSubmitData);

Loader.onFor(scopeName+'initHistory');
API.cui.assignPersonRoles({data:rolesSubmitData}).
then(function(res){
console.log(res);
Loader.offFor(scopeName+'initHistory');
$scope.$digest();
userRoles.success=true;
$timeout(function(){
init();
},3000);

}).
fail(function(err){
Loader.offFor(scopeName+'initHistory');
APIError.onFor(scopeName+'initHistory');
userRoles.rolessubmitError=true;
$scope.$digest();
});
};
/*    userRoles.checkrequest = (roleId) =>{
        if (!userRoles.selectedCheckbox[roleId]) {
            userRoles.selectedCheckbox[roleId] = roleId
        } else {
            delete userRoles.selectedCheckbox[roleId]
        }
        if(Object.keys(userRoles.selectedCheckbox).length<0){
            
        }else{
            userRoles.appCheckboxValid=true
        }
    }*/
$scope.$watch("userRoles.appCheckbox",function(n){
var count=0;
angular.forEach(userRoles.appCheckbox,function(dsd,key){
console.log(key);
if(dsd)
count+=1;
});
if(count>0){
userRoles.appCheckboxValid=true;
}else{
userRoles.appCheckboxValid=false;
}
},true);
// ON CLICK END ----------------------------------------------------------------------------------
});


angular.module('registration',[]).
config(['$stateProvider',function($stateProvider){

var templateBase='app/modules/registration/';

var returnCtrlAs=function returnCtrlAs(name,asPrefix){
return name+'Ctrl as '+(asPrefix?asPrefix:'')+(asPrefix?name[0].toUpperCase()+name.slice(1,name.length):name);
};

$stateProvider.
state('registration',{
url:'/register',
template:'<div ui-view></div>'}).

state('registration.walkup',{
url:'/walkup',
templateUrl:templateBase+'userWalkup/userWalkup.html',
controller:returnCtrlAs('userWalkup'),
menu:{
desktop:false,
mobile:false}}).


state('registration.invitation',{
url:'/invitation?inviteId&pin',
templateUrl:templateBase+'userInvited/userInvited.html',
controller:returnCtrlAs('userInvited'),
menu:{
desktop:false,
mobile:false}});



}]);

angular.module('registration').
controller('userInvitedCtrl',function(APIError,localStorageService,Registration,$scope,$state,$q,LocaleService,$window,Base,$stateParams,$pagination,$filter){

var userInvited=this;
var encodedString=btoa($stateParams.inviteId+':'+$stateParams.pin);
userInvited.applications={};
userInvited.userLogin={};
userInvited.applications.numberOfSelected=0;
userInvited.submitError=false;
userInvited.languages=[];
userInvited.showOrgInfo=false;
userInvited.pageSize=userInvited.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
// need to initialize to avoid undefined error when preselecting apps based on invitation data
userInvited.applications.selected={};
/* -------------------------------------------- ON LOAD START --------------------------------------------- */

//for detectig browser time
var d=new Date();
var tz=d.toTimeString();

//for detectig browser language
var lang=$window.navigator.language||$window.navigator.userLanguage;

if(lang.indexOf('en-')>=0){userInvited.browserPreference='en';}else
if(lang.indexOf('zh')>=0){userInvited.browserPreference='zh';}else
if(lang.indexOf('pl')>=0){userInvited.browserPreference='pl';}else
if(lang.indexOf('pt')>=0){userInvited.browserPreference='pt';}else
if(lang.indexOf('tr')>=0){userInvited.browserPreference='tr';}else
if(lang.indexOf('fr')>=0){userInvited.browserPreference='fr';}else
if(lang.indexOf('ja')>=0){userInvited.browserPreference='ja';}else
if(lang.indexOf('es')>=0){userInvited.browserPreference='es';}else
if(lang.indexOf('de')>=0){userInvited.browserPreference='de';}else
if(lang.indexOf('ru')>=0){userInvited.browserPreference='ru';}else
if(lang.indexOf('it')>=0){userInvited.browserPreference='it';}else
{
console.log(lang+"not supported");
userInvited.browserPreference='en';
}
//LocaleService.setLocaleByDisplayName(appConfig.languages[userInvited.browserPreference])
userInvited.initializing=true;

if(!localStorageService.get('userInvited.user')){
// If registration is not saved in localstorage we need to initialize 
// these arrays so ng-model treats them as arrays rather than objects 
userInvited.user={addresses:[]};
userInvited.user.addresses[0]={streets:[]};
userInvited.user.phones=[];
}else
{
userInvited.user=localStorageService.get('userInvited.user');

}

Object.keys(Base.languages).forEach(function(id,index){
userInvited.languages[index]={
id:id};

});
Object.values(Base.languages).forEach(function(language,index){
userInvited.languages[index].name=language;
});
userInvited.user.language=_.find(userInvited.languages,{id:userInvited.browserPreference});
Registration.initInvitedRegistration(encodedString).
then(function(res){
var questions=res.securityQuestions;

// Split questions to use between 2 dropdowns
questions.splice(0,1);
var numberOfQuestionsFloor=Math.floor(questions.length/2);

userInvited.userLogin.challengeQuestions1=questions.slice(0,numberOfQuestionsFloor);
userInvited.userLogin.challengeQuestions2=questions.slice(numberOfQuestionsFloor);

// Preload questions into input
userInvited.userLogin.question1=userInvited.userLogin.challengeQuestions1[0];
userInvited.userLogin.question2=userInvited.userLogin.challengeQuestions2[0];

// Populate organization Data
userInvited.organization=res.organization;
userInvited.invitationData=res.invitationData;

//Check restrict Email flag
userInvited.user.email="";
if(userInvited.invitationData.restrictEmail){
userInvited.user.email=userInvited.invitationData.email;
userInvited.emailRe=userInvited.user.email;
}
userInvited.initializing=false;
}).
catch(function(error){
console.error(error);
if(error.responseJSON&&error.responseJSON.apiMessage.indexOf(encodedString)>0){
userInvited.initializing=false;
APIError.onFor('RegistrationFactory.inValidInvite');
}else{
$state.go('misc.loadError');
}
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */

userInvited.applications.updateNumberOfSelected=function(checkboxValue){
// Update the number of selected apps everytime on of the boxes is checked/unchecked
if(checkboxValue!==null){
userInvited.applications.numberOfSelected+=1;
}else{
userInvited.applications.numberOfSelected-=1;
}
userInvited.applications.process();
};

userInvited.applications.updateSelected=function(application,checkboxValue,index){
if(checkboxValue===true){
userInvited.applications.selected[index]=application.id+','+application.packageId+','+application.name+','+application.showTac;
userInvited.applications.numberOfSelected+=1;
}else{
delete userInvited.applications.selected[index];
userInvited.applications.numberOfSelected-=1;
}
};

userInvited.getAppicationTaC=function(){
angular.forEach(userInvited.applications.processedSelected,function(app){
//need to change later to ===
if(app.showTac=='true'&&app.tac===undefined){
Registration.getTac(app.packageId).
then(function(res){
app.tac=res;
}).
catch(function(err){
console.log(err);
});
};
});
};

//Check TAC flag for selected applications
userInvited.checkTacFlag=function(selectedApplications){
var TacCount=0;
angular.forEach(selectedApplications,function(app){
//need to change later to ===
if(app.showTac=='true'){
TacCount++;
};
});
return TacCount;
};

userInvited.showTac=function(index){
if(userInvited.applications.processedSelected[index].tac){
userInvited.tacContent=userInvited.applications.processedSelected[index].tac.tacText;
userInvited.applications.step=3;
}
};

userInvited.applications.process=function(){
// Process the selected apps when you click next after selecting the apps you need
// returns number of apps selected
var oldSelected=void 0;
var index=0;
if(userInvited.applications.processedSelected){
oldSelected=userInvited.applications.processedSelected;
}

// Fixes issue where adding and removing selected apps would leave objects with null values
angular.forEach(userInvited.applications.selected,function(app,i){
if(app===null)delete userInvited.applications.selected[i];
});

userInvited.applications.processedSelected=[];

angular.forEach(userInvited.applications.selected,function(app,i){
if(app!==null){
userInvited.applications.processedSelected.push({
id:app.split(',')[0],
packageId:app.split(',')[1],
name:app.split(',')[2],
// this fixes an issue where removing an app from the selected list that the user 
// had accepted the terms for would carry over that acceptance to the next app on the list
acceptedTos:oldSelected&&oldSelected[index]&&oldSelected[index].id==i?oldSelected[index].acceptedTos:false,
showTac:app.split(',')[3],
tac:oldSelected&&oldSelected[index]&&oldSelected[index].id==i?oldSelected[index].tac:undefined});

}
index++;
});
return userInvited.checkTacFlag(userInvited.applications.processedSelected);

};

userInvited.submit=function(){
userInvited.submitting=true;
userInvited.submitError=false;

var registrationData={
profile:userInvited.user,
organization:userInvited.organization,
login:userInvited.userLogin,
applications:userInvited.applications,
userCountry:userInvited.userCountry,
requestReason:userInvited.reason};


Registration.invitedSubmit(registrationData,encodedString,$stateParams.inviteId).
then(function(){
userInvited.success=true;
userInvited.submitting=false;
$state.go('misc.success');
}).
catch(function(error){
userInvited.submitError=true;
userInvited.submitting=false;
if(error.responseJSON){
userInvited.errorMessage=error.responseJSON.apiMessage;
}else
{
userInvited.errorMessage='Error submitting registration request';
}
});
};

userInvited.selectOrganization=function(){
userInvited.applications.numberOfSelected=0;// Restart applications count
userInvited.applications.processedSelected=undefined;// Restart applications selected

Registration.selectOrganization(userInvited.organization,userInvited.pageSize).
then(function(res){
var grants=res.grants;
userInvited.appCount=res.appCount;
if(!grants.length)userInvited.applications.list=undefined;else
{
userInvited.applications.list=grants;
//Preselect the applications selected by admin
if(userInvited.invitationData.servicePackage){
var flagObject=userInvited.preSelectApps(userInvited.applications.list,false,false);
// Check whether we found main apps and sub apps in the current pagination
if(flagObject.appsFoundFlag&&flagObject.subappsFoundFlag){
userInvited.applications.process();
}
// application or subapplication was not retrieved in current set of pagination
// need to retrieve all apps and pre selects them
else{
userInvited.getAllOrgApps(flagObject).
then(function(){
userInvited.applications.process();
});
}
}
}
// userInvited.reRenderPaginate && userInvited.reRenderPaginate()
userInvited.passwordRules=res.passwordRules;
}).
fail(function(error){
console.error('Error getting organization information',error);
APIError.onFor('userInvited.orgInfo',error);
}).
always(function(){
$scope.$digest();
});
};

//Updates the selected apps and count and set the found flags
userInvited.selectAndUpdateFlags=function(application,flags){
userInvited.applications.selected[application.id]=application.id+','+application.servicePackage.id+','+$filter('cuiI18n')(application.name)+','+application.servicePackage.personTacEnabled;
flags[application.id]=true;
if(application.bundledApps&&Object.keys(flags).length===1){
application.bundledApps.forEach(function(app){
flags[app.id]=false;
});
}
return flags;
};

userInvited.preSelectApps=function(appList,appsFoundFlag,subappsFoundFlag){
var bundledAppFlags={};
var subappFlags={};
appList.forEach(function(application){
if(appsFoundFlag!==true&&userInvited.invitationData.servicePackage.id===application.servicePackage.id){
bundledAppFlags=userInvited.selectAndUpdateFlags(application,bundledAppFlags);
}
if(subappsFoundFlag!==true&&userInvited.invitationData.subPackage){
// If subpackages
if(userInvited.invitationData.subPackage.id.indexOf(',')>0){
// If multiple subpackages Then subPackage.id will be string like "id1,id2,...idn"
var subPackages=userInvited.invitationData.subPackage.id.split(',');
subPackages.forEach(function(subPackage){
subappFlags[subPackage]=subappFlags[subPackage]||{};
if(application.servicePackage.id.indexOf(subPackage)>0){
subappFlags[subPackage]=userInvited.selectAndUpdateFlags(application,subappFlags[subPackage]);
}
});
}else
{
// Single Subpackage
if(application.servicePackage.id.indexOf(userInvited.invitationData.subPackage.id)>0){
subappFlags[userInvited.invitationData.subPackage.id]={};
subappFlags[userInvited.invitationData.subPackage.id]=userInvited.selectAndUpdateFlags(application,subappFlags[userInvited.invitationData.subPackage.id]);
}
}
}
});
//Check whether we found all the main apps,
var count=0;
var iteration=0;
angular.forEach(bundledAppFlags,function(flag){
iteration++;
if(flag===false){
count++;
}
if(iteration===Object.keys(bundledAppFlags).length){
if(count===0){
appsFoundFlag=true;
}
}
});
//Check wether we found all the subapps,
count=0;
iteration=0;
var iterationOut=0;
var countOut=0;
angular.forEach(subappFlags,function(subpackage){
iterationOut++;
if(Object.keys(subpackage).length!==0){
angular.forEach(subpackage,function(flag){
iteration++;
if(flag===false){
count++;
}
if(iteration===Object.keys(subpackage).length){
if(count===0){
subappsFoundFlag=true;
}
}
});
}else
{
countOut++;
}
if(iterationOut===Object.keys(subappFlags).length){
if(countOut===0){
subappsFoundFlag=true;
}else
{
subappsFoundFlag=false;
}

}
});
userInvited.applications.numberOfSelected=Object.keys(userInvited.applications.selected).length;
return{
appsFoundFlag:appsFoundFlag,
subappsFoundFlag:subappsFoundFlag};

};

userInvited.getAllOrgApps=function(flagObject){
var deferred=$q.defer();
var tempAllApps=[];
var tempAppsCount=userInvited.appCount;
var page=0;
var apiPromises=[];
do{
page++;
apiPromises.push(Registration.getOrgAppsByPage(page,200,userInvited.organization.id));
tempAppsCount=tempAppsCount-200;
}while(tempAppsCount>200);
$q.all(apiPromises).
then(function(res){
res.forEach(function(appList){
userInvited.preSelectApps(appList,flagObject.appsFoundFlag,flagObject.subappsFoundFlag);
});
deferred.resolve();
});
return deferred.promise;
};

userInvited.pageChange=function(newpage){
userInvited.updatingApps=true;
Registration.getOrgAppsByPage(newpage,userInvited.pageSize,userInvited.organization.id).
then(function(res){
userInvited.page=newpage;
if(!res.length)userInvited.applications.list=undefined;else
{
userInvited.applications.list=res;
userInvited.updatingApps=false;
}
});
};
/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

/* -------------------------------------------- WATCHERS START -------------------------------------------- */

$scope.$watch('userInvited.user',function(a){
if(a&&Object.keys(a).length!==0){
localStorageService.set('userInvited.user',a);
}
},true);

userInvited.checkDuplicateEmail=function(value){
if(value&&value!==""){
$q.all([Registration.isEmailTaken(value).promise]).
then(function(res){
userInvited.isEmailTaken=res[0];
});
}else
{
userInvited.isEmailTaken=true;
}
};

userInvited.checkDuplicateEmail(userInvited.user.email);
userInvited.customErrors={
userName:{
usernameTaken:Registration.isUsernameTaken},

email:{
email:function email(){
var EMAIL_REGEXP=/^[a-z0-9!#$%&*?_.-]+@[a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+[.][a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+/i;
if(userInvited.user.email){
return EMAIL_REGEXP.test(userInvited.user.email);
}else{
return true;
}
}},

answersMatch:{
answersMatch:function answersMatch(){
if(userInvited.userLogin&&userInvited.userLogin.challengeAnswer2){
return userInvited.userLogin.challengeAnswer2!==userInvited.userLogin.challengeAnswer1;
}else{
return true;
}
}}



//Error handlers for Inline Edits in review page
};userInvited.inlineEdit={
firstName:function firstName(value){
if(!angular.isDefined(value)){
userInvited.inlineEdit.firstNameError={};
}else
{
userInvited.inlineEdit.firstNameError={
required:value===""||!value};

}
userInvited.inlineEdit.noSaveFirstName=value===""||!value;
},
lastName:function lastName(value){
if(!angular.isDefined(value)){
userInvited.inlineEdit.lastNameError={};
}else
{
userInvited.inlineEdit.lastNameError={
required:value===""||!value};

}
userInvited.inlineEdit.noSaveLastName=value===""||!value;
},
email:function email(value){
var EMAIL_REGXP=/^[a-z0-9!#$%&*?_.-]+@[a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+[.][a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+/i;
if(!angular.isDefined(value)){
userInvited.inlineEdit.emailError={};
}else
{
userInvited.inlineEdit.emailError={
required:value===""||!value,
email:!EMAIL_REGXP.test(value)

//emailTaken:
};if(!userInvited.inlineEdit.emailError.required&&!userInvited.inlineEdit.emailError.email){
userInvited.checkDuplicateEmail(value);
}

}
userInvited.inlineEdit.noSaveEmail=value===""||!value||!EMAIL_REGXP.test(value);
},
//For autocomplete need to handle differently
country:function country(value){
console.log(value);
if(!angular.isDefined(value)){
userInvited.inlineEdit.countryError={
required:true};

}else{
userInvited.inlineEdit.countryError={
required:false};

}
userInvited.inlineEdit.noSaveCountry=value===undefined;
},
address1:function address1(value){
if(!angular.isDefined(value)){
userInvited.inlineEdit.address1Error={};
}else
{
userInvited.inlineEdit.address1Error={
required:value===""||!value};

}
userInvited.inlineEdit.noSaveAddress1=value===""||!value;
},
telephone:function telephone(value){
if(!angular.isDefined(value)){
userInvited.inlineEdit.telephoneError={};
}else
{
userInvited.inlineEdit.telephoneError={
required:value===""||!value};

}
userInvited.inlineEdit.noSaveTelephone=value===""||!value;
},
userId:function userId(value){
if(!angular.isDefined(value)){
userInvited.inlineEdit.userIdError={};
}else
{
userInvited.inlineEdit.userIdError={
required:value===""||!value

//usernameTaken: 
};if(!userInvited.inlineEdit.userIdError.required){
$q.all([Registration.isUsernameTaken(value).promise]).
then(function(res){
userInvited.inlineEdit.userIdError.usernameTaken=!res[0];
userInvited.inlineEdit.noSaveUserId=value===""||!value||userInvited.inlineEdit.userIdError.usernameTaken;
});
}

}
userInvited.inlineEdit.noSaveUserId=value===""||!value;
},
challengeAnswer1:function challengeAnswer1(value){
if(!angular.isDefined(value)){
userInvited.inlineEdit.challengeAnswer1Error={};
}else
{
userInvited.inlineEdit.challengeAnswer1Error={
required:value===""||!value,
answersMatch:value===userInvited.userLogin.challengeAnswer2};

}
userInvited.inlineEdit.noSaveChallengeAnswer1=value===""||!value||value===userInvited.userLogin.challengeAnswer2;
},
challengeAnswer2:function challengeAnswer2(value){
if(!angular.isDefined(value)){
userInvited.inlineEdit.challengeAnswer2Error={};
}else
{
userInvited.inlineEdit.challengeAnswer2Error={
required:value===""||!value,
answersMatch:value===userInvited.userLogin.challengeAnswer1};

}
userInvited.inlineEdit.noSaveChallengeAnswer2=value===""||!value||value===userInvited.userLogin.challengeAnswer1;
},
//on save functions needed to show error when pressed enter
updateFirstNameError:function updateFirstNameError(){
userInvited.inlineEdit.firstName(userInvited.user.name.given);
},
updateLastNameError:function updateLastNameError(){
userInvited.inlineEdit.lastName(userInvited.user.name.surname);
},
updateEmailError:function updateEmailError(){
userInvited.emailRe=userInvited.user.email;
userInvited.inlineEdit.email(userInvited.user.email);
},
updateCountryError:function updateCountryError(){
if(userInvited.userCountry){
userInvited.inlineEdit.countryError={
required:false};

}
},
updateAddress1Error:function updateAddress1Error(){
userInvited.inlineEdit.address1(userInvited.user.addresses[0].streets[0]);
},
updateTelephoneError:function updateTelephoneError(){
userInvited.inlineEdit.telephone(userInvited.user.phones[0].number);
},
updateUserIdError:function updateUserIdError(){
userInvited.inlineEdit.userId(userInvited.userLogin.username);
},
updateChallengeAnswer1Error:function updateChallengeAnswer1Error(){
userInvited.inlineEdit.challengeAnswer1(userInvited.userLogin.challengeAnswer1);
},
updateChallengeAnswer2Error:function updateChallengeAnswer2Error(){
userInvited.inlineEdit.challengeAnswer2(userInvited.userLogin.challengeAnswer2);
}



/* --------------------------------------------- WATCHERS END --------------------------------------------- */};

});

angular.module('registration').
controller('userWalkupCtrl',function(APIError,localStorageService,Registration,$scope,$state,$q,LocaleService,$window,Base,$pagination,$filter){

var userWalkup=this;

userWalkup.applications={};
userWalkup.userLogin={};
userWalkup.applications.numberOfSelected=0;
userWalkup.submitError=false;
userWalkup.languages=[];
userWalkup.orgPaginationSize=userWalkup.orgPaginationSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
userWalkup.appPaginationSize=userWalkup.appPaginationSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
/* -------------------------------------------- ON LOAD START --------------------------------------------- */

//for detectig browser time
var d=new Date();
var tz=d.toTimeString();

//for detectig browser language
var lang=$window.navigator.language||$window.navigator.userLanguage;

if(lang.indexOf('en-')>=0){userWalkup.browserPreference='en';}else
if(lang.indexOf('zh')>=0){userWalkup.browserPreference='zh';}else
if(lang.indexOf('pl')>=0){userWalkup.browserPreference='pl';}else
if(lang.indexOf('pt')>=0){userWalkup.browserPreference='pt';}else
if(lang.indexOf('tr')>=0){userWalkup.browserPreference='tr';}else
if(lang.indexOf('fr')>=0){userWalkup.browserPreference='fr';}else
if(lang.indexOf('ja')>=0){userWalkup.browserPreference='ja';}else
if(lang.indexOf('es')>=0){userWalkup.browserPreference='es';}else
if(lang.indexOf('de')>=0){userWalkup.browserPreference='de';}else
if(lang.indexOf('ru')>=0){userWalkup.browserPreference='ru';}else
if(lang.indexOf('it')>=0){userWalkup.browserPreference='it';}else
{
console.log(lang+"not supported");
userWalkup.browserPreference='en';
}
//LocaleService.setLocaleByDisplayName(appConfig.languages[userWalkup.browserPreference])
userWalkup.initializing=true;

if(!localStorageService.get('userWalkup.user')){
// If registration is not saved in localstorage we need to initialize 
// these arrays so ng-model treats them as arrays rather than objects 
userWalkup.user={addresses:[]};
userWalkup.user.addresses[0]={streets:[]};
userWalkup.user.phones=[];
}else
{
userWalkup.user=localStorageService.get('userWalkup.user');

}

Object.keys(Base.languages).forEach(function(id,index){
userWalkup.languages[index]={
id:id};

});
Object.values(Base.languages).forEach(function(language,index){
userWalkup.languages[index].name=language;
});
userWalkup.user.language=_.find(userWalkup.languages,{id:userWalkup.browserPreference});
Registration.initWalkupRegistration(userWalkup.orgPaginationSize).
then(function(res){
var questions=res.securityQuestions;

// Split questions to use between 2 dropdowns
questions.splice(0,1);
var numberOfQuestionsFloor=Math.floor(questions.length/2);

userWalkup.userLogin.challengeQuestions1=questions.slice(0,numberOfQuestionsFloor);
userWalkup.userLogin.challengeQuestions2=questions.slice(numberOfQuestionsFloor);

// Preload questions into input
userWalkup.userLogin.question1=userWalkup.userLogin.challengeQuestions1[0];
userWalkup.userLogin.question2=userWalkup.userLogin.challengeQuestions2[0];

// Populate organization list
userWalkup.organizationList=res.organizations;
userWalkup.organizationCount=res.organizationCount;
userWalkup.orgReRenderPaginate&&userWalkup.orgReRenderPaginate();

userWalkup.initializing=false;
}).
catch(function(error){
$state.go('misc.loadError');
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */
userWalkup.applications.checkOrUncheckBundledApps=function(checkboxValue,application){
if(application.bundledApps){
application.bundledApps.forEach(function(bundledApp){
if(checkboxValue!==null){
bundledApp=_.find(userWalkup.applications.list,{id:bundledApp.id});
userWalkup.applications.selected[bundledApp.id]=bundledApp.id+','+bundledApp.servicePackage.id+','+$filter('cuiI18n')(bundledApp.name)+','+application.servicePackage.personTacEnabled;
userWalkup.applications.numberOfSelected+=1;

}else{
userWalkup.applications.selected[bundledApp.id]=null;
userWalkup.applications.numberOfSelected-=1;
}
});
}

};

userWalkup.applications.updateNumberOfSelected=function(checkboxValue,application){
// Update the number of selected apps everytime on of the boxes is checked/unchecked
if(checkboxValue!==null){
userWalkup.applications.numberOfSelected+=1;
}else{
userWalkup.applications.numberOfSelected-=1;
}
userWalkup.applications.checkOrUncheckBundledApps(checkboxValue,application);
userWalkup.applications.process();
};

userWalkup.applications.updateSelected=function(application,checkboxValue,index){
var bundledApps=_.filter(userWalkup.applications.processedSelected,{packageId:application.packageId});
bundledApps.forEach(function(bundledApp){
if(checkboxValue!==null){
userWalkup.applications.selected[bundledApp.id]=bundledApp.id+','+bundledApp.packageId+','+bundledApp.name+','+bundledApp.showTac;
userWalkup.applications.numberOfSelected+=1;
}else{
delete userWalkup.applications.selected[bundledApp.id];
userWalkup.applications.numberOfSelected-=1;
}
});
};

userWalkup.getAppicationTaC=function(){
angular.forEach(userWalkup.applications.processedSelected,function(app){
//need to change later to ===
if(app.showTac=='true'){
Registration.getTac(app.packageId).
then(function(res){
app.tac=res;
}).
catch(function(err){
console.log(err);
});
};
});
};

//Check TAC flag for selected applications
userWalkup.checkTacFlag=function(selectedApplications){
var TacCount=0;
angular.forEach(selectedApplications,function(app){
//need to change later to ===
if(app.showTac=='true'){
TacCount++;
};
});
return TacCount;
};

userWalkup.showTac=function(index){
if(userWalkup.applications.processedSelected[index].tac){
userWalkup.tacContent=userWalkup.applications.processedSelected[index].tac.tacText;
userWalkup.applications.step=3;
}
};

userWalkup.applications.process=function(){
// Process the selected apps when you click next after selecting the apps you need
// returns number of apps selected
var oldSelected=void 0;
var index=0;
if(userWalkup.applications.processedSelected){
oldSelected=userWalkup.applications.processedSelected;
}

// Fixes issue where adding and removing selected apps would leave objects with null values
angular.forEach(userWalkup.applications.selected,function(app,i){
if(app===null)delete userWalkup.applications.selected[i];
});

userWalkup.applications.processedSelected=[];

angular.forEach(userWalkup.applications.selected,function(app,i){
if(app!==null){
userWalkup.applications.processedSelected.push({
id:app.split(',')[0],
packageId:app.split(',')[1],
name:app.split(',')[2],
// this fixes an issue where removing an app from the selected list that the user 
// had accepted the terms for would carry over that acceptance to the next app on the list
acceptedTos:oldSelected&&oldSelected[index]&&oldSelected[index].id==i?oldSelected[index].acceptedTos:false,
showTac:app.split(',')[3]});

}
index++;
});
return userWalkup.checkTacFlag(userWalkup.applications.processedSelected);

};

userWalkup.submit=function(){
userWalkup.submitting=true;
userWalkup.submitError=false;

var registrationData={
profile:userWalkup.user,
organization:userWalkup.organization,
login:userWalkup.userLogin,
applications:userWalkup.applications,
userCountry:userWalkup.userCountry,
requestReason:userWalkup.reason};


Registration.walkupSubmit(registrationData).
then(function(){
userWalkup.success=true;
userWalkup.submitting=false;
$state.go('misc.success');
}).
catch(function(error){
userWalkup.submitError=true;
userWalkup.submitting=false;
if(error.responseJSON){
userWalkup.errorMessage=error.responseJSON.apiMessage;
}else
{
userWalkup.errorMessage='Error submitting registration request';
}
});
};

userWalkup.selectOrganization=function(organization){
userWalkup.organization=organization;
userWalkup.applications.numberOfSelected=0;// Restart applications count
userWalkup.applications.processedSelected=undefined;// Restart applications selected

Registration.selectOrganization(organization,userWalkup.appPaginationSize).
then(function(res){
var grants=res.grants;
userWalkup.appCount=res.appCount;
userWalkup.appReRenderPaginate&&userWalkup.appReRenderPaginate();
if(!grants.length)userWalkup.applications.list=undefined;else
{
userWalkup.applications.list=grants;
}

userWalkup.passwordRules=res.passwordRules;
}).
fail(function(error){
console.error('Error getting organization information',error);
APIError.onFor('userWalkup.orgInfo',error);
}).
always(function(){
$scope.$digest();
});
};

userWalkup.orgPaginationPageHandler=function(newPage){
userWalkup.updatingOrgs=true;
Registration.getOrgsByPageAndName(newPage,userWalkup.orgPaginationSize).
then(function(res){
userWalkup.orgPaginationCurrentPage=newPage;
userWalkup.organizationList=res;
userWalkup.updatingOrgs=false;
$scope.$digest();
}).
fail(function(err){
console.error("There was an error in fetching organization list for page "+newPage+err);
userWalkup.updatingOrgs=false;
$scope.$digest();
});
};

userWalkup.appPaginationPageHandler=function(newPage){
userWalkup.updatingApps=true;
Registration.getOrgAppsByPage(newPage,userWalkup.appPaginationSize,userWalkup.organization.id).
then(function(res){
userWalkup.appPaginationCurrentPage=newPage;
if(!res.length){
userWalkup.updatingApps=false;
userWalkup.applications.list=undefined;
}else
{
userWalkup.applications.list=res;
userWalkup.updatingApps=false;
}
$scope.$digest();
}).
fail(function(err){
userWalkup.updatingApps=false;
$scope.$digest();
console.error("There was an error in fetching app list for page "+newPage+err);
});
};
/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

/* -------------------------------------------- WATCHERS START -------------------------------------------- */

$scope.$watch('userWalkup.user',function(a){
if(a&&Object.keys(a).length!==0){
localStorageService.set('userWalkup.user',a);
}
},true);

$scope.$watch('userWalkup.orgFilterByname',function(a){
if(a!==undefined){
userWalkup.updatingOrgs=true;
Registration.getOrgsByPageAndName(1,userWalkup.orgPaginationSize,a).
then(function(res){
userWalkup.organizationList=res;
userWalkup.updatingOrgs=false;
$scope.$digest();
}).
fail(function(err){
userWalkup.updatingOrgs=false;
$scope.$digest();
console.error("There was an error in filtering orgs by name "+err);
});
}

});

userWalkup.checkDuplicateEmail=function(value){
if(value&&value!==""){
$q.all([Registration.isEmailTaken(value).promise]).
then(function(res){
userWalkup.isEmailTaken=res[0];
});
}else
{
userWalkup.isEmailTaken=true;
}
};

userWalkup.checkDuplicateEmail(userWalkup.user.email);
userWalkup.customErrors={
userName:{
usernameTaken:Registration.isUsernameTaken},

email:{
email:function email(){
var EMAIL_REGEXP=/^[a-z0-9!#$%&*?_.-]+@[a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+[.][a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+/i;
if(userWalkup.user.email){
return EMAIL_REGEXP.test(userWalkup.user.email);
}else{
return true;
}
}},

answersMatch:{
answersMatch:function answersMatch(){
if(userWalkup.userLogin&&userWalkup.userLogin.challengeAnswer2){
return userWalkup.userLogin.challengeAnswer2!==userWalkup.userLogin.challengeAnswer1;
}else{
return true;
}
}}



//Error handlers for Inline Edits in review page
};userWalkup.inlineEdit={
firstName:function firstName(value){
if(!angular.isDefined(value)){
userWalkup.inlineEdit.firstNameError={};
}else
{
userWalkup.inlineEdit.firstNameError={
required:value===""||!value};

}
userWalkup.inlineEdit.noSaveFirstName=value===""||!value;
},
lastName:function lastName(value){
if(!angular.isDefined(value)){
userWalkup.inlineEdit.lastNameError={};
}else
{
userWalkup.inlineEdit.lastNameError={
required:value===""||!value};

}
userWalkup.inlineEdit.noSaveLastName=value===""||!value;
},
email:function email(value){
var EMAIL_REGXP=/^[a-z0-9!#$%&*?_.-]+@[a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+[.][a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+/i;
if(!angular.isDefined(value)){
userWalkup.inlineEdit.emailError={};
}else
{
userWalkup.inlineEdit.emailError={
required:value===""||!value,
email:!EMAIL_REGXP.test(value)

//emailTaken:
};if(!userWalkup.inlineEdit.emailError.required&&!userWalkup.inlineEdit.emailError.email){
userWalkup.checkDuplicateEmail(value);
}

}
userWalkup.inlineEdit.noSaveEmail=value===""||!value||!EMAIL_REGXP.test(value);
},
//For autocomplete need to handle differently
country:function country(value){
console.log(value);
if(!angular.isDefined(value)){
userWalkup.inlineEdit.countryError={
required:true};

}else{
userWalkup.inlineEdit.countryError={
required:false};

}
userWalkup.inlineEdit.noSaveCountry=value===undefined;
},
address1:function address1(value){
if(!angular.isDefined(value)){
userWalkup.inlineEdit.address1Error={};
}else
{
userWalkup.inlineEdit.address1Error={
required:value===""||!value};

}
userWalkup.inlineEdit.noSaveAddress1=value===""||!value;
},
telephone:function telephone(value){
if(!angular.isDefined(value)){
userWalkup.inlineEdit.telephoneError={};
}else
{
userWalkup.inlineEdit.telephoneError={
required:value===""||!value};

}
userWalkup.inlineEdit.noSaveTelephone=value===""||!value;
},
userId:function userId(value){
if(!angular.isDefined(value)){
userWalkup.inlineEdit.userIdError={};
}else
{
userWalkup.inlineEdit.userIdError={
required:value===""||!value

//usernameTaken: 
};if(!userWalkup.inlineEdit.userIdError.required){
$q.all([Registration.isUsernameTaken(value).promise]).
then(function(res){
userWalkup.inlineEdit.userIdError.usernameTaken=!res[0];
userWalkup.inlineEdit.noSaveUserId=value===""||!value||userWalkup.inlineEdit.userIdError.usernameTaken;
});
}

}
userWalkup.inlineEdit.noSaveUserId=value===""||!value;
},
challengeAnswer1:function challengeAnswer1(value){
if(!angular.isDefined(value)){
userWalkup.inlineEdit.challengeAnswer1Error={};
}else
{
userWalkup.inlineEdit.challengeAnswer1Error={
required:value===""||!value,
answersMatch:value===userWalkup.userLogin.challengeAnswer2};

}
userWalkup.inlineEdit.noSaveChallengeAnswer1=value===""||!value||value===userWalkup.userLogin.challengeAnswer2;
},
challengeAnswer2:function challengeAnswer2(value){
if(!angular.isDefined(value)){
userWalkup.inlineEdit.challengeAnswer2Error={};
}else
{
userWalkup.inlineEdit.challengeAnswer2Error={
required:value===""||!value,
answersMatch:value===userWalkup.userLogin.challengeAnswer1};

}
userWalkup.inlineEdit.noSaveChallengeAnswer2=value===""||!value||value===userWalkup.userLogin.challengeAnswer1;
},
//on save functions needed to show error when pressed enter
updateFirstNameError:function updateFirstNameError(){
userWalkup.inlineEdit.firstName(userWalkup.user.name.given);
},
updateLastNameError:function updateLastNameError(){
userWalkup.inlineEdit.lastName(userWalkup.user.name.surname);
},
updateEmailError:function updateEmailError(){
userWalkup.emailRe=userWalkup.user.email;
userWalkup.inlineEdit.email(userWalkup.user.email);
},
updateCountryError:function updateCountryError(){
if(userWalkup.userCountry){
userWalkup.inlineEdit.countryError={
required:false};

}
},
updateAddress1Error:function updateAddress1Error(){
userWalkup.inlineEdit.address1(userWalkup.user.addresses[0].streets[0]);
},
updateTelephoneError:function updateTelephoneError(){
userWalkup.inlineEdit.telephone(userWalkup.user.phones[0].number);
},
updateUserIdError:function updateUserIdError(){
userWalkup.inlineEdit.userId(userWalkup.userLogin.username);
},
updateChallengeAnswer1Error:function updateChallengeAnswer1Error(){
userWalkup.inlineEdit.challengeAnswer1(userWalkup.userLogin.challengeAnswer1);
},
updateChallengeAnswer2Error:function updateChallengeAnswer2Error(){
userWalkup.inlineEdit.challengeAnswer2(userWalkup.userLogin.challengeAnswer2);
}



/* --------------------------------------------- WATCHERS END --------------------------------------------- */};

});

angular.module('organization',[]).
config(['$stateProvider',function($stateProvider){

var templateBase='app/modules/organization/';

var returnCtrlAs=function returnCtrlAs(name,asPrefix){return name+'Ctrl as '+(asPrefix||'')+(asPrefix?name[0].toUpperCase()+name.slice(1,name.length):name);};

var loginRequired=true;

$stateProvider.
state('organization',{
url:'/organization',
template:'<div ui-view></div>',
access:loginRequired})

// Profile --------------------------------------------------
.state('organization.profile',{
url:'/profile/:orgId?userId',
templateUrl:templateBase+'profile/organization-profile.html',
controller:returnCtrlAs('orgProfile'),
access:loginRequired})

// Directory ------------------------------------------------
.state('organization.directory',{
abstract:true,
template:'<div ui-view></div>'}).

state('organization.directory.userList',{
url:'/directory/:orgId?page&pageSize&sortBy&status&fullName',
templateUrl:templateBase+'directory/user-list/directory-userList.html',
controller:returnCtrlAs('orgDirectory'),
access:{
permittedLogic:appConfig.accessByAnyAdmin}}).


state('organization.directory.userDetails',{
url:'/user-details?userId&orgId',
views:{
'':{
templateUrl:templateBase+'directory/user-details/directory-userDetails.html',
controller:returnCtrlAs('userDetails')},

'profile@organization.directory.userDetails':{
templateUrl:templateBase+'directory/user-details/sections/profile/userDetails-profile.html',
controller:returnCtrlAs('userDetailsProfile')},

'applications@organization.directory.userDetails':{
templateUrl:templateBase+'directory/user-details/sections/applications/userDetails-applications.html',
controller:returnCtrlAs('userDetailsApps')},

'roles@organization.directory.userDetails':{
templateUrl:templateBase+'directory/user-details/sections/roles/userDetails-roles.html',
controller:returnCtrlAs('userDetailsRoles')},

'history@organization.directory.userDetails':{
templateUrl:templateBase+'directory/user-details/sections/history/userDetails-history.html',
controller:returnCtrlAs('userDetailsHistory')}},


access:{
permittedLogic:appConfig.accessByAnyAdmin}}).


state('organization.directory.userAppDetails',{
url:'/user-app-details/:appId?userId&orgId',
templateUrl:templateBase+'directory/user-app-details/directory-userAppDetails.html',
controller:returnCtrlAs('userAppDetails'),
access:{
permittedLogic:appConfig.accessByAnyAdmin}}).


state('organization.directory.orgDetails',{
url:'/org-details?orgId&page&pageSize',
views:{
'':{
templateUrl:templateBase+'directory/org-details/directory-orgDetails.html',
controller:returnCtrlAs('orgDetails')},

'profile@organization.directory.orgDetails':{
templateUrl:templateBase+'directory/org-details/sections/profile/orgDetails-profile.html',
controller:returnCtrlAs('orgDetailsProfile')},

'applications@organization.directory.orgDetails':{
templateUrl:templateBase+'directory/org-details/sections/applications/orgDetails-applications.html',
controller:returnCtrlAs('orgDetailsApps')},

'users@organization.directory.orgDetails':{
templateUrl:templateBase+'directory/org-details/sections/users/orgDetails-users.html',
controller:returnCtrlAs('orgDetailsUsers')},

'hierarchy@organization.directory.orgDetails':{
templateUrl:templateBase+'directory/org-details/sections/hierarchy/orgDetails-hierarchy.html',
controller:returnCtrlAs('orgDetailsHierarchy')}},


access:{
permittedLogic:appConfig.accessByAnyAdmin}})


// Hierarchy ------------------------------------------------
.state('organization.hierarchy',{
url:'/hierarchy/:orgId',
templateUrl:templateBase+'hierarchy/organization-hierarchy.html',
controller:returnCtrlAs('orgHierarchy'),
access:{
permittedLogic:appConfig.accessByAnyAdmin}})


// applications----------------------------------------------
.state('organization.applications',{
url:'/applications/:orgId?name&page&pageSize&service.category&sortBy&refine',
templateUrl:templateBase+'applications/organization-applications.html',
controller:returnCtrlAs('organizationApplications'),
access:{
permittedLogic:appConfig.accessByAnyAdmin}}).


state('organization.applicationDetails',{
url:'/applications/:appId/details/:orgId',
templateUrl:templateBase+'applications/applicationDetails/organization-applicationDetails.html',
controller:returnCtrlAs('orgApplicationDetails'),
access:{
permittedLogic:appConfig.accessByAnyAdmin}}).


state('organization.newRequest',{
url:'/request',
templateUrl:templateBase+'applications/appRequest/newRequest/appRequest-newRequest.html',
controller:returnCtrlAs('orgAppRequest'),
access:loginRequired}).

state('organization.newRequestReview',{
url:'/request/review',
templateUrl:templateBase+'applications/appRequest/newRequestReview/appRequest-newRequestReview.html',
controller:returnCtrlAs('orgAppRequestReview'),
access:loginRequired}).

state('organization.search',{
url:'/search?name&category&page&pageSize',
templateUrl:templateBase+'applications/search/orgApplications-search.html',
controller:returnCtrlAs('orgAppSearch'),
access:loginRequired})

// Roles ----------------------------------------------------
.state('organization.roles',{
url:'/roles?orgID',
templateUrl:templateBase+'roles/organization-roles.html',
controller:returnCtrlAs('orgRoles'),
access:loginRequired})

// Requests -------------------------------------------------
.state('organization.requests',{
url:'/requests',
template:'<div ui-view></div>',
access:loginRequired}).

state('organization.requests.newGrant',{
url:'/new-grant?orgId&userId',
templateUrl:templateBase+'requests/newGrant/requests-newGrant.html',
controller:returnCtrlAs('newGrant'),
access:{
permittedLogic:appConfig.grantAppToUserLogic}}).


state('organization.requests.newGrantSearch',{
url:'/search?type&category&name&orgId&userId&page&pageSize&sortBy',
templateUrl:templateBase+'requests/newGrant/search/search.html',
controller:returnCtrlAs('newGrantSearch'),
access:{
permittedLogic:appConfig.grantAppToUserLogic}}).


state('organization.requests.newGrantClaims',{
url:'/claims?orgId&userId',
templateUrl:templateBase+'requests/newGrant/claims/claims.html',
controller:returnCtrlAs('newGrantClaims'),
access:{
permittedLogic:appConfig.grantAppToUserLogic}})


// Org Grant
.state('organization.requests.newOrgGrant',{
url:'/new-org-grant?orgId',
templateUrl:templateBase+'requests/newOrgGrant/requests-newGrant.html',
controller:returnCtrlAs('newOrgGrant'),
access:{
permittedLogic:appConfig.grantAppToOrgLogic}}).


state('organization.requests.newOrgGrantSearch',{
url:'/search-org?type&category&name&orgId&page&pageSize&sortBy',
templateUrl:templateBase+'requests/newOrgGrant/search/search.html',
controller:returnCtrlAs('newOrgGrantSearch'),
access:{
permittedLogic:appConfig.grantAppToOrgLogic}}).


state('organization.requests.newOrgGrantClaims',{
url:'/claims-org?orgId',
templateUrl:templateBase+'requests/newOrgGrant/claims/claims.html',
controller:returnCtrlAs('newOrgGrantClaims'),
access:{
permittedLogic:appConfig.grantAppToOrgLogic}}).


state('organization.requests.pendingRequests',{
url:'/pending-requests?userId&orgId',
templateUrl:templateBase+'requests/pendingRequestsReview/requests-pendingRequests.html',
controller:returnCtrlAs('pendingRequests'),
access:loginRequired}).

state('organization.requests.pendingRequestsReview',{
url:'/pending-requests/review?userId&orgId',
templateUrl:templateBase+'requests/pendingRequestsReview/requests-pendingRequestsReview.html',
controller:returnCtrlAs('pendingRequestsReview'),
access:loginRequired})

// Approval of Org requests
.state('organization.requests.organizationRequest',{
url:'/organization-request?orgId&userId',
templateUrl:templateBase+'requests/organizationRequest/requests-organization.html',
controller:returnCtrlAs('organizationRequest'),
access:{
permittedLogic:appConfig.orgAdminLogic}}).


state('organization.requests.organizationRequestReview',{
url:'/organization-request-review?orgId',
templateUrl:templateBase+'requests/organizationRequest/requests-organizationReview.html',
controller:returnCtrlAs('organizationRequestReview'),
access:{
permittedLogic:appConfig.orgAdminLogic}}).


state('organization.requests.organizationAppRequest',{
url:'/organization-app-request?orgId&userId',
templateUrl:templateBase+'requests/organizationAppRequests/requests-organization.html',
controller:returnCtrlAs('organizationAppRequest'),
access:{
permittedLogic:appConfig.orgAdminLogic}}).


state('organization.requests.organizationAppRequestReview',{
url:'/organization-app-request-review?orgId',
templateUrl:templateBase+'requests/organizationAppRequests/requests-organizationReview.html',
controller:returnCtrlAs('organizationAppRequestReview'),
access:{
permittedLogic:appConfig.orgAdminLogic}}).


state('organization.requests.personRequest',{
url:'/person-request?userId&orgId',
templateUrl:templateBase+'requests/personRequest/requests-person.html',
controller:returnCtrlAs('personRequest'),
access:loginRequired}).

state('organization.requests.personRequestReview',{
url:'/person-request-review?userId&orgId',
templateUrl:templateBase+'requests/personRequest/requests-personReview.html',
controller:returnCtrlAs('personRequestReview'),
access:loginRequired})


// ADMIN...
.state('organization.requests.usersRegistrationRequests',{
url:'/userRequests',
templateUrl:templateBase+'requests/usersRequests/usersRegistrationRequests/requests-RegistrationRequests.html',
controller:returnCtrlAs('usersRegistrationRequests'),
access:appConfig.orgAdminLogic}).

state('organization.requests.usersAppRequests',{
url:'/applicationRequests',
templateUrl:templateBase+'requests/usersRequests/usersAppRequests/requests-AppRequests.html',
controller:returnCtrlAs('usersAppRequests'),
access:appConfig.orgAdminLogic}).

state('invitation',{
url:'/invitation',
template:'<div ui-view></div>',
access:{
permittedLogic:appConfig.accessByAnyAdmin}}).


state('invitation.inviteSelect',{
url:'/select',
templateUrl:templateBase+'invitation/invitation.html',
access:{
permittedLogic:appConfig.accessByAnyAdmin}}).


state('invitation.inviteUser',{
url:'/user',
templateUrl:templateBase+'invitation/user/user.html',
controller:returnCtrlAs('user'),
access:{
permittedLogic:appConfig.accessByAnyAdmin}}).


state('invitation.division',{
url:'/division',
templateUrl:templateBase+'invitation/division/division.html',
controller:returnCtrlAs('division'),
access:{
permittedLogic:appConfig.accessByAnyAdmin}}).


state('invitation.tlo',{
url:'/tlo',
templateUrl:templateBase+'invitation/tlo/tlo.html',
controller:returnCtrlAs('tlo'),
access:{
permittedLogic:appConfig.accessByAnyAdmin}})


// Org Requests/ADMIN
.state('organization.requests.orgRegistrationRequests',{
url:'/orgRequests?page&pageSize&organizationName',
templateUrl:templateBase+'requests/orgRequests/orgRegistrationRequests/requests-RegistrationRequests.html',
controller:returnCtrlAs('orgRegistrationRequests'),
access:{
permittedLogic:appConfig.orgAdminLogic}}).


state('organization.requests.orgAppRequests',{
url:'/orgApplicationRequests?pageSize&page',
templateUrl:templateBase+'requests/orgRequests/orgAppRequests/requests-AppRequests.html',
controller:returnCtrlAs('orgAppRequests'),
access:{
permittedLogic:appConfig.orgAdminLogic}});


}]);

angular.module('organization').
controller('orgAppRequestCtrl',function(API,DataStorage,Loader,User,$scope,$state,$stateParams){

var orgAppRequest=this;
var orgAppsBeingRequested=DataStorage.getType('orgAppsBeingRequested');
var loaderName='orgAppRequest.loading';
orgAppRequest.stateParamsOrgId=User.user.organization.id;

orgAppRequest.orgAppsBeingRequested=[];
orgAppRequest.numberOfOrgRequests=0;

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

Loader.onFor(loaderName);

if(orgAppsBeingRequested){
orgAppRequest.numberOfOrgRequests=Object.keys(orgAppsBeingRequested).length;
}

API.cui.getOrgAppCategories({organizationId:orgAppRequest.stateParamsOrgId}).
then(function(res){
orgAppRequest.categories=res;
Loader.offFor(loaderName);
$scope.$digest();
}).
fail(function(err){
Loader.offFor(loaderName);
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */

orgAppRequest.searchCallback=function(searchWord){
$state.go('organization.search',{name:searchWord});
};

/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('orgAppRequestReviewCtrl',function(API,APIError,BuildPackageRequests,DataStorage,Loader,User,$q,$state,$timeout,AppRequests,$stateParams){

var orgAppRequestReview=this;
var loaderName='orgAppRequestReview.';
orgAppRequestReview.stateParamsOrgId=$stateParams.orgId;

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

Loader.onFor(loaderName+'loading');
/*orgAppRequestReview.appsRequests = DataStorage.getType('orgAppsBeingRequested', User.user.id)*/
Loader.offFor(loaderName+'loading');

if(Object.keys(AppRequests.get()).length===0&&DataStorage.getType('orgAppsBeingRequested',User.user.id)){
AppRequests.set(DataStorage.getType('orgAppsBeingRequested',User.user.id));
}


var appRequests=AppRequests.get(),
appsBeingRequested=Object.keys(appRequests);

if(appsBeingRequested.length===0){
$state.go('organization.search',{orgId:orgAppRequestReview.stateParamsOrgId});
}

orgAppRequestReview.appRequests=[];

for(var i=0;i<appsBeingRequested.length;i+=2){
var applicationGroup=[];
applicationGroup.push(appRequests[appsBeingRequested[i]]);
if(appRequests[appsBeingRequested[i+1]]){
applicationGroup.push(appRequests[appsBeingRequested[i+1]]);
}
//get Terms And Conditions for requested packages
applicationGroup.forEach(function(app){
if(app.servicePackage.organizationTacEnabled){
API.cui.getOrgTacOfPackage({packageId:app.servicePackage.id}).
then(function(res){
app.tac=res;
}).
fail(function(err){
console.log("There was an error fetching Tac");
console.log(err);
});
}
});
orgAppRequestReview.appRequests.push(applicationGroup);
}

orgAppRequestReview.numberOfRequests=0;
appsBeingRequested.forEach(function(){
orgAppRequestReview.numberOfRequests+=1;
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */

orgAppRequestReview.removeApplicationRequest=function(requestId){
delete orgAppRequestReview.appRequests[requestId];

if(Object.keys(orgAppRequestReview.appRequests).length===0){
DataStorage.deleteType('orgAppsBeingRequested');
$state.go('organization.applications',{orgId:orgAppRequestReview.stateParamsOrgId});
}else
{
DataStorage.setType('orgAppsBeingRequested',orgAppRequestReview.appRequests);
}
};

orgAppRequestReview.submit=function(){
var requestArray=[];

Loader.onFor(loaderName+'attempting');

/*Object.keys(orgAppRequestReview.appRequests).forEach((request) => {
            requestArray.push(orgAppRequestReview.appRequests[request])
        })
*/
orgAppRequestReview.appRequests.forEach(function(appRequestGroup,i){
appRequestGroup.forEach(function(appRequest,x){
requestArray[i+x]=appRequest;
});

});

$q.all(BuildPackageRequests(User.user.organization.id,'organization',requestArray)).
then(function(){
Loader.offFor(loaderName+'attempting');
DataStorage.deleteType('orgAppsBeingRequested');
AppRequests.clear();// clears app requests if the request goes through
DataStorage.setType('orgAppsBeingRequested',{});
orgAppRequestReview.success=true;
$timeout(function(){
$state.go('organization.applications',{orgId:User.user.organization.id});
},3000);
}).
catch(function(error){
APIError.onFor(loaderName+'requestError');
Loader.offFor(loaderName+'attempting');
});
};

orgAppRequestReview.updateSearch=function(nameSearch){
orgAppRequestReview.search=nameSearch;
};

orgAppRequestReview.showTac=function(application){
if(application.tac){
orgAppRequestReview.tacContent=application.tac.tacText;
orgAppRequestReview.step=2;
}
};

/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('orgApplicationDetailsCtrl',function(API,APIHelpers,APIError,Loader,Sort,User,$q,$scope,$state,$stateParams){

var orgApplicationDetails=this;
var organizationId=$stateParams.orgId;
var serviceId=$stateParams.appId;
var loaderName='orgApplicationDetails.';
orgApplicationDetails.stateParamsOrgId=$stateParams.orgId;

orgApplicationDetails.sortFlag=true;

/* ---------------------------------------- HELPER FUNCTIONS START ---------------------------------------- */

var checkIfRequestable=function checkIfRequestable(organizationId,relatedAppsArray){
if(relatedAppsArray){
API.cui.getOrganizationRequestableApps({organizationId:organizationId}).
then(function(res){
relatedAppsArray.forEach(function(app){
var requestable=_.find(res,function(id){return app.id=id;});
if(requestable){
app.requestable=true;
}
});
}).
then(function(){
$scope.$digest();
});
}
};

var getGrantArrayData=function getGrantArrayData(grantArray){
var promises=[];

Loader.onFor(loaderName+'loadingPageData');

grantArray.forEach(function(grant){
promises.push(
API.cui.getPerson({personId:grant.grantee.id}).
then(function(res){
grant.person=res;
return API.cui.getOrganization({organizationId:grant.person.organization.id});
}).
then(function(res){
grant.organization=res;
return API.cui.getPersonPackageClaims({grantee:grant.person.organization.id,packageId:grant.servicePackage.id});
}).
then(function(res){
grant.claims=res.packageClaims;
}));

});

$q.all(promises).
then(function(res){
orgApplicationDetails.grantList=grantArray;
Loader.offFor(loaderName+'loadingPageData');
}).
catch(function(error){
Loader.offFor(loaderName+'loadingPageData');
APIError.onFor(loaderName+'grants: ',error);
});
};

/* ----------------------------------------- HELPER FUNCTIONS END ----------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

Loader.onFor(loaderName+'app');

API.cui.getOrganization({organizationId:organizationId}).
then(function(res){
orgApplicationDetails.organization=res;
return API.cui.getOrganizationGrantedApps({organizationId:organizationId,qs:[['service.id',serviceId]]});
}).
then(function(res){
orgApplicationDetails.application=res[0];
return API.cui.getOrganizationRequestableApps({organizationId:organizationId,qs:[['service.id',serviceId]]});
}).
then(function(res){
orgApplicationDetails.application.bundledApps=res[0].bundledApps;
orgApplicationDetails.application.relatedApps=res[0].relatedApps;
/*return API.cui.getPackageGrants    ({qs: [
    		['grantedPackageId', orgApplicationDetails.application.servicePackage.id],
    		['granteeType', 'person']
    	]});*/
Loader.offFor(loaderName+'app');
checkIfRequestable(organizationId,orgApplicationDetails.application.relatedApps);
$scope.$apply();
})
/* .then((res) => {
        Loader.offFor(loaderName + 'app');
        orgApplicationDetails.unparsedGrantList = res;
        getGrantArrayData(orgApplicationDetails.unparsedGrantList);*/
/*Loader.onFor(loaderName + 'user');*/
/*checkIfRequestable(organizationId, orgApplicationDetails.application.relatedApps);*/
/*return API.cui.getPersons({qs: [
            ['organization.id', organizationId]
        ]});*//*Loader.offFor(loaderName + 'user');*/
/* })*/
/*.then((res) => {
        orgApplicationDetails.grantList = res;
        Loader.offFor(loaderName + 'user');
        $scope.$apply();
    })*/.
fail(function(error){
APIError.onFor(loaderName+'grants: ',error);
Loader.offFor(loaderName+'user');
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */

orgApplicationDetails.sort=function(sortValue){
Sort.listSort(orgApplicationDetails.userList,sortValue,orgApplicationDetails.sortFlag);
orgApplicationDetails.sortFlag=!orgApplicationDetails.sortFlag;
};

orgApplicationDetails.parseGrantUsersByStatus=function(status){
if(status==='all'){
orgApplicationDetails.grantList=orgApplicationDetails.unparsedGrantList;
}else
{
var filteredGrantUsers=_.filter(orgApplicationDetails.unparsedGrantList,function(grant){
return grant.person.status===status;
});
orgApplicationDetails.grantList=filteredGrantUsers;
}
};

orgApplicationDetails.newGrants=function(){
$state.go('applications.orgApplications.newGrant',{appId:serviceId});
};

orgApplicationDetails.switchDivision=function(organization){
Loader.onFor(loaderName+'loadingPageData');

API.cui.getGrants({qs:[
['grantedPackageId',orgApplicationDetails.application.servicePackage.id],
['granteeType','person'],
['organization.id',organization.id]]}).

then(function(res){
orgApplicationDetails.unparsedGrantList=res;
getGrantArrayData(orgApplicationDetails.unparsedGrantList);
Loader.offFor(loaderName+'loadingPageData');
}).
fail(function(error){
APIError.onFor(loaderName+'grants: ',error);
});
};

orgApplicationDetails.requestRelatedApp=function(service){
var data={
requestor:{
id:organizationId,
type:'organization'},

'servicePackage':{
id:service.packageId}};



Loader.onFor(loaderName+'appRequest');

API.cui.postRequest({data:data}).
then(function(){
service.requestable=false;
Loader.offFor(loaderName+'appRequest');
$scope.$digest();
}).
fail(function(error){
APIError.onFor(loaderName+'appRequest');
console.log(error);
$scope.$digest();
});
};


orgApplicationDetails.mobileTabs=function(tab){

if(tab=='bundled'){
orgApplicationDetails.mobileTabs.bundled=true;
orgApplicationDetails.mobileTabs.related=false;
}else if(tab=='related'){
orgApplicationDetails.mobileTabs.bundled=false;
orgApplicationDetails.mobileTabs.related=true;
}
};

orgApplicationDetails.suspendApplication=function(organization){
Loader.onFor(loaderName+'app');

var suspendObj={
"grantee":{
"id":orgApplicationDetails.application.owningOrganization.id,
"type":"organization",
"realm":orgApplicationDetails.application.realm},

"servicePackage":{
"id":orgApplicationDetails.application.servicePackage.id,
"type":"servicepackage",
"realm":orgApplicationDetails.application.realm},

"justification":"Suspending Organization Application"};


API.cui.suspendOrgPkg({data:suspendObj}).
then(function(res){
orgApplicationDetails.success='true';
Loader.offFor(loaderName+'app');
$timeout(function(){
$state.go('applications.orgApplications.applicationList');
},3000);
}).
fail(function(error){
Loader.offFor(loaderName+'app');
orgApplicationDetails.suspendError=true;
$scope.$apply();
/*APIError.onFor(loaderName + 'grants: ', error);*/
});
};

/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */
});
angular.module('organization').
controller('organizationApplicationsCtrl',function(API,Sort,User,$filter,$pagination,$q,$scope,$state,$stateParams){

var organizationApplications=this;
organizationApplications.stateParamsOrgId=$stateParams.orgId;

organizationApplications.loading=true;
organizationApplications.search={orgId:organizationApplications.stateParamsOrgId};
organizationApplications.search.page=organizationApplications.search.page||1;
organizationApplications.paginationPageSize=organizationApplications.paginationPageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
organizationApplications.search.pageSize=organizationApplications.paginationPageSize;

// HELPER FUNCTIONS START ---------------------------------------------------------------------------------

/*const switchBetween = (property, firstValue, secondValue) => { 
        // helper function to switch a property between two values or set to undefined if values not passed;
        if(!firstValue) organizationApplications.search[property] = undefined;
        organizationApplications.search[property] === firstValue ? organizationApplications.search[property] = secondValue : organizationApplications.search[property] = firstValue;
    };*/

/*const switchBetween = (property, firstValue, secondValue) => { 
        // helper function to switch a property between two values or set to undefined if values not passed;
        if(!firstValue) {
            organizationApplications.search[property] = undefined;
            return
        }
        organizationApplications.search[property] = organizationApplications.search[property] === firstValue
            ? secondValue
            : firstValue
    }*/

var switchBetween=function switchBetween(property,firstValue,secondValue){
// helper function to switch a property between two values or set to undefined if values not passed
if(!firstValue){
organizationApplications.search[property]=undefined;
return;
}
organizationApplications.search[property]=organizationApplications.search[property]===firstValue?
secondValue:
firstValue;
};

var getPackageServices=function getPackageServices(ArrayOfPackages){
var services=[];

ArrayOfPackages.forEach(function(servicePackage){
API.cui.getPackageServices({packageId:servicePackage.servicePackage.id}).
then(function(res){
res.forEach(function(service){
services.push(service);
});
});
});

return services;
};

// HELPER FUNCTIONS END -----------------------------------------------------------------------------------

// ON LOAD START ------------------------------------------------------------------------------------------

var onLoad=function onLoad(previouslyLoaded){
if(previouslyLoaded){
organizationApplications.loading=false;
}else
{
organizationApplications.search.name=$stateParams.name;
organizationApplications.search.category=$stateParams.category;
organizationApplications.search.sortBy=$stateParams.sortBy;
organizationApplications.search.refine=$stateParams.refine;
if($stateParams.page)
organizationApplications.search.page=parseInt($stateParams.page);
if($stateParams.pageSize)
organizationApplications.search.pageSize=parseInt($stateParams.pageSize);


API.cui.getOrgAppCategories({organizationId:organizationApplications.stateParamsOrgId}).
then(function(res){
organizationApplications.categories=res;
$scope.$digest();
}).
fail(function(err){

});

}

var queryParams=[['page',String(organizationApplications.search.page)],['pageSize',String(organizationApplications.search.pageSize)]];
var promises=[];
var opts={
organizationId:organizationApplications.stateParamsOrgId,
qs:queryParams};


if(organizationApplications.search.name)queryParams.push(['service.name',organizationApplications.search.name]);
if(organizationApplications.search.category)queryParams.push(['service.category',organizationApplications.search.category]);
// sortBy: +/-service.name, +/-service.creation, +/-grant.instant
if(organizationApplications.search.sortBy)queryParams.push(['sortBy',organizationApplications.search.sortBy]);

switch(organizationApplications.search.refine){
case'active':
case'suspended':
queryParams.push(['grant.status',organizationApplications.search.refine]);
promises.push(API.cui.getOrganizationGrantedApps(opts),API.cui.getOrganizationGrantedCount(opts));
/*promises.push(API.cui.getOrganizationGrantedApps(opts));*/
break;
case'pending':
/*promises.push(
                    API.cui.getOrgPendingServicePackages({qs: [['requestor.id', organizationId], ['requestor.type', 'organization']]})
                    .then((res) => {
                        return getPackageServices(res);
                    }),
                    API.cui.getOrganizationRequestableCount({organizationId: organizationId})
                );*/
queryParams.push(['grant.status',organizationApplications.search.refine]);
/* promises.push(API.cui.getOrganizationGrantedApps(opts));*/
promises.push(API.cui.getOrganizationGrantedApps(opts),API.cui.getOrganizationGrantedCount(opts));
break;
case undefined:
/*promises.push(API.cui.getOrganizationGrantedApps(opts));*/
promises.push(API.cui.getOrganizationGrantedApps(opts),API.cui.getOrganizationGrantedCount(opts));
break;}


$q.all(promises).
then(function(res){
organizationApplications.appList=res[0];
organizationApplications.count=res[1];
/*organizationApplications.count = res[0].length;*/
organizationApplications.loading=false;
if(organizationApplications.reRenderPaginate)organizationApplications.reRenderPaginate();
}).
catch(function(err){
organizationApplications.loadingError=true;
organizationApplications.loading=false;
});
};
// get Organization to display name
API.cui.getOrganization({organizationId:organizationApplications.stateParamsOrgId}).
then(function(res){
organizationApplications.organization=res;
});
onLoad(false);

// ON LOAD END --------------------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START -------------------------------------------------------------------------------

organizationApplications.pageChange=function(newpage){
organizationApplications.updateSearch('page',newpage);
};

organizationApplications.updateSearchByName=function(){
organizationApplications.updateSearch('name',organizationApplications.search['name']);
};

organizationApplications.updateSearch=function(updateType,updateValue){
switch(updateType){
case'alphabetic':
switchBetween('sortBy','+service.name','-service.name');
break;
case'date':
switchBetween('sortBy','+grant.instant','-grant.instant');
break;
case'status':
organizationApplications.search.page=1;
organizationApplications.search.refine=updateValue;
break;
case'category':
organizationApplications.search.page=1;
organizationApplications.search.category=$filter('cuiI18n')(updateValue);
break;
case'name':
organizationApplications.search.page=1;
break;}


// Updates URL, doesn't change state
$state.transitionTo('organization.applications',organizationApplications.search,{notify:false});
onLoad(true);
};

organizationApplications.goToDetails=function(application){
var opts={
appId:application.id,
orgId:application.owningOrganization.id};

$state.go('organization.applicationDetails',opts);
};

// ON CLICK FUNCTIONS END ---------------------------------------------------------------------------------

});

angular.module('organization').
controller('orgAppSearchCtrl',function(API,DataStorage,Loader,User,$pagination,$q,$state,$stateParams){

var orgAppSearch=this;
var loaderName='orgAppSearch.loading';
orgAppSearch.stateParamsOrgId=User.user.organization.id;

orgAppSearch.packageRequests=DataStorage.getType('orgAppsBeingRequested',User.user.id)||{};
orgAppSearch.appCheckbox={};

/* ---------------------------------------- HELPER FUNCTIONS START ---------------------------------------- */

var processNumberOfRequestedApps=function processNumberOfRequestedApps(pkgRequest){
if(pkgRequest)orgAppSearch.numberOfRequests++;else
orgAppSearch.numberOfRequests--;
};

var updateViewList=function updateViewList(list){
var deferred=$q.defer();
orgAppSearch.viewList=[];
var qs=[];
var apiPromises=[];
angular.forEach(list,function(app,parentIndex){
// Child App and Parent app requested by user
if(app.servicePackage.parent&&app.relatedApps){
var flag=false;
angular.forEach(app.relatedApps,function(realtedApp,index){
if(_.find(list,{id:realtedApp.id})){
flag=true;
}else
{
qs.push(['service.id',realtedApp.id]);
}
if(index===app.relatedApps.length-1&&qs.length!==0){
apiPromises.push(API.cui.getOrganizationsRequestableApps({organizationId:User.user.organization.id,qs:qs}));
qs=[];
}
});
}else
{
orgAppSearch.viewList.push(app);
}
});
$q.all(apiPromises).
then(function(res){
angular.forEach(res,function(app){var _orgAppSearch$viewLis,_orgAppSearch$list;
if(orgAppSearch.search.name){
app[0].expanded=true;
}
(_orgAppSearch$viewLis=orgAppSearch.viewList).push.apply(_orgAppSearch$viewLis,_toConsumableArray(app));
(_orgAppSearch$list=orgAppSearch.list).push.apply(_orgAppSearch$list,_toConsumableArray(app));
});
deferred.resolve();
}).
catch(function(err){
console.log("There was an error loading parent requestable apps");
deferred.reject(err);
});
return deferred.promise;
};
/* ----------------------------------------- HELPER FUNCTIONS END ----------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

var onLoad=function onLoad(previouslyLoaded){
if(previouslyLoaded){
Loader.onFor(loaderName);
}else
{
Loader.onFor(loaderName);
// pre populate fields based on state params on first load
var numberOfRequests=0;

Object.keys(orgAppSearch.packageRequests).forEach(function(appId){
// Gets the list of package requests saved in memory
// This sets the checkboxes back to marked when the user clicks back after being in request review
orgAppSearch.appCheckbox[appId]=true;
numberOfRequests++;
});

orgAppSearch.numberOfRequests=numberOfRequests;

orgAppSearch.search={};
orgAppSearch.search.name=$stateParams.name;
orgAppSearch.search.category=$stateParams.category;
orgAppSearch.search.page=parseInt($stateParams.page);
orgAppSearch.search.pageSize=parseInt($stateParams.pageSize);
}

var query=[];

if(orgAppSearch.search.name)query.push(['service.name',orgAppSearch.search.name]);
if(orgAppSearch.search.category)query.push(['service.category',orgAppSearch.search.category]);

orgAppSearch.search.pageSize=orgAppSearch.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0]||25;
query.push(['pageSize',String(orgAppSearch.search.pageSize)]);

orgAppSearch.search.page=orgAppSearch.search.page||1;
query.push(['page',String(orgAppSearch.search.page)]);

var opts={
organizationId:User.user.organization.id,
useCuid:true,
qs:query};


var promises=[API.cui.getOrganizationsRequestableApps(opts),API.cui.getOrganizationRequestableCount(opts)];

$q.all(promises).
then(function(res){
orgAppSearch.list=res[0];
orgAppSearch.count=res[1];
updateViewList(res[0]).
then(function(){
Loader.offFor(loaderName);
});

});
};

onLoad(false);

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */

orgAppSearch.pageChange=function(newpage){
orgAppSearch.updateSearch('page',newpage);
};

orgAppSearch.updateSearch=function(updateType,updateValue){
if(updateType!=='page'){
orgAppSearch.search.page=1;
}
orgAppSearch.search.orgId=orgAppSearch.stateParamsOrgId;
// Update current URL without changing the state
$state.transitionTo('organization.search',orgAppSearch.search,{notify:false});
onLoad(true);
};

orgAppSearch.toggleRequest=function(application){
if(!orgAppSearch.packageRequests[application.id])orgAppSearch.packageRequests[application.id]=application;else
delete orgAppSearch.packageRequests[application.id];

DataStorage.setType('orgAppsBeingRequested',orgAppSearch.packageRequests);
processNumberOfRequestedApps(orgAppSearch.packageRequests[application.id]);
};

/* orgAppSearch.saveRequestsAndCheckout = function() {
        DataStorage.setType('orgAppsBeingRequested', orgAppSearch.packageRequests);
        $state.go('organization.newRequestReview');
    };*/


orgAppSearch.saveRequestsAndCheckout=function(){
var qs=[];
//needed to set a flag for related apps to display in review page
angular.forEach(orgAppSearch.packageRequests,function(request){
if(request.relatedApps){
request.relatedAppSelectedCount=0;
request.relatedApps.forEach(function(relatedApp){
if(_.find(orgAppSearch.packageRequests,{id:relatedApp.id})){
relatedApp.selected=true;
request.relatedAppSelectedCount++;
}else
{
relatedApp.selected=false;
}
});
}
// If Selected Related app full details not available need to fetch it
if(!request.servicePackage){
qs.push(['service.id',request.id]);
}
});
if(qs.length!==0){
API.cui.getPersonRequestableApps({personId:API.getUser(),qs:qs}).
then(function(res){
res.forEach(function(app){
orgAppSearch.packageRequests[app.id]=app;
});
/*AppRequests.set(orgAppSearch.packageRequests);*/
DataStorage.setType('orgAppsBeingRequested',orgAppSearch.packageRequests);
$state.go('organization.newRequestReview');
});
}else
{
/*AppRequests.set(orgAppSearch.packageRequests);*/
DataStorage.setType('orgAppsBeingRequested',orgAppSearch.packageRequests);
$state.go('organization.newRequestReview');
}
};
//Related apps will always appear inside body, So need to select parent if it is selected 
orgAppSearch.checkRelatedAppsBody=function(relatedApp,parent){
if(_.find(orgAppSearch.list,{id:relatedApp.id})){
orgAppSearch.toggleRequest(_.find(orgAppSearch.list,{id:relatedApp.id}));
}else
{
orgAppSearch.list.push(relatedApp);
orgAppSearch.toggleRequest(relatedApp);
}
orgAppSearch.checkRelatedAndBundledApps(_.find(orgAppSearch.list,{id:relatedApp.id}),parent);
};

//Deselect Child apps If it has any and select parent if checked from parent body 
orgAppSearch.checkRelatedAndBundledApps=function(application,parent){
//if unchecked the checkbox
if(!orgAppSearch.packageRequests[application.id]){
//if it is a parent then then deselect childs
if(!parent){
application.relatedApps&&application.relatedApps.forEach(function(relatedApp){
if(orgAppSearch.appCheckbox[relatedApp.id]){
orgAppSearch.appCheckbox[relatedApp.id]=!orgAppSearch.appCheckbox[relatedApp.id];
orgAppSearch.toggleRequest(_.find(orgAppSearch.list,{id:relatedApp.id}));
}
});
orgAppSearch.checkBundledApps(application,false);
}
}else{
if(parent){
if(!orgAppSearch.appCheckbox[parent.id]){
orgAppSearch.appCheckbox[parent.id]=true;
orgAppSearch.toggleRequest(parent);
orgAppSearch.checkBundledApps(parent,true);
}
}else
orgAppSearch.checkBundledApps(application,true);
}
};

orgAppSearch.checkBundledApps=function(application,check){
if(application.bundledApps){
application.bundledApps.forEach(function(bundledApp){
orgAppSearch.appCheckbox[bundledApp.id]=check;
if(_.find(orgAppSearch.list,{id:bundledApp.id}))
orgAppSearch.toggleRequest(_.find(orgAppSearch.list,{id:bundledApp.id}));
});
}
};

/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('orgDetailsCtrl',function(API,Loader,$scope,$stateParams,APIError,APIHelpers,$timeout,$q){

var orgDetails=this;
var scopeName='orgDetails.';
orgDetails.prevState={
params:{
orgId:$stateParams.orgId},

name:"organization.directory.userList"};

orgDetails.mobileHandler='profile';
orgDetails.profileUsersSwitch='profile';
orgDetails.appsHierarchySwitch='apps';

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

Loader.onFor(scopeName+'orgInfo');
/*
    API.cui.getPerson({ personId: $stateParams.userId })
    .then(res => {
        orgDetails.user = res
        CuiMobileNavFactory.setTitle(res.name.given + '.' + res.name.surname)
    })
    .fail(error => {
        console.error('Failed getting user information')
    })
    .always(() => {
        Loader.offFor(scopeName + 'userInfo')
        $scope.$digest()
    })*/


var apiPromises=[
API.cui.getOrganization({organizationId:$stateParams.orgId})];


$q.all(apiPromises).
then(function(_ref){var _ref2=_slicedToArray(_ref,1),organization=_ref2[0];
// CuiMobileNavFactory.setTitle(user.name.given + '.' + user.name.surname)
orgDetails.organization=Object.assign({},organization);
Loader.offFor(scopeName+'orgInfo');
}).
catch(function(){
Loader.offFor(scopeName+'orgInfo');
APIError.onFor('orgDetails.org');
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------------- ON CLICK START ---------------------------------------------- */

/* --------------------------------------------- ON CLICK END ---------------------------------------------- */
});

angular.module('organization').
controller('orgDetailsAppsCtrl',function(API,$stateParams,$q,$state,DataStorage,$pagination,Loader,$filter,$scope){
'use strict';


var orgDetailsApps=this;
var scopeName='orgDetailsApps.';
orgDetailsApps.stateParamsOrgId=$stateParams.orgId;

Loader.onFor('orgDetailsApps.init');
orgDetailsApps.search={orgId:orgDetailsApps.stateParamsOrgId};
orgDetailsApps.search.page=orgDetailsApps.search.page||1;
orgDetailsApps.paginationPageSize=orgDetailsApps.paginationPageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
orgDetailsApps.search.pageSize=orgDetailsApps.paginationPageSize;

// HELPER FUNCTIONS START ---------------------------------------------------------------------------------

/*const switchBetween = (property, firstValue, secondValue) => { 
        // helper function to switch a property between two values or set to undefined if values not passed;
        if(!firstValue) orgDetailsApps.search[property] = undefined;
        orgDetailsApps.search[property] === firstValue ? orgDetailsApps.search[property] = secondValue : orgDetailsApps.search[property] = firstValue;
    };*/

/*const switchBetween = (property, firstValue, secondValue) => { 
        // helper function to switch a property between two values or set to undefined if values not passed;
        if(!firstValue) {
            orgDetailsApps.search[property] = undefined;
            return
        }
        orgDetailsApps.search[property] = orgDetailsApps.search[property] === firstValue
            ? secondValue
            : firstValue
    }*/

var switchBetween=function switchBetween(property,firstValue,secondValue){
// helper function to switch a property between two values or set to undefined if values not passed
if(!firstValue){
orgDetailsApps.search[property]=undefined;
return;
}
orgDetailsApps.search[property]=orgDetailsApps.search[property]===firstValue?
secondValue:
firstValue;
};

var getPackageServices=function getPackageServices(ArrayOfPackages){
var services=[];

ArrayOfPackages.forEach(function(servicePackage){
API.cui.getPackageServices({packageId:servicePackage.servicePackage.id}).
then(function(res){
res.forEach(function(service){
services.push(service);
});
});
});

return services;
};

// HELPER FUNCTIONS END -----------------------------------------------------------------------------------

// ON LOAD START ------------------------------------------------------------------------------------------

var onLoad=function onLoad(previouslyLoaded){
if(previouslyLoaded){
Loader.offFor('orgDetailsApps.init');
}else
{
orgDetailsApps.search.name=$stateParams.name;
orgDetailsApps.search.category=$stateParams.category;
orgDetailsApps.search.sortBy=$stateParams.sortBy;
orgDetailsApps.search.refine=$stateParams.refine;
if($stateParams.page)
orgDetailsApps.search.page=parseInt($stateParams.page);
if($stateParams.pageSize)
orgDetailsApps.search.pageSize=parseInt($stateParams.pageSize);


API.cui.getOrgAppCategories({organizationId:orgDetailsApps.stateParamsOrgId}).
then(function(res){
orgDetailsApps.categories=res;
$scope.$digest();
}).
fail(function(err){

});

}

var queryParams=[['page',String(orgDetailsApps.search.page)],['pageSize',String(orgDetailsApps.search.pageSize)]];
var promises=[];
var opts={
organizationId:orgDetailsApps.stateParamsOrgId,
qs:queryParams};


if(orgDetailsApps.search.name)queryParams.push(['service.name',orgDetailsApps.search.name]);
if(orgDetailsApps.search.category)queryParams.push(['service.category',orgDetailsApps.search.category]);
// sortBy: +/-service.name, +/-service.creation, +/-grant.instant
if(orgDetailsApps.search.sortBy)queryParams.push(['sortBy',orgDetailsApps.search.sortBy]);

switch(orgDetailsApps.search.refine){
case'active':
case'suspended':
queryParams.push(['grant.status',orgDetailsApps.search.refine]);
promises.push(API.cui.getOrganizationGrantedApps(opts),API.cui.getOrganizationGrantedCount(opts));
/*promises.push(API.cui.getOrganizationGrantedApps(opts));*/
break;
case'pending':
/*promises.push(
                    API.cui.getOrgPendingServicePackages({qs: [['requestor.id', organizationId], ['requestor.type', 'organization']]})
                    .then((res) => {
                        return getPackageServices(res);
                    }),
                    API.cui.getOrganizationRequestableCount({organizationId: organizationId})
                );*/
queryParams.push(['grant.status',orgDetailsApps.search.refine]);
/* promises.push(API.cui.getOrganizationGrantedApps(opts));*/
promises.push(API.cui.getOrganizationGrantedApps(opts),API.cui.getOrganizationGrantedCount(opts));
break;
case undefined:
/*promises.push(API.cui.getOrganizationGrantedApps(opts));*/
promises.push(API.cui.getOrganizationGrantedApps(opts),API.cui.getOrganizationGrantedCount(opts));
break;}


$q.all(promises).
then(function(res){
orgDetailsApps.appList=res[0];
orgDetailsApps.count=res[1];
/*orgDetailsApps.count = res[0].length;*/
Loader.offFor('orgDetailsApps.init');
if(orgDetailsApps.reRenderPaginate)orgDetailsApps.reRenderPaginate();
}).
catch(function(err){
orgDetailsApps.loadingError=true;
Loader.offFor('orgDetailsApps.init');
});
};
// get Organization to display name
API.cui.getOrganization({organizationId:orgDetailsApps.stateParamsOrgId}).
then(function(res){
orgDetailsApps.organization=res;
});
onLoad(false);

// ON LOAD END --------------------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START -------------------------------------------------------------------------------

orgDetailsApps.pageChange=function(newpage){
orgDetailsApps.updateSearch('page',newpage);
};

orgDetailsApps.updateSearchByName=function(){
orgDetailsApps.updateSearch('name',orgDetailsApps.search['name']);
};

orgDetailsApps.updateSearch=function(updateType,updateValue){
switch(updateType){
case'alphabetic':
switchBetween('sortBy','+service.name','-service.name');
break;
case'date':
switchBetween('sortBy','+grant.instant','-grant.instant');
break;
case'status':
orgDetailsApps.search.page=1;
orgDetailsApps.search.refine=updateValue;
break;
case'category':
orgDetailsApps.search.page=1;
orgDetailsApps.search.category=$filter('cuiI18n')(updateValue);
break;
case'name':
orgDetailsApps.search.page=1;
break;}


// Updates URL, doesn't change state
$state.transitionTo('organization.directory.orgDetails',orgDetailsApps.search,{notify:false});
onLoad(true);
};

orgDetailsApps.goToDetails=function(application){
var opts={
appId:application.id,
orgId:application.owningOrganization.id};

$state.go('organization.applicationDetails',opts);
};
// ON CLICK FUNCTIONS END ------------------------------------------------------------------------
});

angular.module('organization').
controller('orgDetailsHierarchyCtrl',function(API,APIError,Loader,User,$scope,$state,$stateParams){
'use strict';
var orgDetailsHierarchy=this;
var pageLoader='orgDetailsHierarchy.loading';
orgDetailsHierarchy.stateParamsOrgId=$stateParams.orgId;

/* -------------------------------------------- HELPER FUNCTIONS START --------------------------------------------- */

var addExpandedProperty=function addExpandedProperty(childOrgs,parentOrg){

childOrgs.forEach(function(org){
// Need to remove org if it is pending
if(org.status==="PENDING"){
parentOrg.children.splice(index,1);
return;
}
if(org.children){
org.expanded=false;
addExpandedProperty(org.children,org);
}
});
};

/* -------------------------------------------- HELPER FUNCTIONS END --------------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */
Loader.onFor(pageLoader);
API.cui.getOrganizationHierarchy({organizationId:orgDetailsHierarchy.stateParamsOrgId}).
done(function(res){
// Put hierarchy response in an array as the hierarchy directive expects an array
orgDetailsHierarchy.organizationHierarchy=[res];
// add expended property to all the org with children directive needs it to work for 
// expandable and collapsable function
if(orgDetailsHierarchy.organizationHierarchy[0].children){
addExpandedProperty(orgDetailsHierarchy.organizationHierarchy[0].children,orgDetailsHierarchy.organizationHierarchy[0]);
}
}).
fail(function(err){
APIError.onFor(pageLoader,err);
}).
always(function(){
Loader.offFor(pageLoader);
$scope.$digest();
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */
/* */
orgDetailsHierarchy.goToOrgPrfile=function(org){
$state.go('organization.directory.orgDetails',{orgId:org.id});
};

orgDetailsHierarchy.toggleExpand=function(object){
object.expanded=!object.expanded;
// let updateOrgChildren= (orgs) => {
//     orgs.forEach(org => {
//         if (org.id===object.id) {
//             org.expanded=object.expanded
//             return;
//         }
//         if (org.children) {
//             updateOrgChildren(org.children)
//         }
//     })

//     if (true) {};
// }
// updateOrgChildren(orgDetailsHierarchy.organizationHierarchy[0].children)
$scope.$digest();
};
});

angular.module('organization').
controller('orgDetailsProfileCtrl',function(Loader,Organization,$stateParams,$q,APIError){

var orgDetailsProfile=this;
var scopeName='orgDetailsProfile.';

orgDetailsProfile.stateParamsOrgId=$stateParams.orgId;
var orgPromise=[];

/* -------------------------------------------- ON LOAD START --------------------------------------------- */
Loader.onFor('orgDetailsProfile.init');
orgPromise.push(Organization.getOrganization($stateParams.orgId));
$q.all(orgPromise).
then(function(res){
if(orgPromise.length!==0){
orgDetailsProfile.organization=res[0];
}
Organization.initOrganizationProfile(orgDetailsProfile.organization.id,orgDetailsProfile.organization.passwordPolicy.id,orgDetailsProfile.organization.authenticationPolicy.id).
then(function(res){
orgDetailsProfile.securityAdmins=res.admins;
orgDetailsProfile.passwordPolicy=res.passwordPolicy;
orgDetailsProfile.authenticationPolicy=res.authenticationPolicy;
Loader.offFor('orgDetailsProfile.init');
}).
catch(function(err){
console.error("there was an error fetching additional org details"+err);
Loader.offFor('orgDetailsProfile.init');
APIError.onFor('orgDetailsProfile.init');
});
}).
catch(function(err){
console.error("there was an error fetching org details"+err);
Loader.offFor('orgDetailsProfile.init');
APIError.onFor('orgDetailsProfile.init');
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

});

angular.module('organization').
controller('orgDetailsUsersCtrl',function(API,APIError,APIHelpers,CuiMobileNavFactory,Loader,User,UserList,$filter,$pagination,$q,$state,$stateParams){

var orgDetailsUsers=this;
var scopeName='orgDetailsUsers.';
orgDetailsUsers.stateParamsOrgId=$stateParams.orgId;
orgDetailsUsers.search={};
orgDetailsUsers.sortBy={};

/* ---------------------------------------- HELPER FUNCTIONS START ---------------------------------------- */

var switchBetween=function switchBetween(property,firstValue,secondValue){
orgDetailsUsers.search[property]===firstValue?
orgDetailsUsers.search[property]=secondValue:
orgDetailsUsers.search[property]=firstValue;
};

var getUserListAppCount=function getUserListAppCount(userList){
userList.forEach(function(user){
API.cui.getPersonGrantedAppCount({personId:user.id}).
then(function(res){
user.appCount=res;
}).
fail(function(error){
user.appCount='...';
});
});
};

/* ----------------------------------------- HELPER FUNCTIONS END ----------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

var initDirectory=function initDirectory(organizationId){
orgDetailsUsers.search['organization.id']=organizationId||$stateParams.orgId||User.user.organization.id;
orgDetailsUsers.search.pageSize=orgDetailsUsers.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];

var apiCalls=[
UserList.getUsers({qs:APIHelpers.getQs(orgDetailsUsers.search)}),
UserList.getUserCount({qs:[['organization.id',orgDetailsUsers.search['organization.id']]]}),
API.cui.getOrganization({organizationId:orgDetailsUsers.search['organization.id']})];


Loader.onFor(scopeName+'userList');
APIError.offFor(scopeName+'userList');

$q.all(apiCalls).
then(function(_ref3){var _ref4=_slicedToArray(_ref3,3),users=_ref4[0],userCount=_ref4[1],organization=_ref4[2];
orgDetailsUsers.organization=organization;
// orgDetailsUsers.organizationList = APIHelpers.flattenOrgHierarchy(orgHierarchy)
orgDetailsUsers.userList=users;
orgDetailsUsers.userCount=userCount;
orgDetailsUsers.statusData=APIHelpers.getCollectionValuesAndCount(users,'status',true);
CuiMobileNavFactory.setTitle(organization.name);
orgDetailsUsers.reRenderPagination&&orgDetailsUsers.reRenderPagination();
getUserListAppCount(orgDetailsUsers.userList);
}).
catch(function(error){
APIError.onFor(scopeName+'userList');
}).
finally(function(){
Loader.offFor(scopeName+'userList');
});
};

orgDetailsUsers.search=Object.assign({},$stateParams);
initDirectory();

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */


// headers="['cui-name', 'username', 'status']" 

orgDetailsUsers.sortingCallbacks={
name:function name(){
orgDetailsUsers.sortBy.sortBy='name';
orgDetailsUsers.sort(['name.given','name.surname'],orgDetailsUsers.sortBy.sortType);
},
username:function username(){
orgDetailsUsers.sortBy.sortBy='username';
orgDetailsUsers.sort('username',orgDetailsUsers.sortBy.sortType);
},
status:function status(){
orgDetailsUsers.sortBy.sortBy='status';
orgDetailsUsers.sort('status',orgDetailsUsers.sortBy.sortType);
}};


orgDetailsUsers.sort=function(sortBy,order){
cui.log('sort',sortBy,order);

orgDetailsUsers.userList=_.orderBy(orgDetailsUsers.userList,sortBy,order);
};

orgDetailsUsers.updateSearchParams=function(page){
if(page)orgDetailsUsers.search.page=page;
$state.transitionTo('organization.directory.orgDetails',orgDetailsUsers.search,{notify:false});
initDirectory(orgDetailsUsers.search['organization.id']);
};

orgDetailsUsers.updateSearchByName=function(name){
orgDetailsUsers.updateSearchParams();
};
orgDetailsUsers.actionCallbacks={
sort:function sort(sortType){
switch(sortType){
case'name':
switchBetween('sortBy','+person.name','-person.name');
break;
case'username':
switchBetween('sortBy','+person.username','-person.username');
break;
case'status':
switchBetween('sortBy','+person.status','-person.status');
break;}


// if (!orgDetailsUsers.search.hasOwnProperty('sortBy')) orgDetailsUsers.search['sortBy'] = '+' + sortType
// else if (orgDetailsUsers.search.sortBy.slice(1) !== sortType) orgDetailsUsers.search.sortBy = '+' + sortType
// else switchBetween('sortBy', '+' + sortType, '-' + sortType)
orgDetailsUsers.updateSearchParams();
},
refine:function refine(refineType){
if(refineType==='all')delete orgDetailsUsers.search['status'];else
{
if(!orgDetailsUsers.search.hasOwnProperty('status'))orgDetailsUsers.search['status']=refineType;else
orgDetailsUsers.search.status=refineType;
}
orgDetailsUsers.updateSearchParams();
}};


orgDetailsUsers.userClick=function(clickedUser){
var stateOpts={
userId:clickedUser.id,
orgId:clickedUser.organization.id};

if(clickedUser.status==='pending')$state.go('organization.requests.personRequest',stateOpts);else
$state.go('organization.directory.userDetails',stateOpts);
};

orgDetailsUsers.getOrgMembers=function(organization){
CuiMobileNavFactory.setTitle($filter('cuiI18n')(organization.name));
initDirectory(organization.id);
};

/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('userAppDetailsCtrl',function(API,$scope,$stateParams,$state,$q,APIHelpers,Loader,APIError,DataStorage,$timeout){
var userAppDetails=this;
userAppDetails.relatedApps=[];
userAppDetails.prevState={
params:{
userId:$stateParams.userId,
orgId:$stateParams.orgId},

name:"organization.directory.userDetails"};

userAppDetails.dropDown={
claims:false,
suspend:false,
unsuspend:false,
remove:false

// HELPER FUNCTIONS START ------------------------------------------------------------------------
};var getClaims=function getClaims(app){
var deferred=$q.defer();
var packageId=app.servicePackage.id;

Loader.onFor(loaderName+'claims');
API.cui.getPersonPackageClaims({grantee:$stateParams.userId,packageId:packageId}).
then(function(userClaims){
APIError.offFor(loaderName+'claims');
deferred.resolve(userClaims);
}).
fail(function(err){
APIError.onFor(loaderName+'claims');
deferred.reject(err);
}).
always(function(){
Loader.offFor(loaderName+'claims');
$scope.$digest();
});
return deferred.promise;
};

// Returns claims that are associated with a package id
var getPackageClaims=function getPackageClaims(packageId){
var deferred=$q.defer();
API.cui.getPackageClaims({qs:[['packageId',packageId]]}).
then(function(packageClaims){
APIError.offFor(loaderName+'packageClaims');
deferred.resolve(packageClaims);
}).
fail(function(err){
console.error('Failed getting package claims');
APIError.onFor(loaderName+'packageClaims');
deferred.reject(err);
}).
always(function(){
Loader.offFor(loaderName+'packageClaims');
$scope.$digest();
});
return deferred.promise;
};

var getFormattedClaimData=function getFormattedClaimData(){
$q.all([getClaims(userAppDetails.app),getPackageClaims(userAppDetails.app.servicePackage.id)]).
then(function(res){
userAppDetails.userClaims=res[0];
userAppDetails.packageClaims=res[1];
userAppDetails.claimSelection={};
//initialize and preselect claims which are already granted to user
userAppDetails.packageClaims.forEach(function(packageClaim){
userAppDetails.claimSelection[packageClaim.claimId]={};
var grantedClaim=_.find(userAppDetails.userClaims.packageClaims,{claimId:packageClaim.claimId});
if(grantedClaim){
packageClaim.claimValues.forEach(function(claimValue){
if(_.find(grantedClaim.claimValues,{claimValueId:claimValue.claimValueId})){
userAppDetails.claimSelection[packageClaim.claimId][claimValue.claimValueId]=true;
}
});
}
});
});
};

var getApp=function getApp(updating){
if(!updating){
Loader.onFor(loaderName+'app');
}
API.cui.getPersonGrantedApps(opts).
then(function(res){
APIError.offFor(loaderName+'app');
userAppDetails.app=Object.assign({},res[0]);
if(!updating){
getFormattedClaimData();
getRelatedApps(userAppDetails.app);
}
}).
fail(function(err){
APIError.onFor(loaderName+'app');
}).
done(function(){
Loader.offFor(loaderName+'app');
$scope.$digest();
});
};
var getRelatedApps=function getRelatedApps(app){
var packageId=app.servicePackage.id;
var qs=void 0;
if(app.servicePackage.parent){
qs=[['servicePackage.id',app.servicePackage.parent.id]];
}else{
qs=[['servicePackage.parentPackage.id',app.servicePackage.id]];
}
Loader.onFor(loaderName+'relatedApps');
var apiPromises=[
API.cui.getPersonRequestableApps({personId:API.getUser(),'qs':[['servicePackage.parentPackage.id',packageId]]}),
API.cui.getPersonGrantedApps({personId:API.getUser(),'qs':qs})];

$q.all(apiPromises).
then(function(res){
APIError.offFor(loaderName+'relatedApps');
userAppDetails.relatedApps=userAppDetails.relatedApps.concat(res[0]);
userAppDetails.relatedApps=userAppDetails.relatedApps.concat(res[1]);
}).
catch(function(err){
APIError.onFor(loaderName+'relatedApps');
}).
finally(function(){
Loader.offFor(loaderName+'relatedApps');
});
};

var buildData=function buildData(type){
var reason=void 0;
if(type=="suspend"){
reason=userAppDetails.suspendReason;
}else{
reason=userAppDetails.unsuspendReason;
}
return{
grantee:{
id:$stateParams.userId,
type:'person'},

servicePackage:{
id:userAppDetails.app.servicePackage.id},

justification:reason};


};

var buildClaimData=function buildClaimData(){

var buildPackageClaims=function buildPackageClaims(claimsObject){
if(Object.keys(claimsObject).length===0){
return undefined;
}// if there's no claims in this claim object
var packageClaims=[];
Object.keys(claimsObject).forEach(function(claimId){
if(Object.keys(claimsObject[claimId]).length===0){
return;
}// if no claimValues selected for that claimId
var claimValues=[];
Object.keys(claimsObject[claimId]).forEach(function(claimValueId){
if(claimsObject[claimId][claimValueId]){//If checked
claimValues.push({claimValueId:claimValueId});
}
});
// const claimValues = Object.keys(claimsObject[claimId]).reduce((claims, claimValueId) => {
//     claims.push({ claimValueId })
//     return claims
// },[])
if(claimValues.length!==0){
packageClaims.push({
claimId:claimId,
claimValues:claimValues});

}
});
return packageClaims;
};
return{
data:{
grantee:{
id:$stateParams.userId,
type:'person'},

servicePackage:{
id:userAppDetails.app.servicePackage.id,
type:'servicePackage'},

packageClaims:buildPackageClaims(userAppDetails.claimSelection)}};


};
// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

var loaderName='userAppDetails.';

var qs={
'service.id':$stateParams.appId};


var opts={
personId:$stateParams.userId,
qs:APIHelpers.getQs(qs)};

userAppDetails.app=DataStorage.getType('userAppDetail');
if(userAppDetails.app&&userAppDetails.app.id===$stateParams.appId){
getFormattedClaimData();
getRelatedApps(userAppDetails.app);
// Update application detail for any new changes during reload
// Commenting out as API is not giving full details for service.id query parameter get
//it is relying on previous page details which has full details
getApp(true);
}else
{
getApp(false);
}

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START ----------------------------------------------------------------------

userAppDetails.goToDetails=function(application){
$state.go('applications.userAppDetails',{
'packageId':application.packageId,
'appId':application.id});

};

userAppDetails.toggleDropDown=function(type){
Object.keys(userAppDetails.dropDown).forEach(function(key){
if(key===type){
userAppDetails.dropDown[key]=!userAppDetails.dropDown[key];
}else{
userAppDetails.dropDown[key]=false;
}
});
};
userAppDetails.suspendApp=function(){
Loader.onFor(loaderName+'suspend');
APIError.offFor(loaderName+'suspend');
var data=buildData('suspend');
API.cui.suspendPersonApp({data:data}).
then(function(res){
userAppDetails.app.grant.status="suspended";
userAppDetails.suspendAppSuccess=true;
Loader.offFor(loaderName+'suspend');
$scope.$digest();
$timeout(function(){
userAppDetails.dropDown.suspend=false;
userAppDetails.suspendAppSuccess=false;
},2000);
}).
fail(function(err){
APIError.onFor(loaderName+'suspend');
Loader.offFor(loaderName+'suspend');
$scope.$digest();
console.log('There was an error suspending user App',+err);
});
};

userAppDetails.unsuspendApp=function(){
Loader.onFor(loaderName+'unsuspend');
APIError.offFor(loaderName+'unsuspend');
var data=buildData('unsuspend');
API.cui.unsuspendPersonApp({data:data}).
then(function(res){
userAppDetails.app.grant.status="active";
userAppDetails.unsuspendAppSuccess=true;
Loader.offFor(loaderName+'unsuspend');
$scope.$digest();
$timeout(function(){
userAppDetails.dropDown.unsuspend=false;
userAppDetails.unsuspendAppSuccess=false;
},2000);
}).
fail(function(err){
APIError.onFor(loaderName+'unsuspend');
Loader.offFor(loaderName+'unsuspend');
$scope.$digest();
console.log('There was an error suspending user App',+err);
});
};

userAppDetails.removeApp=function(){
Loader.onFor(loaderName+'remove');
APIError.offFor(loaderName+'remove');
API.cui.revokePersonApp({personId:$stateParams.userId,packageId:userAppDetails.app.servicePackage.id}).
then(function(res){
// userAppDetails.app.grant.status="removeed"
userAppDetails.removeAppSuccess=true;
Loader.offFor(loaderName+'remove');
$scope.$digest();
$timeout(function(){
userAppDetails.removeAppSuccess=false;
$state.go('organization.directory.userDetails',userAppDetails.prevState.params);
},2000);
}).
fail(function(err){
APIError.onFor(loaderName+'remove');
Loader.offFor(loaderName+'remove');
$scope.$digest();
$timeout(function(){
APIError.offFor(loaderName+'remove');
},3000);
console.log('There was an error removing user App',+err);
});
};

userAppDetails.modifyClaims=function(){
Loader.onFor(loaderName+'modifyClaims');
APIError.offFor(loaderName+'modifyClaims');
API.cui.grantClaims(buildClaimData()).
then(function(res){
userAppDetails.modifyClaimsSuccess=true;
Loader.offFor(loaderName+'modifyClaims');
$scope.$digest();
$timeout(function(){
userAppDetails.dropDown.claims=false;
userAppDetails.modifyClaimsSuccess=false;
},2000);
}).
fail(function(err){
APIError.onFor(loaderName+'modifyClaims');
Loader.offFor(loaderName+'modifyClaims');
$scope.$digest();
console.log('There was an error updating user\'s app claims',+err);
});

};
// ON CLICK FUNCTIONS END ------------------------------------------------------------------------

});

angular.module('organization').
controller('userDetailsCtrl',function(API,Loader,$scope,$stateParams,APIError,APIHelpers,$timeout,$q){

var userDetails=this;
var scopeName='userDetails.';
userDetails.prevState={
params:{
orgId:$stateParams.orgId},

name:"organization.directory.userList"};

userDetails.stateParamsOrgId=$stateParams.orgId;
userDetails.mobileHandler='profile';
userDetails.profileRolesSwitch='profile';
userDetails.appsHistorySwitch='apps';

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

Loader.onFor(scopeName+'userInfo');
/*
    API.cui.getPerson({ personId: $stateParams.userId })
    .then(res => {
        userDetails.user = res
        CuiMobileNavFactory.setTitle(res.name.given + '.' + res.name.surname)
    })
    .fail(error => {
        console.error('Failed getting user information')
    })
    .always(() => {
        Loader.offFor(scopeName + 'userInfo')
        $scope.$digest()
    })*/


var apiPromises=[
API.cui.getPerson({
personId:$stateParams.userId}),

API.cui.getOrganization({organizationId:$stateParams.orgId}),
API.cui.getPersonPassword({
personId:$stateParams.userId})];



$q.all(apiPromises).
then(function(_ref5){var _ref6=_slicedToArray(_ref5,3),user=_ref6[0],organization=_ref6[1],password=_ref6[2];
// CuiMobileNavFactory.setTitle(user.name.given + '.' + user.name.surname)
userDetails.user=Object.assign({},user);
userDetails.organization=Object.assign({},organization);
userDetails.passwordAccount=Object.assign({},password);
return API.cui.getPasswordPolicy({policyId:userDetails.organization.passwordPolicy.id});
}).
then(function(res){
userDetails.passwordPolicy=res;

res.rules.forEach(function(rule){
if(rule.type==='history'){
userDetails.numberOfPasswords=rule.numberOfPasswords;
}
});
Loader.offFor(scopeName+'userInfo');
}).
catch(function(){
Loader.offFor(scopeName+'userInfo');
APIError.onFor('userDetails.user');
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------------- ON CLICK START ---------------------------------------------- */
userDetails.suspend=function(personId){

userDetails.suspend.begun=userDetails.suspend.begun?false:true;
userDetails.unsuspend.begun=userDetails.unsuspend.begun?false:false;
userDetails.specifyPassword.begun=userDetails.specifyPassword.begun?false:false;
userDetails.resetPassword.begun=userDetails.resetPassword.begun?false:false;

var name='userDetails.suspend';

userDetails.suspend.reset=function(){
Loader.offFor(name);
APIError.offFor(name);
userDetails.user.suspendReason='';
userDetails.suspend.success&&delete userDetails.suspend.success;
};

userDetails.suspend.reset();

userDetails.suspend.confirm=function(){
Loader.onFor(name);
APIError.offFor(name);

var reason=encodeURIComponent(userDetails.user.suspendReason);

API.cui.suspendPerson({
qs:APIHelpers.getQs({
personId:personId,
reason:reason})}).


then(
function(res){
APIError.offFor(name);
userDetails.suspend.success=true;
userDetails.user.status='suspended';
$timeout(userDetails.suspend.cancel,1500);
},
function(err){
APIError.onFor(name);
}).

always(function(){
Loader.offFor(name);
$scope.$digest();
});
};

userDetails.suspend.cancel=function(){
userDetails.suspend.begun=false;
userDetails.suspend.reset();
};
};

userDetails.unsuspend=function(personId){
userDetails.unsuspend.begun=userDetails.unsuspend.begun?false:true;
userDetails.suspend.begun=userDetails.suspend.begun?false:false;
userDetails.specifyPassword.begun=userDetails.specifyPassword.begun?false:false;
userDetails.resetPassword.begun=userDetails.resetPassword.begun?false:false;

var name='userDetails.unsuspend';

userDetails.unsuspend.reset=function(){
Loader.offFor(name);
APIError.offFor(name);
userDetails.user.unsuspendReason='';
userDetails.unsuspend.success&&delete userDetails.unsuspend.success;
};

userDetails.unsuspend.reset();

userDetails.unsuspend.confirm=function(){
Loader.onFor(name);
APIError.offFor(name);

var reason=encodeURIComponent(userDetails.user.unsuspendReason);

API.cui.unsuspendPerson({
qs:APIHelpers.getQs({
personId:personId,
reason:reason})}).


then(
function(res){
APIError.offFor(name);
userDetails.unsuspend.success=true;
userDetails.user.status='active';
$timeout(userDetails.unsuspend.cancel,1500);
},
function(err){
APIError.onFor(name);
}).

always(function(){
Loader.offFor(name);
$scope.$digest();
});
};

userDetails.unsuspend.cancel=function(){
userDetails.unsuspend.begun=false;
userDetails.unsuspend.reset();
};
};

userDetails.resetPassword=function(){
userDetails.unsuspend.begun=userDetails.unsuspend.begun?false:false;
userDetails.suspend.begun=userDetails.suspend.begun?false:false;
userDetails.specifyPassword.begun=userDetails.specifyPassword.begun?false:false;
userDetails.resetPassword.begun=userDetails.resetPassword.begun?false:true;


if(userDetails.resetPassword.begun){
var name='userDetails.unsuspend';

Loader.onFor(name);
APIError.offFor(name);
API.cui.resetPersonPassword({
qs:[['subject',$stateParams.userId]]}).

then(
function(res){
APIError.offFor(name);
userDetails.resetPasswordValue=res;
userDetails.resetPassword.begun=true;
},
function(err){
APIError.onFor(name);
}).

always(function(){
Loader.offFor(name);
$scope.$digest();
});
}

};

userDetails.specifyPassword=function(){
errorTimer&&$timeout.cancel(errorTimer);// cancel the timer if there's one pending
var errorTimer=void 0;

var name='userDetails.specifyPassword';
userDetails.specifyPassword.begun=userDetails.specifyPassword.begun?false:true;
userDetails.suspend.begun=userDetails.suspend.begun?false:false;
userDetails.unsuspend.begun=userDetails.unsuspend.begun?false:false;
userDetails.resetPassword.begun=userDetails.resetPassword.begun?false:false;

userDetails.specifyPassword.reset=function(){
Loader.offFor(name);
APIError.offFor(name);
APIError.offFor('userDetails.passwordHistory');
userDetails.specifyPassword.success&&delete userDetails.specifyPassword.success;
userDetails.specifyPassword.passwordHistoryError=false;
userDetails.specifyPassword.newPassword='';
userDetails.specifyPassword.newPasswordConfirm='';
};

userDetails.specifyPassword.validate=function(password,formObject,input){
var validSwitch=function validSwitch(input,isValidBoolean){
switch(input){
case'newPassword':
userDetails.specifyPassword.validNewPassword=isValidBoolean;
case'newPasswordConfirm':
userDetails.specifyPassword.validNewPasswordRe=isValidBoolean;}

};

var validateData={
userId:$stateParams.userId,
organizationId:$stateParams.orgId,
password:password,
operations:['PASSWORD_SPECIFY']};


API.cui.validatePassword({data:validateData}).
then(function(res){
var validPasswordHistory=false;

res.forEach(function(rule){
if(rule.type==='HISTORY'&&rule.isPassed){
validPasswordHistory=true;
return;
}
});

if(validPasswordHistory){
validSwitch(input,true);
formObject[input].$setValidity(input,true);
$scope.$digest();
}else
{
validSwitch(input,false);
formObject[input].$setValidity(input,false);
$scope.$digest();
}
}).
fail(function(err){
validSwitch(input,false);
formObject[input].$setValidity(input,false);
$scope.$digest();
});
};

userDetails.specifyPassword.confirm=function(){
APIError.offFor(name);
Loader.onFor(name);

/*  if (!userDetails.specifyPassword.form.$valid) {
                angular.forEach(userDetails.specifyPassword.form.$error, error => {
                    angular.forEach(error, errorField => errorField.$setTouched())
                })
                APIError.onFor(name)
                return
            }*/

API.cui.getPersonPassword({personId:$stateParams.userId}).
then(function(res){
return API.cui.specifyPersonPassword({
data:{
subject:$stateParams.userId,
password:userDetails.specifyPassword.newPassword}});


}).
then(function(res){
return API.cui.expirePersonPassword({
qs:[['subject',$stateParams.userId]],
data:{
subject:$stateParams.userId,
password:userDetails.specifyPassword.newPassword,
passwordPolicyId:userDetails.passwordPolicy.id,
authenticationPolicyId:userDetails.organization.authenticationPolicy.id}});


}).
then(function(res){
userDetails.specifyPassword.success=true;
$timeout(userDetails.specifyPassword.cancel,1500);
},function(err){
console.log(err);
APIError.onFor(name);
errorTimer=$timeout(function(){return APIError.offFor(name);},1500);
}).
always(function(){
Loader.offFor(name);
$scope.$digest();
});
};

userDetails.specifyPassword.cancel=function(){
userDetails.specifyPassword.begun=false;
userDetails.specifyPassword.reset();
};
};

userDetails.unlockUser=function(){
Loader.onFor('userDetails.unlockUser');
APIError.offFor('userDetails.unlockUser');
//Need to call two API's One is unlock Password Account and Update person stutus to active
API.cui.unlockPersonPassword({qs:[['subject',$stateParams.userId]]}).
then(function(res){
userDetails.user.stutus='active';
API.cui.updatePerson({personId:$stateParams.userId,data:userDetails.user}).
then(function(res){
userDetails.unlockUserSuccess=true;
}).
fail(function(err){
APIError.onFor('userDetails.unlockUser');
$timeout(function(){APIError.offFor('userDetails.unlockUser');},3000);
}).
always(function(){
Loader.offFor('userDetails.unlockUser');
$scope.$digest();
});
}).
fail(function(err){
APIError.onFor('userDetails.unlockUser');
$timeout(function(){APIError.offFor('userDetails.unlockUser');},3000);
}).
always(function(){
Loader.offFor('userDetails.unlockUser');
$scope.$digest();
});
};

/* --------------------------------------------- ON CLICK END ---------------------------------------------- */
});

angular.module('organization').
controller('userDetailsAppsCtrl',function(API,$stateParams,$q,$state,DataStorage){
'use strict';

var userDetailsApps=this,
userId=$stateParams.userId,
organizationId=$stateParams.orgId;

var apiPromises=[];

userDetailsApps.loading=true;
userDetailsApps.appList=[];

var getPackageServices=function getPackageServices(servicePackage){
return API.cui.getPackageServices({packageId:servicePackage.servicePackage.id}).
then(function(res){
res.forEach(function(pendingService){
pendingService.grant={
status:'pending'};

pendingService.servicePackage=servicePackage;
userDetailsApps.appList.push(pendingService);
});
});
};

// ON LOAD START ---------------------------------------------------------------------------------

apiPromises.push(
// Get user's granted applications
API.cui.getPersonGrantedApps({personId:userId}).
then(function(res){
res.forEach(function(grantedApp){
userDetailsApps.appList.push(grantedApp);
});
}));


apiPromises.push(
// Get user's pending service packages
API.cui.getPersonPendingServicePackages({qs:[['requestor.id',userId],['requestor.type','person']]}).
then(function(res){
var pendingServicePromises=[];

res.forEach(function(servicePackage){
// For each packages get its services
pendingServicePromises.push(getPackageServices(servicePackage));
});

$q.all(pendingServicePromises).
then(function(){
userDetailsApps.loading=false;
}).
catch(function(error){
userDetailsApps.loading=false;
console.log(error);
});
}));


apiPromises.push(
// Get categories of applications
API.cui.getCategories().
then(function(res){
userDetailsApps.appCategories=res;
}));


apiPromises.push(
// Get user's granted applications count
API.cui.getPersonGrantedAppCount({personId:userId}).
then(function(res){
userDetailsApps.appCount=res;
}));


$q.all(apiPromises).
catch(function(error){
userDetailsApps.loading=false;
console.log(error);
});

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START ----------------------------------------------------------------------

userDetailsApps.goToDetails=function(application){
DataStorage.setType('userAppDetail',application);
if(application.grant.status==='pending'){
$state.go('organization.requests.pendingRequests',{
'userId':userId,
'orgId':organizationId,
'packageId':application.servicePackage.servicePackage.id});

}else

$state.go('organization.directory.userAppDetails',{appId:application.id,orgId:organizationId,userId:userId});
};

// ON CLICK FUNCTIONS END ------------------------------------------------------------------------
});

angular.module('organization').
controller('userDetailsHistoryCtrl',function(API,$stateParams,$q){
'use strict';

var userDetailsHistory=this,
userId=$stateParams.userId,
organizationId=$stateParams.orgId;

var apiPromises=[];

userDetailsHistory.loading=true;
userDetailsHistory.sortClicked=false;

// ON LOAD START ---------------------------------------------------------------------------------

apiPromises.push(
API.cui.getPersonStatusHistory({qs:[['userId',String(userId)]]}).
then(function(res){
userDetailsHistory.personStatusHistory=res;
}));


$q.all(apiPromises).
then(function(res){
userDetailsHistory.loading=false;
}).
catch(function(error){
userDetailsHistory.loading=false;
console.log(error);
});

// ON LOAD END -----------------------------------------------------------------------------------

});

angular.module('organization').
controller('userDetailsProfileCtrl',function(Loader,UserProfile,$scope,$stateParams){

var userDetailsProfile=this;
var scopeName='userDetailsProfile.';

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

UserProfile.injectUI(userDetailsProfile,$scope,$stateParams.userId);

Loader.onFor(scopeName+'initProfile');

UserProfile.initUserProfile($stateParams.userId,$stateParams.orgId).
then(function(res){
angular.merge(userDetailsProfile,res);
Loader.offFor(scopeName+'initProfile');
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

});

angular.module('organization').
controller('userDetailsRolesCtrl',function(API,$stateParams,$q,$scope,APIError,$timeout){
'use strict';

var userDetailsRoles=this,
userId=$stateParams.userId,
organizationId=$stateParams.orgId;

var apiPromises=[];

userDetailsRoles.loading=true;

// ON LOAD START ---------------------------------------------------------------------------------

var init=function init(){

apiPromises.push(
API.cui.getPersonRoles({personId:userId}).
then(function(res){
userDetailsRoles.assignedRoles=res;
API.cui.getPersonRolesGrantable({personId:userId}).
then(function(res){
userDetailsRoles.rolesGrantable=res;
}).
fail(function(err){
userDetailsRoles.grantedHistoryError=true;
});
}));


apiPromises.push(
API.cui.getPersonRolesGrantable({personId:userId}).
then(function(res){
userDetailsRoles.rolesGrantable=res;
}).
fail(function(err){
userDetailsRoles.grantedHistoryError=true;
}));


$q.all(apiPromises).
then(function(res){
userDetailsRoles.loading=false;
userDetailsRoles.success=false;
}).
catch(function(error){
userDetailsRoles.loading=false;
userDetailsRoles.grantedHistoryError=true;
userDetailsRoles.success=false;
console.log(error);
});
};

init();

userDetailsRoles.assignRoles=function(){
var roles=[];
angular.forEach(userDetailsRoles.appCheckbox,function(dsd,appId){
/*Object.keys(userRoles.appCheckbox).forEach(function(appId) {*/
if(dsd){
var test={
"id":appId};

roles.push(test);
}
});
var rolesSubmitData={
"userId":userId,
"roles":roles};

console.log(rolesSubmitData);

userDetailsRoles.loading=true;
API.cui.assignPersonRoles({data:rolesSubmitData}).
then(function(res){
console.log(res);
$scope.$digest();
userDetailsRoles.success=true;
$timeout(function(){
userDetailsRoles.loading=false;

init();
},3000);

}).
fail(function(err){
userDetailsRoles.loading=false;
userDetailsRoles.rolessubmitError=true;
$scope.$digest();
});
};

$scope.$watch("userDetailsRoles.appCheckbox",function(n){
var count=0;
angular.forEach(userDetailsRoles.appCheckbox,function(dsd,key){
console.log(key);
if(dsd)
count+=1;
});
if(count>0){
userDetailsRoles.appCheckboxValid=true;
}else{
userDetailsRoles.appCheckboxValid=false;
}
},true);

// ON LOAD END -----------------------------------------------------------------------------------

});

angular.module('organization').
controller('orgDirectoryCtrl',function(API,APIError,APIHelpers,CuiMobileNavFactory,Loader,User,UserList,$filter,$pagination,$q,$state,$stateParams){

var orgDirectory=this;
var scopeName='orgDirectory.';
orgDirectory.stateParamsOrgId=$stateParams.orgId;
orgDirectory.search={};
orgDirectory.sortBy={};

/* ---------------------------------------- HELPER FUNCTIONS START ---------------------------------------- */

var switchBetween=function switchBetween(property,firstValue,secondValue){
orgDirectory.search[property]===firstValue?
orgDirectory.search[property]=secondValue:
orgDirectory.search[property]=firstValue;
};

var getUserListAppCount=function getUserListAppCount(userList){
userList.forEach(function(user){
API.cui.getPersonGrantedAppCount({personId:user.id}).
then(function(res){
user.appCount=res;
}).
fail(function(error){
user.appCount='...';
});
});
};

/* ----------------------------------------- HELPER FUNCTIONS END ----------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

var initDirectory=function initDirectory(organizationId){
orgDirectory.search['organization.id']=organizationId||$stateParams.orgId||User.user.organization.id;
orgDirectory.search.pageSize=orgDirectory.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];

var apiCalls=[
UserList.getUsers({qs:APIHelpers.getQs(orgDirectory.search)}),
UserList.getUserCount({qs:[['organization.id',orgDirectory.search['organization.id']]]}),
API.cui.getOrganization({organizationId:orgDirectory.search['organization.id']})];


Loader.onFor(scopeName+'userList');
APIError.offFor(scopeName+'userList');

$q.all(apiCalls).
then(function(_ref7){var _ref8=_slicedToArray(_ref7,3),users=_ref8[0],userCount=_ref8[1],organization=_ref8[2];
orgDirectory.organization=organization;
// orgDirectory.organizationList = APIHelpers.flattenOrgHierarchy(orgHierarchy)
orgDirectory.userList=users;
orgDirectory.userCount=userCount;
orgDirectory.statusData=APIHelpers.getCollectionValuesAndCount(users,'status',true);
CuiMobileNavFactory.setTitle(organization.name);
orgDirectory.reRenderPagination&&orgDirectory.reRenderPagination();
getUserListAppCount(orgDirectory.userList);
}).
catch(function(error){
APIError.onFor(scopeName+'userList');
}).
finally(function(){
Loader.offFor(scopeName+'userList');
});
};

orgDirectory.search=Object.assign({},$stateParams);
initDirectory();

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */


// headers="['cui-name', 'username', 'status']" 

orgDirectory.sortingCallbacks={
name:function name(){
orgDirectory.sortBy.sortBy='name';
orgDirectory.sort(['name.given','name.surname'],orgDirectory.sortBy.sortType);
},
username:function username(){
orgDirectory.sortBy.sortBy='username';
orgDirectory.sort('username',orgDirectory.sortBy.sortType);
},
status:function status(){
orgDirectory.sortBy.sortBy='status';
orgDirectory.sort('status',orgDirectory.sortBy.sortType);
}};


orgDirectory.sort=function(sortBy,order){
cui.log('sort',sortBy,order);

orgDirectory.userList=_.orderBy(orgDirectory.userList,sortBy,order);
};

orgDirectory.updateSearchParams=function(page){
if(page)orgDirectory.search.page=page;
$state.transitionTo('organization.directory.userList',orgDirectory.search,{notify:false});
initDirectory(orgDirectory.search['organization.id']);
};

orgDirectory.updateSearchByName=function(name){
orgDirectory.updateSearchParams();
};
orgDirectory.actionCallbacks={
sort:function sort(sortType){
switch(sortType){
case'name':
switchBetween('sortBy','+name.given','-name.given');
break;
case'username':
switchBetween('sortBy','+person.username','-person.username');
break;
case'status':
switchBetween('sortBy','+person.status','-person.status');
break;}


// if (!orgDirectory.search.hasOwnProperty('sortBy')) orgDirectory.search['sortBy'] = '+' + sortType
// else if (orgDirectory.search.sortBy.slice(1) !== sortType) orgDirectory.search.sortBy = '+' + sortType
// else switchBetween('sortBy', '+' + sortType, '-' + sortType)
orgDirectory.updateSearchParams();
},
refine:function refine(refineType){
if(refineType==='all')delete orgDirectory.search['status'];else
{
if(!orgDirectory.search.hasOwnProperty('status'))orgDirectory.search['status']=refineType;else
orgDirectory.search.status=refineType;
}
orgDirectory.updateSearchParams();
}};


orgDirectory.userClick=function(clickedUser){
var stateOpts={
userId:clickedUser.id,
orgId:clickedUser.organization.id};

if(clickedUser.status==='pending')$state.go('organization.requests.personRequest',stateOpts);else
$state.go('organization.directory.userDetails',stateOpts);
};

orgDirectory.getOrgMembers=function(organization){
CuiMobileNavFactory.setTitle($filter('cuiI18n')(organization.name));
initDirectory(organization.id);
};

/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('orgHierarchyCtrl',function(API,APIError,DataStorage,Loader,User,$scope,$state,$stateParams){

var orgHierarchy=this;
var pageLoader='orgHierarchy.loading';
orgHierarchy.stateParamsOrgId=$stateParams.orgId;
orgHierarchy.expanded=false;

/* -------------------------------------------- HELPER FUNCTIONS START --------------------------------------------- */

var addExpandedProperty=function addExpandedProperty(childOrgs,parentOrg){
childOrgs.forEach(function(org,index){
// Need to remove org if it is pending
if(org.status==="PENDING"){
parentOrg.children.splice(index,1);
return;
}
if(org.children){
org.expanded=false;
addExpandedProperty(org.children,org);
}
});
};

/* -------------------------------------------- HELPER FUNCTIONS END --------------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

var storedData=DataStorage.getType('orgHierarchy');

if(storedData){
orgHierarchy.organizationHierarchy=storedData;
// add expended property to all the org with children directive needs it to work for 
// expandable and collapsable function
if(orgHierarchy.organizationHierarchy[0].children){
addExpandedProperty(orgHierarchy.organizationHierarchy[0].children,orgHierarchy.organizationHierarchy[0]);
}
}

if(!storedData)Loader.onFor(pageLoader);
// Loader.onFor(pageLoader)
API.cui.getOrganizationHierarchy({organizationId:orgHierarchy.stateParamsOrgId}).
done(function(res){
// Put hierarchy response in an array as the hierarchy directive expects an array
orgHierarchy.organizationHierarchy=[res];
DataStorage.setType('orgHierarchy',orgHierarchy.organizationHierarchy);
// add expended property to all the org with children directive needs it to work for 
// expandable and collapsable function
if(orgHierarchy.organizationHierarchy[0].children){
addExpandedProperty(orgHierarchy.organizationHierarchy[0].children,orgHierarchy.organizationHierarchy[0]);
}
}).
fail(function(err){
APIError.onFor(pageLoader,err);
}).
always(function(){
Loader.offFor(pageLoader);
$scope.$digest();
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */
/* */
orgHierarchy.goToOrgPrfile=function(org){
$state.go('organization.directory.orgDetails',{orgId:org.id});
};

orgHierarchy.toggleExpand=function(object){
object.expanded=!object.expanded;
var updateOrgChildren=function updateOrgChildren(orgs){
orgs.forEach(function(org){
if(org.id===object.id){
org.expanded=object.expanded;
return;
}
if(org.children){
updateOrgChildren(org.children);
}
});

if(true){};
};
updateOrgChildren(orgHierarchy.organizationHierarchy[0].children);
$scope.$digest();
};

orgHierarchy.toggleAll=function(toggleFlag){
orgHierarchy.expanded=!orgHierarchy.expanded;
var updateFlag=function updateFlag(orgs){
orgs.forEach(function(org){
if(org.children){
org.expanded=!toggleFlag;
updateFlag(org.children);
}
});
};
updateFlag(orgHierarchy.organizationHierarchy[0].children);
};
/* */
});

angular.module('organization').
controller('divisionCtrl',function(APIError,API,$scope,$state,$q,Base,$stateParams,User,$timeout,DataStorage){

var division=this;
division.sendInvitationError='';
var promises=[];
division.userSelectedOrg={};
division.userSelectedOrg.originalObject={};
division.userSelectedOrg.originalObject.name=User.user.organization.name;
division.userSelectedOrg.originalObject.id=User.user.organization.id;
division.stateParamsOrgId=User.user.organization.id;
//division.emailSubject='Register as an adminstrator within '

var storedData=DataStorage.getType('orgHierarchy',User.user.id);

if(storedData){
division.organizationHierarchyRoot=storedData;
division.organizationHierarchy=storedData[0].children;
var organizationList=[];
angular.forEach(division.organizationHierarchy,function(value){
var array={
"id":value.id,
"name":value.name[0].text};

organizationList.push(array);
});
division.organizationList=organizationList;
}else{
division.loader=true;
API.cui.getOrganizationHierarchy({organizationId:User.user.organization.id}).
done(function(res){
DataStorage.setType('orgHierarchy',[res],User.user.id);
var organizationList=[];
// Put hierarchy response in an array as the hierarchy directive expects an array
var storedDatas=DataStorage.getType('orgHierarchy',User.user.id);
division.organizationHierarchyRoot=storedDatas;
division.organizationHierarchy=storedDatas[0].children;

angular.forEach(division.organizationHierarchy,function(value){
var array={
"id":value.id,
"name":value.name[0].text};


organizationList.push(array);
});
division.organizationList=organizationList;
console.log(division.organizationList);

}).
fail(function(err){
APIError.onFor(pageLoader,err);
}).
always(function(){
division.loader=false;
$scope.$digest();
});
}


division.sendInvitation=function(){
var promises=[];
var validEmails=[];
division.emailAddressError=false;
division.sendInvitationError=false;
var EMAIL_REGEXP=/^[a-z0-9!#$%&*?_.-]+@[a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+[.][a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+/i;
division.emailArray=new Array();
division.emailArray=division.emailAddress.split(',');
angular.forEach(division.emailArray,function(email){
if(EMAIL_REGEXP.test(email)){
validEmails.push(email);
}
});
if(validEmails.length===division.emailArray.length){
division.loader=true;
angular.forEach(division.emailArray,function(email){
var opts={
"email":email,
"invitor":{
"id":User.user.id,
"type":"person"},

"targetOrganization":{
"id":division.userSelectedOrg.originalObject.id,
"type":"organization"}};


promises.push(API.cui.createOrgDivisionInvitation({data:opts}));
});

$q.all(promises).
then(function(res){
division.loader=false;
division.success=true;
division.sendInvitationError=false;
$timeout(function(){
$state.go('invitation.inviteSelect');
},3000);
}).
catch(function(error){
division.loader=false;
division.sendInvitationError=true;
});
}else{
division.emailAddressError=true;
}
};
division.goToOrgPrfile=function(org){
division.userSelectedOrg.originalObject={};
division.userSelectedOrg.originalObject.name=org.name[0].text;
division.userSelectedOrg.originalObject.id=org.id;
division.selectOrgFromList=false;
$scope.$digest();
};
division.goToOrg=function(){

};
});

angular.module('organization').
controller('tloCtrl',function(APIError,API,$scope,$state,$q,Base,$stateParams,User,$timeout){

var tlo=this;
tlo.sendInvitationError='';
var promises=[];
tlo.organization={};
tlo.organization.name=User.user.organization.name;
tlo.stateParamsOrgId=User.user.organization.id;
//tlo.emailSubject='Register as a new organization'

tlo.sendInvitation=function(){
var promises=[];
var validEmails=[];
tlo.emailAddressError=false;
tlo.sendInvitationError=false;
var EMAIL_REGEXP=/^[a-z0-9!#$%&*?_.-]+@[a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+[.][a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+/i;
tlo.emailArray=new Array();
tlo.emailArray=tlo.emailAddress.split(',');
angular.forEach(tlo.emailArray,function(email){
if(EMAIL_REGEXP.test(email)){
validEmails.push(email);
}
});
if(validEmails.length===tlo.emailArray.length){
tlo.loader=true;
angular.forEach(tlo.emailArray,function(email){
var opts={
"email":email,
"invitor":{
"id":User.user.id,
"type":"person"},

"targetOrganization":{
"id":User.user.organization.id,
"type":"organization"}};


promises.push(API.cui.createOrgCompanyInvitation({data:opts}));
});

$q.all(promises).
then(function(res){
tlo.loader=false;
tlo.success=true;
tlo.sendInvitationError=false;
$timeout(function(){
$state.go('invitation.inviteSelect');
},3000);
}).
catch(function(error){
tlo.loader=false;
tlo.sendInvitationError=true;
});
}else{
tlo.emailAddressError=true;
}
};
});

angular.module('organization').
controller('userCtrl',function(APIError,API,$scope,$state,$q,Base,$stateParams,User,$timeout,DataStorage){

var user=this;
user.sendInvitationError='';
var promises=[];
user.userSelectedOrg={};
user.userSelectedOrg.originalObject={};
user.userSelectedOrg.originalObject.name=User.user.organization.name;
user.userSelectedOrg.originalObject.id=User.user.organization.id;
user.stateParamsOrgId=User.user.organization.id;
//user.emailSubject='Register as a user to join '
user.selectOrgFromList=false;

var storedData=DataStorage.getType('orgHierarchy',User.user.id);

if(storedData){
user.organizationHierarchyRoot=storedData;
user.organizationHierarchy=storedData[0].children;
var organizationList=[];
angular.forEach(user.organizationHierarchy,function(value){
var array={
"id":value.id,
"name":value.name[0].text};

organizationList.push(array);
});
user.organizationList=organizationList;
}else{
user.loader=true;
API.cui.getOrganizationHierarchy({organizationId:User.user.organization.id}).
done(function(res){
DataStorage.setType('orgHierarchy',[res],User.user.id);
var organizationList=[];
var storedDatas=DataStorage.getType('orgHierarchy',User.user.id);
// Put hierarchy response in an array as the hierarchy directive expects an array
user.organizationHierarchyRoot=storedDatas;
user.organizationHierarchy=storedDatas[0].children;

angular.forEach(user.organizationHierarchy,function(value){
var array={
"id":value.id,
"name":value.name[0].text};


organizationList.push(array);
});
user.organizationList=organizationList;
}).
fail(function(err){
APIError.onFor(pageLoader,err);
}).
always(function(){
user.loader=false;
$scope.$digest();
});
}


user.customErrors={
email:{
email:function email(){
var EMAIL_REGEXP=/^[a-z0-9!#$%&*?_.-]+@[a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+[.][a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+/i;
if(user.email){
return EMAIL_REGEXP.test(user.email);
}else{
return true;
}
}}};



user.sendInvitation=function(){
var promises=[];
var validEmails=[];
user.emailAddressError=false;
user.sendInvitationError=false;
var EMAIL_REGEXP=/^[a-z0-9!#$%&*?_.-]+@[a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+[.][a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+/i;
user.emailArray=new Array();
user.emailArray=user.emailAddress.split(',');
angular.forEach(user.emailArray,function(email){
if(EMAIL_REGEXP.test(email)){
validEmails.push(email);
}
});
if(validEmails.length===user.emailArray.length){
user.loader=true;
angular.forEach(user.emailArray,function(email){
var opts={
"email":email,
"invitor":{
"id":User.user.id,
"type":"person"},

"targetOrganization":{
"id":user.userSelectedOrg.originalObject.id,
"type":"organization"}};


promises.push(API.cui.createPersonInvitation({data:opts}));
});

$q.all(promises).
then(function(res){
user.loader=false;
user.success=true;
user.sendInvitationError=false;
$timeout(function(){
$state.go('invitation.inviteSelect');
},3000);
}).
catch(function(error){
user.loader=false;
user.sendInvitationError=true;
});
}else{
user.emailAddressError=true;
}

};

user.goToOrgPrfile=function(org){
user.userSelectedOrg.originalObject={};
user.userSelectedOrg.originalObject.name=org.name[0].text;
user.userSelectedOrg.originalObject.id=org.id;
user.selectOrgFromList=false;
$scope.$digest();
};

});

angular.module('organization').
controller('orgProfileCtrl',function(DataStorage,Loader,Organization,User,$stateParams,$q,APIError){

var orgProfile=this;
var storedData=DataStorage.getType('orgProfile');
orgProfile.stateParamsOrgId=$stateParams.orgId;
var orgPromise=[];
if(User.user.organization.id===$stateParams.orgId){
orgProfile.organization=User.user.organization;
}else
{
// Organization is different than user's org, need to get fresh
Loader.onFor('orgProfile.init');
orgPromise.push(Organization.getOrganization($stateParams.orgId));
}


/* -------------------------------------------- ON LOAD START --------------------------------------------- */

if(storedData!==undefined){
orgProfile.securityAdmins=storedData.admins;
orgProfile.passwordPolicy=storedData.passwordPolicy;
orgProfile.authenticationPolicy=storedData.authenticationPolicy;
}else
Loader.onFor('orgProfile.init');
$q.all(orgPromise).
then(function(res){
if(orgPromise.length!==0){
orgProfile.organization=res[0];
}
Organization.initOrganizationProfile(orgProfile.organization.id,orgProfile.organization.passwordPolicy.id,orgProfile.organization.authenticationPolicy.id).
then(function(res){
orgProfile.securityAdmins=res.admins;
orgProfile.passwordPolicy=res.passwordPolicy;
orgProfile.authenticationPolicy=res.authenticationPolicy;
DataStorage.setType('orgProfile',res);
Loader.offFor('orgProfile.init');
}).
catch(function(err){
console.error("there was an error fetching additional org details"+err);
Loader.offFor('orgProfile.init');
APIError.onFor('orgProfile.init');
});
}).
catch(function(err){
console.error("there was an error fetching org details"+err);
Loader.offFor('orgProfile.init');
APIError.onFor('orgProfile.init');
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

});

angular.module('organization').
factory('NewGrant',function(DataStorage,API,$stateParams){
var newGrant={};
var newGrantsInStorage=void 0;
/*
        This Factory provides common platform to share common logic between granting an app to 
        User and Organization
    */
// Not handling package requests as not needed
newGrant.updateStorage=function(type,id,application){
var storageType=void 0;
if(type==="person")storageType='newGrant';else
storageType='newOrgGrant';
DataStorage.setType(storageType,{
id:id,
type:type,
applications:application});

// console.log(DataStorage.getType('newGrant'))
};

newGrant.pullFromStorage=function(scope,resourceId,type){
// const newGrantsInStorage = DataStorage.getDataThatMatches('newGrant', { userId: $stateParams.userID })
if(type==="person"){
newGrantsInStorage=DataStorage.getType('newGrant');
}else
{
newGrantsInStorage=DataStorage.getType('newOrgGrant');
}
if(newGrantsInStorage&&newGrantsInStorage.id==resourceId){
scope.appsBeingRequested=Object.assign({},newGrantsInStorage.applications);
scope.packagesBeingRequested=Object.assign({},newGrantsInStorage.packages);
}else
{
scope.packagesBeingRequested={};
scope.appsBeingRequested={};
}

scope.numberOfRequests=Object.keys(scope.appsBeingRequested).length+Object.keys(scope.packagesBeingRequested).length;

scope.applicationCheckbox=Object.keys(scope.appsBeingRequested).reduce(function(applications,appId){
applications[appId]=true;
return applications;
},{});

scope.packageCheckbox=Object.keys(scope.packagesBeingRequested).reduce(function(packages,appId){
packages[appId]=true;
return packages;
},{});

scope.requests={
application:scope.appsBeingRequested,
package:scope.packagesBeingRequested};

};

newGrant.claimGrants=function(id,type,packageRequestObject){
var claimGrants=[];

var buildPackageClaims=function buildPackageClaims(claimsObject){
if(Object.keys(claimsObject).length===0){
return undefined;
}// if there's no claims in this claim object
var packageClaims=[];
Object.keys(claimsObject).forEach(function(claimId){
if(Object.keys(claimsObject[claimId]).length===0){
return;
}// if no claimValues selected for that claimId
var claimValues=Object.keys(claimsObject[claimId]).reduce(function(claims,claimValueId){
claims.push({claimValueId:claimValueId});
return claims;
},[]);

packageClaims.push({
claimId:claimId,
claimValues:claimValues});

});
return packageClaims;
};

Object.keys(packageRequestObject).forEach(function(pkgId){
claimGrants.push({
data:{
grantee:{
id:id,
type:type},

servicePackage:{
id:pkgId,
type:'servicePackage'},

packageClaims:buildPackageClaims(packageRequestObject[pkgId].claims)}});


});

return claimGrants;
};

newGrant.packageGrants=function(id,type,packageRequestObject){
var packageGrants=[];
var index=0;
Object.keys(packageRequestObject).forEach(function(pkgId){
packageGrants.push({
packageId:pkgId,
data:{
version:'123',
status:'active',
grantee:{
id:id,
type:type},

servicePackage:{
id:pkgId,
type:'servicePackage'},

reason:packageRequestObject[pkgId].reason}});


if(type==='person'){
packageGrants[index].personId=id;
}else
{
packageGrants[index].organizationId=id;
}
index++;
});

return packageGrants;
};

return newGrant;
});
angular.module('organization').
controller('newGrantClaimsCtrl',function(API,APIHelpers,DataStorage,Loader,NewGrant,$stateParams,$q,$scope,$state,$timeout){

var newGrantClaims=this;
var loaderType='newGrantClaims.';
newGrantClaims.prevState={
params:{
userId:$stateParams.userId,
orgId:$stateParams.orgId},

name:"organization.directory.userDetails"};

newGrantClaims.packageRequests={};

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

NewGrant.pullFromStorage(newGrantClaims,$stateParams.userId,'person');
if(newGrantClaims.numberOfRequests===0){
$state.go('organization.requests.newGrantSearch',{userId:$stateParams.userId});
}
//For PopUp
newGrantClaims.appsBeingRequestedforPopup=angular.copy(newGrantClaims.appsBeingRequested);
//Keep only one app among all bundled apps
angular.forEach(newGrantClaims.appsBeingRequested,function(request){
if(request.bundledApps){
request.bundledApps.forEach(function(bundledApp){
if(newGrantClaims.appsBeingRequested[bundledApp.id]){
delete newGrantClaims.appsBeingRequested[bundledApp.id];
}
});
}
});
// get the claims for each app being requested
Object.keys(newGrantClaims.appsBeingRequested).forEach(function(appId,i){
var app=newGrantClaims.appsBeingRequested[appId];

if(!newGrantClaims.packageRequests[app.servicePackage.id]){
newGrantClaims.packageRequests[app.servicePackage.id]={
claims:{},
administratorRights:false};

}

Loader.onFor(loaderType+'claims'+i);

var opts={
qs:APIHelpers.getQs({
packageId:newGrantClaims.appsBeingRequested[appId].servicePackage.id})};



API.cui.getPackageClaims(opts).
then(function(res){
newGrantClaims['claims'+i]=Object.assign({},res);
res.forEach(function(claim){
newGrantClaims.packageRequests[app.servicePackage.id].claims[claim.claimId]={};
});
Loader.offFor(loaderType+'claims'+i);
$scope.$digest();
}).
fail(function(err){
// claims endpoint throws an error when the package has no claims
newGrantClaims['claims'+i]=[];
Loader.offFor(loaderType+'claims'+i);
$scope.$digest();
});
});

Loader.onFor(loaderType+'user');
API.cui.getPerson({personId:$stateParams.userId}).
then(function(res){
newGrantClaims.user=Object.assign({},res);
Loader.offFor(loaderType+'user');
$scope.$digest();
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */

newGrantClaims.submit=function(){
Loader.onFor(loaderType+'submit');
var claimsPromises=[];
// Grant Packages
$q.all(NewGrant.packageGrants($stateParams.userId,'person',newGrantClaims.packageRequests).map(function(opts){return API.cui.grantPersonPackage(opts);})).
then(function(res){
// grant claims
var claimsData=NewGrant.claimGrants($stateParams.userId,'person',newGrantClaims.packageRequests);
claimsData.forEach(function(claimData){
if(claimData.data.packageClaims&&claimData.data.packageClaims.length!==0){
claimsPromises.push(API.cui.grantClaims(claimData));
}
});
return $q.all(claimsPromises);
}).
then(function(res){
Loader.offFor(loaderType+'submit');
newGrantClaims.success=true;
DataStorage.setType('newGrant',{});
$timeout(function(){
$state.go('organization.directory.userList',{userId:$stateParams.userId,orgId:$stateParams.orgId});
},3000);
}).
catch(function(err){
Loader.offFor(loaderType+'submit');
newGrantClaims.error=true;
});
};

/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('newGrantCtrl',function(API,$stateParams,$scope,$state,$filter,Loader,DataStorage,NewGrant){

var newGrant=this;
newGrant.prevState={
params:{
userId:$stateParams.userId,
orgId:$stateParams.orgId},

name:"organization.directory.userDetails"

// HELPER FUNCTIONS START ------------------------------------------------------------------------
// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------
};newGrant.searchType='applications';

/****
        grants in DataStorage are under the type 'newGrant' and look like

        [
            {
                userId:<user for which the grant is being made>,
                applications:<array of applications being granted>,
                packages:<array of packages being granted>
            }
        ]
    ****/
NewGrant.pullFromStorage(newGrant,$stateParams.userId,'person');
Loader.onFor('newGrant.user');
API.cui.getPerson({personId:$stateParams.userId}).
then(function(res){
newGrant.user=Object.assign({},res);
Loader.offFor('newGrant.user');
$scope.$digest();
});

Loader.onFor('newGrant.categories');
API.cui.getCategories().
then(function(res){
newGrant.categories=res.slice();
Loader.offFor('newGrant.categories');
$scope.$digest();
}).
fail(function(err){
Loader.offFor('newGrant.categories');
newGrant.categoryError=true;
$scope.$digest();
});

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

newGrant.searchCallback=function(opts){
if(!opts){
$state.go('organization.requests.newGrantSearch',{type:newGrant.searchType,userId:$stateParams.userId,orgId:$stateParams.orgId});
}else if(typeof opts==='string'){
$state.go('organization.requests.newGrantSearch',{type:newGrant.searchType,userId:$stateParams.userId,orgId:$stateParams.orgId,name:opts});
}else{
var optsParser={
category:function category(unparsedCategory){
var category=$filter('cuiI18n')(unparsedCategory);
$state.go('organization.requests.newGrantSearch',{type:newGrant.searchType,userId:$stateParams.userId,orgId:$stateParams.orgId,category:category});
}};

optsParser[opts.type](opts.value);
}
};

newGrant.goToClaimSelection=function(){
$state.go('organization.requests.newGrantClaims',{userId:$stateParams.userId,orgId:$stateParams.orgId});
};
// ON CLICK END ----------------------------------------------------------------------------------

});

angular.module('organization').
controller('newGrantSearchCtrl',function($scope,$state,$stateParams,API,DataStorage,Loader,$pagination,APIHelpers,NewGrant,$q){
var newGrantSearch=this;
newGrantSearch.prevState={
params:{
userId:$stateParams.userId,
orgId:$stateParams.orgId},

name:"organization.directory.userDetails"


// HELPER FUNCTIONS START ------------------------------------------------------------------------

// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

/****
        grants in DataStorage are under the type 'newGrant' and look like

        [
            {
                userId:<user for which the grant is being made>,
                applications:<object of applications being granted>,
                packages:<object of packages being granted>
            }
        ]
    ****/};

NewGrant.pullFromStorage(newGrantSearch,$stateParams.userId,'person');

Loader.onFor('newGrantSearch.user');
API.cui.getPerson({personId:$stateParams.userId}).
then(function(res){
newGrantSearch.user=Object.assign({},res);
Loader.offFor('newGrantSearch.user');
$scope.$digest();
}).
fail(function(err){
console.error("There was an error in fetching user details"+err);
Loader.offFor('newGrantSearch.user');
$scope.$digest();
});

var searchUpdate=function searchUpdate(_ref9){var previouslyLoaded=_ref9.previouslyLoaded;
Loader.onFor('newGrantSearch.apps');
if(!previouslyLoaded){
newGrantSearch.search=Object.assign({},$stateParams);
}

var type=newGrantSearch.search.type||'applications';

var queryParams={
'service.name':newGrantSearch.search.name,
'service.category':newGrantSearch.search.category,
page:newGrantSearch.search.page||1,
pageSize:newGrantSearch.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0],
sortBy:newGrantSearch.search.sortBy};


var queryArray=APIHelpers.getQs(queryParams);

var queryOptions={
personId:$stateParams.userId,
qs:queryArray};


if(type==='applications'){
// TODO: REPLACE WITH REAL COUNT
$q.all([API.cui.getPersonGrantableCount(queryOptions),API.cui.getPersonGrantableApps(queryOptions)]).
then(function(res){
newGrantSearch.applicationList=res[1].slice();
newGrantSearch.count=res[0];
if(newGrantSearch.reRenderPaginate){
newGrantSearch.reRenderPaginate();
}
Loader.offFor('newGrantSearch.apps');
}).
catch(function(err){
console.error('There was an error fetching grantable apps or/and its count'+err);
Loader.offFor('newGrantSearch.apps');
newGrantSearch.grantableAppsError=true;
});
}
};

searchUpdate({
previouslyLoaded:false});


// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

newGrantSearch.toggleRequest=function(_ref10){var type=_ref10.type,payload=_ref10.payload;
if(payload){
var storedRequests=newGrantSearch.requests[type];
storedRequests[payload.id]?delete storedRequests[payload.id]:storedRequests[payload.id]=payload;
if(storedRequests[payload.id]){
newGrantSearch[type+'Checkbox'][payload.id]=true;
}else if(newGrantSearch[type+'Checkbox'][payload.id]){
delete newGrantSearch[type+'Checkbox'][payload.id];
}
newGrantSearch.numberOfRequests=Object.keys(newGrantSearch.applicationCheckbox).length+Object.keys(newGrantSearch.packageCheckbox).length;
NewGrant.updateStorage('person',$stateParams.userId,newGrantSearch.requests.application);
}
};

newGrantSearch.updateSearch=function(){
var stateParams=Object.assign({},newGrantSearch.search);
$state.transitionTo('organization.requests.newGrantSearch',stateParams,{notify:false});
searchUpdate({
previouslyLoaded:true});

};

newGrantSearch.goToClaimSelection=function(){
$state.go('organization.requests.newGrantClaims',{userId:$stateParams.userId,orgId:$stateParams.orgId});
};

//select parent if it is a child, deselect child if it is a parent
newGrantSearch.checkRelatedAppsBody=function(relatedApp){
newGrantSearch.toggleRequest(_.find(newGrantSearch.list,{id:relatedApp.id}));
newGrantSearch.checkRelatedAndBundledApps(_.find(newGrantSearch.list,{id:relatedApp.id}));
};

//deselect child if it is a parent, select parent if it is a child 
newGrantSearch.checkRelatedAndBundledApps=function(type,application){
var storedRequests=newGrantSearch.requests[type];
//if unchecked the checkbox
if(!storedRequests[application.id]){
//if it is a parent then then deselect childs
if(!application.servicePackage.parent){
application.relatedApps&&application.relatedApps.forEach(function(relatedApp){
// if (newGrantSearch[type + 'Checkbox'][relatedApp.id]) {
// newGrantSearch[type + 'Checkbox'][relatedApp.id]=!newGrantSearch[type + 'Checkbox'][relatedApp.id]
newGrantSearch.toggleRequest({type:'application',payload:_.find(newGrantSearch.applicationList,{id:relatedApp.id})});
// }
});
}
newGrantSearch.checkBundledApps(application,false);
}else{
if(application.servicePackage.parent){
//Need to select the other parent(if it has any) If user clicks on expandabel title
newGrantSearch.applicationList.forEach(function(app){
//if it is a parent and parent of selected app
if(!app.servicePackage.parent&&app.servicePackage.id===application.servicePackage.parent.id&&!newGrantSearch['applicationCheckbox'][app.id]){
newGrantSearch['applicationCheckbox'][app.id]=!newGrantSearch['applicationCheckbox'][app.id];
newGrantSearch.toggleRequest({type:'application',payload:app});
}
});
}
newGrantSearch.checkBundledApps(application,true);
}
};

newGrantSearch.checkBundledApps=function(application,check){
if(application.bundledApps){
application.bundledApps.forEach(function(bundledApp){
// newGrantSearch['applicationCheckbox'][bundledApp.id]=check
newGrantSearch.toggleRequest({type:'application',payload:_.find(newGrantSearch.applicationList,{id:bundledApp.id})});
});
}
};
// ON CLICK END ----------------------------------------------------------------------------------
});

angular.module('organization').
controller('newOrgGrantClaimsCtrl',function(API,APIHelpers,DataStorage,Loader,NewGrant,$stateParams,$q,$scope,$state,$timeout){

var newOrgGrantClaims=this;
var loaderType='newOrgGrantClaims.';
newOrgGrantClaims.prevState={
params:{
orgId:$stateParams.orgId}};


if(API.user.organization.id===$stateParams.orgId){
newOrgGrantClaims.prevState.name="organization.applications";
}else
{
newOrgGrantClaims.prevState.name="organization.directory.orgDetails";
}
newOrgGrantClaims.packageRequests={};

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

NewGrant.pullFromStorage(newOrgGrantClaims,$stateParams.orgId,'organization');
if(newOrgGrantClaims.numberOfRequests===0){
$state.go('organization.requests.newOrgGrantSearch',{orgId:$stateParams.orgId});
}
//For PopUp
newOrgGrantClaims.appsBeingRequestedforPopup=angular.copy(newOrgGrantClaims.appsBeingRequested);
//Keep only one app among all bundled apps
angular.forEach(newOrgGrantClaims.appsBeingRequested,function(request){
if(request.bundledApps){
request.bundledApps.forEach(function(bundledApp){
if(newOrgGrantClaims.appsBeingRequested[bundledApp.id]){
delete newOrgGrantClaims.appsBeingRequested[bundledApp.id];
}
});
}
});
// get the claims for each app being requested
Object.keys(newOrgGrantClaims.appsBeingRequested).forEach(function(appId,i){
var app=newOrgGrantClaims.appsBeingRequested[appId];

if(!newOrgGrantClaims.packageRequests[app.servicePackage.id]){
newOrgGrantClaims.packageRequests[app.servicePackage.id]={
claims:{},
administratorRights:false};

}

Loader.onFor(loaderType+'claims'+i);

// const opts = {
//     qs: APIHelpers.getQs({
//         packageId: newOrgGrantClaims.appsBeingRequested[appId].servicePackage.id
//     })
// }

// API.cui.getPackageClaims(opts)
// .then(res => {
//     newOrgGrantClaims['claims' + i] = Object.assign({}, res)
//     res.forEach(claim => {
//         newOrgGrantClaims.packageRequests[app.servicePackage.id].claims[claim.claimId] = {}
//     })
//     Loader.offFor(loaderType + 'claims' + i)
//     $scope.$digest()
// })
// .fail(err => { 
//     // claims endpoint throws an error when the package has no claims
//     newOrgGrantClaims['claims' + i] = []
//     Loader.offFor(loaderType + 'claims' + i)
//     $scope.$digest()
// })
});

Loader.onFor(loaderType+'org');
API.cui.getOrganization({organizationId:$stateParams.orgId}).
then(function(res){
newOrgGrantClaims.org=Object.assign({},res);
Loader.offFor(loaderType+'org');
$scope.$digest();
});

/* --------------------------------------------- ON LOAD END ---------------------------------------------- */

/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */

newOrgGrantClaims.submit=function(){
Loader.onFor(loaderType+'submit');
newOrgGrantClaims.success=false;
var claimsPromises=[];
// Grant Packages
$q.all(NewGrant.packageGrants($stateParams.orgId,'organization',newOrgGrantClaims.packageRequests).map(function(opts){return API.cui.grantOrganizationPackage(opts);}))
// .then(res => {
//     // grant claims
//     let claimsData=NewGrant.claimGrants($stateParams.orgId ,'organization', newOrgGrantClaims.packageRequests)
//     claimsData.forEach(claimData => {
//         if(claimData.data.packageClaims&&claimData.data.packageClaims.length!==0){
//             claimsPromises.push(API.cui.grantClaims(claimData))
//         }
//     })
//     return $q.all(claimsPromises)
// })
.then(function(res){
Loader.offFor(loaderType+'submit');
newOrgGrantClaims.success=true;
DataStorage.setType('newOrgGrant',{});
$timeout(function(){
$state.go('organization.applications',{orgId:$stateParams.orgId});
},3000);
}).
catch(function(err){
Loader.offFor(loaderType+'submit');
newOrgGrantClaims.error=true;
});
};

/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('newOrgGrantCtrl',function(API,$stateParams,$scope,$state,$filter,Loader,DataStorage,NewGrant){

var newOrgGrant=this;
newOrgGrant.prevState={
params:{
orgId:$stateParams.orgId}};


if(API.user.organization.id===$stateParams.orgId){
newOrgGrant.prevState.name="organization.applications";
}else
{
newOrgGrant.prevState.name="organization.directory.orgDetails";
}

// HELPER FUNCTIONS START ------------------------------------------------------------------------
// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

newOrgGrant.searchType='applications';

/****
        grants in DataStorage are under the type 'newGrant' and look like

        [
            {
                id:<user/org for which the grant is being made>,
                applications:<array of applications being granted>,
                packages:<array of packages being granted>
                type:person or organiztion
            }
        ]
    ****/
NewGrant.pullFromStorage(newOrgGrant,$stateParams.orgId,'organization');
Loader.onFor('newOrgGrant.org');
API.cui.getOrganization({organizationId:$stateParams.orgId}).
then(function(res){
newOrgGrant.org=Object.assign({},res);
Loader.offFor('newOrgGrant.org');
$scope.$digest();
});

Loader.onFor('newOrgGrant.categories');
API.cui.getCategories().
then(function(res){
newOrgGrant.categories=res.slice();
Loader.offFor('newOrgGrant.categories');
$scope.$digest();
}).
fail(function(err){
Loader.offFor('newOrgGrant.categories');
newOrgGrant.categoryError=true;
$scope.$digest();
});

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

newOrgGrant.searchCallback=function(opts){
if(!opts){
$state.go('organization.requests.newOrgGrantSearch',{type:newOrgGrant.searchType,orgId:$stateParams.orgId});
}else if(typeof opts==='string'){
$state.go('organization.requests.newOrgGrantSearch',{type:newOrgGrant.searchType,orgId:$stateParams.orgId,name:opts});
}else{
var optsParser={
category:function category(unparsedCategory){
var category=$filter('cuiI18n')(unparsedCategory);
$state.go('organization.requests.newOrgGrantSearch',{type:newOrgGrant.searchType,orgId:$stateParams.orgId,category:category});
}};

optsParser[opts.type](opts.value);
}
};

newOrgGrant.goToClaimSelection=function(){
$state.go('organization.requests.newOrgGrantClaims',{orgId:$stateParams.orgId});
};
// ON CLICK END ----------------------------------------------------------------------------------

});

angular.module('organization').
controller('newOrgGrantSearchCtrl',function($scope,$state,$stateParams,API,DataStorage,Loader,$pagination,APIHelpers,NewGrant,$q,APIError){
var newOrgGrantSearch=this;
newOrgGrantSearch.prevState={
params:{
orgId:$stateParams.orgId}};



if(API.user.organization.id===$stateParams.orgId){
newOrgGrantSearch.prevState.name="organization.applications";
}else
{
newOrgGrantSearch.prevState.name="organization.directory.orgDetails";
}
// HELPER FUNCTIONS START ------------------------------------------------------------------------

// const updateStorage = () => {
//     DataStorage.setType('newOrgGrant', {
//         id: $stateParams.orgId,
//         type:'organization',
//         applications: newOrgGrantSearch.requests.application,
//         packages: newOrgGrantSearch.requests.package
//     })
//     console.log(DataStorage.getType('newOrgGrant'))
// };

var updateViewList=function updateViewList(list){
var deferred=$q.defer();
newOrgGrantSearch.viewList=[];
var qs=[];
var apiPromises=[];
angular.forEach(list,function(app,parentIndex){
// Child App and Parent app requested by user
if(app.servicePackage.parent&&app.relatedApps){
var flag=false;
angular.forEach(app.relatedApps,function(realtedApp,index){
if(_.find(list,{id:realtedApp.id})){
flag=true;
}else
{
qs.push(['service.id',realtedApp.id]);
}
if(index===app.relatedApps.length-1&&qs.length!==0){
apiPromises.push(API.cui.getPersonRequestableApps({personId:API.getUser(),qs:qs}));
qs=[];
}
});
}else
{
newOrgGrantSearch.viewList.push(app);
}
});
$q.all(apiPromises).
then(function(res){
angular.forEach(res,function(app){var _newOrgGrantSearch$vi,_newOrgGrantSearch$li;
if(newOrgGrantSearch.search.name){
app[0].expanded=true;
}
(_newOrgGrantSearch$vi=newOrgGrantSearch.viewList).push.apply(_newOrgGrantSearch$vi,_toConsumableArray(app));
(_newOrgGrantSearch$li=newOrgGrantSearch.list).push.apply(_newOrgGrantSearch$li,_toConsumableArray(app));
});
deferred.resolve();
}).
catch(function(err){
console.log("There was an error loading parent requestable apps");
deferred.reject(err);
});
return deferred.promise;
};

// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

/****
        grants in DataStorage are under the type 'newGrant' and look like

        [
            {
                id:<user/org for which the grant is being made>,
                applications:<object of applications being granted>,
                packages:<object of packages being granted>
                type:<person or org>
            }
        ]
    ****/

NewGrant.pullFromStorage(newOrgGrantSearch,$stateParams.orgId,'organization');

Loader.onFor('newOrgGrantSearch.org');
API.cui.getOrganization({organizationId:$stateParams.orgId}).
then(function(res){
newOrgGrantSearch.org=Object.assign({},res);
Loader.offFor('newOrgGrantSearch.org');
$scope.$digest();
}).
fail(function(err){
console.error('There was an error retreiving organization details '+err);
Loader.offFor('newOrgGrantSearch.org');
$scope.$digest();
});

var searchUpdate=function searchUpdate(_ref11){var previouslyLoaded=_ref11.previouslyLoaded;
Loader.onFor('newOrgGrantSearch.apps');
if(!previouslyLoaded){
newOrgGrantSearch.search=Object.assign({},$stateParams);
}

var type=newOrgGrantSearch.search.type||'applications';

var queryParams={
'service.name':newOrgGrantSearch.search.name,
'service.category':newOrgGrantSearch.search.category,
page:newOrgGrantSearch.search.page||1,
pageSize:newOrgGrantSearch.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0],
sortBy:newOrgGrantSearch.search.sortBy};


var queryArray=APIHelpers.getQs(queryParams);

var queryOptions={
organizationId:$stateParams.orgId,
qs:queryArray};


if(type==='applications'){
// TODO: REPLACE WITH REAL COUNT
$q.all([API.cui.getOrganizationGrantableCount(queryOptions),API.cui.getOrganizationGrantableApps(queryOptions)]).
then(function(res){
newOrgGrantSearch.applicationList=res[1].slice();
newOrgGrantSearch.count=res[0];
if(newOrgGrantSearch.reRenderPaginate){
newOrgGrantSearch.reRenderPaginate();
}
updateViewList(res[1]).
then(function(){
Loader.offFor('newOrgGrantSearch.apps');
});
}).
catch(function(err){
console.error("There was an error in retreiving grantable apps. "+err);
APIError.onFor('newOrgGrantSearch.apps');
Loader.offFor('newOrgGrantSearch.apps');
});
}
};

searchUpdate({
previouslyLoaded:false});


// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

newOrgGrantSearch.toggleRequest=function(_ref12){var type=_ref12.type,payload=_ref12.payload;
if(payload){
var storedRequests=newOrgGrantSearch.requests[type];
storedRequests[payload.id]?delete storedRequests[payload.id]:storedRequests[payload.id]=payload;
if(storedRequests[payload.id]){
newOrgGrantSearch[type+'Checkbox'][payload.id]=true;
}else if(newOrgGrantSearch[type+'Checkbox'][payload.id]){
delete newOrgGrantSearch[type+'Checkbox'][payload.id];
}
newOrgGrantSearch.numberOfRequests=Object.keys(newOrgGrantSearch.applicationCheckbox).length+Object.keys(newOrgGrantSearch.packageCheckbox).length;

NewGrant.updateStorage('organization',$stateParams.orgId,newOrgGrantSearch.requests.application);
}
};

newOrgGrantSearch.updateSearch=function(){
var stateParams=Object.assign({},newOrgGrantSearch.search);
$state.transitionTo('organization.requests.newOrgGrantSearch',stateParams,{notify:false});
searchUpdate({
previouslyLoaded:true});

};

newOrgGrantSearch.goToClaimSelection=function(){
$state.go('organization.requests.newOrgGrantClaims',{orgId:$stateParams.orgId});
};

//select parent if it is a child, deselect child if it is a parent
newOrgGrantSearch.checkRelatedAppsBody=function(relatedApp){
newOrgGrantSearch.toggleRequest(_.find(newOrgGrantSearch.list,{id:relatedApp.id}));
newOrgGrantSearch.checkRelatedAndBundledApps(_.find(newOrgGrantSearch.list,{id:relatedApp.id}));
};

//deselect child if it is a parent, select parent if it is a child 
newOrgGrantSearch.checkRelatedAndBundledApps=function(type,application){
var storedRequests=newOrgGrantSearch.requests[type];
//if unchecked the checkbox
if(!storedRequests[application.id]){
//if it is a parent then then deselect childs
if(!application.servicePackage.parent){
application.relatedApps&&application.relatedApps.forEach(function(relatedApp){
// if (newOrgGrantSearch[type + 'Checkbox'][relatedApp.id]) {
// newOrgGrantSearch[type + 'Checkbox'][relatedApp.id]=!newOrgGrantSearch[type + 'Checkbox'][relatedApp.id]
newOrgGrantSearch.toggleRequest({type:'application',payload:_.find(newOrgGrantSearch.applicationList,{id:relatedApp.id})});
// }
});
}
newOrgGrantSearch.checkBundledApps(application,false);
}else{
if(application.servicePackage.parent){
//Need to select the other parent(if it has any) If user clicks on expandabel title
newOrgGrantSearch.applicationList.forEach(function(app){
//if it is a parent and parent of selected app
if(!app.servicePackage.parent&&app.servicePackage.id===application.servicePackage.parent.id&&!newOrgGrantSearch['applicationCheckbox'][app.id]){
newOrgGrantSearch['applicationCheckbox'][app.id]=!newOrgGrantSearch['applicationCheckbox'][app.id];
newOrgGrantSearch.toggleRequest({type:'application',payload:app});
}
});
}
newOrgGrantSearch.checkBundledApps(application,true);
}
};

newOrgGrantSearch.checkBundledApps=function(application,check){
if(application.bundledApps){
application.bundledApps.forEach(function(bundledApp){
// newOrgGrantSearch['applicationCheckbox'][bundledApp.id]=check
newOrgGrantSearch.toggleRequest({type:'application',payload:_.find(newOrgGrantSearch.applicationList,{id:bundledApp.id})});
});
}
};
// ON CLICK END ----------------------------------------------------------------------------------
});

angular.module('organization').
controller('orgAppRequestsCtrl',
function($timeout,$filter,$pagination,$state,$stateParams,API,APIError,APIHelpers,CuiMobileNavFactory,Loader,User,DataStorage){

var scopeName='orgAppRequests.';
var orgAppRequests=this;
orgAppRequests.search={};
orgAppRequests.sortBy={};

orgAppRequests.search=Object.assign({},$stateParams);
if(!orgAppRequests.search.page)
orgAppRequests.search.page=1;

/* -------------------------------------------- ON LOAD START --------------------------------------------- */

var foundOrgs=[];
var foundPersons=[];
var foundPackages=[];


var init=function init(){
cui.log('init');

orgAppRequests.search['isApprovable']=true;
orgAppRequests.search.pageSize=orgAppRequests.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
var qsArray=APIHelpers.getQs(orgAppRequests.search);

orgAppRequests.data=[];
Loader.onFor(scopeName+'data');
APIError.offFor(scopeName+'data');


var getOrg=function getOrg(orgId){
return $.Deferred(function(dfr){
if(orgId.length){
var cached=_.find(foundOrgs,{id:orgId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getOrganizationSecured({organizationId:orgId}).then(function(org){
foundOrgs.push(org);
//cui.log('org pushed', org, foundOrgs);
dfr.resolve(org);
}).fail(function(err){
cui.log('getOrg error',orgId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var getPerson=function getPerson(personId){
return $.Deferred(function(dfr){
if(personId.length){
var cached=_.find(foundPersons,{id:personId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getPerson({personId:personId}).then(function(person){
foundPersons.push(person);
dfr.resolve(person);
}).fail(function(err){
cui.log('getPerson error',personId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var getPackage=function getPackage(packageId){
return $.Deferred(function(dfr){
if(packageId.length){
var cached=_.find(foundPackages,{id:packageId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getPackage({packageId:packageId}).then(function(pkg){
var p={id:pkg.id,name:pkg.name[0].text};
foundPackages.push(p);
dfr.resolve(p);
}).fail(function(err){
cui.log('getPackage error',packageId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var done=function done(context){
$timeout(function(){
Loader.offFor(scopeName+'data');
cui.log('done',context);
cui.log('data',orgAppRequests.data);

orgAppRequests.reRenderPagination&&orgAppRequests.reRenderPagination();
});
};

/*qsArray.push(['requestor.type','organization'])getPackageRequests*/
qsArray.push(['requestor.id',User.user.organization.id]);
API.cui.retriveOrgPendingApps({qs:['requestor.id',User.user.organization.id]}).then(function(res){
var calls=[];

_.each(res,function(pkgReq){

// NB create an obj and bind it to scope...
var data=pkgReq;
orgAppRequests.data.push(data);

// ..then cache the calls, which populate obj asynchronously...
calls.push(
getPerson(pkgReq.creator).then(function(person){
data.personData=person||{};
var pkgId=pkgReq&&pkgReq.servicePackage?pkgReq.servicePackage.id:'';
return getPackage(pkgId);
}).then(function(pkg){
data.packageData=pkg;
var orgId=pkgReq.requestor.id;
return getOrg(orgId);
}).then(function(org){
if(!data.personData.organization){
data.personData.organization={};
}
data.personData.organization.name=!_.isEmpty(org)?org.name:'';
return $.Deferred().resolve();
}).fail(function(){
// mute the failures so as not to derail the entire list
return $.Deferred().resolve();
}));

});
return $.Deferred().resolve(calls);
}).then(function(calls){
// do the cached calls
return $.when.apply($,calls);
}).then(function(){
// do the count (used for pagination)
return API.cui.getPackageRequestsCount();
}).then(function(count){
// apply the count
orgAppRequests.userCount=count;
API.user.orgAppRequestsCount=count;
return $.Deferred().resolve();
}).fail(function(error){
APIError.onFor(scopeName+'data');
}).always(function(){
CuiMobileNavFactory.setTitle($filter('cuiI18n')('App Requests'));
done('finally');
});
};

init();
/* --------------------------------------------- ON LOAD END ---------------------------------------------- */


/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */
orgAppRequests.sortingCallbacks={
administrator:function administrator(){
orgAppRequests.sortBy.sortBy='administrator';
orgAppRequests.sort(['personData.name.given','personData.name.surname'],orgAppRequests.sortBy.sortType);
},
submitted:function submitted(){
orgAppRequests.sortBy.sortBy='submitted';
orgAppRequests.sort('personData.creation',orgAppRequests.sortBy.sortType);
},
request:function request(){
orgAppRequests.sortBy.sortBy='request';
orgAppRequests.sort('packageData.name',orgAppRequests.sortBy.sortType);
},
organization:function organization(){
orgAppRequests.sortBy.sortBy='organization';
orgAppRequests.sort('personData.organization.name',orgAppRequests.sortBy.sortType);
}};


orgAppRequests.sort=function(sortBy,order){
cui.log('sort',sortBy,order);
orgAppRequests.data=_.orderBy(orgAppRequests.data,sortBy,order);
};

orgAppRequests.goToDetails=function(request){
if(request.personData&&request.personData.id&&
request.personData.organization&&request.personData.organization.id&&
request.packageData&&request.packageData.id){
DataStorage.setType('organizationAppRequest',request);
$state.go('organization.requests.organizationAppRequest',{
'userId':request.personData.id,
'orgId':request.personData.organization.id,
'packageId':request.packageData.id});

}else{
cui.log('orgAppRequests goToDetails missing keys',request);
}
};

orgAppRequests.updateSearchParams=function(page){
if(page)orgAppRequests.search.page=page;
$state.transitionTo('organization.requests.orgAppRequests',orgAppRequests.search,{notify:false});
init();
};
/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('orgRegistrationRequestsCtrl',
function($timeout,$filter,$pagination,$state,$stateParams,API,APIError,APIHelpers,CuiMobileNavFactory,Loader,User,DataStorage){

var scopeName='orgRegistrationRequests.';
var orgRegistrationRequests=this;
orgRegistrationRequests.search={};
orgRegistrationRequests.sortBy={};

orgRegistrationRequests.search=Object.assign({},$stateParams);
if(!orgRegistrationRequests.search.page)
orgRegistrationRequests.search.page=1;

/* -------------------------------------------- ON LOAD START --------------------------------------------- */
var foundOrgs=[];
var foundPersons=[];
var foundPackages=[];


var init=function init(){
cui.log('init');

orgRegistrationRequests.search.pageSize=orgRegistrationRequests.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
var qsArray=APIHelpers.getQs(orgRegistrationRequests.search);
//cui.log('qsArray', qsArray);

orgRegistrationRequests.data=[];
Loader.onFor(scopeName+'data');
APIError.offFor(scopeName+'data');

var getOrg=function getOrg(orgId){
return $.Deferred(function(dfr){
if(orgId.length){
var cached=_.find(foundOrgs,{id:orgId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getOrganizationSecured({organizationId:orgId}).then(function(org){
foundOrgs.push(org);
//cui.log('org pushed', org, foundOrgs);
dfr.resolve(org);
}).fail(function(err){
cui.log('getOrg error',orgId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var getPerson=function getPerson(personId){
return $.Deferred(function(dfr){
if(personId&&personId.length){
var cached=_.find(foundPersons,{id:personId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getPerson({personId:personId}).then(function(person){
foundPersons.push(person);
dfr.resolve(person);
}).fail(function(err){
cui.log('getPerson error',personId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var getPackage=function getPackage(packageId){
return $.Deferred(function(dfr){
if(packageId.length){
var cached=_.find(foundPackages,{id:packageId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getPackage({packageId:packageId}).then(function(pkg){
var p={id:pkg.id,name:pkg.name[0].text};
foundPackages.push(p);
dfr.resolve(p);
}).fail(function(err){
cui.log('getPackage error',packageId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var done=function done(context){
$timeout(function(){
Loader.offFor(scopeName+'data');
cui.log('done',context);
cui.log('data',orgRegistrationRequests.data);

orgRegistrationRequests.reRenderPagination&&orgRegistrationRequests.reRenderPagination();
});
};

var start=window.performance.now();
var end;
API.cui.getOrgRegistrationRequests({qs:qsArray}).
then(function(res){
var calls=[];
_.each(res,function(regReq){
//Needed as some requests will not contain security admin details
//And they need to be removed
if(regReq.registrant){
// NB create an obj and bind it to scope...
var data=regReq;
orgRegistrationRequests.data.push(data);

// ..then cache the calls, which populate obj asynchronously...
calls.push(
getPerson(regReq.registrant&&regReq.registrant.id).
then(function(person){
data.personData=person||{};
var pkgId=!_.isEmpty(regReq.packages)?regReq.packages[0].id:'';
return getPackage(pkgId);
}).
then(function(pkg){
data.packageData=pkg;
var orgId=data.personData&&data.personData.organization?data.personData.organization.id:'';
return getOrg(orgId);
}).
then(function(org){
if(!data.personData.organization){
data.personData.organization={};
}
data.personData.organization.name=!_.isEmpty(org)?org.name:'';
return $.Deferred().resolve();
}).
fail(function(){
// mute the failures so as not to derail the entire list
return $.Deferred().resolve();
}));

}
});
return $.Deferred().resolve(calls);
}).
then(function(calls){
// do the cached calls
return $.when.apply($,calls);
}).
then(function(){
// do the count (used for pagination)
return API.cui.getOrgRegistrationRequestsCount();
}).
then(function(count){
// apply the count
orgRegistrationRequests.userCount=count;
API.user.orgRegistrationRequestsCount=count;
return $.Deferred().resolve();
}).
fail(function(error){
APIError.onFor(scopeName+'data');
}).
always(function(){
CuiMobileNavFactory.setTitle($filter('cuiI18n')('Registration Requests'));
done('finally');
var end=window.performance.now();
var time=end-start;
cui.log('time',time);
});
};

init();
/* --------------------------------------------- ON LOAD END ---------------------------------------------- */


/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */
orgRegistrationRequests.sortingCallbacks={
administrator:function administrator(){
orgRegistrationRequests.sortBy.sortBy='administrator';
orgRegistrationRequests.sort(['personData.name.given','personData.name.surname'],orgRegistrationRequests.sortBy.sortType);
},
submitted:function submitted(){
orgRegistrationRequests.sortBy.sortBy='submitted';
orgRegistrationRequests.sort('personData.creation',orgRegistrationRequests.sortBy.sortType);
},
request:function request(){
orgRegistrationRequests.sortBy.sortBy='request';
orgRegistrationRequests.sort('packageData.name',orgRegistrationRequests.sortBy.sortType);
},
organization:function organization(){
orgRegistrationRequests.sortBy.sortBy='organization';
orgRegistrationRequests.sort('personData.organization.name',orgRegistrationRequests.sortBy.sortType);
}};


orgRegistrationRequests.sort=function(sortBy,order){
cui.log('sort',sortBy,order);
orgRegistrationRequests.data=_.orderBy(orgRegistrationRequests.data,sortBy,order);
};


orgRegistrationRequests.goToDetails=function(request){
if(request.personData&&request.personData.id&&
request.personData.organization&&request.personData.organization.id){
DataStorage.setType('organizationRegRequest',request);
$state.go('organization.requests.organizationRequest',{
'userId':request.personData.id,
'orgId':request.personData.organization.id});

}else{
cui.log('orgRegistrationRequests goToDetails missing keys',request);
}
};

orgRegistrationRequests.updateSearch=function(updateType,updateValue){
//cui.log('updateSearchParams', page);
switch(updateType){
case'organizationName':
orgRegistrationRequests.search.page=1;
orgRegistrationRequests.search.organizationName=updateValue;
break;}

// WHY transition to this same route? if setting notify:false? what is the purpose? just to add an item to history?
$state.transitionTo('organization.requests.orgRegistrationRequests',orgRegistrationRequests.search,{notify:false});
init();
};

orgRegistrationRequests.pageChange=function(newpage){
orgRegistrationRequests.updateSearch('page',newpage);
};

orgRegistrationRequests.searchCallback=function(searchWord){
orgRegistrationRequests.updateSearch('organizationName',searchWord);
};
/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('organizationAppRequestCtrl',function(APIError,DataStorage,Loader,$state,$stateParams,$timeout,API,$scope,$q,ServicePackage){
'use strict';

var organizationAppRequest=this;
var userId=$stateParams.userId;
var organizationId=$stateParams.orgId;

// HELPER FUNCTIONS START------------------------------------------------------
var getAllDetails=function getAllDetails(){
var promises=[];
API.cui.getOrganization({organizationId:organizationId}).
then(function(res){
organizationAppRequest.request.personData.organization=res;
$scope.$digest();
});
if(organizationAppRequest.request.packageData){
ServicePackage.getPackageDetails(organizationAppRequest.request.packageData.id).
then(function(packageData){
organizationAppRequest.request.packageData=angular.merge(organizationAppRequest.request.packageData,packageData);
}).
catch(function(err){
APIError.onFor('organizationAppRequest.packageServices');
console.log('There was an error in fetching following package service details'+err);
}).
finally(function(){
Loader.offFor('organizationAppRequest.init');
});
}else
{
Loader.offFor('organizationAppRequest.init');
}
};
// HELPER FUNCTIONS END------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

Loader.onFor('organizationAppRequest.init');
organizationAppRequest.request=DataStorage.getType('organizationAppRequest');
console.log(organizationAppRequest.request);
if(!organizationAppRequest.request){
APIError.onFor('organizationAppRequest.noRequest');
Loader.offFor('organizationAppRequest.init');
$timeout(function(){return $state.go('organization.requests.orgAppRequests');},5000);
}else
if(organizationAppRequest.request.personData.id!==userId||organizationAppRequest.request.personData.organization.id!==organizationId){
APIError.onFor('organizationAppRequest.noRequest');
Loader.offFor('organizationAppRequest.init');
$timeout(function(){return $state.go('organization.requests.orgAppRequests');},5000);
}else
{
getAllDetails();
}

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

organizationAppRequest.reviewApprovals=function(){
DataStorage.setType('organizationRegRequest',organizationAppRequest.request);
$state.go('organization.requests.organizationAppRequestReview',{userId:userId,orgId:organizationId});
};

// ON CLICK END ----------------------------------------------------------------------------------
});

angular.module('organization').
controller('organizationAppRequestReviewCtrl',function(DataStorage,Loader,ServicePackage,$q,$state,$stateParams,$timeout,APIError,API,$scope){
'use strict';

var organizationAppRequestReview=this;
var orgId=$stateParams.orgId;

organizationAppRequestReview.success=false;

// HELPER FUNCTIONS START ------------------------------------------------------------------------

var handleSuccess=function handleSuccess(res){
Loader.offFor('organizationAppRequestReview.submitting');
organizationAppRequestReview.success=true;
DataStorage.setType('organizationAppRequest',{});
$scope.$digest();
$timeout(function(){
$state.go('organization.requests.orgAppRequests');
},3000);
};

var handleError=function handleError(err){
console.log('There was an error in approving org app request '+err.responseJSON);
if(err&&err.responseJSON.apiMessage==='The service request does not exist'){
organizationAppRequestReview.errorMessage='request-approve-or-rejected';
}else{
organizationAppRequestReview.errorMessage=undefined;
}
Loader.offFor('organizationAppRequestReview.submitting');
organizationAppRequestReview.error=true;
$scope.$digest();
};

// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

Loader.onFor('organizationAppRequestReview.init');

var requestData=DataStorage.getType('organizationAppRequest');
if(!requestData){
APIError.onFor('organizationAppRequestReview.noRequest');
// $timeout(() => $state.go('organization.requests.orgAppRequests'), 5000)
}else
if(requestData.personData.organization.id!==orgId){
APIError.onFor('organizationAppRequestReview.noRequest');
// $timeout(() => $state.go('organization.requests.orgAppRequests'), 5000)
}else
{
Loader.offFor('organizationAppRequestReview.init');
}
organizationAppRequestReview.packageData=requestData.packageData;
organizationAppRequestReview.personData=requestData.personData;
organizationAppRequestReview.organization=requestData.organization;
organizationAppRequestReview.request=requestData.request;
organizationAppRequestReview.justification=requestData.justification;
organizationAppRequestReview.id=requestData.id;

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

organizationAppRequestReview.submit=function(){
Loader.onFor('organizationAppRequestReview.submitting');
organizationAppRequestReview.packageData.id=organizationAppRequestReview.id;
ServicePackage.handlePackageApproval(organizationAppRequestReview.packageData).
then(handleSuccess).
fail(handleError);
// if (organizationAppRequestReview.packageData.approval === 'approved'){
//     API.cui.denyOrgRegistrationRequest({qs:[['requestId',requestData.id],['reason',organizationAppRequestReview.request.rejectReason]]})
//     .then(handleSuccess)
//     .fail(handleError)
// }
// //all approval then call registration endpoint directly
// else (organizationAppRequestReview.deniedCount===0) {
//     API.cui.approveOrgRegistrationRequest({qs:[['requestId',requestData.id]]})
//     .then(handleSuccess)
//     .fail(handleError)
// }
// else {
//     API.cui.approvePersonRegistration({qs: [['requestId',requestData.registrant.requestId]]})
//     let packageRequestCalls = []

//     organizationAppRequestReview.packages.forEach(packageRequest => {
//         packageRequest.id=packageRequest.requestId
//         packageRequestCalls.push(ServicePackage.handlePackageApproval(packageRequest))
//     })

//     $q.all(packageRequestCalls)
//     .then( res =>{
//         Loader.offFor('organizationAppRequestReview.submitting')
//         organizationAppRequestReview.success = true
//             $timeout(() => {
//                 $state.go('organization.requests.orgRegistrationRequests')
//         }, 3000) 
//     })
//     // .catch(handleError)
// }
};

// ON CLICK END ----------------------------------------------------------------------------------

});

angular.module('organization').
controller('organizationRequestCtrl',function(APIError,DataStorage,Loader,$state,$stateParams,$timeout,API,$scope,$q,ServicePackage){
'use strict';

var organizationRequest=this;
var userId=$stateParams.userId;
var organizationId=$stateParams.orgId;

// HELPER FUNCTIONS START------------------------------------------------------
var getAllDetails=function getAllDetails(){
var promises=[];
API.cui.getOrganization({organizationId:organizationId}).
then(function(res){
organizationRequest.request.personData.organization=res;
$scope.$digest();
});
if(organizationRequest.request.packages&&organizationRequest.request.packages.length!==0){
organizationRequest.request.packages.forEach(function(requestedPackage,index){
ServicePackage.getPackageDetails(requestedPackage.id).
then(function(packageData){
requestedPackage=angular.merge(requestedPackage,packageData);
}).
catch(function(err){
APIError.onFor('organizationRequest.packageServices');
console.log('There was an error in fetching following package service details'+err);
Loader.offFor('organizationRequest.init');
}).
finally(function(){
if(index===organizationRequest.request.packages.length-1){
Loader.offFor('organizationRequest.init');
}
});
});
// $q.all(promises)
// .then(res => {
//     organizationRequest.packageData =res

// })
// .catch(err => {
//     APIError.onFor('organizationRequest.packageServices')
//     console.log('There was an error in fetching one or more package service details' +err)
//     Loader.offFor('organizationRequest.init')
// })
}else
{
Loader.offFor('organizationRequest.init');
}
};
// HELPER FUNCTIONS END------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

Loader.onFor('organizationRequest.init');
organizationRequest.request=DataStorage.getType('organizationRegRequest');
console.log(organizationRequest.request);
if(!organizationRequest.request){
APIError.onFor('organizationRequest.noRequest');
Loader.offFor('organizationRequest.init');
$timeout(function(){return $state.go('organization.requests.orgRegistrationRequests');},5000);
}else
if(organizationRequest.request.personData.id!==userId||organizationRequest.request.personData.organization.id!==organizationId){
APIError.onFor('organizationRequest.noRequest');
Loader.offFor('organizationRequest.init');
$timeout(function(){return $state.go('organization.requests.orgRegistrationRequests');},5000);
}else
{
getAllDetails();
}

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

organizationRequest.reviewApprovals=function(){
DataStorage.setType('organizationRegRequest',organizationRequest.request);
$state.go('organization.requests.organizationRequestReview',{userId:userId,orgId:organizationId});
};

// ON CLICK END ----------------------------------------------------------------------------------
});

angular.module('organization').
controller('organizationRequestReviewCtrl',function(DataStorage,Loader,ServicePackage,$q,$state,$stateParams,$timeout,APIError,API,$scope){
'use strict';

var organizationRequestReview=this;
var orgId=$stateParams.orgId;

organizationRequestReview.success=false;
organizationRequestReview.approvedCount=0;
organizationRequestReview.deniedCount=0;

// HELPER FUNCTIONS START ------------------------------------------------------------------------

var getApprovalCounts=function getApprovalCounts(requests){
requests.forEach(function(request){
switch(request.approval){
case'approved':
organizationRequestReview.approvedCount+=1;
break;
case'denied':
organizationRequestReview.deniedCount+=1;
break;}

});
};

var handleSuccess=function handleSuccess(res){
Loader.offFor('organizationRequestReview.submitting');
organizationRequestReview.success=true;
$scope.$digest();
$timeout(function(){
$state.go('organization.requests.orgRegistrationRequests');
},3000);
};

var handleError=function handleError(err){
console.log('There was an error in approving org registration '+err);
Loader.offFor('organizationRequestReview.submitting');
organizationRequestReview.error=true;
$scope.$digest();
};

// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

Loader.onFor('organizationRequestReview.init');

var requestData=DataStorage.getType('organizationRegRequest');
if(!requestData){
APIError.onFor('organizationRequestReview.noRequest');
$timeout(function(){return $state.go('organization.requests.orgRegistrationRequests');},5000);
}else
if(requestData.personData.organization.id!==orgId){
APIError.onFor('organizationRequestReview.noRequest');
$timeout(function(){return $state.go('organization.requests.orgRegistrationRequests');},5000);
}else
if(requestData.personData.status!=="pending"){
APIError.onFor('organizationRequestReview.active');
$timeout(function(){return $state.go('organization.requests.orgRegistrationRequests');},5000);
}else
{
Loader.offFor('organizationRequestReview.init');
}
organizationRequestReview.packages=requestData.packages;
organizationRequestReview.personData=requestData.personData;
organizationRequestReview.organization=requestData.organization;
organizationRequestReview.request=requestData.request;
organizationRequestReview.justification=requestData.justification;
organizationRequestReview.id=requestData.id;
if(organizationRequestReview.packages&&organizationRequestReview.packages.length>0){
getApprovalCounts(organizationRequestReview.packages);
}

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

organizationRequestReview.submit=function(){
Loader.onFor('organizationRequestReview.submitting');

if(organizationRequestReview.request.approval==='denied'){
API.cui.denyOrgRegistrationRequest({qs:[['requestId',requestData.id],['reason',organizationRequestReview.request.rejectReason]]}).
then(handleSuccess).
fail(handleError);
}
//all approval then call registration endpoint directly
else if(organizationRequestReview.deniedCount===0){
API.cui.approveOrgRegistrationRequest({qs:[['requestId',requestData.id]]}).
then(handleSuccess).
fail(handleError);
}else
{
API.cui.approveOrganizationRequests({qs:[['requestId',requestData.registrant.requestId]]}).
then(function(res){
var packageRequestCalls=[];

organizationRequestReview.packages.forEach(function(packageRequest){
packageRequest.id=packageRequest.requestId;
packageRequestCalls.push(ServicePackage.handlePackageApproval(packageRequest));
});

$q.all(packageRequestCalls).
then(function(res){
Loader.offFor('organizationRequestReview.submitting');
organizationRequestReview.success=true;
$timeout(function(){
$state.go('organization.requests.orgRegistrationRequests');
},3000);
}).
catch(function(err){
console.log("Org approval success but One or more package approval/denied failed"+err);
organizationRequestReview.error=true;
});
}).
fail(handleError);
}
};

// ON CLICK END ----------------------------------------------------------------------------------

});

angular.module('organization').
controller('pendingRequestsCtrl',function(API,DataStorage,Loader,ServicePackage,$q,$state,$stateParams,$timeout){
'use strict';

var pendingRequests=this;
var userId=$stateParams.userId;
var orgId=$stateParams.orgId;

pendingRequests.success=false;
// HELPER FUNCTIONS START ------------------------------------------------------------------------

var getApprovalCounts=function getApprovalCounts(requests){
pendingRequests.approvedCount=0;
pendingRequests.deniedCount=0;
requests.forEach(function(request){
switch(request.approval){
case'approved':
pendingRequests.approvedCount+=1;
break;
case'denied':
pendingRequests.deniedCount+=1;
break;}

});
};

// HELPER FUNCTIONS END --------------------------------------------------------------------------


// ON LOAD START ---------------------------------------------------------------------------------

Loader.onFor('pendingRequests.init');

$q.all([
API.cui.getPerson({personId:userId}),
ServicePackage.getAllUserPendingPackageData(userId)]).

then(function(res){
pendingRequests.user=res[0];
pendingRequests.packages=res[1];
Loader.offFor('pendingRequests.init');
});

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

pendingRequests.reviewApprovals=function(){
var storageData={
user:pendingRequests.user,
packages:pendingRequests.packages};


DataStorage.setType('appRequests',storageData);
$state.go('organization.requests.pendingRequestsReview',{userId:userId,orgId:orgId});
};

pendingRequests.submit=function(){
var submitCalls=[];
getApprovalCounts(pendingRequests.packages);
if(pendingRequests.deniedCount===0){
pendingRequests.submitting=true;
pendingRequests.packages.forEach(function(packageRequest){
submitCalls.push(ServicePackage.handlePackageApproval(packageRequest));
});

$q.all(submitCalls).
then(function(){
pendingRequests.success=true;
pendingRequests.submitting=false;
$timeout(function(){
$state.go('organization.requests.usersAppRequests');
},3000);
}).
catch(function(err){
pendingRequests.submitting=false;
console.log("There was an error in approving application requests"+err);
pendingRequests.error=true;
});
}else
{
pendingRequests.reviewApprovals();
}
};

// ON CLICK END ----------------------------------------------------------------------------------

});

angular.module('organization').
controller('pendingRequestsReviewCtrl',function(DataStorage,Loader,ServicePackage,$q,$state,$stateParams,$timeout){
'use strict';

var pendingRequestsReview=this;
var userId=$stateParams.userId;
var orgId=$stateParams.orgId;

pendingRequestsReview.success=false;
pendingRequestsReview.approvedCount=0;
pendingRequestsReview.deniedCount=0;

// HELPER FUNCTIONS START ------------------------------------------------------------------------

var getApprovalCounts=function getApprovalCounts(requests){
requests.forEach(function(request){
switch(request.approval){
case'approved':
pendingRequestsReview.approvedCount+=1;
break;
case'denied':
pendingRequestsReview.deniedCount+=1;
break;}

});
};

// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

Loader.onFor('pendingRequestsReview.init');

var requestData=DataStorage.getType('appRequests');

pendingRequestsReview.pendingRequests=requestData.packages;
pendingRequestsReview.user=requestData.user;

if(pendingRequestsReview.pendingRequests.length>0){
getApprovalCounts(pendingRequestsReview.pendingRequests);
}

Loader.offFor('pendingRequestsReview.init');

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

pendingRequestsReview.submit=function(){
var submitCalls=[];
pendingRequestsReview.submitting=true;
pendingRequestsReview.pendingRequests.forEach(function(packageRequest){
submitCalls.push(ServicePackage.handlePackageApproval(packageRequest));
});

$q.all(submitCalls).
then(function(){
pendingRequestsReview.success=true;
pendingRequestsReview.submitting=false;
$timeout(function(){
$state.go('organization.requests.usersAppRequests');
},3000);
}).
catch(function(err){
console.log("There was an error in approving user application requests"+err);
pendingRequestsReview.submitting=false;
pendingRequestsReview.error=true;
});
};

pendingRequestsReview.goBack=function(){
$state.go('organization.requests.pendingRequests',{userId:userId,orgId:orgId});
};

// ON CLICK END ----------------------------------------------------------------------------------

});

angular.module('organization').
controller('personRequestCtrl',function(APIError,DataStorage,Loader,PersonRequest,ServicePackage,$state,$stateParams,$timeout,API,$scope){
'use strict';

var personRequest=this;
var userId=$stateParams.userId;
var organizationId=$stateParams.orgId;
// Needed when there is no packages
personRequest.approvedCount=0;
personRequest.deniedCount=0;

personRequest.success=false;


// HELPER FUNCTIONS START ------------------------------------------------------------------------

var getApprovalCounts=function getApprovalCounts(requests){
personRequest.approvedCount=0;
personRequest.deniedCount=0;
requests.forEach(function(request){
switch(request.approval){
case'approved':
personRequest.approvedCount+=1;
break;
case'denied':
personRequest.deniedCount+=1;
break;}

});
};

var handleSuccess=function handleSuccess(res){
Loader.offFor('personRequest.submitting');
personRequest.success=true;
DataStorage.deleteType('userPersonRequest');
API.user.userRegistrationRequestsCount=API.user.userRegistrationRequestsCount-1;
$scope.$digest();
$timeout(function(){
$state.go('organization.requests.usersRegistrationRequests');
},3000);
};

var handleError=function handleError(err){
console.log('There was an error in approving user registration '+err);
Loader.offFor('personRequest.submitting');
personRequest.error=true;
$scope.$digest();
};
// HELPER FUNCTIONS END --------------------------------------------------------------------------


// ON LOAD START ---------------------------------------------------------------------------------

var getPackageDetails=function getPackageDetails(){
if(personRequest.request.request.packages){
ServicePackage.getAllUserPendingPackageData(userId).
then(function(res){
personRequest.request.completePackageData=res;
}).
catch(function(err){
APIError.onFor('personRequest.noRequest');
$timeout(function(){return $state.go('organization.requests.usersRegistrationRequests');},5000);
});
}else
{
personRequest.request.completePackageData=[];
}
};

// Check LocalStorage if data is already obtained in previous page
var storageData=DataStorage.getType('userPersonRequest');
if(storageData&&userId===storageData.request.registrant.id){
personRequest.request=storageData;
getPackageDetails();
}else
{
Loader.onFor('personRequest.init');
PersonRequest.getPersonRegistrationRequestData(userId,organizationId).
then(function(res){
if(!res.request){
APIError.onFor('personRequest.noRequest');
$timeout(function(){return $state.go('organization.requests.usersRegistrationRequests');},5000);
}else
{
personRequest.request=res;
getPackageDetails();
Loader.offFor('personRequest.init');
}
});
}

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

personRequest.reviewApprovals=function(){
DataStorage.setType('userPersonRequest',personRequest.request);
$state.go('organization.requests.personRequestReview',{userId:userId,orgId:organizationId});
};

personRequest.submit=function(){
Loader.onFor('personRequest.submitting');
if(personRequest.packages&&personRequest.packages.length>0){
getApprovalCounts(personRequest.packages);
}
if(personRequest.request.request.approval==='denied'){
//To enter denied Reason
personRequest.reviewApprovals();
// API.cui.denyPersonRegistrationRequest({qs:[['requestId',personRequest.request.request.id],['reason',personRequestReview.request.rejectReason|""]]})
// .then(handleSuccess)
// .fail(handleError)
}else
if(personRequest.deniedCount===0){
API.cui.approvePersonRegistrationRequest({qs:[['requestId',personRequest.request.request.id]]}).
then(handleSuccess).
fail(handleError);
}else
{
//To enter denied Reason
personRequest.reviewApprovals();
// API.cui.approvePersonRequest({qs:[['requestId',personRequest.request.request.registrant.requestId||personRequestReview.request.id]]})
// .then(res => {
//     let packageRequestCalls = []

//     personRequest.packages.forEach(packageRequest => {
//         packageRequestCalls.push(ServicePackage.handlePackageApproval(packageRequest))
//     })

//     $q.all(packageRequestCalls)
//     .then(() => {
//         Loader.offFor('personRequest.submitting')
//         personRequest.success = true
//         $timeout(() => {
//             $state.go('organization.requests.usersRegistrationRequests')
//         }, 3000)  
//     })
//     .catch(err => {
//         console.log("User approval successful but there was an error approving/denying package requests" +err)
//         personRequest.error = true
//         personRequest.errorMessage="app-approval-error"
//     })
// })
// .fail(handleError)
}
};
// ON CLICK END ----------------------------------------------------------------------------------
});

angular.module('organization').
controller('personRequestReviewCtrl',function(DataStorage,Loader,PersonRequest,ServicePackage,$q,$state,$stateParams,$timeout,API,$scope){
'use strict';

var personRequestReview=this;
var userId=$stateParams.userId;
var orgId=$stateParams.orgId;

personRequestReview.success=false;
personRequestReview.approvedCount=0;
personRequestReview.deniedCount=0;

// HELPER FUNCTIONS START ------------------------------------------------------------------------

var getApprovalCounts=function getApprovalCounts(requests){
requests.forEach(function(request){
switch(request.approval){
case'approved':
personRequestReview.approvedCount+=1;
break;
case'denied':
personRequestReview.deniedCount+=1;
break;}

});
};

var handleSuccess=function handleSuccess(res){
Loader.offFor('personRequestReview.submitting');
personRequestReview.success=true;
DataStorage.deleteType('userPersonRequest');
$scope.$digest();
$timeout(function(){
$state.go('organization.requests.usersRegistrationRequests');
},3000);
};

var handleError=function handleError(err){
console.log('There was an error in approving user registration '+err);
Loader.offFor('personRequestReview.submitting');
personRequestReview.error=true;
$scope.$digest();
};
// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

var requestData=DataStorage.getType('userPersonRequest');
if(requestData&&requestData.request.registrant.id===userId){
personRequestReview.packages=requestData.completePackageData;
personRequestReview.personData=requestData.personData;
personRequestReview.organization=requestData.organization;
personRequestReview.request=requestData.request;

if(personRequestReview.packages.length>0){
getApprovalCounts(personRequestReview.packages);
}
}else
{
$state.go('organization.requests.personRequest',{userId:userId,orgId:orgId});
}

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------

personRequestReview.submit=function(){
Loader.onFor('personRequestReview.submitting');

if(personRequestReview.request.approval==='denied'){
API.cui.denyPersonRegistrationRequest({qs:[['requestId',personRequestReview.request.id],['reason',personRequestReview.request.rejectReason|""]]}).
then(handleSuccess).
fail(handleError);
}else
if(personRequestReview.deniedCount===0){
API.cui.approvePersonRegistrationRequest({qs:[['requestId',personRequestReview.request.id]]}).
then(handleSuccess).
fail(handleError);
}else
{
API.cui.approvePersonRequest({qs:[['requestId',personRequestReview.request.registrant.requestId||personRequestReview.request.id]]}).
then(function(res){
var packageRequestCalls=[];

personRequestReview.packages.forEach(function(packageRequest){
packageRequestCalls.push(ServicePackage.handlePackageApproval(packageRequest));
});

$q.all(packageRequestCalls).
then(function(){
Loader.offFor('personRequestReview.submitting');
personRequestReview.success=true;
DataStorage.deleteType('userPersonRequest');
$timeout(function(){
$state.go('organization.requests.usersRegistrationRequests');
},3000);
}).
catch(function(err){
console.log("User approval successful but there was an error approving/denying package requests"+err);
personRequestReview.error=true;
personRequestReview.errorMessage="app-approval-error";
});
}).
fail(handleError);
}
};

// ON CLICK END ----------------------------------------------------------------------------------

});

angular.module('organization').
controller('usersAppRequestsCtrl',
function($timeout,$filter,$pagination,$state,$stateParams,API,APIError,APIHelpers,CuiMobileNavFactory,Loader,User){

var scopeName='usersAppRequests.';
var usersAppRequests=this;
usersAppRequests.search={};
usersAppRequests.sortBy={};


/* -------------------------------------------- ON LOAD START --------------------------------------------- */

var foundOrgs=[];
var foundPersons=[];
var foundPackages=[];


var init=function init(){
cui.log('init');

usersAppRequests.search['isApprovable']=true;
usersAppRequests.search.pageSize=usersAppRequests.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
var qsArray=APIHelpers.getQs(usersAppRequests.search);

usersAppRequests.data=[];
Loader.onFor(scopeName+'data');
APIError.offFor(scopeName+'data');


var getOrg=function getOrg(orgId){
return $.Deferred(function(dfr){
if(orgId.length){
var cached=_.find(foundOrgs,{id:orgId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getOrganizationSecured({organizationId:orgId}).then(function(org){
foundOrgs.push(org);
//cui.log('org pushed', org, foundOrgs);
dfr.resolve(org);
}).fail(function(err){
cui.log('getOrg error',orgId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var getPerson=function getPerson(personId){
return $.Deferred(function(dfr){
if(personId.length){
var cached=_.find(foundPersons,{id:personId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getPerson({personId:personId}).then(function(person){
foundPersons.push(person);
dfr.resolve(person);
}).fail(function(err){
cui.log('getPerson error',personId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var getPackage=function getPackage(packageId){
return $.Deferred(function(dfr){
if(packageId.length){
var cached=_.find(foundPackages,{id:packageId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getPackage({packageId:packageId}).then(function(pkg){
var p={id:pkg.id,name:pkg.name[0].text};
foundPackages.push(p);
dfr.resolve(p);
}).fail(function(err){
cui.log('getPackage error',packageId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var done=function done(context){
$timeout(function(){
Loader.offFor(scopeName+'data');
cui.log('done',context);
cui.log('data',usersAppRequests.data);

usersAppRequests.reRenderPagination&&usersAppRequests.reRenderPagination();
});
};


API.cui.getPackageRequests({qs:qsArray}).then(function(res){
var calls=[];

_.each(res,function(pkgReq){

// NB create an obj and bind it to scope...
var data={};
usersAppRequests.data.push(data);

// ..then cache the calls, which populate obj asynchronously...
calls.push(
getPerson(pkgReq.requestor.id).then(function(person){
data.personData=person||{};
var pkgId=pkgReq&&pkgReq.servicePackage?pkgReq.servicePackage.id:'';
return getPackage(pkgId);
}).then(function(pkg){
data.packageData=pkg;
var orgId=data.personData&&data.personData.organization?data.personData.organization.id:'';
return getOrg(orgId);
}).then(function(org){
if(!data.personData.organization){
data.personData.organization={};
}
data.personData.organization.name=!_.isEmpty(org)?org.name:'';
return $.Deferred().resolve();
}).fail(function(){
// mute the failures so as not to derail the entire list
return $.Deferred().resolve();
}));

});
return $.Deferred().resolve(calls);
}).then(function(calls){
// do the cached calls
return $.when.apply($,calls);
}).then(function(){
// do the count (used for pagination)
return API.cui.getPackageRequestsCount();
}).then(function(count){
// apply the count
usersAppRequests.userCount=count;
API.user.userAppRequestsCount=count;
return $.Deferred().resolve();
}).fail(function(error){
APIError.onFor(scopeName+'data');
}).always(function(){
CuiMobileNavFactory.setTitle($filter('cuiI18n')('App Requests'));
done('finally');
});
};

init();
/* --------------------------------------------- ON LOAD END ---------------------------------------------- */


/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */
usersAppRequests.sortingCallbacks={
name:function name(){
usersAppRequests.sortBy.sortBy='name';
usersAppRequests.sort(['personData.name.given','personData.name.surname'],usersAppRequests.sortBy.sortType);
},
title:function title(){
usersAppRequests.sortBy.sortBy='title';
usersAppRequests.sort('personData.title',usersAppRequests.sortBy.sortType);
},
submitted:function submitted(){
usersAppRequests.sortBy.sortBy='submitted';
usersAppRequests.sort('personData.creation',usersAppRequests.sortBy.sortType);
},
application:function application(){
usersAppRequests.sortBy.sortBy='application';
usersAppRequests.sort('packageData.name',usersAppRequests.sortBy.sortType);
},
division:function division(){
usersAppRequests.sortBy.sortBy='division';
usersAppRequests.sort('personData.organization.name',usersAppRequests.sortBy.sortType);
}};


usersAppRequests.sort=function(sortBy,order){
cui.log('sort',sortBy,order);
usersAppRequests.data=_.orderBy(usersAppRequests.data,sortBy,order);
};

usersAppRequests.goToDetails=function(request){
if(request.personData&&request.personData.id&&
request.personData.organization&&request.personData.organization.id&&
request.packageData&&request.packageData.id){
$state.go('organization.requests.pendingRequests',{
'userId':request.personData.id,
'orgId':request.personData.organization.id,
'packageId':request.packageData.id});

}else{
cui.log('usersAppRequests goToDetails missing keys',request);
}
};

usersAppRequests.updateSearchParams=function(page){
if(page)usersAppRequests.search.page=page;
$state.transitionTo('organization.requests.usersAppRequests',usersAppRequests.search,{notify:false});
init();
};
/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */

});

angular.module('organization').
controller('usersRegistrationRequestsCtrl',
function($timeout,$filter,$pagination,$state,$stateParams,API,APIError,APIHelpers,CuiMobileNavFactory,Loader,User,$scope,DataStorage){

var scopeName='usersRegistrationRequests.';
var usersRegistrationRequests=this;
usersRegistrationRequests.search={};
usersRegistrationRequests.sortBy={};
usersRegistrationRequests.searchByOrg=[];
usersRegistrationRequests.searchByPerson=[];


/* -------------------------------------------- ON LOAD START --------------------------------------------- */
var foundOrgs=[];
var foundPersons=[];
var foundPackages=[];


var init=function init(){
cui.log('init');

usersRegistrationRequests.search.pageSize=usersRegistrationRequests.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
var qsArray=APIHelpers.getQs(usersRegistrationRequests.search);
//cui.log('qsArray', qsArray);
if(usersRegistrationRequests.searchByOrg.length>0){
usersRegistrationRequests.searchByOrg.forEach(function(val){
qsArray.push(['organization.id',val.id]);
});

}else if(usersRegistrationRequests.searchByPerson.length>0){
usersRegistrationRequests.searchByPerson.forEach(function(val){
qsArray.push(['registrant.id',val.id]);
});
}else
{}

usersRegistrationRequests.data=[];
Loader.onFor(scopeName+'data');
APIError.offFor(scopeName+'data');

var getOrg=function getOrg(orgId){
return $.Deferred(function(dfr){
if(orgId.length){
var cached=_.find(foundOrgs,{id:orgId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getOrganizationSecured({organizationId:orgId}).then(function(org){
foundOrgs.push(org);
//cui.log('org pushed', org, foundOrgs);
dfr.resolve(org);
}).fail(function(err){
cui.log('getOrg error',orgId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var getPerson=function getPerson(personId){
return $.Deferred(function(dfr){
if(personId.length){
var cached=_.find(foundPersons,{id:personId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getPerson({personId:personId}).then(function(person){
foundPersons.push(person);
dfr.resolve(person);
}).fail(function(err){
cui.log('getPerson error',personId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var getPackage=function getPackage(packageId){
return $.Deferred(function(dfr){
if(packageId.length){
var cached=_.find(foundPackages,{id:packageId});
if(cached){
dfr.resolve(cached);
}else{
API.cui.getPackage({packageId:packageId}).then(function(pkg){
var p={id:pkg.id,name:pkg.name[0].text};
foundPackages.push(p);
dfr.resolve(p);
}).fail(function(err){
cui.log('getPackage error',packageId,err);
dfr.resolve({});
});
}
}else{
dfr.resolve({});
}
});
};

var done=function done(context){
$timeout(function(){
Loader.offFor(scopeName+'data');
cui.log('done',context);
cui.log('data',usersRegistrationRequests.data);

usersRegistrationRequests.reRenderPagination&&usersRegistrationRequests.reRenderPagination();
});
};

var start=window.performance.now();
var end;
API.cui.getRegistrationRequests({qs:qsArray}).then(function(res){
var calls=[];

_.each(res,function(regReq){
// NB create an obj and bind it to scope...
var data={};
data.request=regReq;
usersRegistrationRequests.data.push(data);

// ..then cache the calls, which populate obj asynchronously...
calls.push(
getPerson(regReq.registrant.id).
then(function(person){
data.personData=person||{};
var pkgId=!_.isEmpty(regReq.packages)?regReq.packages[0].id:'';
return getPackage(pkgId);
}).
then(function(pkg){
data.packageData=pkg;
console.log(data.personData.organization.id);
var orgId=data.personData&&data.personData.organization?data.personData.organization.id:'';
return getOrg(orgId);
}).
then(function(org){
if(!data.personData.organization){
data.personData.organization={};
}
data.personData.organization.name=!_.isEmpty(org)?org.name:'';
data.organization={
id:org.id,
name:org.name};

return $.Deferred().resolve();
}).fail(function(){
// mute the failures so as not to derail the entire list
return $.Deferred().resolve();
}));

});
return $.Deferred().resolve(calls);
}).then(function(calls){
// do the cached calls
return $.when.apply($,calls);
}).then(function(){
// do the count (used for pagination)
return API.cui.getRegistrationRequestsCount();
}).then(function(count){
// apply the count
usersRegistrationRequests.userCount=count;
API.user.userRegistrationRequestsCount=count;
return $.Deferred().resolve();
}).fail(function(error){
APIError.onFor(scopeName+'data');
}).always(function(){
CuiMobileNavFactory.setTitle($filter('cuiI18n')('Registration Requests'));
done('finally');
var end=window.performance.now();
var time=end-start;
cui.log('time',time);
});
};

init();
/* --------------------------------------------- ON LOAD END ---------------------------------------------- */


/* --------------------------------------- ON CLICK FUNCTIONS START --------------------------------------- */
usersRegistrationRequests.sortingCallbacks={
name:function name(){
usersRegistrationRequests.sortBy.sortBy='name';
usersRegistrationRequests.sort(['personData.name.given','personData.name.surname'],usersRegistrationRequests.sortBy.sortType);
},
title:function title(){
usersRegistrationRequests.sortBy.sortBy='title';
usersRegistrationRequests.sort('personData.title',usersRegistrationRequests.sortBy.sortType);
},
submitted:function submitted(){
usersRegistrationRequests.sortBy.sortBy='submitted';
usersRegistrationRequests.sort('personData.creation',usersRegistrationRequests.sortBy.sortType);
},
application:function application(){
usersRegistrationRequests.sortBy.sortBy='application';
usersRegistrationRequests.sort('packageData.name',usersRegistrationRequests.sortBy.sortType);
},
division:function division(){
usersRegistrationRequests.sortBy.sortBy='division';
usersRegistrationRequests.sort('personData.organization.name',usersRegistrationRequests.sortBy.sortType);
}};


usersRegistrationRequests.sort=function(sortBy,order){
cui.log('sort',sortBy,order);
usersRegistrationRequests.data=_.orderBy(usersRegistrationRequests.data,sortBy,order);
};


usersRegistrationRequests.goToDetails=function(request){
if(request.personData&&request.personData.id&&
request.personData.organization&&request.personData.organization.id){
DataStorage.setType('userPersonRequest',{personData:request.personData,organization:request.organization,request:request.request,packageData:request.packageData});
$state.go('organization.requests.personRequest',{
'userId':request.personData.id,
'orgId':request.personData.organization.id});

}else{
cui.log('usersRegistrationRequests goToDetails missing keys',request);
}
};

usersRegistrationRequests.updateSearchParams=function(page){
//cui.log('updateSearchParams', page);
if(page)usersRegistrationRequests.search.page=page;
// WHY transition to this same route? if setting notify:false? what is the purpose? just to add an item to history?
$state.transitionTo('organization.requests.usersRegistrationRequests',usersRegistrationRequests.search,{notify:false});
init();
};
/* ---------------------------------------- ON CLICK FUNCTIONS END ---------------------------------------- */
usersRegistrationRequests.searchBy='person';
usersRegistrationRequests.updateSearchByName=function(){
//console.log(usersRegistrationRequests.searchBy)
if(usersRegistrationRequests.searchBy==='org'&&usersRegistrationRequests.searchValue){
Loader.onFor(scopeName+'data');
APIError.offFor(scopeName+'data');
usersRegistrationRequests.searchByOrg=[];
API.cui.getOrganizations({qs:[['name',usersRegistrationRequests.searchValue+'*']]}).
then(function(res){
console.log(res);
usersRegistrationRequests.searchByOrg=res;
Loader.offFor(scopeName+'data');
if(res.length>0){
$state.transitionTo('organization.requests.usersRegistrationRequests',usersRegistrationRequests.searchByOrg,{notify:false});
init();
}else{
usersRegistrationRequests.data=[];
$scope.$apply();
}
}).
fail(function(err){
console.log(err);
});
}else if(usersRegistrationRequests.searchBy==='person'&&usersRegistrationRequests.searchValue){
Loader.onFor(scopeName+'data');
APIError.offFor(scopeName+'data');
usersRegistrationRequests.searchByPerson=[];
API.cui.getPersons({qs:[['fullName',usersRegistrationRequests.searchValue]]}).
then(function(res){
console.log(res);
usersRegistrationRequests.searchByPerson=res;
Loader.offFor(scopeName+'data');
if(res.length>0){
$state.transitionTo('organization.requests.usersRegistrationRequests',usersRegistrationRequests.searchByPerson,{notify:false});
init();
}else{
usersRegistrationRequests.data=[];
$scope.$apply();
}
}).
fail(function(err){
console.log(err);
});
}else{
usersRegistrationRequests.searchByOrg=[];
usersRegistrationRequests.searchByPerson=[];
$state.transitionTo('organization.requests.usersRegistrationRequests',{notify:false});
init();
}
/*return undefined*/
};

});

angular.module('organization').
controller('orgRolesCtrl',function($scope){
'use strict';

var orgRoles=this;

// HELPER FUNCTIONS START ------------------------------------------------------------------------

var handleError=function handleError(err){
orgRoles.loading=false;
$scope.$digest();
console.log('Error',err);
};

// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------
// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK START --------------------------------------------------------------------------------
// ON CLICK END ----------------------------------------------------------------------------------

});

angular.module('misc',[]).
config(['$stateProvider',function($stateProvider){

var templateBase='app/modules/misc/';

var returnCtrlAs=function returnCtrlAs(name,asPrefix){
return name+'Ctrl as '+(asPrefix?asPrefix:'')+(asPrefix?name[0].toUpperCase()+name.slice(1,name.length):name);
};

var loginRequired=true;
$stateProvider.
state('welcome',{
url:'/welcome',
templateUrl:templateBase+'welcome/welcome.html'}).

state('search',{
url:'/search?page&pageSize',
templateUrl:templateBase+'search/search.html',
controller:returnCtrlAs('search'),
access:{
permittedLogic:appConfig.globalSearch}}).


state('misc',{
url:'/status',
templateUrl:templateBase+'status/status.html'}).

state('misc.404',{
url:'/404',
templateUrl:templateBase+'status/status-404.html'}).

state('misc.notAuth',{
url:'/notAuthorized',
templateUrl:templateBase+'status/status-notAuth.html'}).

state('misc.pendingStatus',{
url:'/pendingStatus',
templateUrl:templateBase+'status/status-pendingStatus.html'}).

state('misc.success',{
url:'/success',
templateUrl:templateBase+'status/status-success.html'}).

state('misc.loadError',{
url:'/error',
templateUrl:templateBase+'status/status-loadError.html'});


}]);

angular.module('misc').
controller('searchCtrl',['API','$scope','$stateParams','$state','$q','$pagination','APIHelpers','Loader','APIError','Base',
function(API,$scope,$stateParams,$state,$q,$pagination,APIHelpers,Loader,APIError,Base){
var search=this;
search.currentParentOrg=API.user.organization.id;

search.users=null;
search.timer=null;
search.searchType="organizations";
search.searchOrgId="";
search.searchterms="";
search.count=1000;
search.pageError=false;

// search.keypress = function() {
//     search.users = [];
//     if (search.timer) { clearTimeout(search.timer); }
//     search.timer = window.setTimeout(function() {
//         search.searchNow();
//     }, 200);
// }

/* -------------------------------------------- HELPER FUNCTIONS END --------------------------------------------- */

search.flattenOrgHierarchy=function(orgHierarchy){
/*
                Takes the organization hierarchy response and returns a flat object array containing the id's and name's of
                the top level organization as well as it's divisions.
            */

if(orgHierarchy){
var organizationArray=[];

organizationArray.push({
id:orgHierarchy.id,
name:orgHierarchy.name});


if(orgHierarchy.children){
orgHierarchy.children.forEach(function(division){
organizationArray.push({
id:division.id,
name:division.name});


if(division.children){
var flatArray=_.flatten(division.children);

flatArray.forEach(function(childDivision){
organizationArray.push({
id:childDivision.id,
name:childDivision.name});

});
}
});
}
return organizationArray;
}else{
throw new Error('No organization hierarchy object provided');
}
};

search.addPerson=function(newPerson){

// Prevent Duplicates
var add=true;
search.users.forEach(function(person){
if(newPerson.id==person.id){add=false;}
});

if(newPerson.status=='pending'){add=false;}
if(add){search.users.push(newPerson);}

};

search.searchNow=function(searchOrPage){
search.pageError=false;
if(searchOrPage){
search.searchParams.page=1;
}
Loader.onFor('search.loading');
search.users=[];
search.orgs=[];
var qsArray=APIHelpers.getQs(search.searchParams);
//Need to filter out pending and unactive
qsArray.push(['status','active'],['status','suspended']);
// if (search.searchterms|| !type) {

if(search.searchType=="people"){
var qsArrayNameSearch=angular.copy(qsArray);
qsArrayNameSearch.push(['fullName',search.searchterms],['status','locked']);
var promises=[API.cui.countPersons({qs:qsArrayNameSearch}),API.cui.getPersons({qs:qsArrayNameSearch})];
$q.all(promises).
then(function(res){
search.personCount=res[0];
search.users=res[1];
if(search.users.length===0){
search.noRecords=true;
}
Loader.offFor('search.loading');
}).
catch(function(error){
Loader.offFor('search.loading');
search.pageError=true;
});
//     qsArray.push(['email', search.searchterms])
// API.cui.getPersons({
//         qs: qsArray
//     })
//     .done(personResponse => {

//         personResponse.forEach(function(x) {
//             search.addPerson(x);
//         })

//         $scope.$digest()
//     })
//     .fail(error => {

//     })

}
if(search.searchType=="organizations"){
qsArray.push(['name',search.searchterms+"*"]);
API.cui.getOrganizations({qs:qsArray}).
done(function(orgsResponse){
search.orgs=orgsResponse;
if(search.orgs.length===0){
search.noRecords=true;
}
}).
fail(function(error){
search.pageError=true;
}).
always(handleAll);
}
// }
};

var handleAll=function handleAll(){
Loader.offFor('search.loading');
$scope.$digest();
};

/* -------------------------------------------- HELPER FUNCTIONS END --------------------------------------------- */

/* -------------------------------------------- ON LOAD START --------------------------------------------- */
search.searchParams=Object.assign({},$stateParams);
search.searchParams.pageSize=search.searchParams.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
if(!search.searchParams.page){
search.searchParams.page=1;
}
search.sortBy={};
search.organizationList=null;
// API.cui.getOrganizationsCount({qs:APIHelpers.getQs(search.searchParams)})
// .then(count=>{
//     search.orgCount=count
//     return API.cui.getOrganizations({qs:APIHelpers.getQs(search.searchParams)})
// })
// Authorization for org serach and user search
if(Base.accessToSecurityAndExchangeAdmins()){
search.searchNow(true);
}else
{
search.searchType="people";
search.searchNow(true);
}

/* -------------------------------------------- ON LOAD END --------------------------------------------- */

/* -------------------------------------------- ON CLICK FUNCTIONS START --------------------------------------------- */
search.updateSearchParams=function(page){
if(page){
search.searchParams.page=page;
}
$state.transitionTo('search',search.searchParams,{notify:false});
search.searchNow();
};

search.userClick=function(clickedUser){

var stateOpts={
userId:clickedUser.id,
orgId:clickedUser.organization.id};

if(clickedUser.status==='pending')$state.go('organization.requests.personRequest',stateOpts);else
$state.go('organization.directory.userDetails',stateOpts);

};

search.orgClick=function(clickedOrd){
var stateOpts={
orgId:clickedOrd.id};

$state.go('organization.directory.orgDetails',stateOpts);
};

/* -------------------------------------------- ON CLICK FUNCTIONS END --------------------------------------------- */
}]);

angular.module('common',['translate','ngMessages','cui.authorization','cui-ng','ui.router','snap','LocalStorageModule']).
config(function($translateProvider,$locationProvider,$urlRouterProvider,$injector,
localStorageServiceProvider,$cuiIconProvider,$cuiI18nProvider,$paginationProvider,
$stateProvider,$compileProvider,$cuiResizeHandlerProvider){

$urlRouterProvider.rule(function($injector,$location){
var path=$location.path();
var hasTrailingSlash=path[path.length-1]==='/';

if(hasTrailingSlash){
var newPath=path.substr(0,path.length-1);
return newPath;
}
});

localStorageServiceProvider.setPrefix('cui');
// $locationProvider.html5Mode(true);

var templateBase='app/modules/common/';

var returnCtrlAs=function returnCtrlAs(name,asPrefix){return name+'Ctrl as '+(asPrefix||'')+(asPrefix?name[0].toUpperCase()+name.slice(1,name.length):name);};

$stateProvider.
state('auth',{
url:'/auth?xsrfToken&cuid',
controller:returnCtrlAs('auth'),
templateUrl:templateBase+'auth/auth.html',
access:true});


if(appConfig.languages){
if(!appConfig.languageResources){
console.error('You need to configure languageResources in your appConfig.json.');
}

/*
        *   This section will dynamically generate the correct path to versioned i18n assets 
        *   based off of current i18n version in use in the project.
        *
        *   This requires a proper appConfig.json setup. Please refer to the documentation in
        *   ./docs/features/cui-framework/cui-i18n.md for information on how to setup the appConfig.
        *
        *   Note: Grunt tasks will not automatically work with all of the possible setups of i18n assets.
        */

if(appConfig.languageResources.hasOwnProperty('customDependencyName')){
// Loading in custom i18n project
var customDependency=appConfig.languageResources.customDependencyName;
var dependencyType=appConfig.languageResources.dependencyType||'dependencies';
var customDependencyVersion=packageJson[dependencyType][customDependency].split('#v')[1];
appConfig.languageResources.url=appConfig.languageResources.url.replace(/\{\{(.*?)\}\}/,customDependencyVersion);
}else
if(appConfig.languageResources.hasOwnProperty('dependencyOrigin')&&appConfig.languageResources.dependencyOrigin==='cui-idm-b2x'){
// Loading in i18n dependency through B2X (generator projects)
appConfig.languageResources.url=appConfig.languageResources.url.replace(/\{\{(.*?)\}\}/,i18nPackageJson.version);
}else
{
// Loading in standalone cui-i18n dependency
var _dependencyType=appConfig.languageResources.dependencyType||'dependencies';
appConfig.languageResources.url=appConfig.languageResources.url.replace(/\{\{(.*?)\}\}/,packageJson[_dependencyType]['@covisint/cui-i18n']);
}

$cuiI18nProvider.setLocaleCodesAndNames(appConfig.languages);
var languageKeys=Object.keys($cuiI18nProvider.getLocaleCodesAndNames());

var returnRegisterAvailableLanguageKeys=function returnRegisterAvailableLanguageKeys(){
// Reroute unknown language to prefered language
var object={'*':languageKeys[0]};
languageKeys.forEach(function(languageKey){
// Redirect language keys such as en_US to en
object[languageKey+'*']=languageKey;
});
return object;
};

$translateProvider.useLoader('LocaleLoader',appConfig.languageResources).
registerAvailableLanguageKeys(languageKeys,returnRegisterAvailableLanguageKeys()).
uniformLanguageTag('java').
determinePreferredLanguage().
fallbackLanguage(languageKeys);

$cuiI18nProvider.setLocalePreference(languageKeys);
}

if(appConfig.iconSets){
appConfig.iconSets.forEach(function(iconSet){
$cuiIconProvider.iconSet(iconSet.name,iconSet.path,iconSet.defaultViewBox||null);
});
}

// Pagination Results Per Page Options
if(appConfig.paginationOptions){
$paginationProvider.setPaginationOptions(appConfig.paginationOptions);
}else
{
throw new Error('You don\'t have paginationOptions set in your appConfig.json');
}

// Cui Resize Handler Breakpoint Option
if(appConfig.breakpointOption){
$cuiResizeHandlerProvider.setBreakpoint(appConfig.breakpointOption);
}else{
throw new Error('You don\'t have breakpointOption set in your appConfig.json');
}

$compileProvider.debugInfoEnabled(false);

});

angular.module('common').
run(['LocaleService','$rootScope','$state','$http','$templateCache','$cuiI18n','User',
'cui.authorization.routing','cui.authorization.evalRouteRequest','Menu','API','$cuiIcon','$timeout','PubSub','APIError','Loader','Theme','CuiRouteHistoryFactory',
function(LocaleService,$rootScope,$state,$http,$templateCache,$cuiI18n,User,routing,evalRouteRequest,Menu,API,$cuiIcon,$timeout,PubSub,APIError,Loader,Theme,CuiRouteHistoryFactory){

if(window.cuiApiInterceptor){
var cuiApiInterceptorConfig={
apiUris:[appConfig.serviceUrl],
stopIfInvalidPayload:true};


if(appConfig.debugServiceUrl){
cuiApiInterceptorConfig.apiUris.push(appConfig.debugServiceUrl);
}

var interceptors=[
'Get',
'PrePut',
'PrePost',
'PostPut',
'PostPost'];


interceptors.forEach(function(interceptor){return window.cuiApiInterceptor['start'+interceptor+'Interceptor'](cuiApiInterceptorConfig);});
}

// Add locales here
var languageNameObject=$cuiI18n.getLocaleCodesAndNames();

for(var LanguageKey in languageNameObject){
LocaleService.setLocales(LanguageKey,languageNameObject[LanguageKey]);
}

$rootScope.$on('$stateChangeStart',function(event,toState,toParams,fromState,fromParams){
Theme.clear();
APIError.clearAll();
Loader.clearAll();
event.preventDefault();

function attachAccessInfo(toState){
if(toState.access){
if(!_.isObject(toState.access)){
toState.access={};
}
toState.access.roles=User.getRoles();
toState.access.entitlements=User.getEntitlements();
}else{
toState.access={};
}
}

function go(toState,toParams,fromState,fromParams){
// NB... detailed access logic is evaluated upstream, in cui.authorization.evalRouteRequest...
attachAccessInfo(toState);
evalRouteRequest(toState,toParams,fromState,fromParams,'misc.notAuth');
PubSub.publish('stateChange',{toState:toState,toParams:toParams,fromState:fromState,fromParams:fromParams});
Menu.handleStateChange(toState.menu);
}

var route=function route(){
if(appConfig.debugServiceUrl){
/**
                    appConfig.debugServiceUrl can be pointed at a localhost server to act as a mock API.
                        Ex: 'debugServiceUrl': 'http://localhost:8001'
                    mock api server source code 
                        https://github.com/thirdwavellc/cui-api-mock
                    NB this workaround is not calling new evalRouteRequest() logic.
                **/
var userInfo={};
API.cui.getPerson({personId:'personId'}).
then(function(res){
userInfo=res;
return API.cui.getOrganization({organizationId:res.organization.id});
}).
then(function(res){
userInfo.organization=res;
API.setUser(userInfo);
});
routing(toState,toParams,fromState,fromParams,[]);
PubSub.publish('stateChange',{toState:toState,toParams:toParams,fromState:fromState,fromParams:fromParams});// this is required to make the ui-sref-active-nested directive work
Menu.handleStateChange(toState.menu);
}else
{
/* deprecated...
                if (!toState.access || !toState.access.loginRequired) {
                    Menu.handleStateChange(toState.menu);
                    routing(toState, toParams, fromState, fromParams, User.getEntitlements());
                    PubSub.publish('stateChange',{ toState,toParams,fromState,fromParams }); // this is required to make the ui-sref-active-nested directive work with a multi-module approach
                    return;
                }
                else if (User.get() !== '[cuid]') {
                    routing(toState, toParams, fromState, fromParams, User.getEntitlements());
                    PubSub.publish('stateChange',{ toState, toParams, fromState, fromParams });
                    Menu.handleStateChange(toState.menu);
                }
                else {
                    API.authenticateUser({ toState,toParams,fromState,fromParams })
                    .then((res) => {
                        const { toState, toParams, fromState, fromParams } = res.redirect;
                        // Determine if user is able to access the particular route we're navigating to
                        routing(toState, toParams, fromState, fromParams, res.roleList);
                        PubSub.publish('stateChange',{ toState, toParams, fromState, fromParams }); // this is required to make the ui-sref-active-nested directive work with a multi-module approach
                        // Menu handling
                        Menu.handleStateChange(res.redirect.toState.menu);
                    });
                }
                */
if(!toState.access||User.get()!=='[cuid]'){
// ...route needs no User info... or ...route needs User and we have User info...
cui.log('stateChangeStart2',toState,toParams);
go(toState,toParams,fromState,fromParams);
}else{
// ..route needs (loggedIn) User and we need User info...
API.authenticateUser({toState:toState,toParams:toParams,fromState:fromState,fromParams:fromParams}).then(function(res){
cui.log('stateChangeStart3',res.redirect.toState,res.redirect.toParams);
go(res.redirect.toState,res.redirect.toParams,res.redirect.fromState,res.redirect.fromParams);
});
}
}
};

if(_.isEmpty(API.cui)){
// async load API.cui
API.initApi().then(function(){
route();
});
}else{
route();
}
});

// $state.stateStack is a stack of states used by base.goBack()
$state.stateStack=[];

$rootScope.$on('$stateChangeSuccess',function(e,_ref13){var toState=_ref13.toState,toParams=_ref13.toParams,fromState=_ref13.fromState,fromParams=_ref13.fromParams;
// For base.goBack()
$state.stateStack.push({
name:fromState.name,
params:fromParams||{}});


// routeHistory POC
var routeTextArray=toState.name.split('.');
CuiRouteHistoryFactory.add({
text:routeTextArray[routeTextArray.length-1],
uiroute:toState.name,
uirouteparams:toParams});


cui.log('on $stateChangeSuccess',toState,toParams,fromState,fromParams,$state.stateStack);
});

angular.forEach($cuiIcon.getIconSets(),function(iconSettings,namespace){
$http.get(iconSettings.path,{
cache:$templateCache});

});

}]);

angular.module('common').
controller('authCtrl',['$state',function($state){
$state.go('welcome');
}]);

angular.module('common').
controller('baseCtrl',function(Base,$scope){

$scope.base=Base;
$scope.base.pendingNotificationFlag=false;
}).

filter('capitalize',function(){
return function(input){
return!!input?input.charAt(0).toUpperCase()+input.substr(1).toLowerCase():'';
};
}).

filter('capitalize',function(){
return function(input){
return!!input?input.charAt(0).toUpperCase()+input.substr(1).toLowerCase():'';
};
});

angular.module('common').
directive('disableAnimate',function($animate){return{

/*
		Use this directive to disable the animation window that is introduced by ng-animate.
		Add the 'disable-animate' attribute to an element you need to disable ng-animate on.

		Example: 	<p disable-animate> Element you need to disable ng-animate on. </p>
	*/

restrict:'A',
link:function link(attrs,elem){
$animate.enabled(elem,false);
}};});


angular.module('common').
factory('CuiMobileNavFactory',function(PubSub,User,$filter){
return{
title:User.user.organization.name,
defaultTitle:User.user.organization.name,
getTitle:function getTitle(){
return this.title;
},
setTitle:function setTitle(newTitle){
this.title=newTitle;
PubSub.publish('mobileNavTitleChange');
},
getDefaultTitle:function getDefaultTitle(){
return this.defaultTitle;
},
setDefaultTitle:function setDefaultTitle(newDefaultTitle){
this.defaultTitle=newDefaultTitle;
}};

}).
directive('cuiMobileNav',function(CuiMobileNavFactory,PubSub,$state){return{
restrict:'E',
scope:{
showIf:'=',
links:'=',
activeTitle:'@activeTitle',
label:'=?'},

link:function link(scope,elem,attrs){
// attrs.activeTitle ? scope.activeTitle = attrs.activeTitle : scope.activeTitle = CuiMobileNavFactory.getDefaultTitle()
scope.currentState=$state.current.name;

scope.close=function(){return scope.showIf=false;};
scope.toggle=function(){return scope.showIf=!scope.showIf;};

var pubSubSubscription=PubSub.subscribe('mobileNavTitleChange',function(){
// scope.activeTitle = CuiMobileNavFactory.getTitle()
});

scope.$on('$destroy',function(){
PubSub.unsubscribe(pubSubSubscription);
});
},
template:'\n        <nav class="cui-breadcrumb--mobile" id="breadcrumb-button" aria-hidden="true" ng-click="toggle()" off-click="close()">\n            <ul class="cui-breadcrumb__links">\n                <li class="cui-breadcrumb__link cui-breadcrumb__link--current">\n                    <span class="cui-breadcrumb__mobile-link" ng-if="links[currentState]" class="active"><span class="cui-mobile-only" ng-if="activeTitle">{{activeTitle}}.</span>{{links[currentState].label}}</span>\n                    <span class="cui-breadcrumb__mobile-link" ng-if="!links[currentState]" class="active"><span class="cui-mobile-only" ng-if="activeTitle">{{activeTitle}}.</span>{{label}}</span>\n                </li>\n                <div class="cui-popover cui-popover--menu cui-breadcrumb__popover cui-popover--top cui-popover__categories-popover" tether target="#breadcrumb-button" attachment="top left" target-attachment="bottom left" offset="-10px 0" ng-if="showIf">\n                    <li class="cui-breadcrumb__link cui-popover__row" ng-repeat="(state, stateDetails) in links" ng-if="currentState!==state">\n                        <a class="cui-breadcrumb__mobile-link" ui-sref="{{state}}(stateDetails.stateParams)">{{stateDetails.label}}</a>\n                    </li>\n                </div>\n            </ul>\n        </nav>\n    '};});
















/*
TODO
    -strategically handle jumps?
        - best bet is to just display last 3 routes in markup
*/

angular.module('common').
factory('CuiRouteHistoryFactory',function(){
var routes=[];
/*
        route: {
            text: '',
            uiroute: '',
            uirouteparams: ''
        }
    */
return{
add:function add(route){
routes.push(route);
return;
},
remove:function remove(route){
_.remove(routes,{text:route.text});
return;
},
truncate:function truncate(route){
// Remove everything that follows route
var idx=routes.indexOf(route);
cui.log('truncate before',routes,route,idx);
if(idx!==-1){
routes=routes.slice(0,idx);
}
cui.log('truncate after',routes);
return;
},
clear:function clear(){
routes=[];
return;
},
get:function get(){
return routes;
}};

}).
directive('cuiRouteHistory',function(CuiRouteHistoryFactory,$state){return{
restrict:'E',
link:function link(scope,elem,attrs){
//scope.currentState = $state.current.name;
scope.routes=CuiRouteHistoryFactory.get();
scope.go=function(route){
if(route.uiroute&&route.uiroute!==$state.current.name){
CuiRouteHistoryFactory.truncate(route);
if(route.uirouteparams){
$state.go(route.uiroute,route.uirouteparams);
}else{
$state.go(route.uiroute);
}
}
};
},
template:'\n        <nav class="cui-breadcrumb">\n            <ul class="cui-breadcrumb__links">\n              <li class="cui-breadcrumb__link" ng-repeat="route in routes | limitTo:-3">\n                <span ng-class="{\'cui-breadcrumb__route\':!$last, \'cui-breadcrumb__routelast\':$last}" ng-click="go(route)">{{route.text}}</span>\n              </li>\n            </ul>\n        </nav>\n    '








//            <a ng-if="route.uiroute !== null" ui-sref="{{route.uiroute}}">{{route.text}}</a>
};});

angular.module('common').
directive('cuiSuccessPane',function($state,$timeout){return{

/*****
		--- Usage ---

        <cui-success-pane show-if="scope.variable" close-after="5000" on-close="scope.functionName()">
      		<p class="cui-modal__secondary-message">This is extra content</p>
      		<p class="cui-modal__secondary-message">{{scope.object.name}}</p>
    	</cui-success-pane>

        --- Optional Paramaters ---

            close-after - specify how long before the success pane automatically closes
                        - if timer is not specified, the pane will stay open until clicked

            on-close    - specify what scope function to fire when the modal closes
	*****/

restrict:'E',
transclude:true,
scope:{
showIf:'=',
closeAfter:'=',
onClose:'&'},

link:function link(scope){
scope.close=function(){
scope.showIf=!scope.showIf;
};

if(scope.closeAfter){
$timeout(function(){
if(scope.onClose){
scope.onClose()&&scope.onClose()();
}
scope.close();
},scope.closeAfter);
}
},
template:'\n        <div class="cui-modal" ng-if="showIf" ng-click="close()">\n            <div class="cui-modal__pane">\n                <div class="cui-modal__icon">\n                    <cui-icon cui-svg-icon="cui:check-with-border" class="cui-modal__icon"></cui-icon>\n                </div>\n                <span class="cui-modal__primary-message">{{\'cui-success\' | translate}}</span>\n                <ng-transclude></ng-transclude>\n            </div>\n        </div>\n    '};});












angular.module('common').
directive('unique',['$parse',function($parse){
return{
restrict:'A',
require:'ngModel',
link:function link(scope,element,attrs,ctrl){
var checkIfUnique=function checkIfUnique(values){
ctrl.$setValidity('unique',values[0]!==(values[1]||''));
};

scope.$watch(function(){return[scope.$eval(attrs.unique),ctrl.$viewValue];},checkIfUnique,function(newValues,oldValues){return angular.equals(newValues,oldValues);});
}};

}]);
angular.module('common').
factory('API',function(Base,CustomAPI,Loader,localStorageService,User,$location,$q,$timeout,$window,LocaleService){

var authInfo={};
var myCUI={};

Base.authInfo=authInfo;

var populateUserInfo=function populateUserInfo(info,redirectOpts){
var deferred=$q.defer();
var userInfo=void 0,roleList=void 0,entitlementList=void 0;
authInfo=info;
User.set(info);

$q.all([
myCUI.getPersonRoles({personId:authInfo.cuid}),
myCUI.getPersonEntitlements({personId:authInfo.cuid}),
myCUI.getPerson({personId:authInfo.cuid})]).

then(function(res){
roleList=res[0].map(function(x){return x.name;});
User.setRoles(roleList);

entitlementList=res[1].map(function(x){return x.privilegeName;});
User.setEntitlements(entitlementList);

userInfo=res[2];
LocaleService.setLocaleByDisplayName(appConfig.languages[userInfo.language]);
return myCUI.getOrganizationWithAttributes({organizationId:res[2].organization.id});
}).
then(function(res){
userInfo.organization=res;
User.set(userInfo);
//cui.log('populateUserInfo', User);
//get user notification related information  as lazy loading,
// No need to hold entire UI apps for this loading.
getNotificationDetails(userInfo);
deferred.resolve({roleList:roleList,redirect:redirectOpts});
});

return deferred.promise;
};

var getNotificationDetails=function getNotificationDetails(userInfo){
if(!Base.canGrantAppToUser()){
myCUI.getPersonPendingApps({personId:userInfo.id}).
then(function(res){
userInfo.pendingApps=res.map(function(x){return x.name;});
User.set(userInfo);
});
}else
{
$q.all([
myCUI.getRegistrationRequestsCount(),
myCUI.getPackageRequestsCount(),
myCUI.getOrgRegistrationRequestsCount(),
myCUI.getPackageRequestsCount({qs:[['requestor.id',userInfo.organization.id],['requestor.type','organization']]})]).

then(function(res){
userInfo.userRegistrationRequestsCount=res[0];
userInfo.userAppRequestsCount=res[1];
userInfo.orgRegistrationRequestsCount=res[2];
userInfo.orgAppRequestsCount=res[3];
userInfo.totalCount=res[0]+res[1]+res[2]+res[3];
User.set(userInfo);
});
}

};
var jwtAuthHandler=function jwtAuthHandler(){
return myCUI.covAuth({
originUri:appConfig.originUri,
authRedirect:window.location.href.split('#')[0]+'#/auth',
appRedirect:$location.path()});

};

var initApi=function initApi(){
var deferred=$q.defer();
Loader.onFor('wholeApp','custom-api-loading');
cui.api({
retryUnseured:true,
envDefs:['https://cuijs.run.covisintrnd.com/defs/env.json'],
dataCallDefs:[
'https://cuijs.run.covisintrnd.com/defs/auth.json',
'app/json/idm-call-defs.json',
CustomAPI]}).


then(function(cuiObject){
if(appConfig.logoutUrl){
Base.logout=function(){
myCUI.covLogout({
redirect:appConfig.logoutUrl,
qs:[['type','logout']]});

};
}else
Base.logout=cuiObject.covLogout;
angular.copy(cuiObject,myCUI);
myCUI.setAuthHandler(jwtAuthHandler);
// overwrite the service url to get the solution instance id
appConfig.solutionInstancesUrl&&myCUI.setServiceUrl(appConfig.solutionInstancesUrl);
return myCUI.covAuthInfo({originUri:appConfig.originUri});
}).
then(function(){
// reset the service url
appConfig.debugServiceUrl?
myCUI.setServiceUrl(appConfig.debugServiceUrl):
myCUI.setServiceUrl(appConfig.serviceUrl);
$timeout(function(){return Loader.offFor('wholeApp');},50);
deferred.resolve();
});
return deferred.promise;
};

var apiFactory={
cui:myCUI,
getUser:User.get,
setUser:User.set,
setPersonData:User.setPersonData,
getPersonData:User.getPersonData,
user:User.user,
initApi:initApi,
authenticateUser:function authenticateUser(redirectOpts){
var deferred=$q.defer();
var sessionInfo=myCUI.getCovAuthInfo();

if(redirectOpts.toState.name!=='auth'){
localStorageService.set('appRedirect',redirectOpts);// set the redirect to whatever the last state before auth was
Loader.onFor('wholeApp','redirecting-to-sso');// don't need to turn this loader off since covAuth takes us to another page
appConfig.solutionInstancesUrl&&myCUI.setServiceUrl(appConfig.solutionInstancesUrl);
jwtAuthHandler();// force redirect to SSO
}else
{
Loader.onFor('wholeApp','getting-user-info');
myCUI.handleCovAuthResponse({selfRedirect:true}).
then(function(res){
populateUserInfo(res,localStorageService.get('appRedirect')).
then(function(res){
deferred.resolve(res);
$timeout(function(){return Loader.offFor('wholeApp');},50);
});
});
}
return deferred.promise;
},
setAuthInfo:function setAuthInfo(newAuthInfo){
angular.copy(newAuthInfo[0],authInfo);
},
authInfo:authInfo};


return apiFactory;

});

angular.module('common').
factory('APIError',function(SharedService){
var APIError=Object.create(SharedService);
APIError.details=Object.assign({},APIError.details);
APIError.for=APIError.details;
return APIError;
});
angular.module('common').
factory('APIHelpers',function(API,$filter){
'use strict';

var apiHelpers={

getQs:function getQs(opts){
/**
                return a qs array from an object of key value pairs
                where the key is the search param and the value is the search value (accepts undefined values)
            **/

return Object.keys(_(opts).omitBy(_.isUndefined).value()).
reduce(function(query,param){
return query.concat([[param,opts[param]]]);
},[]);
},

buildPackageRequests:function buildPackageRequests(arrayOfApps){
/**
                returns an array of API package request promises
                based on an array of apps that we want to request

                the reason for the request should be under app._reason
                if it does not have a reason and the service package
                for that app requires one, we return undefined and
                attach an _error property (app._error = true) on that app
            **/

var numberOfApps=arrayOfApps.length;

if(!_.isArray(arrayOfApps)||numberOfApps===0){
throw new Error('The argument passed to APIHelpers.buildPackageRequests should be an array of apps, with 1 or more apps.');
return undefined;
}

var error=false;
for(var i=0;i<numberOfApps;i+=1){
if(arrayOfApps[i].servicePackage.requestReasonRequired&&!arrayOfApps[i]._reason){
arrayOfApps[i]._error=true;
if(!error){
error=true;
}
}
}
if(error){
return undefined;
}

var packagesBeingRequested=[];
var packageRequests=[];
for(var _i=0;_i<numberOfApps;_i+=1){
if(packagesBeingRequested.indexOf(arrayOfApps[_i].servicePackage.id)>=0){
// if the service package is already being requested, simply append to the reason.
// if the app doesn't have a reason and we got to this point then the package
// doesn't require a reason
if(arrayOfApps[_i]._reason){
packageRequests[packagesBeingRequested.indexOf(arrayOfApps[_i].servicePackage.id)].reason+=
'\n'+$filter('translate')('reason-im-requesting')+' '+$filter('cuiI18n')(arrayOfApps[_i].name)+': '+arrayOfApps[_i].name._reason;
}
}else
{
// cache the ids in another array so that we can look for an existing package request
// without having to search through the array of requests.
packagesBeingRequested.push(arrayOfApps[_i].servicePackage.id);
packageRequests.push({
requestor:{
id:API.getUser(),
type:'person'},

servicePackage:{
id:arrayOfApps[_i].servicePackage.id,
type:'servicePackage'},

reason:arrayOfApps[_i]._reason||''});

}
}
return packageRequests.map(function(data){return API.cui.createPackageRequest({data:data});});
},

flattenOrgHierarchy:function flattenOrgHierarchy(orgHierarchy){
/*
                Takes the organization hierarchy response and returns a flat object array containing the id's and name's of
                the top level organization as well as it's divisions.
            */

if(orgHierarchy){
var organizationArray=[];

organizationArray.push({
id:orgHierarchy.id,
name:orgHierarchy.name});


if(orgHierarchy.children){
orgHierarchy.children.forEach(function(division){
organizationArray.push({
id:division.id,
name:division.name});


if(division.children){
var flatArray=_.flatten(division.children);

flatArray.forEach(function(childDivision){
organizationArray.push({
id:childDivision.id,
name:childDivision.name});

});
}
});
}
return organizationArray;
}else
{
throw new Error('No organization hierarchy object provided');
}
},

getCollectionValuesAndCount:function getCollectionValuesAndCount(collection,key,returnAsCollection){
// Given a collection and a key, will return an object containing each different value found
// for the given key as well as the count of that key. If the optional parameter `returnAsCollection`
// is provided, will return data as a collection instead of an object. This was done as in some 
// cases (such as ng-repeat) it is easier to work with the data when its in an array.

// One area this method is handy is when you are getting all the different status values of a user list
// and need the count of each status.

var data={
all:0};


collection.forEach(function(object){
if(object.hasOwnProperty(key)){
var keyValue=object[key];
if(data.hasOwnProperty(keyValue)){
data[keyValue]+=1;
data.all+=1;
}else
{
data[keyValue]=1;
data.all+=1;
}
}
});

if(!returnAsCollection)return data;else
{
var collectionData=[];

Object.keys(data).forEach(function(dataKey){
var asObject={
value:dataKey,
count:data[dataKey]};


collectionData.push(asObject);
});

return collectionData;
}
}};


return apiHelpers;

});

angular.module('common').
factory('Base',function(APIError,BaseExtensions,Countries,Languages,LocaleService,Loader,Menu,Theme,Timezones,User,$state,$translate){

var baseFactory={
apiError:APIError,
appConfig:appConfig,
countries:Countries,
getLanguageCode:Languages.getCurrentLanguageCode,
languages:Languages.all,
loader:Loader,
menu:Menu,
theme:Theme,
timezones:Timezones.all,
user:User.user,

goBack:function goBack(stateName,stateParams){
var numberOfStates=$state.stateStack.length;
var i=numberOfStates-1;// Last state user visited
var counter=0;
var stateParamsFromStack=void 0;
do{
if($state.stateStack[i].name===stateName){
stateParamsFromStack=$state.stateStack[i].params;
}
i--;
counter++;
}while(!stateParamsFromStack&&i>=0&&counter<=20);// limit our attempts to 20
if(stateParamsFromStack)stateParams=stateParamsFromStack;
if(!stateParams)$state.go(stateName);else
$state.go(stateName,stateParams);
},

generateHiddenPassword:function generateHiddenPassword(password){return Array(password.length+1).join('•');}};


return Object.assign({},baseFactory,BaseExtensions);

});

angular.module('common').
factory('BaseExtensions',['cui.authorization.permitted','User',function(permitted,User){

function _test(){
cui.log('base extensions test');
return true;
}

return{
test:function test(){
return _test();
},
isPermitted:function isPermitted(logic){
//cui.log('isPermitted', logic, User.getRoles(), User.getEntitlements());
return permitted(logic,User.getRoles(),User.getEntitlements());
},
isOrgAdmin:function isOrgAdmin(){
//cui.log('isOrgAdmin', appConfig.orgAdminLogic, User.getRoles(), User.getEntitlements());
return permitted(appConfig.orgAdminLogic,User.getRoles(),User.getEntitlements());
},
canGrantAppToUser:function canGrantAppToUser(){
return permitted(appConfig.grantAppToUserLogic,User.getRoles(),User.getEntitlements());
},
canGrantAppToOrg:function canGrantAppToOrg(){
return permitted(appConfig.grantAppToOrgLogic,User.getRoles(),User.getEntitlements());
},
accessByAnyAdmin:function accessByAnyAdmin(){
return permitted(appConfig.accessByAnyAdmin,User.getRoles(),User.getEntitlements());
},
globalSearch:function globalSearch(){
return permitted(appConfig.globalSearch,User.getRoles(),User.getEntitlements());
},
accessToSecurityAndExchangeAdmins:function accessToSecurityAndExchangeAdmins(){
return permitted(appConfig.accessToSecurityAndExchangeAdmins,User.getRoles(),User.getEntitlements());
}};

}]);

angular.module('common').
factory('CommonAPI',function(API,APIError,$q){
'use strict';

// This service handles basic API calls that are done throughout the project.
// API calls that are more specific are handled in their own services.

var errorName='CommonAPIFactory.';

var getPerson=function getPerson(userId){
var defer=$q.defer();

APIError.offFor(errorName+'getPerson');

API.cui.getPerson({personId:userId}).
done(function(personResponse){
defer.resolve(personResponse);
}).
fail(function(err){
console.error('Failed getting person information');
APIError.onFor(errorName+'getPerson');
defer.reject(err);
});

return defer.promise;
};

var getOrganization=function getOrganization(organizationId){
var defer=$q.defer();

APIError.offFor(errorName+'getOrganization');

API.cui.getOrganization({organizationId:organizationId}).
done(function(orgResponse){
defer.resolve(orgResponse);
}).
fail(function(err){
console.error('Failed getting organization information');
APIError.onFor(errorName+'getOrganization');
defer.reject(err);
});

return defer.promise;
};

var getOrganizationHierarchy=function getOrganizationHierarchy(organizationId){
var defer=$q.defer();

APIError.offFor(errorName+'getOrgHierarchy');

API.cui.getOrganizationHierarchy({organizationId:organizationId}).
done(function(orgHierarchy){
defer.resolve(orgHierarchy);
}).
fail(function(err){
console.error('Failed getting organization hierarchy');
APIError.onFor(errorName+'getOrgHierarchy');
defer.reject(err);
});

return defer.promise;
};

return{
getPerson:getPerson,
getOrganization:getOrganization,
getOrganizationHierarchy:getOrganizationHierarchy};


});

angular.module('common').
factory('Countries',function($http,$rootScope,$translate){

var countries=[];

var GetCountries=function GetCountries(locale){
return $http.get(appConfig.languageResources.url+'countries/'+locale+'.json');
};

var setCountries=function setCountries(language){
language=language||'en';

if(language.indexOf('_')>-1){
language=language.split('_')[0];
}

GetCountries(language).
then(function(res){
countries.length=0;

res.data.forEach(function(country){
countries.push(country);
});
}).
catch(function(err){
console.log(err);
});
};

$rootScope.$on('languageChange',function(e,args){
setCountries(args);
});

var getCountryByCode=function getCountryByCode(countryCode){
return _.find(countries,function(countryObject){
return countryObject.code===countryCode;
});
};

setCountries($translate.proposedLanguage());

return{
list:countries,
getCountryByCode:getCountryByCode};

});

angular.module('common').
factory('CustomAPI',function(CustomAPIExtension){

var calls=[
{
cmd:'getPackageClaims',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.package.claim.v1+json',
call:'/service/v3/claims',
type:'GET'},

{
cmd:'getPersonPackageClaims',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.package.grant.claim.v1+json',
call:'/service/v3/persons/'+'{grantee}'+'/packages/'+'{packageId}'+'/claims',
type:'GET'},

{
cmd:'getCategories',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.category.v1+json',
call:'/service/v3/categories',
type:'GET'},

{
cmd:'getPersonRequestableApps',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.service.application.v1+json',
call:'/service/v3/applications/persons/'+'{personId}'+'/requestable',
type:'GET'},

{
cmd:'getPersonRequestableCount',
accepts:'text/plain',
call:'/service/v3/applications/persons/'+'{personId}'+'/requestable/count',
type:'GET'},

{
cmd:'getPersonGrantedApps',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.service.application.v1+json',
call:'/service/v3/applications/persons/'+'{personId}',
type:'GET'},

{
cmd:'getPersonGrantedAppCount',
cmdType:'secured',
accepts:'text/plain',
call:'/service/v3/applications/persons/'+'{personId}'+'/count',
type:'GET'},

{
cmd:'getOrganizationRequestableApps',
accepts:'application/vnd.com.covisint.platform.service.application.v1+json',
call:'/service/v3/applications/organizations/'+'{organizationId}',
type:'GET'},

{
cmd:'getOrganizationRequestableCount',
accepts:'text/plain',
call:'/service/v3/applications/organizations/'+'{organizationId}'+'/requestable/count',
type:'GET'},

{
cmd:'getOrganizationGrantedApps',
accepts:'application/vnd.com.covisint.platform.service.application.v1+json',
call:'/service/v3/applications/organizations/'+'{organizationId}',
type:'GET'},

{
cmd:'getOrganizationGrantedCount',
accepts:'text/plain',
call:'/service/v3/applications/organizations/'+'{organizationId}'+'/count',
type:'GET'},

{
cmd:'getPersonGrantableApps',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.service.application.v1+json',
call:'/service/v3/applications/persons/'+'{personId}'+'/grantable',
type:'GET'},

{
cmd:'getPersonGrantableCount',
accepts:'text/plain',
call:'/service/v3/applications/persons/'+'{personId}'+'/grantable/count',
type:'GET'},

{
cmd:'getOrganizationGrantableApps',
accepts:'application/vnd.com.covisint.platform.service.application.v1+json',
call:'/service/v3/applications/organizations/'+'{organizationId}'+'/grantable',
type:'GET'},

{
cmd:'getOrganizationGrantableCount',
accepts:'text/plain',
call:'/service/v3/applications/organizations/'+'{organizationId}'+'/grantable/count',
type:'GET'},

{
cmd:'getPersonStatusHistory',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.person.status.history.v1+json',
call:'/person/v3/persons/statusHistory',
type:'GET'},

{
cmd:'getPersonPasswordChangeHistory',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.authn.password.change.history.req.v1+json',
call:'/authentication/v4/passwords/changeHistory',
type:'GET'},

{
cmd:'getPersonPendingServicePackages',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.package.request.v1+json',
call:'/service/v3/requests',
type:'GET'},

{
cmd:'getPackage',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.package.v1+json',
call:'/service/v3/packages/'+'{packageId}',
type:'GET'},

{
cmd:'denyPackage',
cmdType:'secured',
accepts:'text/plain',
type:'POST',
call:'/service/v3/requests/tasks/deny'},

{
cmd:'approvePackage',
cmdType:'secured',
accepts:'text/plain',
type:'POST',
call:'/service/v3/requests/tasks/approve'},

{
cmd:'grantClaims',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.package.grant.claim.v1+json',
call:'/service/v3/packages/grants/claims',
type:'PUT'},

{
cmd:'getOrganizationRegistrationRequest',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.organization.request.v1+json',
call:'/organization/v3/requests',
type:'GET'},

{
cmd:'getPersonRegistrationRequest',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.person.request.v1+json',
call:'/person/v3/requests',
type:'GET'},

{
cmd:'approvePersonRegistration',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.person.request.v1+json',
call:'/person/v3/requests/tasks/approve',
type:'POST'},

{
cmd:'denyPersonRegistration',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.person.request.v1+json',
call:'/person/v3/requests/tasks/deny',
type:'POST'},

{
cmd:'getAllOrganizationRequests',
accepts:'application/vnd.com.covisint.platform.organization.request.v1+json',
call:'/organization/v3/requests',
type:'GET'},

{
cmd:'getPersonEntitlements',
cmdType:'secured',
contentType:'application/vnd.com.covisint.platform.person.privilege.v1+json',
accepts:'application/vnd.com.covisint.platform.person.privilege.v1+json',
call:'/person/v3/persons/privileges/'+'{personId}',
type:'GET'},

{cmd:'getPersonGrantedCount',
cmdType:'secured',
accepts:'text/plain',
call:'/person/v3/persons/count',
type:'GET'},

{
cmd:'suspendOrgPkg',
cmdType:'secured',
accepts:'application/vnd.com.covisint.platform.package.grant.status.request.v1+json',
contentType:'application/vnd.com.covisint.platform.package.grant.status.request.v1+json',
call:'/service/v3/grants/tasks/organization/package/suspend',
type:'POST'}];



return calls.concat(CustomAPIExtension);

});

angular.module('common').
factory('CustomAPIExtension',function(){

/* 	
		Any calls added here will be added to the API.cui object.
	*/

var calls=[
/* ---------- Registration Nonce Calls ---------- */
{
cmd:'initiateNonce',
cmdType:'unsecured',
type:'GET',
accepts:'application/json',
call:'/registration/v1/registrations/open/initiate'},

{
cmd:'getOrganizationNonce',
cmdType:'nonce',
type:'GET',
accepts:'application/vnd.com.covisint.platform.organization.v1+json',
call:'/registration/v1/registrations/organizations/{organizationId}'},

{
cmd:'getOrganizationsNonce',
cmdType:'nonce',
type:'GET',
accepts:'application/vnd.com.covisint.platform.organization.v1+json',
call:'/registration/v1/registrations/organizations'},

{
cmd:'getSecurityQuestionsNonce',
cmdType:'nonce',
type:'GET',
accepts:'application/vnd.com.covisint.platform.securityquestion.v1+json',
call:'/registration/v1/registrations/securityQuestions'},

{
cmd:'postUserRegistrationNonce',
cmdType:'nonce',
type:'POST',
accepts:'application/vnd.com.covisint.platform.person.password.account.v1+json',
contentType:'application/vnd.com.covisint.platform.person.password.account.v1+json',
call:'/registration/v1/registrations/persons/registration'},

{
cmd:'getPasswordPoliciesNonce',
cmdType:'nonce',
type:'GET',
accepts:'application/vnd.com.covisint.platform.password.policy.v1+json',
call:'/registration/v1/registrations/passwords/policies/{policyId}'},

{
cmd:'postPersonRequestNonce',
cmdType:'nonce',
type:'POST',
accepts:'application/vnd.com.covisint.platform.person.request.v1+json',
contentType:'application/vnd.com.covisint.platform.person.request.v1+json',
call:'/registration/v1/registrations/persons/requests'},

{
cmd:'getOrgPackageGrantsNonce',
cmdType:'nonce',
type:'GET',
accepts:'application/vnd.com.covisint.platform.package.grant.v1+json',
call:'/registration/v1/registrations/organizations/{organizationId}/packages'},

{
cmd:'validateUsernameEmailNonce',
cmdType:'nonce',
type:'POST',
accepts:'application/vnd.com.covisint.platform.person.password.account.v1+json',
contentType:'application/vnd.com.covisint.platform.person.password.account.v1+json',
call:'/registration/v1/registrations/persons/registration/validate'},

{
cmd:'securedInitiate',
cmdType:'unsecured',
type:'GET',
accepts:'application/vnd.com.covisint.platform.person.invitation.v1+json',
call:'/registration/v1/registrations/securedInvite/initiate/{invitationId}'},

{
cmd:'getOrgAppsNonce',
cmdType:'nonce',
type:'GET',
accepts:'application/vnd.com.covisint.platform.service.application.v1+json',
call:'/registration/v1/applications/organizations/{organizationId}'},

{
cmd:'getOrgAppsCountNonce',
cmdType:'nonce',
type:'GET',
accepts:'text/plain',
call:'/registration/v1/applications/organizations/{organizationId}/count'},

{
cmd:'getOrganizationsCountNonce',
cmdType:'nonce',
type:'GET',
accepts:'text/plain',
call:'/registration/v1/registrations/organizations/count'},

//New Calls-S
{cmd:"getOrgRegistrationRequests",call:"/registration/v1/organization/requests",type:"GET",accepts:"application/vnd.com.covisint.platform.organization.request.v1+json",contentType:"application/vnd.com.covisint.platform.organization.request.v1+json"},
{cmd:"getOrgRegistrationRequestsCount",call:"/registration/v1/organization/requests/count",type:"GET",accepts:"text/plain"},
{cmd:'approveOrgRegistrationRequest',call:'/registration/v1/organization/requests/tasks/approve',type:'POST',accepts:'application/vnd.com.covisint.platform.organization.request.v1+json'},
{cmd:'denyOrgRegistrationRequest',call:'/registration/v1/organization/requests/tasks/deny',type:'POST',accepts:'application/vnd.com.covisint.platform.organization.request.v1+json'},
// ADMIN... imported from Coke...
{cmd:'getPackageByQuery',accepts:'application/vnd.com.covisint.platform.package.v1+json',call:'/service/v3/packages',type:'GET'},
{cmd:"getPersonByQuery",call:"/person/v3/persons",type:"GET",accepts:"application/vnd.com.covisint.platform.person.v1+json"},
{cmd:"getRegistrationRequests",call:"/registration/v1/person/requests",type:"GET",accepts:"application/vnd.com.covisint.platform.person.request.v1+json",contentType:"application/vnd.com.covisint.platform.person.request.v1+json"},
{cmd:"createRegistrationRequest","cmdType":"unsecured",call:"/registration/v1/person/requests",type:"POST",accepts:"application/vnd.com.covisint.platform.person.request.v1+json",contentType:"application/vnd.com.covisint.platform.person.request.v1+json"},
{cmd:"getOrganizationSecured","cmdType":"secured","call":"/organization/v3/organizations/{organizationId}","type":"GET","accepts":"application/vnd.com.covisint.platform.organization.v1+json"},
{cmd:"getPasswordPolicySecured","cmdType":"secured","call":"/authn/v4/passwords/policies/{policyId}","type":"GET","accepts":"application/vnd.com.covisint.platform.password.policy.v1+json"},
{cmd:'grantClaims',accepts:'application/vnd.com.covisint.platform.package.grant.claim.v1+json',contentType:"application/vnd.com.covisint.platform.package.grant.claim.v1+json",call:'/service/v3/packages/grants/claims',type:'PUT'},
{cmd:'initiateRegistration',cmdType:'unsecured',call:'/registration/v1/registrations/open/initiate',type:'GET',accepts:'application/vnd.com.covisint.platform.person.invitation.v1+json'},
{cmd:'initiateSecuredRegistration',cmdType:'unsecured',call:'/registration/v1/registrations/securedInvite/initiate/{id}',type:'GET',accepts:'application/vnd.com.covisint.platform.person.invitation.v1+json'},
{cmd:'createRegistrationNonce',cmdType:'nonce',call:'/registration/v1/registrations/persons/registration',type:'POST',accepts:'application/vnd.com.covisint.platform.person.password.account.v1+json',contentType:'application/vnd.com.covisint.platform.person.password.account.v1+json'},
{cmd:'createRegistrationRequestNonceWithPkg',cmdType:'nonce',call:'/registration/v1/registrations/persons/requests',type:'POST',accepts:'application/vnd.com.covisint.platform.person.request.v1+json',contentType:'application/vnd.com.covisint.platform.person.request.v1+json'},
{cmd:'approvePersonRegistrationRequest',call:'/registration/v1/person/requests/tasks/approve',type:'POST',accepts:'application/vnd.com.covisint.platform.person.request.v1+json'},
{cmd:'denyPersonRegistrationRequest',call:'/registration/v1/person/requests/tasks/deny',type:'POST',accepts:'application/vnd.com.covisint.platform.person.request.v1+json'},
{cmd:'validateRegistrationNonce',cmdType:'nonce',call:'/registration/v1/registrations/persons/registration/validate',type:'POST',accepts:'text/plain'},
//{cmd: 'getOrganizationNonce',cmdType:'nonce',call: '/registration/v1/registrations/organizations/{id}', type:'GET', accepts: 'application/vnd.com.covisint.platform.organization.v1+json'},
{cmd:'getPasswordPolicyNonce',cmdType:'nonce',call:'/registration/v1/registrations/passwords/policies/{id}',type:'GET',accepts:'application/vnd.com.covisint.platform.password.policy.v1+json'},
{cmd:'getAttributeTemplatesNonce',cmdType:'nonce',call:'/registration/v1/registrations/attributeTemplates',type:'GET',accepts:'application/vnd.com.covisint.platform.attribute.template.v1+json'},
{cmd:"getOrganizationPackagesSecured","cmdType":"secured","call":"/service/v3/organizations/{organizationId}/packages","type":"GET","accepts":"application/vnd.com.covisint.platform.package.grant.v1+json"},
{cmd:"validatePasswordSecured",call:"/person/v3/persons/password/validate",type:"POST",accepts:"application/vnd.com.covisint.platform.password.validation.response.v1+json","contentType":"application/vnd.com.covisint.platform.password.validation.v1+json"},
{cmd:"getPackageRequestsCount",call:"/service/v3/requests/count",type:"GET",accepts:"text/plain"},
{cmd:"getOrganizationPackagesCount",call:"/service/v3/organizations/{organizationId}/packages/count",type:"GET",accepts:"text/plain"},
{cmd:"getRegistrationRequestsCount",call:"/registration/v1/person/requests/count",type:"GET",accepts:"text/plain"},
{cmd:"getPackagesRequestedCount",call:"/service/v3/persons/{personId}/packages/count",type:"GET",accepts:"text/plain"},
{cmd:'validatePasswordNonce',cmdType:'nonce',call:'/registration/v1/registrations/persons/password/validate',type:'POST',accepts:'application/vnd.com.covisint.platform.password.validation.response.v1+json',contentType:'application/vnd.com.covisint.platform.password.validation.v1+json'}];




return calls;

});

angular.module('common').
factory('DataStorage',function(API,localStorageService){

var storage=localStorageService.get('dataStorage')||{};
var dataStorage={};

var initStorageIfUndefined=function initStorageIfUndefined(){
if(!storage[API.getUser()]){
storage[API.getUser()]={};
}
};

var saveToLocaStorage=function saveToLocaStorage(){
localStorageService.set('dataStorage',storage);
};

/****************************************
        FOR OBJECT AND ARRAY TYPE DATA
    ****************************************/

// completely overrides a type
dataStorage.setType=function(type,data){
initStorageIfUndefined();
storage[API.getUser()][type]=data;
saveToLocaStorage();
};

dataStorage.getType=function(type){
if(!storage[API.getUser()]){
return undefined;
}
return storage[API.getUser()][type];
};

dataStorage.deleteType=function(type){
if(!storage[API.getUser()]||!storage[API.getUser()][type]){
return;
}
delete storage[API.getUser()][type];
saveToLocaStorage();
};

// deletes the storage for just the currently logged in user
dataStorage.deleteUserStorage=function(){
if(storage[API.getUser()]){
delete storage[API.getUser()];
}
saveToLocaStorage();
};

// deletes the storage for every user in local storage
dataStorage.clear=function(){
storage={};
saveToLocaStorage();
};

dataStorage.getUserStorage=function(){return storage[API.getUser()];};

/****************************************
        FOR ARRAY TYPE DATA ONLY
    ****************************************/

// appends to a certain type
// NOTE: Make sure to use data that you can later distinguish between using dataThatMatches
// I recommend using replaceDataThatMatches instead unless you know what you're doing
dataStorage.appendToType=function(type,data){
initStorageIfUndefined();
if(!storage[API.getUser()][type]){
storage[API.getUser()][type]=[data];
}else
if(!_.isArray(storage[API.getUser()][type])){
throw new Error('Tried appending to an existing data type that is not an array in dataStorage.');
return;
}else
{
storage[API.getUser()][type].push(data);
}
saveToLocaStorage();
};

// returns ALL data that matches against a given comparison or undefined if no results
dataStorage.getDataThatMatches=function(type,comparison){
if(!storage[API.getUser()]||!storage[API.getUser()][type]){
return undefined;
}else
if(!_.isArray(storage[API.getUser()][type])){
throw new Error('Tried using DataStorage.getDataThatMatches on a type that isn\'t an array. Use .getType(type) instead.');
return;
}else
{
var matches=storage[API.getUser()][type].filter(function(x){
return _.isMatch(x,comparison);
});
if(matches.length>0){
return matches;
}else
{
return undefined;
}
}
};

// replaces all data that matches against a certain comparison and appends
// new data to that type's array
dataStorage.replaceDataThatMatches=function(type,comparison,newData){
dataStorage.deleteDataThatMatches(type,newData);
dataStorage.appendToType(type,newData);
};

dataStorage.deleteDataThatMatches=function(type,comparison){
if(!storage[API.getUser()]||!storage[API.getUser()][type]){
return;
}else
if(!_.isArray(storage[API.getUser()][type])){
throw new Error('Tried using DataStorage.deleteDataThatMatches on a type that isn\'t an array. Use .deleteType(type) instead.');
return;
}else
{
storage[API.getUser()][type]=storage[API.getUser()][type].filter(function(x){
return!_.isMatch(x,comparison);
});
}
saveToLocaStorage();
};

return dataStorage;
});

angular.module('common').
factory('Languages',['$cuiI18n','LocaleService',function($cuiI18n,LocaleService){

var languages=$cuiI18n.getLocaleCodesAndNames();

return{
all:languages,
getCurrentLanguageCode:function getCurrentLanguageCode(){
if(LocaleService.getLocaleCode().indexOf('_')>-1){
return LocaleService.getLocaleCode().split('_')[0];
}else{
return LocaleService.getLocaleCode();
}
}};

}]);
angular.module('common').
factory('Loader',function(SharedService){
var Loader=Object.create(SharedService);
Loader.details=Object.assign({},Loader.details);
Loader.for=Loader.details;
return Loader;
});

angular.module('common').
factory('Menu',function(snapRemote,$rootScope,$window){

var shouldShowMobileNav=function shouldShowMobileNav(){
if($window.innerWidth>=1000){
snapRemote.close();
}
};

// Fixes issue where opening up the mobile menu and then expanding into desktop mode 
// would leave all content pushed to the right.
$window.onresize=_.debounce(function(){
shouldShowMobileNav();
},1000);

return{
desktop:{
state:'open',// default state for desktop menu
enabled:true,
open:function open(){
this.state='closed';
},
close:function close(){
this.state='closed';
},
toggle:function toggle(){
this.state==='open'?this.state='closed':this.state='open';
},
hide:function hide(){
this.enabled=false;
},
show:function show(){
this.enabled=true;
}},


mobile:{
state:'closed',// default state for mobile menu
enabled:true,
open:function open(){
this.state='open';
},
close:function close(){
this.state='close';
},
toggle:function toggle(){
this.state==='open'?this.state='closed':this.state='open';
},
hide:function hide(){
this.enabled=false;
},
show:function show(){
this.state=true;
}},


handleStateChange:function handleStateChange(stateMenuOptions){
if(!angular.isDefined(stateMenuOptions)){
this.desktop.show();
this.mobile.show();
}else
{
angular.isDefined(stateMenuOptions.desktop)&&stateMenuOptions.desktop===false?this.desktop.hide():this.desktop.show()(
angular.isDefined(stateMenuOptions.mobile)&&stateMenuOptions.mobile===false)?this.mobile.hide():this.mobile.show();
}
}};

});

angular.module('common').
factory('Organization',function(API,$q){

var factoryName='organizationFactory.';

var getOrganizationAdmins=function getOrganizationAdmins(organizationId){
var defer=$q.defer();

API.cui.getOrganizationSecurityAdmins({organizationId:organizationId}).
done(function(response){return defer.resolve(response);}).
fail(function(error){return defer.reject(error);});

return defer.promise;
};

var getOrganizationPasswordPolicy=function getOrganizationPasswordPolicy(policyId){
var defer=$q.defer();

API.cui.getPasswordPolicy({policyId:policyId}).
done(function(response){return defer.resolve(response);}).
fail(function(error){return defer.reject(error);});

return defer.promise;
};

var getOrganizationAuthenticationPolicy=function getOrganizationAuthenticationPolicy(policyId){
var defer=$q.defer();

API.cui.getAuthenticationPolicy({policyId:policyId}).
done(function(response){return defer.resolve(response);}).
fail(function(error){return defer.reject(error);});

return defer.promise;
};

var getOrganization=function getOrganization(organizationId){
return API.cui.getOrganizationWithAttributes({organizationId:organizationId});
};

var initOrganizationProfile=function initOrganizationProfile(organizationId,policyId,authPolicyId){
var defer=$q.defer();
var organizationProfile={};
var callsToComplete=3;
var callsCompleted=0;

getOrganizationAdmins(organizationId).
then(function(response){return organizationProfile['admins']=response;}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===callsToComplete)defer.resolve(organizationProfile);
});

getOrganizationPasswordPolicy(policyId).
then(function(response){return organizationProfile['passwordPolicy']=response;}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===callsToComplete)defer.resolve(organizationProfile);
});

getOrganizationAuthenticationPolicy(authPolicyId).
then(function(response){return organizationProfile['authenticationPolicy']=response;}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===callsToComplete)defer.resolve(organizationProfile);
});

return defer.promise;
};

return{
getOrganizationAdmins:getOrganizationAdmins,
getOrganizationPasswordPolicy:getOrganizationPasswordPolicy,
getOrganizationAuthenticationPolicy:getOrganizationAuthenticationPolicy,
getOrganization:getOrganization,
initOrganizationProfile:initOrganizationProfile};


});

angular.module('common').
factory('PersonAndOrgRequest',function(API,APIError,CommonAPI,$q){
'use strict';

/*
		Use this service as a helper when dealing with person requests.

		Allows you to get a person's registration request or a wrapper call that also gets you the person's and their
		organization's data.
	*/

var PersonAndOrgRequestFactory={};
var errorName='PersonAndOrgRequestFactory.';

/****************************************
				Service Functions
	****************************************/

// Returns the registration request associated with the userId
PersonAndOrgRequestFactory.getPersonRegistrationRequest=function(userId){
var defer=$q.defer();

API.cui.getPersonRegistrationRequest({qs:[['registrant.id',userId]]}).
done(function(registrationResponse){
defer.resolve(registrationResponse[0]);
}).
fail(function(err){
console.error('Failed getting user\'s registration request');
APIError.onFor(errorName+'getRegistrationRequest');
defer.reject(err);
});

return defer.promise;
};

PersonAndOrgRequestFactory.getOrgRegistrationRequest=function(organizationId){
var defer=$q.defer();

API.cui.getOrgRegistrationRequests({qs:[['organization.id',organizationId]]}).
done(function(registrationResponse){
defer.resolve(registrationResponse[0]);
}).
fail(function(err){
console.error('Failed getting organization\'s registration request');
APIError.onFor(errorName+'getRegistrationRequest');
defer.reject(err);
});

return defer.promise;
};

/*
		Wrapper call for: 	PersonRequest.getPersonRegistrationRequest()
							CommonAPI.getPerson()
							CommonAPI.getOrganization()
	*/
PersonAndOrgRequestFactory.getRegistrationRequestData=function(userId,organizationId,type){
var defer=$q.defer();
var callsCompleted=0;
var requestData={};

if(type==='person'){
PersonAndOrgRequestFactory.getPersonRegistrationRequest(userId).
then(function(registrationRequest){
requestData.request=registrationRequest;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(requestData);
}
});
}else
{
PersonAndOrgRequestFactory.getOrgRegistrationRequest(organizationId).
then(function(registrationRequest){
requestData.request=registrationRequest;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(requestData);
}
});
}

CommonAPI.getPerson(userId).
then(function(personData){
requestData.personData=personData;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(requestData);
}
});

CommonAPI.getOrganization(organizationId).
then(function(organizationData){
requestData.organization=organizationData;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(requestData);
}
});

return defer.promise;
};

// Provided a decision ('approved' or 'denied') and the person request object
// Handles the approval/denial of the person request
PersonAndOrgRequestFactory.handleRequestApproval=function(decision,request){
var data=[['requestId',request.id]];

if(decision==='approved'){
API.cui.approvePersonRegistration({qs:data});
}else
if(decision==='denied'){
if(request.rejectReason){
data.push(['reason',request.rejectReason]);
return API.cui.denyPersonRegistration({qs:data});
}else
{
return API.cui.denyPersonRegistration({qs:data});
}
}else
{
throw new Error('Requires a decision of "approved" or "denied" and the request object.');
}
};

return PersonAndOrgRequestFactory;

});

angular.module('common').
factory('PersonRequest',function(API,APIError,CommonAPI,$q){
'use strict';

/*
		Use this service as a helper when dealing with person requests.

		Allows you to get a person's registration request or a wrapper call that also gets you the person's and their
		organization's data.
	*/

var personRequestFactory={};
var errorName='PersonRequestFactory.';

/****************************************
				Service Functions
	****************************************/

// Returns the registration request associated with the userId
personRequestFactory.getPersonRegistrationRequest=function(userId){
var defer=$q.defer();

API.cui.getPersonRegistrationRequest({qs:[['registrant.id',userId]]}).
done(function(registrationResponse){
defer.resolve(registrationResponse[0]);
}).
fail(function(err){
console.error('Failed getting user\'s registration request');
APIError.onFor(errorName+'getRegistrationRequest');
defer.reject(err);
});

return defer.promise;
};

/*
		Wrapper call for: 	PersonRequest.getPersonRegistrationRequest()
							CommonAPI.getPerson()
							CommonAPI.getOrganization()
	*/
personRequestFactory.getPersonRegistrationRequestData=function(userId,organizationId){
var defer=$q.defer();
var callsCompleted=0;
var requestData={};

personRequestFactory.getPersonRegistrationRequest(userId).
then(function(registrationRequest){
requestData.request=registrationRequest;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(requestData);
}
});

CommonAPI.getPerson(userId).
then(function(personData){
requestData.personData=personData;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(requestData);
}
});

CommonAPI.getOrganization(organizationId).
then(function(organizationData){
requestData.organization=organizationData;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(requestData);
}
});

return defer.promise;
};

// Provided a decision ('approved' or 'denied') and the person request object
// Handles the approval/denial of the person request
personRequestFactory.handleRequestApproval=function(decision,request){
var data=[['requestId',request.id]];

if(decision==='approved'){
API.cui.approvePersonRegistration({qs:data});
}else
if(decision==='denied'){
if(request.rejectReason){
data.push(['reason',request.rejectReason]);
return API.cui.denyPersonRegistration({qs:data});
}else
{
return API.cui.denyPersonRegistration({qs:data});
}
}else
{
throw new Error('Requires a decision of "approved" or "denied" and the request object.');
}
};

return personRequestFactory;

});

angular.module('common').
factory('Registration',function(API,APIError,Base,$q){

var self={};
var pub={};

// Helper functions to build out the person and request objects needed for registration
var build={
person:function person(registrationData){
var personData=Object.assign({},registrationData.profile);

personData.addresses[0].country=registrationData.userCountry.originalObject.code;
personData.organization={id:registrationData.organization.id};
personData.language=registrationData.profile.language.id;
personData.timezone=registrationData.profile.timezone.id;

if(personData.phones[0]){
personData.phones[0].type='main';
}

return personData;
},
passwordAccount:function passwordAccount(registrationData){
return{
version:'1',
username:registrationData.login.username,
password:registrationData.login.password,
passwordPolicy:registrationData.organization.passwordPolicy,
authenticationPolicy:registrationData.organization.authenticationPolicy};

},
securityQuestionAccount:function securityQuestionAccount(registrationData){
return{
version:'1',
questions:[{
question:{
id:registrationData.login.question1.id,
type:'question',
realm:registrationData.organization.realm},

answer:registrationData.login.challengeAnswer1,
index:1},

{
question:{
id:registrationData.login.question2.id,
type:'question',
realm:registrationData.organization.realm},

answer:registrationData.login.challengeAnswer2,
index:2}]};


},
walkupSubmit:function walkupSubmit(registrationData){
var _registrationData=Object.assign({},registrationData);

return{
person:this.person(_registrationData),
passwordAccount:this.passwordAccount(_registrationData),
securityQuestionAccount:this.securityQuestionAccount(_registrationData)};

},
InvitedSubmit:function InvitedSubmit(registrationData,inviteId){
var _registrationData=Object.assign({},registrationData);

return{
person:this.person(_registrationData),
passwordAccount:this.passwordAccount(_registrationData),
securityQuestionAccount:this.securityQuestionAccount(_registrationData),
inviteId:inviteId};

},
servicePackageRequest:function servicePackageRequest(personId,personRealm,packageData,requestReason){
var request={
registrant:{
id:personId,
type:'person',
realm:personRealm},

justification:requestReason||'User Walkup Registration'};


if(packageData&&packageData.selected){
request.packages=[];
angular.forEach(packageData.selected,function(servicePackage){
// userWalkup.applications.selected is an array of strings that looks like
// ['<appId>,<packageId>,<appName>']
request.packages.push({
id:servicePackage.split(',')[1],
type:'servicePackage'});

});
request.packages=_.uniqBy(request.packages,'id');
}

return request;
}


/**
     * this method makes sure to make the call but before it calls cui.initiateNonce
     * @param method method name
     * @param args method arguments
     * @returns {*} promise
     */};
self.makeNonceCall=function(method){for(var _len=arguments.length,args=Array(_len>1?_len-1:0),_key=1;_key<_len;_key++){args[_key-1]=arguments[_key];}
var deferred=$.Deferred();
var tag="registration/self/makeNonceCall";

API.cui.initiateNonce().
then(function(res){

API.cui[method].apply(API.cui,args).
then(function(result){
deferred.resolve(result);
}).
fail(function(error){
deferred.reject(error);
});

}).
fail(function(error){
console.error(tag,error);
deferred.reject(error);
});

return deferred.promise();
};

/**
     * TODO: once the promise gets an error message, we are going to resolve as false. This is temporary.
     * Makes an api call to know if the registrating user's username or email address
     * appear already been taken.
     * @param stringParams a param array having either or both userName and emalAddress.
     * @returns {{promise, valid: (function(*=)), catch: (function(*))}}
     */
self.isUsernameOrEmailTaken=function(stringParams){
var tag="registration/self/isUsernameOrEmailTaken";

return{
promise:function(){
var defered=$q.defer();

if(stringParams){

self.makeNonceCall("validateUsernameEmailNonce",{qs:stringParams}).then(function(res){
defered.resolve(true);
}).fail(function(error){
defered.resolve(false);
console.error(tag+".error",error);
});
}else{
defered.resolve(true);
}

return defered.promise;
}(),
valid:function valid(res){
return res;
},
catch:function _catch(error){
// do something with the error here
console.error(tag+".catch","there is an error, :) ");
}};

};

pub.getOrganizations=function(){
return self.makeNonceCall("getOrganizationsNonce");
};

pub.getSecurityQuestions=function(){
return self.makeNonceCall("getSecurityQuestionsNonce");
};

// Returns organizations and security questions for the realm.
// Both must resolve for the walkup registration to work.
pub.initWalkupRegistration=function(pageSize){
var defer=$q.defer();
var data={};

APIError.offFor('RegistrationFactory.initWalkup');

API.cui.initiateNonce().
then(function(){
//  2-13-2017 filter resuts by status is not available for count now.
return API.cui.getOrganizationsCountNonce();
}).
then(function(res){
data.organizationCount=res;
return API.cui.getOrganizationsNonce({qs:[['page',1],['pageSize',pageSize],['status','active']]});
}).
then(function(res){
data.organizations=res;
return API.cui.getSecurityQuestionsNonce();
}).
then(function(res){
data.securityQuestions=res;
defer.resolve(data);
}).
fail(function(error){
APIError.onFor('RegistrationFactory.initWalkup');
defer.reject(error);
});

return defer.promise;
};
// validates invite and Returns Target organization
//Must resolve for the Invited registration to work.
pub.initInvitedRegistration=function(encodedString){
var defer=$q.defer();
var data={};

APIError.offFor('RegistrationFactory.initInvited');

API.cui.securedInitiate({invitationId:encodedString}).
then(function(res){
data.invitationData=res;
return API.cui.getOrganizationNonce({organizationId:res.targetOrganization.id});
}).
then(function(res){
data.organization=res;
return API.cui.getSecurityQuestionsNonce();
}).
then(function(res){
data.securityQuestions=res;
defer.resolve(data);
}).
fail(function(error){
APIError.onFor('RegistrationFactory.initInvited');
defer.reject(error);
});

return defer.promise;
};

pub.walkupSubmit=function(registrationData){
var defer=$q.defer();
var submitData=build.walkupSubmit(registrationData);

API.cui.initiateNonce().
then(function(){
return API.cui.postUserRegistrationNonce({data:submitData});
}).
then(function(res){
var packageRequestData=build.servicePackageRequest(res.person.id,res.person.realm,registrationData.applications,registrationData.requestReason);
return API.cui.postPersonRequestNonce({data:packageRequestData});
}).
then(function(res){
defer.resolve(res);
}).
fail(function(error){
defer.reject(error);
});

return defer.promise;
};

pub.invitedSubmit=function(registrationData,encodedString,invitationId){
var defer=$q.defer();
var submitData=build.InvitedSubmit(registrationData,invitationId);

API.cui.securedInitiate({invitationId:encodedString}).
then(function(){
return API.cui.postUserRegistrationNonce({qs:[['inviteId',invitationId]],data:submitData});
}).
then(function(res){
var packageRequestData=build.servicePackageRequest(res.person.id,res.person.realm,registrationData.applications,registrationData.requestReason);
return API.cui.postPersonRequestNonce({data:packageRequestData});
}).
then(function(res){
defer.resolve(res);
}).
fail(function(error){
defer.reject(error);
});

return defer.promise;
};

pub.getOrgAppsByPage=function(page,pageSize,organizationId){
return API.cui.getOrgAppsNonce({organizationId:organizationId,qs:[['page',page],['pageSize',pageSize]]});
};

pub.getOrgsByPageAndName=function(page,pageSize,name){
if(name!==undefined){
return self.makeNonceCall("getOrganizationsNonce",{qs:[['page',page],['pageSize',pageSize],['status','active'],['name',name]]});
}else
{
return self.makeNonceCall("getOrganizationsNonce",{qs:[['page',page],['pageSize',pageSize],['status','active']]});
}

};

pub.selectOrganization=function(organization,pageSize){
var deferred=$.Deferred();
var results={
grants:[]};


API.cui.initiateNonce().
then(function(res){
return API.cui.getOrgAppsCountNonce({organizationId:organization.id});
}).
then(function(res){
results.appCount=res;
return pub.getOrgAppsByPage(1,pageSize,organization.id);
}).
then(function(res){
res.forEach(function(grant){
if(grant.servicePackage.requestable)results.grants.push(grant);
});
return API.cui.getPasswordPoliciesNonce({policyId:organization.passwordPolicy.id});
}).
then(function(res){
results.passwordRules=res.rules;
deferred.resolve(results);
}).
fail(function(error){
deferred.reject(error);
});

return deferred.promise();
};

pub.getTac=function(packageId){
var deferred=$q.defer();
self.makeNonceCall("getOrgTacOfPackage",{packageId:packageId}).
then(function(res){
deferred.resolve(res);
}).
fail(function(err){
console.log("Error in fetching TaC for application "+packageId);
console.log(err);
deferred.reject(err);
});
return deferred.promise;
};

pub.isUsernameTaken=function(name){
return self.isUsernameOrEmailTaken([['userName',name]]);
};

pub.isEmailTaken=function(email){
return self.isUsernameOrEmailTaken([['emailAddress',email]]);
};

return pub;

});

angular.module('common').
service('SharedService',function(){
/*****
        this service serves as an instantiable class
        that can be extended to provide information throughout the app
        using the base controller

        How to use:
        angular.module('myModule')
        .factory/service/provider('MyProvider', function(SharedService){
            const MyProvider = Object.create(SharedService)
        })

        MyProvider now has an object that serves as a data holder for switchable loaders, error messages etc.

        methods
        .onFor(property:String, <message>:String)
            enables that property in the details object, setting the message associated with that property
            if you use onFor for multiple properties without using "offFor" to disable them
            there's a count that gets incremented, and that property will only be disabled once offFor
            is called on that property n times, where n is the amount of times it was enabled

        .offFor(property:String)

        .toggleFor(property:String, <message>:String)

        .for
            this holds a reference to the storage object, so that you can associate it with your base ctrl
    *****/

this.details={};

this.onFor=function(property,message){
if(this.details[property]){
this.details[property].count?
this.details[property].count+=1:
this.details[property].count=2;// count is only defined if there's more than 1
if(message){
this.details[property].message=message;
}
}else{
this.details[property]={
status:true,
message:message};

}
};

this.offFor=function(property){
if(!this.details[property]){
return;
}else if(!this.details[property].count||this.details[property].count===1){
delete this.details[property];
}else{
this.details[property].count-=1;
}
};

this.toggleFor=function(property,message){
if(this.details[property]){
delete this.details[property];
}else{
this.details[property]={
status:true,
message:message};

}
};

this.clearAll=function(){
for(var key in this.details){delete this.details[key];}
};

this.for=this.details;

return this;
});
angular.module('common').
factory('Sort',['$filter',function($filter){
return{
listSort:function listSort(listToSort,sortType,order){
listToSort.sort(function(a,b){
if(sortType==='alphabetically'){
if(a.name[0]){
a=$filter('cuiI18n')(a.name).toUpperCase(),
b=$filter('cuiI18n')(b.name).toUpperCase();
}else
{
a=a.name.given.toUpperCase(),
b=b.name.given.toUpperCase();
}
}else
if(sortType==='date'){
if(a.dateCreated){
a=a.dateCreated,b=b.dateCreated;
}else
{
a=a.creation,b=b.creation;
}
}else
{
a=a.status,b=b.status;
}

if(a<b){
if(order){
return 1;
}else{
return-1;
}
}else
if(a>b){
if(order){
return-1;
}else{
return 1;
}
}else{
return 0;
}
});
}};

}]);

angular.module('common').
factory('Theme',function(){

/*
	*	Utilize this factory when you need to set styles on the top-level element based on the current router state.
	*	
	*	Full documentation on how to utilize and or customize the application with this factory can be found in:
	*	`./docs/features/factories/Theme.md`
	*/

var activeTheme=void 0;
var defaultTheme=void 0;

var getTheme=function getTheme(){
return activeTheme;
};

var setTheme=function setTheme(cssClass){
activeTheme=cssClass;
};

var getDefaultTheme=function getDefaultTheme(){
return defaultTheme;
};

var setDefaultTheme=function setDefaultTheme(cssClass){
defaultTheme=cssClass;
};

var clearActiveTheme=function clearActiveTheme(){
activeTheme='';
};

var useDefaultTheme=function useDefaultTheme(){
activeTheme=defaultTheme;
};

var setActiveDefaultTheme=function setActiveDefaultTheme(cssClass){
defaultTheme=cssClass;
activeTheme=cssClass;
};

return{
get:getTheme,
set:setTheme,
getDefault:getDefaultTheme,
setDefault:setDefaultTheme,
useDefault:useDefaultTheme,
setActiveDefault:setActiveDefaultTheme,
clear:clearActiveTheme};


});

angular.module('common').
factory('Timezones',function($http,$rootScope,$translate){

var timezones=[];

var GetTimezones=function GetTimezones(locale){
return $http.get(appConfig.languageResources.url+'timezones/'+locale+'.json');
};

var setTimezones=function setTimezones(language){
language=language||'en';

if(language.indexOf('_')>-1){
language=language.split('_')[0];
}

GetTimezones(language).
then(function(res){
timezones.length=0;

res.data.forEach(function(timezone){
timezones.push(timezone);
});
}).
catch(function(err){
console.log(err);
});
};

var getTimezoneById=function getTimezoneById(id){
if(!id){
return'';
}

return _.find(timezones,function(timezone){
return timezone.id===id;
}).name;
};

$rootScope.$on('languageChange',function(e,args){
setTimezones(args);
});

setTimezones($translate.proposedLanguage());

return{
all:timezones,
timezoneById:getTimezoneById};

});

angular.module('common').
factory('User',function($rootScope){

/*
        This factory is intended to store data/logic pertaining to the logged in user only.
        This data is populated right after logon (this can be found in the API.factory.js 
        inside the populateUserInfo method). The application will not run if those endpoints
        fail.
    */

var user={
entitlements:undefined,
roles:undefined};


return{
set:function set(newUser){
angular.merge(user,newUser);
},

get:function get(){return user.cuid||'[cuid]';},

setEntitlements:function setEntitlements(newEntitlements){
user.entitlements?user.entitlements=user.entitlements.concat(newEntitlements):user.entitlements=newEntitlements;
},

getEntitlements:function getEntitlements(){return user.entitlements;},

setRoles:function setRoles(newRoles){
user.roles?user.roles=user.roles.concat(newRoles):user.roles=newRoles;
},

getRoles:function getRoles(){return user.roles;},

user:user};


});

angular.module('common').
factory('UserHistory',function(API,APIError,LocaleService,$q,$timeout){

var errorName='userHistoryFactory.';

var UserHistory={
getTodaysDate:function getTodaysDate(){
var today=new Date();
var dd=today.getDate();
var yyyy=today.getFullYear();
var mmm=today.toString().substring(4,7);
return dd+'-'+mmm+'-'+yyyy;
},

initStatusHistory:function initStatusHistory(userId){
var defer=$q.defer();

API.cui.getPersonDetailedStatusHistory({qs:[
['userId',userId],
['startDate','01-Jan-2016'],
['lastDate',UserHistory.getTodaysDate()]]}).

done(function(res){
defer.resolve(res);
}).
fail(function(err){
console.error('Failed getting user status information',err);
APIError.onFor(errorName+'initStatusHistory');
$timeout(function(){
APIError.offFor(errorName+'initStatusHistory');
},5000);
defer.reject(err);
});
return defer.promise;
},

initPasswordChangeHistory:function initPasswordChangeHistory(userId){
var defer=$q.defer();
API.cui.getPasswordCangeHistory({personId:userId}).
then(function(res){
defer.resolve(res);
}).
fail(function(err){
console.error('Failed getting Password change history',err);
APIError.onFor(errorName+'initPasswordChangeHistory');
$timeout(function(){
APIError.offFor(errorName+'initPasswordChangeHistory');
},5000);
defer.reject(err);
});
return defer.promise;
},

initUserHistory:function initUserHistory(userId,organizationId){
var defer=$q.defer();
var history={};
var callsCompleted=0;
var callsToComplete=2;

UserHistory.initStatusHistory(userId).
then(function(res){
history.statusHistory=res;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===callsToComplete)defer.resolve(history);
});

UserHistory.initPasswordChangeHistory(userId).
then(function(res){
history.passwordChangeHistory=res;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===callsToComplete)defer.resolve(history);
});

return defer.promise;
},

injectUI:function injectUI(history,$scope,personId){
history.fail=false;
history.success=false;
}};


return UserHistory;
});

angular.module('common').
factory('UserList',function(API,APIError,APIHelpers,$q){

var errorName='UserListFactory.';

var getUsers=function getUsers(opts){
var defer=$q.defer();

APIError.offFor(errorName+'getUsers');

API.cui.getPersons(opts).
done(function(personResponse){
defer.resolve(personResponse);
}).
fail(function(error){
console.error('Failed getting user list');
APIError.onFor(errorName+'getUsers');
defer.reject(error);
});

return defer.promise;
};

var getUserCount=function getUserCount(opts){
var defer=$q.defer();

APIError.offFor(errorName+'getUserCount');

API.cui.countPersons(opts).
done(function(countResponse){
defer.resolve(countResponse);
}).
fail(function(error){
console.error('Failed getting user count');
APIError.onFor(errorName+'getUserCount');
defer.reject(error);
});

return defer.promise;
};

return{
getUsers:getUsers,
getUserCount:getUserCount};


});

angular.module('common').
factory('UserProfile',function(API,APIError,LocaleService,Timezones,$filter,$q,$timeout){

var errorName='userProfileFactory.';

var UserProfile={

setPhone:function setPhone(type,index){
var phone={};
phone.type=type;
phone.number="";
return phone;
},

getTodaysDate:function getTodaysDate(){
var today=new Date();
var dd=today.getDate();
var yyyy=today.getFullYear();
var mmm=today.toString().substring(4,7);
return dd+'-'+mmm+'-'+yyyy;
},

initUser:function initUser(userId){
var defer=$q.defer();
var user={};

API.cui.getPerson({personId:userId}).
done(function(res){
// If the person object has no addresses we need to initialize it
if(!res.addresses){
res.addresses=[{streets:[]}];
}
//If there is no streets in address we need to initialie it
else if(!res.addresses[0].streets){
res.addresses[0].streets=[];
};
user.user=Object.assign({},res);
user.tempUser=Object.assign({},res);
//When user doesnot have any phones(data issue)
if(!user.tempUser.phones){
user.tempUser.phones=[];
user.tempUser.phones[0]=UserProfile.setPhone("main",0);
user.tempUser.phones[1]=UserProfile.setPhone("mobile",1);
user.tempUser.phones[2]=UserProfile.setPhone("fax",2);
}else{
//When user have fax/mobile but not mobile
if(user.tempUser.phones[0]&&user.tempUser.phones[0].type!=="main"){
if(user.tempUser.phones[0].type==="fax"){
user.tempUser.phones[2]=angular.copy(user.tempUser.phones[0]);
user.tempUser.phones[0]=UserProfile.setPhone("main",0);
user.tempUser.phones[1]=UserProfile.setPhone("mobile",1);
}else if(user.tempUser.phones[0].type==="mobile"&&user.tempUser.phones[1]){
user.tempUser.phones[2]=angular.copy(user.tempUser.phones[1]);
user.tempUser.phones[1]=angular.copy(user.tempUser.phones[0]);
user.tempUser.phones[0]=UserProfile.setPhone("main",0);
}else
{
user.tempUser.phones[1]=angular.copy(user.tempUser.phones[0]);
user.tempUser.phones[0]=UserProfile.setPhone("main",0);
user.tempUser.phones[2]=UserProfile.setPhone("fax",2);
}
}else
if(user.tempUser.phones[1]){
if(user.tempUser.phones[1].type==="fax"){
user.tempUser.phones[2]=angular.copy(user.tempUser.phones[1]);
user.tempUser.phones[1]=UserProfile.setPhone("mobile",1);
}else{
if(!user.tempUser.phones[2]){
user.tempUser.phones[2]=UserProfile.setPhone("fax",2);
};
}
}else{
user.tempUser.phones[1]=UserProfile.setPhone("mobile",1);
user.tempUser.phones[2]=UserProfile.setPhone("fax",2);
}
}
angular.copy(user.tempUser,user.user);
defer.resolve(user);
}).
fail(function(err){
console.error('Failed getting user information',err);
APIError.onFor(errorName+'initUser');
$timeout(function(){
APIError.offFor(errorName+'initUser');
},5000);
defer.reject(err);
});
return defer.promise;
},

initSecurityQuestions:function initSecurityQuestions(userId){
var defer=$q.defer();
var securityQuestions={
userSecurityQuestions:{},
tempUserSecurityQuestions:{},
allSecurityQuestions:[],
allSecurityQuestionsDup:[]};


$q.all([
API.cui.getSecurityQuestionAccount({personId:userId}),
API.cui.getSecurityQuestions()]).

then(function(res){
angular.copy(res[0],securityQuestions.userSecurityQuestions);
angular.copy(res[0],securityQuestions.tempUserSecurityQuestions);
angular.copy(res[1],securityQuestions.allSecurityQuestions);
angular.copy(res[1],securityQuestions.allSecurityQuestionsDup);

securityQuestions.allSecurityQuestions.splice(0,1);

var numberOfQuestions=securityQuestions.allSecurityQuestions.length;
var numberOfQuestionsFloor=Math.floor(numberOfQuestions/2);

securityQuestions.allChallengeQuestions0=securityQuestions.allSecurityQuestions.slice(0,numberOfQuestionsFloor);
securityQuestions.allChallengeQuestions1=securityQuestions.allSecurityQuestions.slice(numberOfQuestionsFloor);

securityQuestions.challengeQuestionsTexts=UserProfile.selectTextsForQuestions(securityQuestions);

defer.resolve(securityQuestions);
}).
catch(function(err){
console.error('Failed getting security question data',err);
APIError.onFor(errorName+'initSecurityQuestions');
$timeout(function(){
APIError.offFor(errorName+'initSecurityQuestions');
},5000);
defer.reject(err);
});
return defer.promise;
},

selectTextsForQuestions:function selectTextsForQuestions(securityQuestions){
var challengeQuestionsTexts=[];

angular.forEach(securityQuestions.userSecurityQuestions.questions,function(userQuestion){
var question=_.find(securityQuestions.allSecurityQuestionsDup,function(question){
return question.id===userQuestion.question.id;
});
challengeQuestionsTexts.push($filter('cuiI18n')(question.question));
});
return challengeQuestionsTexts;
},

initPasswordPolicy:function initPasswordPolicy(organizationId){
var defer=$q.defer();
var passwordPolicy={};

API.cui.getOrganization({organizationId:organizationId}).
then(function(res){
passwordPolicy.organization=res;
return API.cui.getPasswordPolicy({policyId:res.passwordPolicy.id});
}).
then(function(res){
passwordPolicy.passwordRules=res.rules;
res.rules.forEach(function(rule){
if(rule.type==='history'){
passwordPolicy.numberOfPasswords=rule.numberOfPasswords;
}
});
defer.resolve(passwordPolicy);
}).
fail(function(err){
console.error('Failed getting password policy data',err);
APIError.onFor(errorName+'initPasswordPolicy');
$timeout(function(){
APIError.offFor(errorName+'initPasswordPolicy');
},5000);
defer.reject(err);
});
return defer.promise;
},

initRegisteredDate:function initRegisteredDate(userId){
var defer=$q.defer();
var lastDate=UserProfile.getTodaysDate();

API.cui.getPersonDetailedStatusHistory({qs:[
['userId',userId],
['startDate','01-Jan-2016'],
['lastDate',lastDate]]}).

then(function(res){
var activeStatusList=[];
res.forEach(function(status,index){
if(status.status==='ACTIVE'){
activeStatusList.push(status);
}
if(res.length-1===index){
_.orderBy(activeStatusList,['creation'],['asc']);
defer.resolve(activeStatusList[0].creation);
}

});
}).
fail(function(error){
console.error('initRegisteredDate: There was an issue retrieving the registered date.');
APIError.onFor(errorName+'initRegisteredDate');
$timeout(function(){
APIError.offFor(errorName+'initRegisteredDate');
},5000);
defer.reject(error);
});

return defer.promise;
},

initUserProfile:function initUserProfile(userId,organizationId){
var defer=$q.defer();
var profile={};
var callsCompleted=0;
var callsToComplete=4;

UserProfile.initUser(userId).
then(function(res){
angular.merge(profile,res);
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===callsToComplete)defer.resolve(profile);
});

UserProfile.initSecurityQuestions(userId).
then(function(res){
angular.merge(profile,res);
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===callsToComplete)defer.resolve(profile);
});

UserProfile.initPasswordPolicy(organizationId).
then(function(res){
angular.merge(profile,res);
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===callsToComplete)defer.resolve(profile);
});

UserProfile.initRegisteredDate(userId).
then(function(res){
profile['registeredDate']=res;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===callsToComplete)defer.resolve(profile);
});

return defer.promise;
},

buildPersonPasswordAccount:function buildPersonPasswordAccount(user,passwordAccount,organization){
return{
version:'1',
username:user.username,
currentPassword:passwordAccount.currentPassword,
password:passwordAccount.password,
passwordPolicy:organization.passwordPolicy,
authenticationPolicy:organization.authenticationPolicy};

},

injectUI:function injectUI(profile,$scope,personId){
var userId=void 0;

personId?
userId=personId:
userId=API.getUser();

profile.saving=false;
profile.fail=false;
profile.success=false;
profile.timezoneById=Timezones.timezoneById;
profile.toggleOffFunctions={};

profile.resetAllData=function(){
angular.copy(profile.userSecurityQuestions,profile.tempUserSecurityQuestions);
angular.copy(profile.user,profile.tempUser);
};

profile.toggleAllOff=function(){
angular.forEach(profile.toggleOffFunctions,function(toggleOff){
toggleOff();
});
profile.resetAllData();
};

profile.pushToggleOff=function(toggleOffObject){
if(!profile.toggleOffFunctions){
profile.toggleOffFunctions={};
}
profile.toggleOffFunctions[toggleOffObject.name]=toggleOffObject.function;
};

profile.resetPasswordFields=function(){
profile.userPasswordAccount={
currentPassword:'',
password:''};

profile.passwordRe='';
};

profile.checkIfRepeatedSecurityAnswer=function(securityQuestions,formObject){
securityQuestions.forEach(function(secQuestion,i){
var securityAnswerRepeatedIndex=_.findIndex(securityQuestions,function(secQuestionToCompareTo,z){
return z!==i&&secQuestion.answer&&secQuestionToCompareTo.answer&&secQuestion.answer.toUpperCase()===secQuestionToCompareTo.answer.toUpperCase();
});
if(securityAnswerRepeatedIndex>-1){
if(formObject['answer'+securityAnswerRepeatedIndex]){
formObject['answer'+securityAnswerRepeatedIndex].$setValidity('securityAnswerRepeated',false);
}
if(formObject['answer'+i]){
formObject['answer'+i].$setValidity('securityAnswerRepeated',false);
}
}else
{
if(formObject['answer'+i]){
formObject['answer'+i].$setValidity('securityAnswerRepeated',true);
}
}
});
};

profile.updatePerson=function(section,toggleOff){
var tempUserWithoutLastLogin=void 0;
if(section){
profile[section]={submitting:true};
}

if(!profile.userCountry){
profile.tempUser.addresses[0].country=profile.user.addresses[0].country;
}else{
profile.tempUser.addresses[0].country=profile.userCountry.originalObject.code;
}

// [7/20/2016] Note: Can't pass in 'activatedDate' anymore when updating a person
delete profile.tempUser.activatedDate;
// Can't pass lastLoginDate
tempUserWithoutLastLogin=Object.assign({},profile.tempUser);
if(tempUserWithoutLastLogin.lastLoginDate){
delete tempUserWithoutLastLogin.lastLoginDate;
};

API.cui.updatePerson({personId:userId,data:tempUserWithoutLastLogin}).
always(function(){
if(section){
profile[section].submitting=false;
}
$scope.$digest();
}).
done(function(){
angular.copy(profile.tempUser,profile.user);
LocaleService.setLocaleByDisplayName(appConfig.languages[profile.user.language]);
if(toggleOff){
toggleOff();
}
}).
fail(function(err){
console.error('Failed to update user profile:',err);
if(section){
profile[section].error=true;
}
});
};

profile.updatePassword=function(section,toggleOff){
if(section)profile[section]={submitting:true};
profile.lifetimeError=false;

API.cui.updatePersonPassword({
personId:userId,
data:UserProfile.buildPersonPasswordAccount(profile.user,profile.userPasswordAccount,profile.organization)}).

always(function(){
if(section)profile[section].submitting=false;
}).
done(function(){
if(toggleOff)toggleOff();
profile.passwordUpdateSuccess=true;
$timeout(function(){return profile.passwordUpdateSuccess=false;},5000);
profile.resetPasswordFields();
$scope.$digest();
}).
fail(function(err){
console.error('Error updating password',err);
if(err.responseJSON.apiMessage.indexOf('does not conform to policy')>1){
profile.lifetimeError=true;
}
if(section)profile[section].error=true;
$scope.$digest();
});
};

profile.saveChallengeQuestions=function(section,toggleOff){
if(section){
profile[section]={submitting:true};
}
profile.userSecurityQuestions=angular.copy(profile.tempUserSecurityQuestions);

API.cui.updateSecurityQuestionAccount({
personId:userId,
data:{
version:'1',
id:userId,
questions:profile.userSecurityQuestions.questions}}).


always(function(){
if(section){
profile[section].submitting=false;
}
}).
done(function(){
if(toggleOff){
toggleOff();
}
profile.challengeQuestionsTexts=UserProfile.selectTextsForQuestions(profile);
$scope.$digest();
}).
fail(function(err){
console.error('Error updating security questions',err);
if(section){
profile[section].error=true;
}
$scope.$digest();
});
};

profile.validatePassword=function(password,formObject,input){

var validSwitch=function validSwitch(input,isValidBoolean,type){
switch(input){
case'newPassword':
if(type==='history')
profile.validNewPasswordHistory=isValidBoolean;else

profile.validNewPasswordDisallowed=isValidBoolean;
case'newPasswordRe':
if(type==='history')
profile.validNewPasswordReHistory=isValidBoolean;else

profile.validNewPasswordReDisallowed=isValidBoolean;}

};

var validateData={
userId:userId,
organizationId:profile.user.organization.id,
password:password,
operations:['PASSWORD_SPECIFY']};


API.cui.validatePassword({data:validateData}).
then(function(res){
var validPasswordHistory=false;
var validateDisallowed=false;
// Sometimes disallowed words will not come in response, In that case need to set form object to true
var disallowedFlag=false;
res.forEach(function(rule){
if(rule.type==='HISTORY'&&rule.isPassed){
validPasswordHistory=true;
}
if(rule.type==='DISALLOWED_WORDS'){
disallowedFlag=true;
if(rule.isPassed){
validateDisallowed=true;
}
}
});
//History Validation
if(validPasswordHistory){
validSwitch(input,true,'history');
}else
{
validSwitch(input,false,'history');
}
//Disallowed words Validation
if(disallowedFlag===false||validateDisallowed===true){
validSwitch(input,true,'disallowed');
}else
{
validSwitch(input,false,'disallowed');
}
if(validPasswordHistory&&(disallowedFlag===false||validateDisallowed===true)){
formObject[input].$setValidity(input,true);
$scope.$digest();
}else
{
formObject[input].$setValidity(input,false);
$scope.$digest();
}
});
};
}};


return UserProfile;
});

angular.module('common').
factory('BuildPackageRequests',function(API){

/*
        Helper factory for creating and sending service package requests.

        Usage: BuildPackageRequests(requestorId, requestorType, arrayOfServices)
        Return: Array of API service package request promises
        
        Notes:
            - RequestorType: Whether the requestor is a person or organization (expects 'person' or 'organization')
            - The reason for the request should be under service._reason
            - If no reason is provided and the service package requires a reason, returns undefined and attach
              an _error property (app._error = true) for that service.
            - This factory is not pure (alters the provided array of services)
    */

return function(requestorId,requestorType,arrayOfApps){
var numberOfApps=arrayOfApps.length;

if(!_.isArray(arrayOfApps)||numberOfApps===0){
throw new Error('The argument passed to BuildPackageRequests should be an array of 1 or more services.');
return undefined;
}

var error=false;

for(var i=0;i<numberOfApps;i+=1){
if(arrayOfApps[i].servicePackage.requestReasonRequired&&!arrayOfApps[i]._reason){
arrayOfApps[i]._error=true;
if(!error){
error=true;
}
}
}

if(error){
return undefined;
}

var packagesBeingRequested=[];
var packageRequests=[];

for(var _i2=0;_i2<numberOfApps;_i2+=1){
if(packagesBeingRequested.indexOf(arrayOfApps[_i2].servicePackage.id)>=0){
// If the service package is already being requested, append service to the request reason
// If the request doesn't have a reason here, then it is not required for this service package
if(arrayOfApps[_i2]._reason){
packageRequests[packagesBeingRequested.indexOf(arrayOfApps[_i2].servicePackage.id)].reason+=
'\n'+$filter('translate')('reason-im-requesting')+' '+$filter('cuiI18n')(arrayOfApps[_i2].name)+': '+arrayOfApps[_i2].name._reason;
}
}else
{
// Cache id's in seperate array to check for existing package requests without having to search through the array of requests.
packagesBeingRequested.push(arrayOfApps[_i2].servicePackage.id);
packageRequests.push({
requestor:{
id:requestorId,
type:requestorType},

servicePackage:{
id:arrayOfApps[_i2].servicePackage.id,
type:'servicePackage'},

reason:arrayOfApps[_i2]._reason||''});

}
}

return packageRequests.map(function(data){return API.cui.createPackageRequest({data:data});});

};
});

angular.module('common').
factory('AppRequests',['$filter',function($filter){
var appRequestsObject={},
appRequests={};

appRequests.set=function(newAppRequestsObject){
appRequestsObject=newAppRequestsObject;
};

appRequests.get=function(){
return appRequestsObject;
};

appRequests.clear=function(){
appRequestsObject={};
};

appRequests.buildReason=function(app,reason){
var tempApp={};
angular.copy(app,tempApp);
tempApp.reason=$filter('translate')('reason-im-requesting')+' '+$filter('cuiI18n')(tempApp.name)+': '+reason;
return tempApp;
};


appRequests.getPackageRequests=function(userId,arrayOfAppsBeingRequested){
var arrayOfPackagesBeingRequested=[],
arrayOfPackageRequests=[];
arrayOfAppsBeingRequested.forEach(function(app,i){
if(arrayOfPackagesBeingRequested.indexOf(app.servicePackage.id)>-1){// if we've parsed an app that belongs to the same pacakge
if(app.servicePackage.reasonRequired){
arrayOfPackageRequests.some(function(packageRequest,i){
return arrayOfPackageRequests[i].servicePackage.id===app.servicePackage.id?(arrayOfPackageRequests[i].reason=arrayOfPackageRequests[i].reason+('\n\n'+app.reason),true):false;// if we already build a package request for this pacakge then append the reason of why we need this other app
});
}
// if the reason isn't required then we don't need to do anything, we're already requesting this package
}else
{
arrayOfPackageRequests[i]={
'requestor':{
id:userId,
type:'person'},

servicePackage:{
id:app.servicePackage.id,
type:'servicePackage'},

reason:app.servicePackage.reasonRequired?app.reason:undefined};

arrayOfPackagesBeingRequested[i]=app.servicePackage.id;// save the pacakge id that we're requesting in a throwaway array, so it's easier to check if we're
// already requesting this package
}
});
return arrayOfPackageRequests;
};

return appRequests;
}]);
angular.module('common').
factory('ServicePackage',function(API,APIError,$q){
'use strict';

/*
        This factory was originally used as a type of data storage for storing service package data. The use of this factory
        for storing data is now deprecated in favor of an actual data storage solution in our "DataStorage" factory. 
        The data storage features of this factory will be removed in a future version.

        The focus of this factory will transition to dealing with any other logic associated with service packages.
    */

var servicePackage={};
var errorName='ServicePackageFactory.';
var servicePackageStorage={};

/****************************************
                Helper Functions
    ****************************************/

// Returns services that are associated with a package id
var getPackageServices=function getPackageServices(packageId){
var defer=$q.defer();

API.cui.getPackageServices({packageId:packageId}).
done(function(packageServices){
defer.resolve(packageServices);
}).
fail(function(err){
console.error('Failed getting package services');
APIError.onFor(errorName+'getPackageServices');
defer.reject(err);
});
return defer.promise;
};

// Returns claims that are associated with a package id
var getPackageClaims=function getPackageClaims(packageId){
var defer=$q.defer();

API.cui.getPackageClaims({qs:[['packageId',packageId]]}).
done(function(packageClaims){
defer.resolve(packageClaims);
}).
fail(function(err){
console.error('Failed getting package claims');
APIError.onFor(errorName+'getPackageClaims');
defer.reject(err);
});
return defer.promise;
};

// Returns all data for a specified package id
var getPackageDetails=function getPackageDetails(packageId){
var defer=$q.defer();

API.cui.getPackage({packageId:packageId}).
done(function(packageData){
defer.resolve(packageData);
}).
fail(function(err){
console.error('Failed getting package details');
APIError.onFor(errorName+'getPackageDetails');
defer.reject(err);
});
return defer.promise;
};

/****************************************
                Service Functions
    ****************************************/

// Deprecated
servicePackage.set=function(userId,newServicePackageArray){
servicePackageStorage.userId=newServicePackageArray;
};

// Deprecated
servicePackage.get=function(userId){
return servicePackageStorage.userId;
};

// Deprecated
servicePackage.clear=function(){
servicePackageStorage={};
};

// Deprecated
servicePackage.checkStorage=function(userId){
if(servicePackageStorage.userId){
return true;
}
return false;
};

// This call wraps the getPackageServices(), getPackageClaims(), and getPackageDetails() calls
// Returns all relevant data associated with the provided packageId including its services, claims, and details
servicePackage.getPackageDetails=function(packageId){
var defer=$q.defer();
var packageDetails={};
var callsCompleted=0;

getPackageDetails(packageId).
then(function(packageData){
packageDetails.details=packageData;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(packageDetails);
}
});

getPackageServices(packageId).
then(function(packageServices){
packageDetails.services=packageServices;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(packageDetails);
}
});

getPackageClaims(packageId).
then(function(packageClaims){
packageDetails.claims=packageClaims;
}).
finally(function(){
callsCompleted+=1;
if(callsCompleted===3){
defer.resolve(packageDetails);
}
});

return defer.promise;
};

// Returns all packages for the specified userId with a pending status
servicePackage.getPersonPendingPackages=function(userId){
var defer=$q.defer();

API.cui.getPersonPendingServicePackages({qs:[
['requestor.id',userId],
['requestor.type','person']]}).

done(function(servicePackages){
defer.resolve(servicePackages);
}).
fail(function(err){
console.error('There was an error retrieving pending service packages');
APIError.onFor(errorName+'getPendingPackages');
defer.reject(err);
});

return defer.promise;
};

// This call wraps the service.getPersonPendingServicesPackages() and service.getPackageDetails() calls
// Returns all relevant data for a user's pending packages
servicePackage.getAllUserPendingPackageData=function(userId){
var defer=$q.defer();
var pendingPackageData=[];

servicePackage.getPersonPendingPackages(userId).
then(function(pendingPackages){
var packageDetailCalls=[];

pendingPackages.forEach(function(pendingPackage){
packageDetailCalls.push(
servicePackage.getPackageDetails(pendingPackage.servicePackage.id).
then(function(packageDetails){
angular.merge(pendingPackage,packageDetails);
pendingPackageData.push(pendingPackage);
}));

});

$q.all(packageDetailCalls).
then(function(){
cui.log('packageDetailCalls then',userId,pendingPackageData);
defer.resolve(pendingPackageData);
}).
catch(function(err){
cui.log('packageDetailCalls catch',err);
defer.reject(err);
});
}).
catch(function(err){
defer.reject(err);
});

return defer.promise;
};

// Handles the approval/denial of a package request
// The package request must have a property of "approval" with either "approved" or "denied"
// If the package is denied and the package request has an optional property of "rejectReason", appends the reason to the payload
servicePackage.handlePackageApproval=function(packageRequest){
var data=[['requestId',packageRequest.id]];

if(packageRequest.approval==='approved'){
return API.cui.approvePackage({qs:data});
}else
if(packageRequest.approval==='denied'){
if(packageRequest.rejectReason){
data.push(['justification',packageRequest.rejectReason]);
}
return API.cui.denyPackage({qs:data});
}else{
throw new Error('Package request object must contain "approval" of either "approved" or "denied"');
}
};

return servicePackage;

});

angular.module('applications',[]).
config(['$stateProvider',function($stateProvider){

var templateBase='app/modules/applications/';

var returnCtrlAs=function returnCtrlAs(name,asPrefix){return name+'Ctrl as '+(asPrefix||'')+(asPrefix?name[0].toUpperCase()+name.slice(1,name.length):name);};

var loginRequired=true;

$stateProvider.
state('applications',{
url:'/applications',
template:'<div ui-view class="cui-applications"></div>',
access:loginRequired,
abstract:true}).

state('applications.myApplications',{
url:'?page&pageSize&service.category',
templateUrl:templateBase+'myApplications/myApplications.html',
controller:returnCtrlAs('myApplications'),
access:loginRequired}).

state('applications.myApplicationDetails',{
url:'/details/:appId',
templateUrl:templateBase+'myApplications/myApplications-details.html',
controller:returnCtrlAs('myApplicationDetails'),
access:loginRequired}).

state('applications.newRequest',{
url:'/request',
templateUrl:templateBase+'newRequestReview/newRequest.html',
controller:returnCtrlAs('newAppRequest'),
access:loginRequired}).

state('applications.search',{
url:'/search?name&category&page&pageSize',
templateUrl:templateBase+'search/applicationSearch.html',
controller:returnCtrlAs('applicationSearch'),
access:loginRequired}).

state('applications.reviewRequest',{
url:'/review',
templateUrl:templateBase+'newRequestReview/applicationReview.html',
controller:returnCtrlAs('applicationReview'),
access:loginRequired}).

state('applications.manageApplications',{
url:'/manage?name&page&pageSize&service.category&sortBy&grant.status&service.name',
templateUrl:templateBase+'myApplications/myApplications-manage.html',
controller:returnCtrlAs('manageApplications'),
access:loginRequired})

// seperating out as it is a seperate icon on in menu
.state('pendingAppRequests',{
url:'/pendingAppRequests?page&pageSize&sortBy&name',
templateUrl:templateBase+'pendingRequests/pendingRequests.html',
controller:returnCtrlAs('pendingAppRequests'),
access:loginRequired})

/*Organization Applications*/.
state('applications.orgApplications',{
url:'/organization',
template:'<div ui-view></div>',
abstract:true,
access:loginRequired})

/*        .state('applications.orgApplications.applicationList', {
            url: '?name&page&pageSize&service.category&sortBy&grant.status',
            templateUrl: templateBase + 'orgApplications/applicationList/orgApplications-applicationList.html',
            controller: returnCtrlAs('orgApplications'),
            access: loginRequired
        })
        .state('applications.orgApplications.applicationDetails', {
            url: '/application/:appId/details',
            templateUrl: templateBase + 'orgApplications/applicationDetails/orgApplications-applicationDetails.html',
            controller: returnCtrlAs('orgApplicationDetails'),
            access: loginRequired
        })*/.
state('applications.orgApplications.newGrant',{
url:'/application/:appId/new-grant',
templateUrl:templateBase+'orgApplications/newGrant/orgApplications-newGrant.html',
controller:returnCtrlAs('orgAppNewGrant'),
access:loginRequired});

/*        .state('applications.orgApplications.newRequest', {
            url: '/request',
            templateUrl: templateBase + 'orgApplications/appRequest/newRequest/appRequest-newRequest.html',
            controller: returnCtrlAs('orgAppRequest'),
            access: loginRequired
        })
        .state('applications.orgApplications.newRequestReview', {
            url: '/request/review',
            templateUrl: templateBase + 'orgApplications/appRequest/newRequestReview/appRequest-newRequestReview.html',
            controller: returnCtrlAs('orgAppRequestReview'),
            access: loginRequired
        })
        .state('applications.orgApplications.search', {
            url: '/search?name&category&page&pageSize',
            templateUrl: templateBase + 'orgApplications/search/orgApplications-search.html',
            controller: returnCtrlAs('orgAppSearch'),
            access: loginRequired
        });*/
}]);

angular.module('applications').
controller('myApplicationDetailsCtrl',function(API,$scope,$stateParams,$state,$q,APIHelpers,Loader,APIError,DataStorage){
var myApplicationDetails=this;
myApplicationDetails.relatedApps=[];

// HELPER FUNCTIONS START ------------------------------------------------------------------------
var getClaims=function getClaims(app){
var packageId=app.servicePackage.id;

Loader.onFor(loaderName+'claims');
API.cui.getPersonPackageClaims({grantee:API.getUser(),useCuid:true,packageId:packageId}).
then(function(res){
APIError.offFor(loaderName+'claims');
myApplicationDetails.claims=res;
}).
fail(function(err){
APIError.onFor(loaderName+'claims');
}).
always(function(){
Loader.offFor(loaderName+'claims');
$scope.$digest();
});
};

var getApp=function getApp(updating){
if(!updating){
Loader.onFor(loaderName+'app');
}
API.cui.getPersonGrantedApps(opts).
then(function(res){
APIError.offFor(loaderName+'app');
myApplicationDetails.app=Object.assign({},res[0]);
if(!updating){
getClaims(myApplicationDetails.app);
getRelatedApps(myApplicationDetails.app);
}
}).
fail(function(err){
APIError.onFor(loaderName+'app');
}).
done(function(){
Loader.offFor(loaderName+'app');
$scope.$digest();
});
};
var getRelatedApps=function getRelatedApps(app){
var packageId=app.servicePackage.id;
var qs=void 0;
if(app.servicePackage.parent){
qs=[['servicePackage.id',app.servicePackage.parent.id]];
}else{
qs=[['servicePackage.parentPackage.id',app.servicePackage.id]];
}
Loader.onFor(loaderName+'relatedApps');
var apiPromises=[
API.cui.getPersonRequestableApps({personId:API.getUser(),'qs':[['servicePackage.parentPackage.id',packageId]]}),
API.cui.getPersonGrantedApps({personId:API.getUser(),'qs':qs})];

$q.all(apiPromises).
then(function(res){
APIError.offFor(loaderName+'relatedApps');
myApplicationDetails.relatedApps=myApplicationDetails.relatedApps.concat(res[0]);
myApplicationDetails.relatedApps=myApplicationDetails.relatedApps.concat(res[1]);
}).
catch(function(err){
APIError.onFor(loaderName+'relatedApps');
}).
finally(function(){
Loader.offFor(loaderName+'relatedApps');
});
};
// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

var loaderName='myApplicationDetails.';

var qs={
'service.id':$stateParams.appId};


var opts={
personId:API.getUser(),
useCuid:true,
qs:APIHelpers.getQs(qs)};

myApplicationDetails.app=DataStorage.getType('myAppDetail');
if(myApplicationDetails.app&&myApplicationDetails.app.id===$stateParams.appId){
getClaims(myApplicationDetails.app);
getRelatedApps(myApplicationDetails.app);
// Update application detail for any new changes during reload
// Commenting out as API is not giving full details for service.id query parameter get
//it is relying on previous page details which has full details
// getApp(true)
}else
{
getApp(false);
}

// ON LOAD END -----------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START ----------------------------------------------------------------------

myApplicationDetails.goToDetails=function(application){
$state.go('applications.myApplicationDetails',{
'packageId':application.packageId,
'appId':application.id});

};

// ON CLICK FUNCTIONS END ------------------------------------------------------------------------

});

angular.module('applications').
controller('manageApplicationsCtrl',function(API,APIError,APIHelpers,DataStorage,Loader,User,$filter,$pagination,$q,$scope,$state,$stateParams){

var manageApplications=this;
var userId=User.user.id;
var loaderName='manageApplications.';

var checkedLocalStorage=false;

// HELPER FUNCTIONS START ---------------------------------------------------------------------------------

var switchBetween=function switchBetween(property,firstValue,secondValue){
// helper function to switch a property between two values or set to undefined if values not passed
if(!firstValue){
manageApplications.search[property]=undefined;
return;
}
manageApplications.search[property]=manageApplications.search[property]===firstValue?
secondValue:
firstValue;
};

var getCountsOfStatus=function getCountsOfStatus(qsValue){
var opts={
personId:API.getUser(),
useCuid:true

//Assign query strings if any value passed 
//otherwise it will get full count
};if(qsValue){
opts.qs=[['grant.status',qsValue]];
}
API.cui.getPersonGrantedAppCount(opts).
then(function(res){
if(!qsValue){
manageApplications.popupCount=res;
}else if(qsValue==="active"){
manageApplications.activeCount=res;
}else
{
manageApplications.suspendedCount=res;
}
$scope.$digest();
}).
fail(function(err){

});
};

var getCountsOfcategories=function getCountsOfcategories(){
manageApplications.categories.forEach(function(category,index){
console.log($filter('cuiI18n')(category.name));
var opts={
personId:API.getUser(),
useCuid:true};

opts.qs=[['service.category',$filter('cuiI18n')(category.name)]];
API.cui.getPersonGrantedAppCount(opts).
then(function(res){
category.count=res;
if(index===manageApplications.categories.length-1){
$scope.$digest();
};
}).
fail(function(err){
console.log(err);
if(index===manageApplications.categories.length-1){
$scope.$digest();
};
});
});
};

// HELPER FUNCTIONS END -----------------------------------------------------------------------------------

// ON LOAD START ------------------------------------------------------------------------------------------

var loadStoredData=function loadStoredData(){
// Check DataStorage if this page has been loaded before. We initially populate this screen
// with data that was previously retrieved from the API while we redo calls to get the up to date data.
var storedData=DataStorage.getType('manageApplicationsList');

if(storedData){
Loader.onFor(loaderName+'apps');
manageApplications.list=storedData.appList;
manageApplications.count=storedData.appCount;
manageApplications.categories=storedData.categories;
Loader.offFor(loaderName+'apps');
}

checkedLocalStorage=true;
onLoad(false);
};

var onLoad=function onLoad(previouslyLoaded){
if(previouslyLoaded){
Loader.onFor(loaderName+'reloadingApps');
}else
{
checkedLocalStorage?Loader.onFor(loaderName+'updating'):Loader.onFor(loaderName+'apps');
manageApplications.search=Object.assign({},$stateParams);

Loader.onFor(loaderName+'categories');
API.cui.getPersonAppCategories({personId:API.getUser()}).
then(function(res){
APIError.offFor(loaderName+'categories');
manageApplications.categories=res;
getCountsOfcategories();
APIError.offFor(loaderName+'categories');
}).
fail(function(err){
APIError.onFor(loaderName+'categories');
}).
done(function(){
Loader.offFor(loaderName+'categories');
$scope.$digest();
});
}

manageApplications.search.pageSize=manageApplications.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];

var opts={
personId:API.getUser(),
useCuid:true,
qs:APIHelpers.getQs(manageApplications.search)};


var promises=[
API.cui.getPersonGrantedApps(opts),
API.cui.getPersonGrantedAppCount(opts)];


$q.all(promises).
then(function(res){
// manageApplications.list = Object.assign(res[0]).filter(x => x.hasOwnProperty('urls'))
manageApplications.count=res[1];
manageApplications.list=res[0];
// re-render pagination if available
manageApplications.reRenderPaginate&&manageApplications.reRenderPaginate();

var storageData={
appList:manageApplications.list,
appCount:manageApplications.count,
categories:manageApplications.categories};

DataStorage.setType('manageApplicationsList',storageData);
APIError.offFor(loaderName+'apps');
}).
catch(function(err){
APIError.onFor(loaderName+'apps');
}).
finally(function(){
if(previouslyLoaded){
Loader.offFor(loaderName+'reloadingApps');
}else
{
checkedLocalStorage?Loader.offFor(loaderName+'updating'):Loader.offFor(loaderName+'apps');
}
});
//Lazy loading of counts of applications based on status 
//to display in popover
getCountsOfStatus("active");
getCountsOfStatus("suspended");
//To getFull count
getCountsOfStatus(undefined);


};

loadStoredData();

// ON LOAD END --------------------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START -------------------------------------------------------------------------------

manageApplications.pageChange=function(newpage){
manageApplications.updateSearch('page',newpage);
};

manageApplications.updateSearchByName=function(){
manageApplications.updateSearch('name',manageApplications.search['service.name']);
};
manageApplications.updateSearch=function(updateType,updateValue){
switch(updateType){
case'alphabetic':
switchBetween('sortBy','+service.name','-service.name');
break;
case'date':
switchBetween('sortBy','+grant.instant','-grant.instant');
break;
case'status':
manageApplications.search.page=1;
manageApplications.search['grant.status']=updateValue;
break;
case'category':
manageApplications.search.page=1;
manageApplications.search['service.category']=$filter('cuiI18n')(updateValue);
break;
case'name':
manageApplications.search.page=1;
break;}


// doesn't change state, only updates the url
$state.transitionTo('applications.manageApplications',manageApplications.search,{notify:false});
onLoad(true);
};

manageApplications.goToDetails=function(application){
var opts={
appId:application.id};

DataStorage.setType('myAppDetail',application);
$state.go('applications.myApplicationDetails',opts);
};

// ON CLICK FUNCTIONS END ---------------------------------------------------------------------------------

});

angular.module('applications').
controller('myApplicationsCtrl',function(API,APIError,APIHelpers,DataStorage,Loader,User,$filter,$pagination,$q,$scope,$state,$stateParams){
var myApplications=this;
var userId=User.user.id;
var loaderName='myApplications.';
var checkedLocalStorage=false;

// HELPER FUNCTIONS END -----------------------------------------------------------------------------------
var getCountsOfcategories=function getCountsOfcategories(){
myApplications.categories.forEach(function(category,index){
console.log($filter('cuiI18n')(category.name));
var opts={
personId:userId,
useCuid:true};

opts.qs=[['service.category',$filter('cuiI18n')(category.name)]];
API.cui.getPersonGrantedAppCount(opts).
then(function(res){
//Need to minus each category count with not displayble and other than active apps according to thier categories
category.count=res-(


Object.assign(myApplications.list).filter(function(x){return(
x.category&&$filter('cuiI18n')(x.category)===$filter('cuiI18n')(category.name));}).
length-

Object.assign(myApplications.viewList).filter(function(x){return(
x.category&&$filter('cuiI18n')(x.category)===$filter('cuiI18n')(category.name));}).
length);

if(index===myApplications.categories.length-1){
$scope.$digest();
};
}).
fail(function(err){
console.log(err);
if(index===myApplications.categories.length-1){
$scope.$digest();
};
});
});
};

// HELPER FUNCTIONS END -----------------------------------------------------------------------------------

// ON LOAD START ------------------------------------------------------------------------------------------
var loadStoredData=function loadStoredData(){
// Check DataStorage if this page has been loaded before. We initially populate this screen
// with data that was previously retrieved from the API while we redo calls to get the up to date data.
var storedData=DataStorage.getType('myApplicationsList');

if(storedData){
Loader.onFor(loaderName+'apps');
myApplications.list=storedData.appList;
myApplications.viewList=Object.assign(myApplications.list).filter(function(x){return x.servicePackage.displayable===true&&x.grant.status=='active';});
myApplications.count=storedData.appCount;
myApplications.categories=storedData.categories;
Loader.offFor(loaderName+'apps');
}

checkedLocalStorage=true;
onLoad(false);
};

var onLoad=function onLoad(previouslyLoaded){
if(previouslyLoaded){
Loader.onFor(loaderName+'reloadingApps');
}else
{
checkedLocalStorage?Loader.onFor(loaderName+'updating'):Loader.onFor(loaderName+'apps');
myApplications.search=Object.assign({},$stateParams);

Loader.onFor(loaderName+'categories');
API.cui.getPersonAppCategories({personId:API.getUser()}).
then(function(res){
APIError.offFor(loaderName+'categories');
myApplications.categories=res;
getCountsOfcategories();
APIError.offFor(loaderName+'categories');
}).
fail(function(err){
console.error('There was an error in fetcting user\'s app category details '+err);
APIError.onFor(loaderName+'categories');
}).
done(function(){
Loader.offFor(loaderName+'categories');
$scope.$digest();
});
}

myApplications.search.pageSize=myApplications.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];

var opts={
personId:API.getUser(),
useCuid:true,
qs:APIHelpers.getQs(myApplications.search)};

opts.qs.push(['grant.status','active']);
var promises=[
API.cui.getPersonGrantedApps(opts),
API.cui.getPersonGrantedAppCount(opts)];


$q.all(promises).
then(function(res){
myApplications.viewList=Object.assign(res[0]).filter(function(x){return x.servicePackage.displayable===true&&x.grant.status=='active';});
if(!previouslyLoaded){
myApplications.count=res[1];
}
myApplications.popupCount=myApplications.count-Object.assign(res[0]).filter(function(x){return x.servicePackage.displayable!==true||x.grant.status!=='active';}).length;
myApplications.list=res[0];
// re-render pagination if available
myApplications.reRenderPaginate&&myApplications.reRenderPaginate();

var storageData={
appList:myApplications.list,
appCount:myApplications.count,
categories:myApplications.categories};

DataStorage.setType('myApplicationsList',storageData);
APIError.offFor(loaderName+'apps');
}).
catch(function(err){
console.error('There was an error in fetcting user\'s granted applications '+err);
APIError.onFor(loaderName+'apps');
}).
finally(function(){
if(previouslyLoaded){
Loader.offFor(loaderName+'reloadingApps');
}else
{
checkedLocalStorage?Loader.offFor(loaderName+'updating'):Loader.offFor(loaderName+'apps');
}
});
};

loadStoredData();

// ON LOAD END --------------------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START -------------------------------------------------------------------------------

myApplications.pageChange=function(newpage){
myApplications.updateSearch('page',newpage);
};

myApplications.updateSearch=function(updateType,updateValue){
switch(updateType){
case'category':
myApplications.search.page=1;
myApplications.search['service.category']=$filter('cuiI18n')(updateValue);
break;}


// doesn't change state, only updates the url
$state.transitionTo('applications.myApplications',myApplications.search,{notify:false});
onLoad(true);
};
});

angular.module('applications').
controller('applicationReviewCtrl',['$scope','API','AppRequests','$timeout','$state','$q','localStorageService',function($scope,API,AppRequests,$timeout,$state,$q,localStorage){

var applicationReview=this;

if(Object.keys(AppRequests.get()).length===0&&localStorage.get('appsBeingRequested')){
AppRequests.set(localStorage.get('appsBeingRequested'));
}

var appRequests=angular.copy(AppRequests.get());
angular.forEach(appRequests,function(request){
if(request.bundledApps){
request.bundledApps.forEach(function(bundledApp){
if(appRequests[bundledApp.id]){
delete appRequests[bundledApp.id];
}
});
}
});
var appsBeingRequested=Object.keys(appRequests);

if(appsBeingRequested.length===0){
$state.go('applications.search');
}

// ON LOAD START ---------------------------------------------------------------------------------

applicationReview.appRequests=[];

for(var i=0;i<appsBeingRequested.length;i+=2){
var applicationGroup=[];
applicationGroup.push(appRequests[appsBeingRequested[i]]);
if(appRequests[appsBeingRequested[i+1]]){
applicationGroup.push(appRequests[appsBeingRequested[i+1]]);
}
//get Terms And Conditions for requested packages
applicationGroup.forEach(function(app){
if(app.servicePackage.personTacEnabled){
API.cui.getOrgTacOfPackage({packageId:app.servicePackage.id}).
then(function(res){
app.tac=res;
}).
fail(function(err){
console.log("There was an error fetching Tac");
console.log(err);
});
}
});
applicationReview.appRequests.push(applicationGroup);
}

applicationReview.numberOfRequests=0;
appsBeingRequested.forEach(function(){
applicationReview.numberOfRequests+=1;
});

// ON LOAD END ------------------------------------------------------------------------------------

// ON CLICK START ---------------------------------------------------------------------------------
var applicationRequestArray=void 0;

var requestsValid=function requestsValid(){
applicationRequestArray=[];
applicationReview.attempting=true;
var error=false;
applicationReview.appRequests.forEach(function(appRequestGroup,i){

appRequestGroup.forEach(function(appRequest,x){
if(appRequest.servicePackage.reasonRequired){
if(!appRequest.reason||appRequest.reason===''){
appRequest.reasonRequired=true;
applicationReview.attempting=false;
error=true;
}else
{
appRequest.reasonRequired=false;
applicationRequestArray[i+x]=AppRequests.buildReason(appRequest,appRequest.reason);
}
}else{
applicationRequestArray[i+x]=appRequest;
}
});
});
applicationReview.error=error;
if(error){
return false;
}else{
return true;
}
};

applicationReview.submit=function(){
if(!requestsValid()){
return;
}
var appRequests=AppRequests.getPackageRequests(API.getUser(),applicationRequestArray);

var requestsPromises=[];

appRequests.forEach(function(appRequest){
requestsPromises.push(API.cui.createPackageRequest({data:appRequest}));
});

$q.all(requestsPromises).
then(function(res){
applicationReview.attempting=false;
applicationReview.success=true;
AppRequests.clear();// clears app requests if the request goes through
localStorage.set('appsBeingRequested',{});
$timeout(function(){
$state.go('applications.myApplications');
},3000);
}).
catch(function(){
applicationReview.attempting=false;
applicationReview.error=true;
});
};

applicationReview.updateSearch=function(nameSearch){
applicationReview.search=nameSearch;
};

applicationReview.showTac=function(application){
if(application.tac){
applicationReview.tacContent=application.tac.tacText;
applicationReview.step=2;
}
};

// Error validation
applicationReview.customError={
email:{
email:function email(){
var EMAIL_REGEXP=/^[a-z0-9!#$%&*?_.-]+@[a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+[.][a-z0-9!#$%&*?_.-][a-z0-9!#$%&*?_.-]+/i;
if(applicationReview.extendedData&&applicationReview.extendedData.email){
return EMAIL_REGEXP.test(applicationReview.extendedData.email);
}else{
return true;
}
}}


// ON CLICK END -----------------------------------------------------------------------------------
};
}]);
angular.module('applications').
controller('newAppRequestCtrl',['API','$scope','$state','AppRequests','localStorageService',
function(API,$scope,$state,AppRequests,localStorage){

var newAppRequest=this;

// HELPER FUNCTIONS START ------------------------------------------------------------------------

// HELPER FUNCTIONS END ---------------------------------------------------------------------------

// ON LOAD START ----------------------------------------------------------------------------------------

if(Object.keys(AppRequests.get()).length===0&&localStorage.get('appsBeingRequested')){
AppRequests.set(localStorage.get('appsBeingRequested'));
}
var appsBeingRequested=AppRequests.get();

newAppRequest.appsBeingRequested=[];
newAppRequest.numberOfRequests=0;

Object.keys(appsBeingRequested).forEach(function(appId){
// This sets the checkboxes back to marked when the user clicks back
newAppRequest.numberOfRequests+=1;
newAppRequest.appsBeingRequested.push(appsBeingRequested[appId]);
});

API.cui.getCategories().
then(function(res){
newAppRequest.categories=res;
newAppRequest.loadingDone=true;
$scope.$digest();
});

// ON LOAD END ------------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START -----------------------------------------------------------------------

newAppRequest.searchCallback=function(searchWord){
$state.go('applications.search',{name:searchWord});
};

// ON CLICK FUNCTIONS END -------------------------------------------------------------------------

}]);

angular.module('applications').
controller('pendingAppRequestsCtrl',function(API,APIError,APIHelpers,DataStorage,Loader,$filter,$pagination,$q,$scope,$state,$stateParams){

var pendingAppRequests=this;
var loaderName='pendingAppRequests.';

var checkedLocalStorage=false;
// HELPER FUNCTIONS START ---------------------------------------------------------------------------------

var switchBetween=function switchBetween(property,firstValue,secondValue){
// helper function to switch a property between two values or set to undefined if values not passed
if(!firstValue){
pendingAppRequests.search[property]=undefined;
return;
}
pendingAppRequests.search[property]=pendingAppRequests.search[property]===firstValue?
secondValue:
firstValue;
};

// HELPER FUNCTIONS END ---------------------------------------------------------------------------------

// ON LOAD START ------------------------------------------------------------------------------------------

var loadStoredData=function loadStoredData(){
// Check DataStorage if this page has been loaded before. We initially populate this screen
// with data that was previously retrieved from the API while we redo calls to get the up to date data.
var storedData=DataStorage.getType('pendingAppRequestsList');

if(storedData){
Loader.onFor(loaderName+'apps');
pendingAppRequests.list=storedData.appList;
// Pagination not supported now 
// pendingAppRequests.count = storedData.appCount
Loader.offFor(loaderName+'apps');
}

checkedLocalStorage=true;
onLoad(false);
};

var onLoad=function onLoad(previouslyLoaded){
if(previouslyLoaded){
Loader.onFor(loaderName+'reloadingApps');
}else
{
checkedLocalStorage?Loader.onFor(loaderName+'updating'):Loader.onFor(loaderName+'apps');
pendingAppRequests.search=Object.assign({},$stateParams);
}
// Pagination not supported now 
// pendingAppRequests.search.pageSize = pendingAppRequests.search.pageSize || $pagination.getUserValue() || $pagination.getPaginationOptions()[0]

var opts={
personId:API.getUser(),
useCuid:true,
qs:APIHelpers.getQs(pendingAppRequests.search)};


var promises=[
API.cui.getPersonPendingApps(opts)
// Pagination not supported now 
// API.cui.getPersonGrantedAppCount(opts)
];

$q.all(promises).
then(function(res){
// Pagination not supported now 
// pendingAppRequests.count = res[1]
pendingAppRequests.list=res[0];
// re-render pagination if available
// Pagination not supported now
// pendingAppRequests.reRenderPaginate && pendingAppRequests.reRenderPaginate()

var storageData={
appList:pendingAppRequests.list
// appCount: pendingAppRequests.count, 
};
DataStorage.setType('pendingAppRequestsList',storageData);
APIError.offFor(loaderName+'apps');
}).
catch(function(err){
console.error('There was an error in fetcting user\'s pending applications '+err);
APIError.onFor(loaderName+'apps');
}).
finally(function(){
if(previouslyLoaded){
Loader.offFor(loaderName+'reloadingApps');
}else
{
checkedLocalStorage?Loader.offFor(loaderName+'updating'):Loader.offFor(loaderName+'apps');
}
});
};

loadStoredData();

// ON LOAD END ------------------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START -------------------------------------------------------------------------------

pendingAppRequests.pageChange=function(newpage){
pendingAppRequests.updateSearch('page',newpage);
};

pendingAppRequests.updateSearch=function(updateType,updateValue){
switch(updateType){
case'alphabetic':
switchBetween('sortBy','+service.name','-service.name');
break;
case'date':
switchBetween('sortBy','+requestedDate','-requestedDate');
break;
case'name':
// Pagination not supported now 
// myApplications.search.page = 1
pendingAppRequests.search['name']=updateValue;
break;}


// doesn't change state, only updates the url
$state.transitionTo('pendingAppRequests',pendingAppRequests.search,{notify:false});
onLoad(true);
};

pendingAppRequests.searchCallback=function(searchWord){
pendingAppRequests.updateSearch('name',searchWord);
};

// ON CLICK FUNCTIONS END -------------------------------------------------------------------------------
});
angular.module('applications').
controller('applicationSearchCtrl',['API','$scope','$stateParams','$state','AppRequests','localStorageService','$q','$pagination',function(API,$scope,$stateParams,$state,AppRequests,localStorage,$q,$pagination){
var applicationSearch=this;

if(Object.keys(AppRequests.get()).length===0&&localStorage.get('appsBeingRequested')){// If there's nothing in app memory and there's something in local storage
AppRequests.set(localStorage.get('appsBeingRequested'));
}
applicationSearch.packageRequests=AppRequests.get();
applicationSearch.appCheckbox={};

// HELPER FUNCTIONS START ------------------------------------------------------------------------

var processNumberOfRequestedApps=function processNumberOfRequestedApps(pkgRequest){
if(pkgRequest){
applicationSearch.numberOfRequests+=1;
}else{
applicationSearch.numberOfRequests-=1;
}
};

var updateViewList=function updateViewList(list){
var deferred=$q.defer();
applicationSearch.viewList=[];
var qs=[];
var apiPromises=[];
angular.forEach(list,function(app,parentIndex){
// Child App and Parent app requested by user
if(app.servicePackage.parent&&app.relatedApps){
var flag=false;
angular.forEach(app.relatedApps,function(realtedApp,index){
if(_.find(list,{id:realtedApp.id})){
flag=true;
}else
{
qs.push(['service.id',realtedApp.id]);
}
if(index===app.relatedApps.length-1&&qs.length!==0){
apiPromises.push(API.cui.getPersonRequestableApps({personId:API.getUser(),qs:qs}));
qs=[];
}
});
}else
{
applicationSearch.viewList.push(app);
}
});
$q.all(apiPromises).
then(function(res){
angular.forEach(res,function(app){var _applicationSearch$vi,_applicationSearch$li;
if(applicationSearch.search.name){
app[0].expanded=true;
}
(_applicationSearch$vi=applicationSearch.viewList).push.apply(_applicationSearch$vi,_toConsumableArray(app));
(_applicationSearch$li=applicationSearch.list).push.apply(_applicationSearch$li,_toConsumableArray(app));
});
deferred.resolve();
}).
catch(function(err){
console.log("There was an error loading parent requestable apps");
deferred.reject(err);
});
return deferred.promise;
};

// HELPER FUNCTIONS END --------------------------------------------------------------------------

// ON LOAD START ---------------------------------------------------------------------------------

var onLoad=function onLoad(previouslyLoaded){
if(previouslyLoaded){
applicationSearch.doneReloading=false;
}else
{// pre populate fields based on state params on first load
var numberOfRequests=0;
Object.keys(applicationSearch.packageRequests).forEach(function(appId){// Gets the list of package requests saved in memory
// This sets the checkboxes back to marked when the user clicks back after being in request review
applicationSearch.appCheckbox[appId]=true;
numberOfRequests+=1;
});
applicationSearch.numberOfRequests=numberOfRequests;

applicationSearch.search={};
applicationSearch.search.name=$stateParams.name;
applicationSearch.search.category=$stateParams.category;
applicationSearch.search.page=parseInt($stateParams.page,10);
applicationSearch.search.pageSize=parseInt($stateParams.pageSize,10);
}

var query=[];
if(applicationSearch.search.name){
query.push(['service.name',applicationSearch.search.name]);
}
if(applicationSearch.search.category){
query.push(['service.category',applicationSearch.search.category]);
}

applicationSearch.search.pageSize=applicationSearch.search.pageSize||$pagination.getUserValue()||$pagination.getPaginationOptions()[0];
query.push(['pageSize',String(applicationSearch.search.pageSize)]);

applicationSearch.search.page=applicationSearch.search.page||1;
query.push(['page',String(applicationSearch.search.page)]);

var opts={
personId:API.getUser(),
useCuid:true,
qs:query};


var promises=[API.cui.getPersonRequestableApps(opts),API.cui.getPersonRequestableCount(opts)];

$q.all(promises).
then(function(res){
applicationSearch.list=res[0];
applicationSearch.count=res[1];
updateViewList(res[0]).
then(function(){
applicationSearch.doneReloading=applicationSearch.doneLoading=true;
});
});
};
onLoad(false);

// ON LOAD END ------------------------------------------------------------------------------------

// ON CLICK FUNCTIONS START -----------------------------------------------------------------------

applicationSearch.pageChange=function(newpage){
applicationSearch.updateSearch('page',newpage);
};

applicationSearch.updateSearch=function(updateType,updateValue){
if(updateType!=='page'){
applicationSearch.search.page=1;
}

// doesn't change state, only updates the url
$state.transitionTo('applications.search',applicationSearch.search,{notify:false});
onLoad(true);
};

applicationSearch.toggleRequest=function(application){
if(!applicationSearch.packageRequests[application.id]){
applicationSearch.packageRequests[application.id]=application;
}else{
delete applicationSearch.packageRequests[application.id];
}
localStorage.set('appsBeingRequested',applicationSearch.packageRequests);
processNumberOfRequestedApps(applicationSearch.packageRequests[application.id]);
};

applicationSearch.saveRequestsAndCheckout=function(){
var qs=[];
//needed to set a flag for related apps to display in review page
angular.forEach(applicationSearch.packageRequests,function(request){
if(request.relatedApps){
request.relatedAppSelectedCount=0;
request.relatedApps.forEach(function(relatedApp){
if(_.find(applicationSearch.packageRequests,{id:relatedApp.id})){
relatedApp.selected=true;
request.relatedAppSelectedCount++;
}else
{
relatedApp.selected=false;
}
});
}
// If Selected Related app full details not available need to fetch it
if(!request.servicePackage){
qs.push(['service.id',request.id]);
}
});
if(qs.length!==0){
API.cui.getPersonRequestableApps({personId:API.getUser(),qs:qs}).
then(function(res){
res.forEach(function(app){
applicationSearch.packageRequests[app.id]=app;
});
AppRequests.set(applicationSearch.packageRequests);
$state.go('applications.reviewRequest');
});
}else
{
AppRequests.set(applicationSearch.packageRequests);
$state.go('applications.reviewRequest');
}
};

//Related apps will always appear inside body, So need to select parent if it is selected 
applicationSearch.checkRelatedAppsBody=function(relatedApp,parent){
if(_.find(applicationSearch.list,{id:relatedApp.id})){
applicationSearch.toggleRequest(_.find(applicationSearch.list,{id:relatedApp.id}));
}else
{
applicationSearch.list.push(relatedApp);
applicationSearch.toggleRequest(relatedApp);
}
applicationSearch.checkRelatedAndBundledApps(_.find(applicationSearch.list,{id:relatedApp.id}),parent);
};

//Deselect Child apps If it has any and select parent if checked from parent body 
applicationSearch.checkRelatedAndBundledApps=function(application,parent){
//if unchecked the checkbox
if(!applicationSearch.packageRequests[application.id]){
//if it is a parent then then deselect childs
if(!parent){
application.relatedApps&&application.relatedApps.forEach(function(relatedApp){
if(applicationSearch.appCheckbox[relatedApp.id]){
applicationSearch.appCheckbox[relatedApp.id]=!applicationSearch.appCheckbox[relatedApp.id];
applicationSearch.toggleRequest(_.find(applicationSearch.list,{id:relatedApp.id}));
}
});
applicationSearch.checkBundledApps(application,false);
}
}else{
if(parent){
if(!applicationSearch.appCheckbox[parent.id]){
applicationSearch.appCheckbox[parent.id]=true;
applicationSearch.toggleRequest(parent);
applicationSearch.checkBundledApps(parent,true);
}
}else
applicationSearch.checkBundledApps(application,true);
}
};

applicationSearch.checkBundledApps=function(application,check){
if(application.bundledApps){
application.bundledApps.forEach(function(bundledApp){
applicationSearch.appCheckbox[bundledApp.id]=check;
if(_.find(applicationSearch.list,{id:bundledApp.id}))
applicationSearch.toggleRequest(_.find(applicationSearch.list,{id:bundledApp.id}));
});
}
};
// ON CLICK FUNCTIONS END -------------------------------------------------------------------------

}]);

angular.element(document).ready(function(){
angular.module('app',['common','misc','registration','applications','organization','user','ngAnimate']);

angular.module('app').
config(['$urlRouterProvider',function($urlRouterProvider){

// Fixes infinite digest loop with ui-router (do NOT change unless absolutely required)
$urlRouterProvider.otherwise(function($injector){
var $state=$injector.get('$state');
$state.go('welcome');
});

}]);

angular.bootstrap(document,['app']);
});

});
})(angular,$);
//# sourceMappingURL=app.js.map
