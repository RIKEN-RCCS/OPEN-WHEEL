---
title: HPCI-SS-tar
lang: en
permalink: /reference/4_component/16_HPCISStar.html
---

![img](./img/hpcisstar.png "hpciss-tar")

The HPCI-SS-tar component, like the HPCI-SS component, is a variant of the Storage component for storing files in HPCI shared storage.

Unlike the HPCI-SS component, the HPCI-SS-tar component uses the gfptar command to save files in tar format (gzip compressed) when storing them.

For this reason, unlike the HPCI-SS component, you cannot delete or rename files/directories in the destination HPCI shared storage.

The properties you can set for the HPCI-SS-tar component are as follows.

### host
You can set the host where files are actually stored.
However, only hosts that have the `use gfarm` option checked in the remotehost settings can be set as the host.

Additionally, only hosts that can transfer files to HPCI shared storage using the gfptar command are available.

### directory path
![img](./img/storage_path.png "storage_path")

Similar to the Storage component, this is the path where files are actually stored.
However, you must specify the path on HPCI shared storage, not a path on the host.

### Constraints
The HPCI-SS-tar component creates a tar archive with the path name specified in `directory path`.
Therefore, if a file or directory already exists at directory path, an error will occur.
When running a project containing this component multiple times, either rewrite directory path or click the `remove storage directory` button on the component property screen to delete the archive directory before running.

![img](./img/remove_storage_button_hpciss_tar.png)

--------
[Return to Component Details]({{site.baseurl}}/reference/4_component/)
