import { join } from 'path';
import {
    getVariable,
    setResourcePath,
    getInput,
    loc,
    getEndpointAuthorizationParameter,
    getEndpointUrl, 
    error
} from 'vsts-task-lib';
import { WebApi, getHandlerFromToken } from 'vso-node-api/WebApi';
import postComment from './postComment';

async function main() {
    // set resource file
    setResourcePath(join(__dirname, 'task.json'));

    // get input data
    const text = getInput("text");
    if (!text) {
        throw new Error(`Text to publish is not specified`);
    }
    // get PR id
    const pullRequestId = parseInt(getInput("pullRequestId"));
    if (isNaN(pullRequestId) || pullRequestId <= 0) {
        console.log("Cannot obtain pull request id.");
        return;
    }

    // get connection data
    const accessToken = getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken', false);
    const credentialHandler = getHandlerFromToken(accessToken);
    const collectionUrl = getEndpointUrl('SYSTEMVSSCONNECTION', false);
    const vssConnection = new WebApi(collectionUrl, credentialHandler);

    await postComment(vssConnection, pullRequestId, text);
}

async function run() {
    try {
        await main();
    } catch (ex) {
        if (ex instanceof Error) {
            console.error(`Error: ${ex}; message: ${ex.message}; name: ${ex.name}; stack: ${ex.stack}`);
        } else {
            console.error(ex);
        }
        process.exit(1);
        throw ex;
    }
}

run();
