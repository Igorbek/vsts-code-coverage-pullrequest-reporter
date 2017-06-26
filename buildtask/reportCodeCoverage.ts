import { WebApi } from "vso-node-api/WebApi";
import { BuildReason } from "vso-node-api/interfaces/BuildInterfaces";

export default async function reportCodeCoverage(
  vssConnection: WebApi,
  buildId: number,
  projectId: string
) {
  const testApi = vssConnection.getTestApi();
  const codeCoverage = await testApi.getCodeCoverageSummary(projectId, buildId);

  codeCoverage.coverageData.forEach(d => console.log(d));

  const buildApi = vssConnection.getBuildApi();
  const build = await buildApi.getBuild(buildId);

  if (build.reason !== BuildReason.PullRequest) {
      return;
  }

  const pullRequestId = getPullRequestIdFromBranchName(build.sourceBranch);
  if (!pullRequestId) {
      // message
      return;
  }

  const codeApi = vssConnection.getGitApi();
  const pullRequest = await codeApi.getPullRequestById(pullRequestId);

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
    1,
    undefined,
    undefined,
    undefined,
    undefined,
    pullRequest.targetRefName
  );

  if (!builds || builds.length < 1) {
      return;
  }

  const lastTargetBuildId = builds[0].id;

  const targetCodeCoverage = await testApi.getCodeCoverageSummary(projectId, lastTargetBuildId);

  targetCodeCoverage.coverageData.forEach(d => console.log(d));
}

function getPullRequestIdFromBranchName(branchName: string): number | undefined {
    const match = branchName.match(/refs\/pull\/(\d+)\/merge/);
    return match && parseInt(match[1]) || undefined;
}