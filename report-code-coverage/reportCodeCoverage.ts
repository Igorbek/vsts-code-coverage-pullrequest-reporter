import { WebApi } from "vso-node-api/WebApi";
import { BuildReason } from "vso-node-api/interfaces/BuildInterfaces";
import { CommentThreadStatus, CommentType } from "vso-node-api/interfaces/GitInterfaces";
import { CodeCoverageStatistics } from "vso-node-api/interfaces/TestInterfaces";
import { formatMarkdownReport } from './messageFormatter';

interface CodeCoverageStat {
    total: number;
    covered: number;
}

interface CodeCoverageComparison {
    target: CodeCoverageStat;
    source: CodeCoverageStat;
}

interface CodeCoverageComparisonEntries {
    [label: string]: CodeCoverageComparison;
}

export default async function reportCodeCoverage(
    vssConnection: WebApi,
    buildId: number,
    projectId: string
) {
    const testApi = vssConnection.getTestApi();
    const codeCoverage = await testApi.getCodeCoverageSummary(projectId, buildId);

    if (!codeCoverage || !codeCoverage.coverageData || !codeCoverage.coverageData.length) {
        console.log(`No code coverage data for build #${buildId}.`)
    }

    const buildApi = vssConnection.getBuildApi();
    const build = await buildApi.getBuild(buildId);

    if (build.reason !== BuildReason.PullRequest) {
        console.log(`The reason of build #${buildId} is not pull request.`);
        return;
    }

    const pullRequestId = getPullRequestIdFromBranchName(build.sourceBranch);
    if (!pullRequestId) {
        console.log(`Unable to determine pull request id from branch name '${build.sourceBranch}'.`);
        return;
    }

    const codeApi = vssConnection.getGitApi();
    const pullRequest = await codeApi.getPullRequestById(pullRequestId);

    if (!pullRequest) {
        console.log(`Pull request #${pullRequestId} does not exist.`);
        return;
    }

    const lastMergeTargetCommitId = pullRequest.lastMergeTargetCommit.commitId;

    const builds = await buildApi.getBuilds(
        projectId,
        [build.definition.id],
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        pullRequest.targetRefName
    );

    if (!builds || builds.length < 1) {
        console.log(`No builds found for target branch '${pullRequest.targetRefName}'.`);
        return;
    }

    const lastMergeTargetBuild = builds.find(b => b.sourceVersion === lastMergeTargetCommitId);
    if (!lastMergeTargetBuild) {
        console.log(`Build of merge target commit does not exist.`);
        return;
    }

    const targetCodeCoverage = await testApi.getCodeCoverageSummary(projectId, lastMergeTargetBuild.id);

    if (!targetCodeCoverage || !targetCodeCoverage.coverageData || !targetCodeCoverage.coverageData.length) {
        console.log(`No code coverage for target branch '${pullRequest.targetRefName}'.`);
        return;
    }

    const message = `### Code Coverage Report\n${formatMarkdownReport(
        { label: 'Target', stat: targetCodeCoverage.coverageData[0] },
        { label: 'PR', stat: codeCoverage.coverageData[0] })}`;

    const pullRequestThreads = await codeApi.getThreads(pullRequest.repository.id, pullRequestId);
    let pullRequestThread = pullRequestThreads.find(prThread => prThread.properties && prThread.properties.codeCoverageReport);
    if (pullRequestThread && pullRequestThread.comments.length) {
        const comment = pullRequestThread.comments[0];
        console.log(`codeApi.updateComment({},
            pullRequest.repository.id=${pullRequest.repository.id},
            pullRequestId=${pullRequestId},
            pullRequestThread.id=${pullRequestThread.id},
            comment.id=${comment.id})`);
        await codeApi.updateComment({
                commentType: CommentType.Text,
                content: message
            } as any,
            pullRequest.repository.id,
            pullRequestId,
            pullRequestThread.id,
            comment.id);
    } else {
        await codeApi.createThread({
            comments: [{
                commentType: CommentType.Text,
                content: message
            }],
            properties: { codeCoverageReport: true },
            status: CommentThreadStatus.Active,
        } as any, pullRequest.repository.id, pullRequestId);
    }
}

function getPullRequestIdFromBranchName(branchName: string): number | undefined {
    const match = branchName.match(/refs\/pull\/(\d+)\/merge/);
    return match && parseInt(match[1]) || undefined;
}
