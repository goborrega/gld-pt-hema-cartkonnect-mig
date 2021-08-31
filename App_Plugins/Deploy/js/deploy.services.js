angular.module('umbraco.deploy.services')
    .service('deployConfiguration',
    [
        '$http',
        function() {
            var instance = this;

            if (Umbraco.Sys.ServerVariables.deploy !== undefined && Umbraco.Sys.ServerVariables.deploy !== null) {
                angular.extend(instance, Umbraco.Sys.ServerVariables.deploy);
            } else {
                console.log('Could not get deploy configuration');
            }

            return instance;
        }
    ]);
angular.module('umbraco.deploy.services')
    .service('deployService',
        [
            '$http', '$q', 'deployConfiguration', '$rootScope', 'deployNavigation', 'deployResource',
            function ($http, $q, deployConfiguration, $rootScope, deployNavigation, deployResource) {

                var instance = this;

                instance.sessionId = '';
                instance.pSessionId = '';

                instance.error = undefined;

                instance.deploy = function (enableWorkItemLogging, schemaInfo) {

                    return deployResource.deploy(deployConfiguration.Target.DeployUrl, enableWorkItemLogging,
                        schemaInfo.isLocal,
                        schemaInfo.isDeveloper,
                        schemaInfo.doAutomaticSchemaTransfer)
                        .then(function (data) {
                            instance.setSessionId(data.SessionId);
                            return data;
                        }, function (data) {
                            return $q.reject(data);
                        });
                };

                instance.instantDeploy = function (item, enableWorkItemLogging) {

                    // get the item with Udi from the server
                    return deployResource.getUdiRange(item.id, item.includeDescendants, item.entityType).then(function (data) {

                        if (data !== 'null' && data !== null) {
                            // deploy item
                            var items = [];
                            items.push(data);

                            return deployResource.instantDeploy(items, deployConfiguration.Target.DeployUrl, enableWorkItemLogging)
                                .then(function (data) {
                                    instance.setSessionId(data.SessionId);
                                    return data;
                                },
                                    function (data) {
                                        return $q.reject(data);
                                    });
                        }
                    }, function (error) {
                        return $q.reject(error);
                    });
                };

                instance.restore = function (targetUrl, enableWorkItemLogging) {

                    return deployResource.restore(targetUrl, enableWorkItemLogging)
                        .then(function (data) {
                            instance.setSessionId(data.SessionId);
                            return data;
                        }, function (data) {
                            return $q.reject(data);
                        });

                };

                instance.partialRestore = function (targetUrl, restoreNodes, enableWorkItemLogging) {

                    return deployResource.partialRestore(targetUrl, restoreNodes, enableWorkItemLogging)
                        .then(function (data) {
                            instance.setSessionId(data.SessionId);
                            return data;
                        }, function (data) {
                            return $q.reject(data);
                        });
                };

                instance.feedbackMessageLevel = function () {
                    return deployResource.getCurrentUserFeedbackLevel();
                };

                instance.getStatus = function () {

                    return deployResource.getStatus(instance.sessionId)
                        .then(function (data) {
                            $rootScope.$broadcast('deploy:sessionUpdated',
                                {
                                    sessionId: data.SessionId,
                                    status: data.Status,
                                    comment: data.Comment,
                                    percent: data.Percent,
                                    log: data.Log,
                                    exception: data.Exception,
                                    mismatchList: data.mismatchList
                                });
                            return data;
                        }, function (data) {
                            // todo - need different response messages so a session that doesnt exist doesn't cause an error coded response.
                            instance.removeSessionId();
                            return $q.reject(data);
                        });

                };

                instance.setSessionId = function (sessionId) {
                    instance.sessionId = sessionId;
                    localStorage.setItem('deploySessionId', sessionId);
                };

                instance.removeSessionId = function () {
                    instance.pSessionId = instance.sessionId;
                    instance.sessionId = null;
                    localStorage.removeItem('deploySessionId');
                };

                instance.getSessionId = function () {
                    var deploySessionId = localStorage.getItem('deploySessionId');
                    return deploySessionId;
                };

                instance.isOurSession = function (sessionId) {
                    if (instance.sessionId === sessionId) return true;
                    if (instance.pSessionId !== sessionId) return false;
                    instance.pSessionId = null;
                    return true;
                }

                instance.prettyEntityType = function (udi) {
                    var p1 = udi.indexOf('//');
                    var p2 = udi.indexOf('/', p1 + 2);
                    var n = udi.substr(p1 + 2, p2 - p1 - 2);
                    n = n.replace('-', ' ');
                    n = n.substr(0, 1).toUpperCase() + n.substr(1);
                    return n;
                }

                instance.getViewName = function (name) {
                    if (name.includes('.cshtml')) {
                        return name.replace('umb://template-file/', '');
                    }

                    return name;
                }

                instance.isDeveloper = function (userFeedbackLevel) {
                    if (userFeedbackLevel === 'Developer') {
                        return true;
                    }

                    return false;
                }

                // TODO: This doesn't seem to do anything
                instance.getSessionId();

                return instance;
            }
        ]);

