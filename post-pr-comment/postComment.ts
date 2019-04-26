import { WebApi } from "vso-node-api/WebApi";
import { BuildReason } from "vso-node-api/interfaces/BuildInterfaces";
import { CommentThreadStatus, CommentType, Comment, GitPullRequestCommentThread } from "vso-node-api/interfaces/GitInterfaces";
import { CodeCoverageStatistics } from "vso-node-api/interfaces/TestInterfaces";

export default async function postComment(
    vssConnection: WebApi,
    pullRequestId: number,
    text: string
) {
    const codeApi = vssConnection.getGitApi();
    const pullRequest = await codeApi.getPullRequestById(pullRequestId);

    if (!pullRequest) {
        console.log(`Pull request #${pullRequestId} does not exist.`);
        return;
    }

    const pullRequestThreads = await codeApi.getThreads(pullRequest.repository.id, pullRequestId);

    await codeApi.createThread({
            comments: [{
                commentType: CommentType.Text,
                content: text
            }],
            // properties: { codeCoverageReport: true },
            status: CommentThreadStatus.WontFix,
        } as Partial<GitPullRequestCommentThread> as GitPullRequestCommentThread,
        pullRequest.repository.id,
        pullRequestId
    );
}
