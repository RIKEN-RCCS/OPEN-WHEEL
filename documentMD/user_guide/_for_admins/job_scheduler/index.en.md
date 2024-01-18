---
title: Configuring the Batch System
lang: en
permalink: /for_admins/job_scheduler/
---

## Introduction
This chapter describes how to set up a batch system.

WHEEL includes the main batch system configuration by default. However, if you want to add a batch system that is not included by default, or if you want to remove an unwanted batch system, you can change the batch system settings by editing the WHEEL configuration file.

## Configuration File
The batch system configuration file, `jobScheduler.json`, is located in the `CONFIG_DIR` specified in [How to start WHEEL](../how_to_boot/#how-to-start). It can be edited with a text editor such as vi or Notepad.

{% capture notice-confirm %}
The settings of jobSchduler.json included in WHEEL by default have been verified to work in the following environments.
- PBSPro, PBSProWithoutHistory  -> PBSPro (Open source version) ver. 18
- SLURM -> SLURM 17.02.10
- Fugaku- > Fugaku as of 2021/2/12
{% endcapture %}
<div class="notice--info">
  {{ notice-confirm | markdownify }}
</div>

## Structure of the jobScheduler.json File
Only a single object can be at the top level of the `jobScheduler.json` file.

Within the top-level object, you can place multiple objects whose values are the object that describes the commands to be used by each job scheduler and whose keys are the job scheduler configuration names.

```
{
    "Setting name 1": {
        //Settings
    },
    "Setting name 2": {
        //Settings
    }
}
```

The object that describes each Job Scheduler configuration must contain the following properties:

#### submit
Use a character string to specify the command name to be used when the job is submitted and the required options. However, it does not include the values specified by queueOpt and grpName, which are described below.

#### queueOpt
Use a string to specify options for specifying the destination queue.

#### grpName
A string of options for specifying the group name used in UGE.

{% capture notice-command %}
If submit, queueOpt, and grpName are all specified, and a task component job is submitted, the actual command to be used is the following string:

`${submit} ${grpName} ${task.queue} ${queueOpt}${task.queue} ./${task.script}`

`task.queue` and `task.script` specify the queue name/script file name specified in the GUI of the Task component.
{% endcapture %}
<div class="notice--info">
  {{ notice-command | markdownify }}
</div>

#### reJobID
Specify a character string as a regular expression for obtaining the ID of the job submitted from the character string returned by the job submission command.

The first capture in this regular expression is treated as the job ID.
The specified string is passed verbatim to the RegExp constructor and must be escaped if necessary.

#### stat
Specifies the command used to check the status of the job, including options.
The value can be a string or an array of strings.

If a string is specified as a value, it is executed once, followed by a jobID.

Given an array of strings, a jobID is given for each element of the array.
Execute the commands in order until they terminate normally.  
For example, if the setting value is ["stat -a," "stat -b"]

`stat -a ${jobID} || stat -b ${jobID}`

If `stat -a` succeeds, the output of `stat -b` is treated as the output of the stat command.

#### reFinishedState
For the character string returned by the status check command, specify a character string as a regular expression for determining whether the job has ended (whether no further status check is required).

The determination of normal or abnormal termination is based on the capture returned by reReturnCode and reJobStatusCode, described below.

#### reReturnCode
Specifies, as a string, the regular expression for retrieving the return value (exit code) of the job script from the output of the stat command.
However, if the specified string does not qualify as a regular expression or contains no captures, treat it as "Return value =-2". (This fact is also output to the log.)

#### reJobStatus
A string is a regular expression used to obtain the status code returned by the job scheduler from the output of the stat command.
Treats the only captured value in this regular expression as a status code. However, if the specified string does not qualify as a regular expression or contains no captures, treat it as "status code =-2". (This fact is also output to the log.)

#### del
A string specifying the command used to delete the job, including options.
It is called with jobID as the argument of the command specified here.


--------
[Return to home page]({{ site.baseurl }}/)