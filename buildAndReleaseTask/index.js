"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const azure_pipelines_task_lib_1 = require("azure-pipelines-task-lib");
const WebApi_1 = require("azure-devops-node-api/WebApi");
const reportCodeCoverage_1 = __importDefault(require("./reportCodeCoverage"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // set resource file
        azure_pipelines_task_lib_1.setResourcePath(path_1.join(__dirname, 'task.json'));
        // get input data
        const buildId = parseInt(azure_pipelines_task_lib_1.getInput("buildId"));
        if (isNaN(buildId)) {
            throw new Error(`Invalid buildId ${azure_pipelines_task_lib_1.getInput("buildId")}`);
        }
        // get connection data
        const accessToken = azure_pipelines_task_lib_1.getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken', false);
        const credentialHandler = WebApi_1.getHandlerFromToken(accessToken);
        const collectionUrl = azure_pipelines_task_lib_1.getEndpointUrl('SYSTEMVSSCONNECTION', false);
        const vssConnection = new WebApi_1.WebApi(collectionUrl, credentialHandler);
        // get project id
        const projectId = azure_pipelines_task_lib_1.getVariable("System.TeamProjectId");
        yield reportCodeCoverage_1.default(vssConnection, buildId, projectId);
        console.log("projectId: ", projectId);
        console.log("buildId: ", buildId);
    });
}
main();
