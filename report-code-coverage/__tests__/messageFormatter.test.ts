import { formatMarkdownReport } from '../messageFormatter';

describe('formatMarkdownReport', () => {
    it('renders markdown message', ( ) => {
        const inputTarget = {
            label: 'master',
            stat: {
                buildFlavor: 'a',
                buildPlatform: 'b',
                coverageStats: [
                    { position: 0, label: 'Lines', covered: 123, total: 234, isDeltaAvailable: false, delta: 0 },
                    { position: 1, label: 'Branches', covered: 234, total: 345, isDeltaAvailable: false, delta: 0 }
                ]
            }
        };
        const inputSource = {
            label: 'PR',
            stat: {
                buildFlavor: 'a',
                buildPlatform: 'b',
                coverageStats: [
                    { position: 0, label: 'Branches', covered: 334, total: 455, isDeltaAvailable: false, delta: 0 },
                    { position: 1, label: 'Lines', covered: 120, total: 235, isDeltaAvailable: false, delta: 0 }
                ]
            }
        };
        const result = formatMarkdownReport(inputTarget, inputSource);

        expect({ inputTarget, inputSource, result }).toMatchSnapshot();
    })
})