import { CodeCoverageData } from "azure-devops-node-api/interfaces/TestInterfaces";

interface CodeCoverageColumn {
  label: string;
  stat: CodeCoverageData;
}

/*
Sample format
|  | master | % | PR | % |
|-:|-:|-----------:|-----------:|--:|
| **Lines** |
| covered | 800 |  84.7% | (+29 :arrow_up_small:) 829 | (+.5%) 85.2% |
| uncovered | 144 |  15.3% | 144 | (-.5%) 14.8% |
| total | 944 | | (+29) 973 |
| **Branches** |
| covered | 800 |  84.7% | (+29) 829 | 85.2% :arrow_up_small: .5%|
| uncovered | 144 |  15.3% | 144 | -.5% :arrow_down_small: 14.8% |
| total | 944 | | (+29) 973 |
 */

function formatNumber(n: number) { return Number(n.toFixed(1)).toString(); }
function getPercentage(n: number, total: number) { return total == 0 ? 0 : (n * 100 / total); }
function formatPercentage(n: number, total: number) { return formatNumber(getPercentage(n, total)) + '%'; }
function getCheck(check: number, change: number) {
  return check === 0 ? '' :
    check * change < 0 ? ' :warning:' :
    ' :white_check_mark:';
}
function formatNumberChange(newValue: number, oldValue: number, checks: number = 0, numberDecorator: string = '', sign: string = '') {
  return newValue == oldValue ? `${numberDecorator}${formatNumber(newValue)}${sign}${numberDecorator}${getCheck(checks, 0)}`:
    newValue > oldValue ? `(+${numberDecorator}${formatNumber(newValue - oldValue)}${sign}${numberDecorator} :arrow_up_small:) ${numberDecorator}${formatNumber(newValue)}${sign}${numberDecorator}${getCheck(checks, 1)}` :
    `(-${numberDecorator}${formatNumber(oldValue - newValue)}${sign}${numberDecorator} :arrow_down_small:) ${numberDecorator}${formatNumber(newValue)}${sign}${numberDecorator}${getCheck(checks, -1)}`;
}
function formatPercentageChange(newValue: number, newTotal: number, oldValue: number, oldTotal: number, checks: number = 0, numberDecorator: string = '') {
  return formatNumberChange(getPercentage(newValue, newTotal), getPercentage(oldValue, oldTotal), checks, numberDecorator, '%');
}

export function formatMarkdownReport(target: CodeCoverageColumn, source: CodeCoverageColumn): string {
  const header = `| | ${target.label} | % | ${source.label} | % |
|-:|-:|-:|-:|-:|`;

  const body = target.stat.coverageStats.map(targetStat => {
    const sourceStat = source.stat.coverageStats.find(s => s.label === targetStat.label);
    if (!sourceStat) {
      return '';
    }
    return `| **${targetStat.label}** |
| covered\
 | ${formatNumber(targetStat.covered)}\
 | ${formatPercentage(targetStat.covered, targetStat.total)}\
 | ${formatNumberChange(sourceStat.covered, targetStat.covered, 1)}\
 | ${formatPercentageChange(sourceStat.covered, sourceStat.total, targetStat.covered, targetStat.total, 1)}
| uncovered\
 | ${formatNumber(targetStat.total - targetStat.covered)}\
 | ${formatPercentage(targetStat.total - targetStat.covered, targetStat.total)}\
 | ${formatNumberChange(sourceStat.total - sourceStat.covered, targetStat.total - targetStat.covered, -1)}\
 | ${formatPercentageChange(sourceStat.total - sourceStat.covered, sourceStat.total, targetStat.total - targetStat.covered, targetStat.total, -1)}
| ***total***\
 | ***${formatNumber(targetStat.total)}***\
 |\
 | ${formatNumberChange(sourceStat.total, targetStat.total, 0, '***')} |`;
  }).join('\n');

  return header + '\n' + body;
}