---
title: BulkjobTask
---

![img](./img/bulkjobTask.png)

The BulkjobTask component is based on the Bulk Jobs feature of the HPC Middleware "FUJITSU Software Technical Computing Suite (TCS)."
It can be used only when remote hosts that can use bulk jobs are set up.

You can specify a bulk number and an input file for the BuildjobTask component.
Multiple jobs are submitted as subjobs based on these settings.

For more information about bulk job functionality, see the HPC Middleware "FUJITSU Software Technical Computing Suite (TCS)" documentation.

The following properties can be set for the BulkjobTask component:

### use parameter setting file for bulk number
Sets whether the bulk number is specified from the parameter configuration file.

When enabled, a parameter configuration file can be specified.

When off, the start and end values can be specified and are treated as the start and end bulk numbers, respectively.

### manual finish condition
Specify whether to specify the judgment of the end status of the component.

--------
Return to Component Details ({{site.baseurl}}/reference/4_component /)
