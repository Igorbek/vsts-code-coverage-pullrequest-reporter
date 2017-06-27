import { WebApi } from "vso-node-api/WebApi";
import { BuildReason } from "vso-node-api/interfaces/BuildInterfaces";
import { CodeCoverageStatistics } from "vso-node-api/interfaces/TestInterfaces";

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

    console.log('Source code coverage:');
    codeCoverage.coverageData.forEach(d => console.log(d));

    const buildApi = vssConnection.getBuildApi();
    const build = await buildApi.getBuild(buildId);

    if (build.reason !== BuildReason.PullRequest) {
        // message
        return;
    }

    const pullRequestId = getPullRequestIdFromBranchName(build.sourceBranch);
    if (!pullRequestId) {
        // message
        return;
    }

    const codeApi = vssConnection.getGitApi();
    const pullRequest = await codeApi.getPullRequestById(pullRequestId);

    if (!pullRequest) {
        console.log(`Pull request #${pullRequestId} has not been found`);
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
        // todo message
        return;
    }

    const lastMergeTargetBuild = builds.find(b => b.sourceVersion === lastMergeTargetCommitId);
    if (!lastMergeTargetBuild) {
        // todo message
        return;
    }

    const targetCodeCoverage = await testApi.getCodeCoverageSummary(projectId, lastMergeTargetBuild.id);

    console.log('Target code coverage:');
    targetCodeCoverage.coverageData.forEach(d => console.log(d));

    const groupedCoverage: CodeCoverageComparisonEntries = {};
    targetCodeCoverage.coverageData[0].coverageStats.forEach(targetData => {
        const sourceData = codeCoverage.coverageData[0].coverageStats.find(sc => sc.label === targetData.label);
        if (sourceData) {
            groupedCoverage[sourceData.label] = {
                target: { total: targetData.total, covered: targetData.covered },
                source: { total: sourceData.total, covered: sourceData.covered }
            };
            console.log(`${sourceData.label}: ${createStatReportMarkdown(groupedCoverage[sourceData.label])}`)
        }
    });

    console.log(groupedCoverage);

}

function getPullRequestIdFromBranchName(branchName: string): number | undefined {
    const match = branchName.match(/refs\/pull\/(\d+)\/merge/);
    return match && parseInt(match[1]) || undefined;
}

function createStatReportMarkdown(stat: CodeCoverageComparison) {
    const sourcePercentage = Number((Math.round(stat.source.covered / stat.source.total * 1000) / 10).toFixed(1));
    const targetPercentage = Number((Math.round(stat.target.covered / stat.target.total * 1000) / 10).toFixed(1));
    const diffPercentage = Number(Math.abs(sourcePercentage - targetPercentage).toFixed(1));

    const sourceUncovered = stat.source.total - stat.source.covered;
    const targetUncovered = stat.target.total - stat.target.covered;
    const diffUncovered = sourceUncovered - targetUncovered;

    return sourcePercentage === targetPercentage
        ? `coverage has not changed`
        : `coverage ${sourcePercentage > targetPercentage ? 'in' : 'de'}creased by ${diffPercentage}%`;
}

/*

Sample format

|  | master | % | PR | % |
|---------:|-:|-----------:|-----------:|--:|
| **Lines** |
| covered | 800 |  84.7% | (+29 :arrow_up_small:) 829 | (+.5%) 85.2% |
| uncovered | 144 |  15.3% | 144 | (-.5%) 14.8% |
| total | 944 | | (+29) 973 |
| **Branches** |
| covered | 800 |  84.7% | (+29) 829 | 85.2% :arrow_up_small: .5%|
| uncovered | 144 |  15.3% | 144 | -.5% :arrow_down_small: 14.8% |
| total | 944 | | (+29) 973 |


 */