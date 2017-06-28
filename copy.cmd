@echo Copying files
copy vss-extension.json dist\ /y
copy report-code-coverage\task.json dist\report-code-coverage\ /y
cd dist\report-code-coverage
yarn add vso-node-api@^6.2.5-preview vsts-task-lib@^2.0.5
cd ..\..
