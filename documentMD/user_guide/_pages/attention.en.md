---
title: Restrictions
permalink: /attention/
toc: true
toc_sticky: true
layout: single
lang: en
---

Describes the specification limitations of WHEEL.  


## If the remote task is terminated by a signal
If a process running on a remote host is terminated by a signal,
Because the WHEEL specification does not allow the remote signal number to be supplemented, the operation is judged to have terminated normally.

{% capture notice-words %}
__ About Task Types __  
The terms used to describe the various tasks have the following meanings:

| Term               | Meaning                                                                |
|:-------------------|:------------------------------------------------------------------ |
| Local task      | Represents a task to run on localhost.                                 |
| Remote task      | Indicates the task to be executed on the remote host. <br/> Do not use a batch system.  |
| Remote Job Task | Represents a task that runs on a remote host using a batch system.       |

{% endcapture %}
<div class="notice--info">
  {{ notice-words | markdownify }}
</div>

***
Handling Running Scripts When Stopping a Project
If the Stop Project button stops the project, the script set to WHEEL is stopped, but any child processes called from the script are not stopped.

***
## Handling Large Files
WHEEL uses git to manage data handled by projects.
Therefore, placing large files in the project directory can cause various problems due to poor performance of repository operations.  
To avoid this problem, upload files larger than a certain size from the WHEEL graph view.
[git LFS] (https://git-lfs.github.com/).
Be aware that if you add files to your project's git repository by means other than WHEEL, you may not be able to work with them properly depending on their size.

***
## Changing the connector name with the input/output connector connected
With multiple output connectors connected to one input connector,
When renaming the input connector, multiple renaming operations are performed simultaneously.
Components may become inconsistent.
Before editing the input/output connector, disconnect it.

***
## Operating in a Windows Environment
If the WHEEL operating environment is WindowsOS, an error may be displayed when you execute delete of the project.
The deleted project is deleted from the project list, but the actual data is not deleted. Delete manually.

***
## About holding and unknown conditions
If a project contains a task that submits a job, the state of the project may be in the holding or unknown state.
The holding state is transitioned when the WHEEL process has terminated before confirming that the job has been submitted and terminated.
In this state, the execution of the project is paused, but only the job that was submitted before the process ended is acknowledged.
The status changes to unknown when all jobs have finished.

The unknown state means that the state of the project cannot be determined.
If you are transitioning from the holding state described above, check the state of the individual components to make sure that all tasks have been completed.
If there are tasks that have not finished, rerunning the project will rerun only those components that are not running and failed.

If the status check processing after the job is submitted fails (e. g. (For example, if a connection to the batch system cannot be established due to a temporary failure), the status is unknown.
In this case, check whether the task in the unknown status has finished normally by directly logging in to the job destination server.
If you need any files, please copy them.

***
## About Importing Existing Projects
When WHEEL reads an existing project that is not in the project list, it commits all changes to the git repository. Therefore, if the imported project or components in the project are not "not-started," you will not be able to clean the project again.
Therefore, check the state of the project and components before loading.


--------
Return to home page ({{site.baseurl}} /)