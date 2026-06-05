---
title: HPCI-SS
lang: en
permalink: /reference/4_component/15_HPCISS.html
---

![img](./img/hpciss.png "hpciss")

The HPCI-SS component is a variant of the Storage component that uses HPCI shared storage as the file storage location.

The properties you can set for the HPCI-SS component are as follows.

### host
You can set the host where files are actually stored.
However, only hosts that have the `use gfarm` option checked in the remotehost settings can be set as the host.

Additionally, only hosts that can transfer files to HPCI shared storage using gfarm commands (gfcp, gfpcopy, etc.) are available.

### directory path
![img](./img/storage_path.png "storage_path")

Similar to the Storage component, this is the path where files are actually stored.
However, you must specify the path on HPCI shared storage, not a path on the host.

### Constraints
HPCI shared storage does not support overwriting copies to directories that already exist.
For this reason, when the HPCI-SS component receives a `foo` directory from a preceding component:
- On the first execution, a `foo` directory is created directly under the path specified in directory path, and the contents of the received `foo` are copied under the `foo` directory.
- On subsequent executions, a directory named `WHEEL_TMP_XXXXXX` (where XXXXXX is a random string) is created directly under directory path, and the `foo` directory is copied under it.


--------
[Return to Component Details]({{site.baseurl}}/reference/4_component/)
