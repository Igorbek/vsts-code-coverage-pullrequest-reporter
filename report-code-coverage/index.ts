import { join } from 'path';
import {
    getVariable,
    setResourcePath,
    getInput,
    loc,
    getEndpointAuthorizationParameter,
    getEndpointUrl
} from 'vsts-task-lib';
import { WebApi, getHandlerFromToken } from 'vso-node-api/WebApi';

import reportCodeCoverage from './reportCodeCoverage';

async function main() {
    // set resource file
    setResourcePath(join(__dirname, 'task.json'));

    // get input data
    const buildId = parseInt(getInput("buildId"));
    if (isNaN(buildId)) {
        throw new Error(`Invalid buildId ${getInput("buildId")}`);
    }

    // get connection data
    const accessToken = getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken', false);
    const credentialHandler = getHandlerFromToken(accessToken);
    const collectionUrl = getEndpointUrl('SYSTEMVSSCONNECTION', false);
    const vssConnection = new WebApi(collectionUrl, credentialHandler);

    // get project id
    const projectId = getVariable("System.TeamProjectId");

    await reportCodeCoverage(vssConnection, buildId, projectId);
}

main();
