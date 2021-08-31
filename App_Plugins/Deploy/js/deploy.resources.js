(function () {
    'use strict';

    angular
        .module('umbraco.deploy.resources')
        .factory('deployResource', deployResource);

    deployResource.$inject = ['$http', '$q', 'umbRequestHelper'];

    function deployResource($http, $q, umbRequestHelper) {

        var baseUrlName = 'deployUiBaseUrl';

        var resource = {
            deploy: deploy,
            instantDeploy: instantDeploy,
            restore: restore,
            partialRestore: partialRestore,
            getStatus: getStatus,
            getUdiRange: getUdiRange,
            getCurrentUserFeedbackLevel: getCurrentUserFeedbackLevel
        };

        return resource;

        ////////////

        function deploy(targetUrl, enableWorkItemLogging, isLocal, isDeveloper, deploySchemaFiles) {

            var data = {
                TargetUrl: targetUrl,
                EnableLogging: enableWorkItemLogging,
                IsLocal: isLocal,
                IsDeveloper: isDeveloper,
                DeploySchemaFiles: deploySchemaFiles
            };

            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "Deploy"), data)
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function instantDeploy(items, targetUrl, enableWorkItemLogging) {

            var data = {
                Items: items,
                TargetUrl: targetUrl,
                EnableLogging: enableWorkItemLogging
            };

            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "InstantDeploy"), data)
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function restore(targetUrl, enableWorkItemLogging) {

            var data = {
                SourceUrl: targetUrl,
                EnableLogging: enableWorkItemLogging
            };

            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "Restore"), data)
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function partialRestore(targetUrl, restoreNodes, enableWorkItemLogging) {

            var data = {
                SourceUrl: targetUrl,
                RestoreNodes: restoreNodes,
                EnableLogging: enableWorkItemLogging
            };

            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "PartialRestore"), data)
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function getStatus(sessionId) {

            var data = {
                SessionId: sessionId
            };

            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "GetStatus"), data)
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function getUdiRange(id, includeDescendants, entityType) {

            var data = {
                id: id,
                includeDescendants: includeDescendants,
                entityType: entityType
            };

            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "GetUdiRange"), data)
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function getCurrentUserFeedbackLevel() {
            return $http.get(umbRequestHelper.getApiUrl(baseUrlName, "GetCurrentUserFeedbackLevel"))
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }
    }
})();

(function () {
    'use strict';

    angular
        .module('umbraco.deploy.resources')
        .factory('deployManagementResource', deployManagementResource);

    deployManagementResource.$inject = ['$http', '$q', 'umbRequestHelper'];

    function deployManagementResource($http, $q, umbRequestHelper) {

        var baseUrlName = 'deployManagementUiBaseUrl';

        var resource = {
            getDashboard: getDashboard,
            triggerOperation: triggerOperation,
        };

        return resource;

        function getDashboard() {

            return $http.get(umbRequestHelper.getApiUrl(baseUrlName, "GetDashboard"))
                .then(function (response) {
                        return response.data;
                    },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function triggerOperation(operation) {

            var data = {
                operation: operation,
            };

            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "TriggerOperation"), data)
                .then(function (response) {
                        return response.data;
                    },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }
    }
})();

(function () {
    'use strict';

    angular
        .module('umbraco.deploy.resources')
        .factory('queueResource', queueResource);

    queueResource.$inject = ['$http', '$q', 'umbRequestHelper'];

    function queueResource($http, $q, umbRequestHelper) {

        var baseUrlName = 'deployUiBaseUrl';

        var resource = {
            clearQueue: clearQueue,
            addToQueue: addToQueue,
            removeFromQueue: removeFromQueue,
            getQueue: getQueue,
            getLicenseStatus: getLicenseStatus
        };

        return resource;

        ////////////

        function clearQueue() {


            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "ClearQueue"))
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function addToQueue(item) {

            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "AddToQueue"), item)
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function removeFromQueue(item) {

            return $http.post(umbRequestHelper.getApiUrl(baseUrlName, "RemoveFromQueue"), item)
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function getQueue() {

            return $http.get(umbRequestHelper.getApiUrl(baseUrlName, "GetQueue"))
                .then(function (response) {
                    return response.data;
                },
                    function (response) {
                        return $q.reject(response.data);
                    });
        }

        function getLicenseStatus() {

            return $http.get(umbRequestHelper.getApiUrl(baseUrlName, "GetLicenseStatus"))
                .then(function (response) {
                    return true;
                },
                    function (response) {
                        return false;
                    });
        }
    }
})();