(function () {
    'use strict';

    angular
        .module('umbraco.deploy.services')
        .factory('deployHelper', deployHelperService);

    function deployHelperService($window) {

        var service = {
            getDeployItem: getDeployItem,
            getStatusValue: getStatusValue,
            getEntityTypeFromUdi: getEntityTypeFromUdi
        };

        return service;

        ////////////

        function getDeployItem(node, includeDescendants) {

            var item = {
                id: node.id,
                name: node.name,
                includeDescendants: includeDescendants,
                entityType: node.nodeType
            };

            // this is very hacky but basically ensures we "align" every weird thing being sent from the backoffice
            // to the format of the new Udis so we don't have to handle a million different cases.

            // if the item has a treeAlias this is *usually* more correct so we start by using that.
            if (node.metaData !== null && node.metaData.treeAlias !== undefined) {
                item.entityType = node.metaData.treeAlias;
            }

            // transform into Deploy terminology
            switch (item.entityType) {
            case 'content':
                item.entityType = 'document';
                break;
            case 'contentBlueprints':
                item.entityType = 'document-blueprint';
                break;
            case 'media':
                item.entityType = 'media';
                break;
            case 'stylesheets':
                item.entityType = 'stylesheet';
                break;
            case 'documentTypes':
                item.entityType = 'document-type';
                break;
            case 'mediaTypes':
                item.entityType = 'media-type';
                break;
            case 'templates':
                item.entityType = 'template';
                break;
            case 'scripts':
                item.entityType = 'script';
                break;
            case 'dictionary':
            case 'DictionaryItem':
                item.entityType = 'dictionary-item';
                break;
            case 'dataTypes':
                item.entityType = 'data-type';
                break;
            case 'macros':
                item.entityType = 'macro';
                break;
            case 'relationTypes':
                item.entityType = 'relation-type';
                break;
            case 'memberTypes':
                item.entityType = 'member-type';
                break;
            case 'memberGroups':
                item.entityType = 'member-group';
                break;
            case 'partialViews':
                item.entityType = 'partial-view';
                break;
            case 'partialViewMacros':
                item.entityType = 'partial-view-macro';
                break;
            case 'form':
                item.entityType = 'forms-form';
                break;
            case 'prevaluesource':
                item.entityType = 'forms-prevalue';
                break;
            case 'datasource':
                item.entityType = 'forms-datasource';
                break;
            case 'contentBlueprints':
                item.entityType = 'document-blueprint';
                break;
            // containers are all just 'container' we have to check the routePath to figure out what kind
            case 'container':
                var m = node.routePath.match(/.+\/(.+?)\/edit\//);
                if (m !== null) {
                    var tree = m[1];
                    if (tree === 'documentTypes') {
                        item.entityType = 'document-type-container';
                    } else if (tree === 'mediaTypes') {
                        item.entityType = 'media-type-container';
                    } else if (tree === 'dataTypes') {
                        item.entityType = 'data-type-container';
                    }
                }
                break;
            }

            // for some reason some of the tree roots doesn't return -1 ... ensure they do now
            if (node.nodeType === 'initstylesheets' ||
                node.nodeType === 'initscripts' ||
                node.nodeType === 'initdictionary' ||
                node.nodeType === 'initmacros' ||
                node.nodeType === 'initmemberGroup' ||
                node.nodeType === 'initxslt') {
                item.id = '-1';
            }

            // make sure that a root node always include all children
            if(item.id === '-1') {
                item.includeDescendants = true;
            }

            // fix missing stylesheet extension
            if (item.entityType === 'stylesheet' && item.id !== '-1' && item.id.indexOf('.css') === -1) {
                item.id = item.id + '.css';
            }

            return item;


        }

        function getStatusValue(number) {
            switch (number) {
                case 2:
                    return 'inProgress';
                case 3:
                    return 'completed';
                case 4:
                    return 'failed';
                case 5:
                    return 'cancelled';
                case 6:
                    return 'timedOut';
                case 7:
                    return 'mismatch';
                default:
                    return '';
            };
        }

        function getEntityTypeFromUdi(udi) {
            var m = udi.match(/umb:\/\/(.+)\//);
            if (m !== null) {
                return m[1];
            }
            return null;
        }
    }

})();
angular.module('umbraco.deploy.services')
    .service('deployNavigation',
    [
        '$timeout',
        function ($timeout) {

            var instance = this;

            instance.view = 'queue';

            instance.navigate = function(viewname) {
                // using $timeout to defer this from the current digest cycle
                $timeout(function() {
                    instance.view = viewname;
                });
            };

            return instance;
        }
    ]);
angular.module('umbraco.deploy.services')
    .service('deployQueueService',
        [
            '$q', 'notificationsService', 'queueResource',
            function ($q, notificationsService, queueResource) {

                var instance = this;

                instance.queue = [];

                instance.clearQueue = function () {

                    return queueResource.clearQueue()
                        .then(function (data) {
                            instance.queue.splice(0);
                            return instance.queue;
                        }, function (data) {
                            notificationsService.error('Error', 'Could not clear the queue.');
                            return $q.reject(data);
                        });
                };

                instance.addToQueue = function (item) {

                    return queueResource.addToQueue(item)
                        .then(function (data) {

                            if (data !== 'null' && data !== null) {
                                _.forEach(data,
                                    function (rItem) {
                                        var found = _.find(instance.queue,
                                            function (o) {
                                                return o.Udi === rItem.Udi;
                                            });
                                        if (found !== undefined && found !== null) {
                                            found.IncludeDescendants = rItem.IncludeDescendants;
                                        } else {
                                            instance.queue.push(rItem);
                                        }
                                    });
                            }
                            return instance.queue;

                        }, function (data) {
                            notificationsService.error('Error', data.ExceptionMessage);
                            return $q.reject(data);
                        });

                };

                instance.removeFromQueue = function (item) {

                    return queueResource.removeFromQueue(item)
                        .then(function (data) {
                            instance.queue.splice(instance.queue.indexOf(item), 1);
                            return instance.queue;
                        }, function (data) {
                            notificationsService.error('Error', data.ExceptionMessage);
                            return $q.reject(data);
                        });
                }

                instance.refreshQueue = function () {

                    return queueResource.getQueue()
                        .then(function (data) {
                            instance.queue.splice(0);
                            _.forEach(data, function (item) {
                                instance.queue.push(item);
                            });
                            return instance.queue;
                        }, function (data) {
                            notificationsService.error('Error', 'Could not retrieve the queue.');
                            return $q.reject(data);
                        });
                };

                instance.isLicensed = function () {

                    return queueResource.getLicenseStatus()
                        .then(function (data) {
                            return data;
                        }, function (data) {
                            return false;
                        });
                };

                instance.refreshQueue();

                return instance;
            }
        ]);

angular.module('umbraco.deploy.services')
    .service('deploySignalrService',
    [
        '$rootScope',
        function ($rootScope) {

            var instance = this;

            var initialized = false;
            var lock = false;

            $.connection.deployHub.client.sessionUpdated = function (sessionId, status, comment, percent, log, exceptionJson, serverTimestamp, mismatchList) {    
                $rootScope.$broadcast('deploy:sessionUpdated', {
                    sessionId: sessionId, status: status, comment: comment, percent: percent, log: log, exception: angular.fromJson(exceptionJson), serverTimestamp: serverTimestamp, mismatchList: mismatchList
                });
            };

            $.connection.deployHub.client.heartbeat = function (sessionId, serverTimestamp) {
                $rootScope.$broadcast('deploy:heartbeat', {
                    sessionId: sessionId, serverTimestamp: serverTimestamp
                });
            };

            $.connection.restoreHub.client.sessionUpdated = function (sessionId, status, comment, percent, log, exceptionJson, serverTimestamp) {
                $rootScope.$broadcast('restore:sessionUpdated', {
                    sessionId: sessionId, status: status, comment: comment, percent: percent, log: log, exception: angular.fromJson(exceptionJson), serverTimestamp: serverTimestamp
                });
            };

            $.connection.restoreHub.client.diskReadSessionUpdated = function (sessionId, status, comment, percent, log, exceptionJson, serverTimestamp) {
                $rootScope.$broadcast('restore:diskReadSessionUpdated', {
                    sessionId: sessionId, status: status, comment: comment, percent: percent, log: log, exception: angular.fromJson(exceptionJson), serverTimestamp: serverTimestamp
                });
            };

            $.connection.restoreHub.client.heartbeat = function (sessionId, serverTimestamp) {
                $rootScope.$broadcast('restore:heartbeat', {
                    sessionId: sessionId, serverTimestamp: serverTimestamp
                });
            };

            instance.initialize = function () {
                if (initialized === false && lock === false) {
                    lock = true;

                    if (Umbraco.Sys.ServerVariables.isDebuggingEnabled) {
                        $.connection.hub.logging = true;
                    }

                    $.connection.hub.start();
                    initialized = true;
                    lock = false;
                }
            };
            
            $.connection.hub.disconnected(function () {
                setTimeout(function () {
                    $.connection.hub.start();
                }, 4000); //When we get disconnected - try to reconnect after 4 seconds
            });

            instance.initialize();

            return instance;
        }
    ]);
(function () {
    'use strict';

    angular
        .module('umbraco.deploy.services')
        .factory('workspaceHelper', workspaceHelperService);

    function workspaceHelperService($window) {

        var service = {
            getActiveWorkspace: getActiveWorkspace,
            addWorkspaceInPortal: addWorkspaceInPortal,
            addAddWorkspace: addAddWorkspace
        };

        return service;

        ////////////

        function getActiveWorkspace(workspaces) {
            for (var i = 0; i < workspaces.length; i++) {
                var workspace = workspaces[i];
                if (workspace.Active === true) {
                    return workspace;
                }
            }
        }

        function addWorkspaceInPortal(projectUrl) {
            $window.open(projectUrl + "?addEnvironment=true");
        }

        function addAddWorkspace(workspaces) {
            var devWorkspaceFound = false;
            
            var addWorkspace = {
                Name: 'Add workspace',
                Type: 'inactive',
                Current: false,
                Active: false
            };

            angular.forEach(workspaces, function (workspace) {
                if (workspace.Type === 'development') {
                    devWorkspaceFound = true;
                }
            });

            if (!devWorkspaceFound) {
                workspaces.unshift(addWorkspace);
            }
        }
    }
})();