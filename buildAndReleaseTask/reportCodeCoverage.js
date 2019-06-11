"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const BuildInterfaces_1 = require("azure-devops-node-api/interfaces/BuildInterfaces");
const GitInterfaces_1 = require("azure-devops-node-api/interfaces/GitInterfaces");
//import { CodeCoverageStatistics } from "vso-node-api/interfaces/TestInterfaces";
const messageFormatter_1 = require("./messageFormatter");
function reportCodeCoverage(vssConnection, buildId, projectId) {
    return __awaiter(this, void 0, void 0, function* () {
        const testApi = yield vssConnection.getTestApi();
        const codeCoverage = yield testApi.getCodeCoverageSummary(projectId, buildId);
        if (!codeCoverage || !codeCoverage.coverageData || !codeCoverage.coverageData.length) {
            console.log(`No code coverage data for build #${buildId}.`);
        }
        const buildApi = yield vssConnection.getBuildApi();
        const build = yield buildApi.getBuild(projectId, buildId);
        if (build.reason !== BuildInterfaces_1.BuildReason.PullRequest) {
            console.log(`The reason of build #${buildId} is not pull request.`);
            return;
        }
        const pullRequestId = getPullRequestIdFromBranchName(build.sourceBranch);
        if (!pullRequestId) {
            console.log(`Unable to determine pull request id from branch name '${build.sourceBranch}'.`);
            return;
        }
        const codeApi = yield vssConnection.getGitApi();
        const pullRequest = yield codeApi.getPullRequestById(pullRequestId);
        if (!pullRequest) {
            console.log(`Pull request #${pullRequestId} does not exist.`);
            return;
        }
        const lastMergeTargetCommitId = pullRequest.lastMergeTargetCommit.commitId;
        const builds = yield buildApi.getBuilds(projectId, [build.definition.id], undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 10, undefined, undefined, undefined, undefined, pullRequest.targetRefName);
        if (!builds || builds.length < 1) {
            console.log(`No builds found for target branch '${pullRequest.targetRefName}'.`);
            return;
        }
        const lastMergeTargetBuild = builds.find(b => b.sourceVersion === lastMergeTargetCommitId);
        if (!lastMergeTargetBuild) {
            console.log(`Build of merge target commit does not exist.`);
            return;
        }
        const targetCodeCoverage = yield testApi.getCodeCoverageSummary(projectId, lastMergeTargetBuild.id);
        if (!targetCodeCoverage || !targetCodeCoverage.coverageData || !targetCodeCoverage.coverageData.length) {
            console.log(`No code coverage for target branch '${pullRequest.targetRefName}'.`);
            return;
        }
        const message = `### Code Coverage Report\n${messageFormatter_1.formatMarkdownReport({ label: 'Target', stat: targetCodeCoverage.coverageData[0] }, { label: 'PR', stat: codeCoverage.coverageData[0] })}`;
        const pullRequestThreads = yield codeApi.getThreads(pullRequest.repository.id, pullRequestId);
        let pullRequestThread = pullRequestThreads.find(prThread => prThread.properties && prThread.properties.codeCoverageReport);
        if (pullRequestThread && pullRequestThread.comments.length) {
            const comment = pullRequestThread.comments[0];
            yield codeApi.updateComment({
                commentType: GitInterfaces_1.CommentType.Text,
                content: message
            }, pullRequest.repository.id, pullRequestId, pullRequestThread.id, comment.id);
        }
        else {
            yield codeApi.createThread({
                comments: [{
                        commentType: GitInterfaces_1.CommentType.Text,
                        content: message
                    }],
                properties: { codeCoverageReport: true },
                status: GitInterfaces_1.CommentThreadStatus.Active,
            }, pullRequest.repository.id, pullRequestId);
        }
    });
}
exports.default = reportCodeCoverage;
function getPullRequestIdFromBranchName(branchName) {
    const match = branchName.match(/refs\/pull\/(\d+)\/merge/);
    return match && parseInt(match[1]) || undefined;
}
