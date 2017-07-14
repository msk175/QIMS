angular.module('applications')
.controller('newAppRequestCtrl',['API','$scope','$state','AppRequests','localStorageService','Loader','$pagination','APIHelpers','$stateParams',
function(API,$scope,$state,AppRequests,localStorage,Loader, $pagination,APIHelpers,$stateParams) {

    let newAppRequest = this;
    newAppRequest.step="selectCategory"
    newAppRequest.searchParams= Object.assign({}, $stateParams)
    newAppRequest.searchParams.pageSize= newAppRequest.searchParams.pageSize||$pagination.getUserValue() || $pagination.getPaginationOptions()[0]

    // HELPER FUNCTIONS START ------------------------------------------------------------------------

    // HELPER FUNCTIONS END ---------------------------------------------------------------------------

    // ON LOAD START ----------------------------------------------------------------------------------------

    // QIMS Customization Start
    if(_.find(API.user.roles, (role) => { return role==="QI Employee Birthright"})){
        newAppRequest.step="selectUser"
        newAppRequest.requestBy="yourself"
    }
    else{
        newAppRequest.searchParams.userId=API.user.id
        newAppRequest.userId=API.user.id
        $state.transitionTo('applications.newRequest', newAppRequest.searchParams, {notify:false})
    }


    if(Object.keys(AppRequests.get()).length===0 && localStorage.get('appsBeingRequested')) {
        AppRequests.set(localStorage.get('appsBeingRequested'));
    }
    const appsBeingRequested = AppRequests.get();

    newAppRequest.appsBeingRequested = [];
    newAppRequest.numberOfRequests = 0;

    Object.keys(appsBeingRequested).forEach((appId) => {
        // This sets the checkboxes back to marked when the user clicks back
        newAppRequest.numberOfRequests += 1;
        newAppRequest.appsBeingRequested.push(appsBeingRequested[appId]);
    });

    API.cui.getCategories()
    .then((res)=>{
        newAppRequest.categories = res;
        newAppRequest.loadingDone = true;
        $scope.$digest();
    })

    // ON LOAD END ------------------------------------------------------------------------------------

    // ON CLICK FUNCTIONS START -----------------------------------------------------------------------

    newAppRequest.searchCallback = function(searchWord) {
        $state.go('applications.search', {name: searchWord , userId:newAppRequest.userId});
    };

    newAppRequest.updateSearchParams = (page) => {
        Loader.onFor('newAppRequest.userList')
        newAppRequest.searchParams.page=page
        API.cui.getPersons({qs: APIHelpers.getQs(newAppRequest.searchParams)})
        .then(res => {
            _.remove(res,{id:API.user.id})
            newAppRequest.userList=res
            Loader.offFor('newAppRequest.userList')
            $scope.$digest()
        })
        .fail( err => {
            console.log('There was an error fetching persons'+ err)
            Loader.offFor('newAppRequest.userList')
        }) 
    }

    newAppRequest.userClick= (user) => {
        newAppRequest.step="selectCategory"
        newAppRequest.searchParams.userId=user.id
        newAppRequest.userId=user.id
        $state.transitionTo('applications.newRequest', newAppRequest.searchParams, {notify:false})
    }

    newAppRequest.updateSearchByEmailCallback = () => {
        newAppRequest.updateSearchParams(1)
    }
    // ON CLICK FUNCTIONS END -------------------------------------------------------------------------

    // WATCHERS---------------------------------------------

    $scope.$watch("newAppRequest.requestBy", (newValue) => {
        if (newValue&&newValue==='others') {
            if (!newAppRequest.userList) {
                // Loader.onFor('newAppRequest.userList')
                API.cui.countPersons()
                .then(count => {
                    newAppRequest.userCount=count
                    newAppRequest.updateSearchParams(1)
                })
                .fail( err => {
                    console.log('There was an error fetching persons'+ err)
                })
            }
            else{
                Loader.offFor('newAppRequest.userList')
            }
        }
    }, true)
}]);
