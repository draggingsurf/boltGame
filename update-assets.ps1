(Get-Content 'app/lib/runtime/action-runner.ts') -replace \
backgrounds/cloud_bg.png
\, \backgrounds/cloud_bg.png


backgrounds/sky.svg
\ | Set-Content 'app/lib/runtime/action-runner.ts'
