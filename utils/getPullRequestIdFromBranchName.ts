export function getPullRequestIdFromBranchName(branchName: string): number | undefined {
    const match = branchName.match(/refs\/pull\/(\d+)\/merge/);
    return match && parseInt(match[1]) || undefined;
}
