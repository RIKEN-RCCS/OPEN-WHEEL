---
title: Task
lang: en
permalink: /reference/4_component/01_Task.html
---

![img](./img/task.png "task")

The Task component is the most basic and important component of WHEEL.  
Executes the script file set in the __script__ property according to the settings in the execution environment (host/use job scheduler/queue property).

The following properties can be specified for a Task component:

### script
Sets the filename of the script to call when the Task component runs.

![img](./img/task_script.png "task_script")

The script property is a select box that lets you choose from among the files in the Task component.

__About Task Component Execution Results__  
The success or failure of the Task component is determined by the return value of the specified script. (0: Normal end, other than 0: Abnormal end)  
Therefore, when executing multiple commands in a script, specify the return value accordingly.
{: .notice--info}

### host
Select the remote host set in [Remote host settings]({{site.baseurl}}/for_admins/how_to_boot/#remote-host-settings) or "localhost" as the script execution environment.

![img](./img/task_host.png "task_host")

- When "localhost" is selected  
script is run on the machine where the WHEEL server is running.  
- When other than "localhost" is selected  
ssh transfers the entire directory to the remote host, and script runs on the remote host. (If use job scheduler is set, as described below, the script is submitted to the batch system as a job script.)

### use job scheduler
Enables script execution when it is submitted to the batch system.  
The following queue, submit option properties can only be set when use job scheduler is enabled:

- When invalid

![img](./img/task_jobScheduler_disable.png "task_jobScheduler_disable")


- When enabled

![img](./img/task_jobScheduler_enable.png "task_jobScheduler_enable")

### queue
Select the queue in which the job is to be submitted from the queue specified in the remote host settings.
If not specified, the job is submitted to the batch system default queue.

### submit command
Displays the name of the command used to submit the job to the batch system specified in [Remote host settings]({{site.baseurl}}/for_admins/how_to_boot/#remote-host-settings).
Therefore, it cannot be changed here.

### submit option
Sets additional options to be specified when the job is submitted.

### number of retry
Specifies the number of times the Task component automatically reruns if it fails to run.
If none is specified, the command is not re-executed.

![img](./img/task_num_retry.png "task_number_of_retry")

### use javascript expression for condition check
Specifies whether to use a javascript expression or a shell script to determine whether a Task component succeeds or fails.

 - When invalid  
 ![img](./img/task_retry_expression_disable.png "task_retry_expression_disable")<br/>
When disabled, a drop-down list appears to select a shell script.  
The shell script specified here is executed after the Task component has finished executing, and returns 0 as success or non-zero as failure. <br/><br/>
If none is specified, the return code of the script specified in __script__ performs the same judgment.

 - When enabled  
![img](./img/task_retry_expression_enable.png "task_retry_expression_enable")<br/>
When enabled, you can write javascript expressions.  
The expression you enter here is evaluated after the Task component has finished executing, and a Truthy value indicates success, and a Falsy value indicates failure.

If both the script name and the javascript expression are not set and you set only the number of retry values, repeat the retry until the script terminates normally or reaches the number of retry settings.

### include, exclude

![img](./img/include_exclude.png "include, exclude")

The files generated when the Task component is run on the remote host remain intact on the remote host unless they are required for further processing, such as specified in output files.

Therefore, you should specify in __include__ the files that you want to check for that are not necessary for subsequent workflow processing (such as the log files output by the application during execution).
When the Task component finishes executing, it is copied to the WHEEL server and can be viewed in the Files area.

__include__ can be a directory name, a glob (wildcard), etc., but __exclude__ can be used to exclude downloads.

For example, suppose you specify `*.txt` for __include__ and `foo.txt` for __exclude__, and foo.txt, bar.txt, baz.txt are generated at the end of execution.
Only two files, bar.txt and baz.txt, are actually copied to the WHEEL server.

### clean up flag
Specifies whether to delete files left on the remote host after execution on the remote host has finished.

![img](./img/clean_up_flag.png "clean_up_flag")

__remove files__ to remove, __keep files__ to save on remote host.  
The default setting is __same as parent__ and behaves the same as the upper component setting.
Note that if __same as parent__ is specified for the top-level component, the behavior is the same as if __keep files__ is specified.



--------
[Return to Component Details]({{site.baseurl}}/reference/4_component/)

