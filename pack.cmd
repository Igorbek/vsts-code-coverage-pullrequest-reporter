@echo Creating extension
@echo "%~dp0/dist"
cd "%~dp0/dist"
tfx extension create --manifest-globs vss-extension.json
cd "%~dp0"
