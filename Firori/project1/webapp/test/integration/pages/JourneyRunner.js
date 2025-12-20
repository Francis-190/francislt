sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"project1/test/integration/pages/EmployeeList",
	"project1/test/integration/pages/EmployeeObjectPage",
	"project1/test/integration/pages/ProjectAssignmentsObjectPage"
], function (JourneyRunner, EmployeeList, EmployeeObjectPage, ProjectAssignmentsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('project1') + '/test/flp.html#app-preview',
        pages: {
			onTheEmployeeList: EmployeeList,
			onTheEmployeeObjectPage: EmployeeObjectPage,
			onTheProjectAssignmentsObjectPage: ProjectAssignmentsObjectPage
        },
        async: true
    });

    return runner;
});

