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
If a process running on a remote host terminates due to a signal, it is considered to have terminated normally because the WHEEL specification does not allow the remote signal number to be supplemented.

{% capture notice-words %}
__About Task Types__  
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
## Handling Running Scripts When Stopping a Project
If the Stop Project button stops the project, the script set to WHEEL is stopped, but any child processes called from the script are not stopped.

***
## Handling Large Files
WHEEL uses git to manage data handled by projects.
Therefore, placing large files in the project directory can cause various problems due to poor performance of repository operations.  
To avoid this problem, configure [git LFS](https://git-lfs.github.com/) to manage files larger than a certain size uploaded from the WHEEL graph view.
Be aware that if you add files to your project's git repository by means other than WHEEL, you may not be able to work with them properly depending on their size.

***
## Changing the connector name with the input/output connector connected
If you rename an input connector while multiple output connectors are connected to one input connector, multiple renaming operations are performed at the same time, and the components may not be consistent.
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

In addition, if the status check processing after a job is submitted fails (e.g. When the batch system cannot be connected due to a temporary failure, etc.), the status is unknown.
In this case, log in to the job destination server directly to check whether the task in unknown status has finished normally, and then copy any necessary files.

***
## About Importing Existing Projects
When WHEEL reads an existing project that is not in the project list, it commits all changes to the git repository.
Therefore, if the imported project or components in the project are not "not-started," you will not be able to clean the project again.
Therefore, check the state of the project and components before loading.


--------
[Return to home page]({{site.baseurl}}/)