import { } from 'vsts-task-lib';
import * as path from 'path';
import { WebApi, getHandlerFromToken } from 'vso-node-api/WebApi';
import * as tl from 'vsts-task-lib/task';

async function main(): Promise<void> {
    // set resource file
    tl.setResourcePath(path.join(__dirname, 'task.json'));

    // get input data
    let buildId = parseInt(tl.getInput("buildId"));
    if (isNaN(buildId)) {
        throw new Error(tl.loc("InvalidBuildId", tl.getInput("buildId")));
    }

    let accessToken = tl.getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken', false);
    let credentialHandler = getHandlerFromToken(accessToken);
    let collectionUrl = tl.getEndpointUrl('SYSTEMVSSCONNECTION', false);
    let vssConnection = new WebApi(collectionUrl, credentialHandler);

    const projectId = tl.getVariable("System.TeamProjectId");

    const testApi = vssConnection.getTestApi();
    const codeCoverage = await testApi.getCodeCoverageSummary(projectId, buildId);
    
    //codeCoverage.coverageData[0].coverageStats[0].
}

main();
