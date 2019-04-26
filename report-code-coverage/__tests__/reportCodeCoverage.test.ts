import { WebApi, getPersonalAccessTokenHandler } from 'vso-node-api/WebApi';
import { getPullRequestIdFromBranchName } from '../reportCodeCoverage';

describe('getPullRequestIdFromBranchName', () => {
    it('extracts PR numbers', () => {
        const inputs = [
            "/refs/pull/123/merge",
            "/refs/pull/0345/merge",
            "/refs/pull/abc/merge",
            "/refs/pull/merge",
            "/refs/pull/123",
            "master"
        ];

        const data = inputs.map(input => ({ input, output: getPullRequestIdFromBranchName(input) });

        expect(data).toMatchSnapshot();
    });
});
