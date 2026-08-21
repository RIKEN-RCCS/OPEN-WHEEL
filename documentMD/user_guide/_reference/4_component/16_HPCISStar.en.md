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
Set host to the host that runs the gfptar command used to transfer files to HPCI shared storage.
The files themselves are stored on HPCI shared storage, not on the host itself.

However, only hosts that have the `use gfarm` option checked in the remotehost settings can be set as the host.

The HPCI-SS-tar component always needs to transfer files to HPCI shared storage, so host is
required. Unlike the Storage component, you cannot select localhost (a local path). If host is
left unset, or set to localhost, running the project will fail with a validation error.

### directory path
![img](./img/storage_path.png "storage_path")

Similar to the Storage component, this is the path where files are actually stored.
However, you must specify the path on HPCI shared storage, not a path on the host.

directory path is also required. Running the project with it left blank will fail with a
validation error.

### memo
You can enter free-form text here. Whatever you enter is included as-is, in the `<memo>` element,
in the GFarm extended-attribute metadata (`wheel.workflow`) attached to the archive on HPCI shared
storage at transfer time. Use it to record the origin, purpose, or any other note about the
stored file.

### Constraints
The HPCI-SS-tar component creates a tar archive with the path name specified in `directory path`.
Therefore, if a file or directory already exists at directory path, an error will occur.
When running a project containing this component multiple times, either rewrite directory path or click the `remove storage directory` button on the component property screen to delete the archive directory before running.

![img](./img/remove_storage_button_hpciss_tar.png)

--------
[Return to Component Details]({{site.baseurl}}/reference/4_component/)
