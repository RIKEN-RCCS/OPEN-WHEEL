---
title: Storage
lang: en
permalink: /reference/4_component/08_Storage.html
---

![img](./img/storage.png "storage")

The Storage component is used to store files in a directory outside the scope of the project directory.

The files in the workflow are managed by WHEEL, and any files generated or modified during execution are returned to their original state by clicking the cleanup project button.

If you want to keep files after initializing a project, such as when you run the same project repeatedly with different settings, you can use the input files/output files feature to transfer them to the Storage component and store them in a location outside of WHEEL's control.


You can set the following properties for the Storage component:

### host
You can set host to the host where the file is actually saved.

If `localhost` is specified, a copy of the file is saved on the machine running the WHEEL server.  
If anything other than `localhost` is specified, a copy of the file is saved on the remote host.

### directory path
![img](./img/storage_path.png "storage_path")

Copy the files transferred to the storage component under the directory specified in directory path.

If directory path is set within the project directory, it will be erased during project initialization.
WHEEL does not determine whether the directory path you set is in the project directory, so we recommend that you set a path outside the project directory.

--------
[Return to Component Details]({{site.baseurl}}/reference/4_component/)
