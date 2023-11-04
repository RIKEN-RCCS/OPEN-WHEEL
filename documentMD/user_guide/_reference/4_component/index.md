---
pages:
 - 00_common.md
 - 01_Task.md
 - 02_If.md
 - 03_For.md
 - 04_while.md
 - 05_Foreach.md
 - 06_PS.md
 - 07_Workflow.md
 - 08_Storage.md
 - 09_Source.md
 - 10_Viewer.md
 - 11_Stepjob.md
 - 12_BulkjobTask.md
---
## コンポーネントの詳細
{% for page in page.pages %}
{% include_relative {{ page }} %}
{% endfor %}
