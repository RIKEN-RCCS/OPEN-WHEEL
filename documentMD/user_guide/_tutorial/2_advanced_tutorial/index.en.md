---
title: Tutorial Application
lang: en
permalink: /tutorial/2_advanced_tutorial/
---

This tutorial covers features not covered in the basics.

Unlike the basic section, all items are independent.
Create a new project individually and then follow the tutorial.

### 1. Conditional Branch
In a workflow, subsequent actions may change depending on the results of one action.

WHEEL provides an if component to achieve such conditional branching.

![img](./img/component_library_if.png "if component")

Let's use the if component to run different scripts depending on the success or failure of the script.

First, create a new project.
Then add two task components and an if component to the workflow.
Each of the following is called task0, task1, if0.

![img](./img/workflow_if.png "Post-Component Workflow")

First, create task0, task1 to run after branching from if0.

Create a new file for each component and enter the following in a text editor:
In addition, specify the created file in the script property.

task0:

```
echo task0
```

task1:

```
echo task1
```

Output __task0__ or __task1__ to the standard output, respectively.

Then specify the conditional branch for the if component.
Open the properties screen, create a new file named `check.sh`, and open it in a text editor.

If the return value of check.sh is 0, it branches to a green ▼ (if clause), and if it is not 0, it branches to a purple ▼ (else clause).
First,
```
exit 0
```
and make sure to pass the green ▼ (if clause).

Return to the component properties screen, click the __condition setting__ line, and specify `check.sh` from the __script name for condition check__ drop-down list.

![img](./img/property_if.png "if Component Properties")

Finally, connect the purple ▼ (else clause) displayed under if0 to task0 and the green ▼ (if clause) to task1.

The green connector (if clause) indicates components that advance when check.sh returns 0 and the purple connector (else clause) indicates components that advance when the return value is non-zero.

![img](./img/workflow_if2.png "Workflow at connection completion")

When you run this workflow, check.sh returns 0, so only task1 is run and stdout shows only `task1`.

![img](./img/workflow_if_result.png "Workflow Execution Results")

Let's initialize the project, change the contents of check.sh to `exit 1`, and try again.
This time, only task0 is executed, and stdout displays only `task0`.

### 2. Loop
The same process may be repeated in a workflow.

WHEEL has three loop components for (1), while (2), and foreach (3).

![img](./img/component_library_loop.png "loop component")

Within each component, you can define a nested workflow that iterates through subordinate workflows until the conditions specified for those components are met.

You can specify conditions for each component in the following ways:

for
: Count up or down from the opening price to the closing price

while
: Executes the specified shell script or javascript statement with a return value of 0 (true for javascript)

foreach
: List all the values to be used

Let's use the for component as a representative example to create a workflow that prints from 1 to 10.

First, add a for component to the project.

There is a text box in the for component property that specifies three numbers: __start__, __end__, and __step__.
Specify 1, 5, and 2, respectively.

![img](./img/property_for.png "for component settings")


Then double-click the for component.
The components in the for component are now visible, but there are no components now, so they are not visible.

![img](./img/graphview_for.png "Inside the for component")

Add one task component here.
Also, add an empty file run.sh to the task component and specify it in the script property.

![img](./img/graphview_for2.png "Inside the for component after adding child components")


The task component in the for component has a $WHEEL_CURRENT_INDEX` environment variable that indicates the value of the loop variable.
Open the file specified in the script in a text editor and write the following lines:

```
echo $WHEEL_CURRENT_INDEX
```

![img](./img/script_for.png "Scripts to Run in the for Component")

When you run the project, the standard output shows 1,3,5.

![img](./img/result_for.png "Execution Results")

As shown in this example, internal components are executed when the value of the end property of the for component and the index variable ($WHEEL_CURRENT_INDEX) are equal.


### 3. Parameter Study
In a computer simulation workflow, you may want to perform the same calculation over and over again, varying some of the input data parameters incrementally.

WHEEL has a parameterStudy component (The following PS components) that supports such processing.

![img](./img/component_library_ps.png "PS Components")

You can define nested workflows within PS components.
By rewriting and executing any file in a subordinate workflow with a specified parameter value, you can perform the same operation multiple times with different parameters.

Let's pass various arguments to the echo command by rewriting and executing the parameter values in the shell script.


First, add one PS component to the project.

![img](./img/graphview_ps.png "PS Graph View")

Then double-click the PS component to see inside the PS component and add one task component.
Also, add an empty file called `run.sh` in the task component and specify it in the script property.

In `run.sh`

```
echo number
```

and write.

![img](./img/script_ps.png "Scripts to Run in PS")

Save run.sh and return to the graph view.
Click the project name (In the following example, __tutorial_PS__) at the top of the screen to return to the root component of the project.

![img](./img/component_tree_ps.png "Scripts to Run in PS")

Open the PS component properties screen to display the Files area.
Click parameterSetting.json to go to the text editor screen with your selection.

The left side of the screen is the same text editor as before, but the right side of the screen provides a screen for setting up parameter studies.

![img](./img/texteditor_with_ps_config.png "Scripts to Run in PS")

First, click the __+ add new target file__ button at the top right of the screen.
The component tree screen appears, click __task0__. Type __run.sh__ for the file name and click the __OK__ button.

![img](./img/select_target_file.png "targetfile selection dialog")

The run.sh you just created appears in the text editor section. Drag the `number` part to select it.
The __parameters__ text box on the right side of the screen displays __number__.

![img](./img/select_parameter_field.png "Parameter substitution field selection state")

In this state, you can click the __+ add new parameter__ button to set the parameter for __number__.
For now, change the drop-down list to __list__.

![img](./img/list_parameter_dialog.png "list parameter dialog")

Next, set three values for __foo__ __bar__ __baz__. Type __foo__ in the text box and click the __+__ button. Follow the same steps to set __bar__ and __baz__.

![img](./img/create_parameter.png "Creating Parameters")

Finally, click the __OK__ button.

![img](./img/created_parameters.png "After creating parameters")

The parameter settings for __number__ are registered.
The __number__ part of __run.sh__ is rewritten as __\{\{ number \}\}__.

![img](./img/texteditor_ps2.png "Text Editor at End of Edit")

At runtime, this __\{\{ number \}\}__ is replaced by the actual parameters (foo, bar, baz) and executed respectively.

Finally, click the __save all files__ button at the top right of the screen to save your edits.

When you run the project, stdout displays foo, bar, and baz, respectively, as output from the echo command.

![img](./img/result_ps.png "PS Execution Results")

__About the order in which parameter studies are run__
The PS component executes the subcomponents as parallel as possible for all combinations in the parameter space specified by parameterFile.
Therefore, the execution order of the lower components is out of order, and the output order of the results is out of order.
{: .notice--info}

#### Addendum to Parameter Replacement
If __{% raw %}{{ number }}{% endraw %}__ appears elsewhere in the file specified in the targetfile, it will be replaced by a parameter as well.

You can also add filters within double parentheses.
For example, __{% raw %}{{ number | upper }}{% endraw %}__ allows the parameter to be capitalized.

Another alternative is __{% raw %}{{ "true" if number == "foo" else "false" }}{% endraw %}__, which is replaced by "true" only when number is foo, and "false" otherwise.

See here for available filters.

[https://mozilla.github.io/nunjucks/templating.html#builtin-filters](https://mozilla.github.io/nunjucks/templating.html#builtin-filters)


### 4. Input File
Depending on the nature of the simulation, you may want preprocessing to be done interactively before the workflow is run, but you may want the workflow to automatically perform subsequent operations after the solver.

WHEEL provides a source component that uploads files at runtime and treats them as __input data__ for the workflow.

![img](./img/component_library_source.png "source component")

Let's learn about the source component by creating a workflow that uses the cat command to display any text file created on the client PC.

First, add a task component and a source component to your project.

Open the properties of the source component and click the upload setting line to enable the __upload on demand__ switch.
The output files of the source component displays __UPLOAD_ON_DEMAND__.

Then add an empty file called `run.sh` in the task component and specify it in the script property.
In run.sh, include the following:

```
cat input.txt
```

Finally, add __input.txt__ to the input files of the task component and connect to __UPLOAD_ON_DEMAND__ of the source component.
This completes the workflow creation process.

![img](./img/workflow_source.png "Complete workflow of source component")

In fact, prepare a text file on your client PC to use as an input file.

When you run the project, you will be prompted to upload a file to use as the outputfile for the source component.
Specify the file you prepared earlier.
When the upload is complete, the part that says __drop file here__ changes to the name of the uploaded file.

![img](./img/upload_dialog.png "Upload source component dialog")


Clicking the __ok__ button resumes project execution and prints the contents of the file uploaded by the cat command to stdout.

You can upload the file again and again until you click the __ok__ button.
If you specify the wrong file, upload it again and the specified file will be used later.


### 5. Result Display
Workflows that are automated to post-process often output image files as the result of calculations.

WHEEL provides a viewer component that displays image files in typical formats in the browser.
This component makes it easy to see the results without downloading the resulting file to the client PC.

![img](./img/component_library_viewer.png "viewer component")

Let's learn about the viewer component by creating a workflow that passes a pre-prepared image file to the viewer component.

To get started, add a task component and a viewer component to your project.

Then add an empty file called `run.sh` in the task component and specify it in the script property.
In run.sh, include the following:

```
ls *
```

Uploads image data for display in the viewer component to the task component.
Upload by dragging and dropping the image data to the Files area with the __upload file__ button.

![img](./img/upload_file.png "upload file button")

Specify the file name of the uploaded image data in the output files property.
By writing __\*.extension__, you can specify all files with the same extension or omit the file name. (For example, for a JPEG file, write __\*.jpg__)
If you want to display only one file as image data, you can specify the file name as it is.
It is also acceptable to specify multiple file names in the output files property without combining them into one.


Finally, add __./__ to the input files of the viewer component and connect to the output files of the task component.
This completes the workflow creation process.

![img](./img/workflow_viewer.png "The complete workflow of the viewer component")

__When "./" is set for input files__
Setting input files to __./__ places all files passed as input files (In this case, \*.JPG and \*.web) directly under the viewer component directory.
{: .notice--info}

When you run the project, you will see a dialog called __open viewer screen__.

![img](./img/open_viewer_screen_dialog.png "open viewer screen daialog")

Click the ok button to display the Image Viewer in a separate tab.

![img](./img/image_viewer.png "image viewer")

By default, the displayed image is tiled, but when you click the displayed image, it enters the slideshow state.
In this state, you can zoom in and out of the image.

![img](./img/slideshow_display.png "slideshow display")

### 6. File Save
When you run a workflow with WHEEL, the resulting output files are deleted every time you initialize the project.

If you run the same workflow over and over with a human intervention, checking results and adjusting settings, you may want to save the results from each run.

In these cases, you can use the storage component to leave it undeleted during project initialization.

![img](./img/component_library_storage.png "storage component")

Let's use the storage component to ensure that all files are saved by running and initializing the project multiple times while saving the files.

To get started, add one task component and one storage component to your project.

Then add an empty file called `run.sh` in the task component and specify it in the script property.
In run.sh, include the following:

```
echo foo >foo.txt
```

Also, add __\*.txt__ to the output files of the task component.
This component only prints __foo.txt__, but the file name is specified as __\*__ because the project will now run several times while the output file name is rewritten.

Next, open the storage component properties window and write __/tmp__ in the __directory path__ field.
Also, specify __./__ for input files.

__About setting directory path__
If/tmp does not exist or/tmp does not have write permission, specify any other directory.
However, you must specify a path that is outside the scope of the directory tree where the project files are stored.
{: .notice--info}

Finally, connect the output files of the task component and the inputFile of the storage component.
This completes the workflow creation process.

![img](./img/workflow_storage.png "Complete storage component workflow")

When you run the project, foo.txt appears in the Files area for each task0, storage0 component.

When you initialize the project, foo.txt for task0 is deleted, but foo.txt for storage0 remains.

If you edit run.sh in task0, rename the output file to bar.txt, and run it again, you will see foo.txt, bar.txt in the storage0 component.

In this way, when you initialize a project, the files stored in the storage component are retained, and can be used to store files for restart calculations.



### 7. Bulk Job
The bulk job function can be used in systems such as Fugaku that use Fujitsu's HPC middleware "UJITSU Software Technical Computing Suite".

WHEEL provides a bulkjobTask component to facilitate this functionality from the GUI.

![img](./img/component_library_bulkjob.png "bulkjob Component")

Let's use bulk jobs to create a workflow that is the same as the parameter study.

Before you begin, create a new project and add a builkjobTask component.

The default is to run on localhost, so change the property host to specify a remote host where bulkjob functionality is available.

__Remote host settings when using the bulk job function__
Note that even if the batch system running on the actual host supports the bulkjob function, the bulkjob function cannot be used unless __use bulkjob__ is enabled in the remotehost setting.
![img](./img/remotehost.png "Configure use bulkjob")
{: .notice--info}

Open the properties screen, create an empty file named `run.sh`, open a text editor, and write `echo ${PJM_BULKNUM}`.
When the job is executed, the `${PJM_BULKNUM}` part is replaced with the set parameters.

Return to the properties screen and set script to `run.sh`.

Finally, click in the __bulkjob setting__ row to specify the parameters.
In this case, uncheck the __use parameter setting file for bulk number__ and specify __0__ for start and __5__ for end.

![img](./img/property_bulkjob.png "bulknum configuration")


Finally, to collect the standard output for each subjob, click the __remote file setting__ line and specify `run.sh*` for __include__.

![img](./img/property_bulkjob2.png "Configure include")

When the project has finished running, standard output is output with a file name of the form run.sh.xxxxx[`${PJM_BULKNUM}`].out .
Make sure that each `PJM_BULKNUM` matches the output of the echo command output to the file.


### 8. Step Job
The Step Job function can be used on systems using Fujitsu's HPC middleware "FUJITSU Software Technical Computing Suite" such as Fugaku.

WHEEL provides the stepJob and stepJobTask components to facilitate this functionality from the GUI.

![img](./img/component_library_stepjob.png "stepjob Component")

The stepjob function of WHEEL is to define multiple stepJobTask components within the stepJob component and define dependencies, and then execute them using the stepjob function of the batch system.

First, create a new project and add a stepJob component.

The default is to run on localhost, so change the property host to point to a remote host where stepjob functionality is available.

![img](./img/workflow_stepjob.png "Configuring the stepjob Component")

__Remote host settings when using the step job function__
Even if the batch system running on the actual host supports the step job function, the stepjob function cannot be used unless __use stepjob__ is enabled in the remotehost setting.
![img](./img/remotehost2.png "Configure use stepjob")
{: .notice--info}

Then double-click __stepjob0__ to view the components below stepjob0.

You can only place a stepjobTask component within a stepjob component.
This switches the component library portion on the left side of the screen to show only the stepjobTask component.

![img](./img/component_library_stepjobTask.png "component library in stepjob component")

Add two stepjobTask components here.

Because you have two components, sjTask0 and sjTask1, create an empty file named __run.sh__ for each component and specify it in the __script__ property.

![img](./img/property_stepjobTask.png "stepjobtask Properties")

The script for sjTask0 should be:

```
exit 1
```

This will cause sjTask0 to fail each time.

The script for sjTask1 must be:

```
echo stepjobTask1 > stdout.txt
```

It then specifies the order in which sjTask0 and sjTask1 run.
Drag the ▼ of sjTask0 and drop it on sjTask1

The lines connect, and the icon on the left shoulder of sjTask1 changes to 1.

![img](./img/workflow_stepjobTask.png "Workflow after dependency specification")

In addition, specify a run condition for sjTask1.
Click to open the __stepjobtask setting__ area of the Properties window, enable __use dependency__, and enter `sd=ec==1` for __dependencyForm__.
Now, sjTask1 is executed only when sjTask0 returns 1.
For more information about writing the __dependencyForm__, see the TCS documentation or the user guide for your computer system.

![img](./img/property_stepjobTask2.png "Dependency Expression")

Finally, to retrieve the file output by sjTask1, click to open the __remote file setting__ area and type `stdout.txt` in the include text box.

![img](./img/property_stepjobTask3.png "include specification")

When I run the project, sjTask0 fails, but sjTask1 runs and prints `stepjobTask1` in stdout.txt.

Once you have initialized the project, change the __dependencyForm__ of sjTask1 to `sd=ec==0` and run it.

This time, after sjTask0 fails, sjTask1 does not run and the entire workflow exits.

This concludes the application tutorial.

If you want to learn about the workflow that actually makes an application work, go to [Practical Tutorial]({{site.baseurl}}/tutorial/3_application_tutorial/).

For detailed information about each function, refer to the [Reference Manual]({{site.baseurl}}/reference/).


--------
[Return to home page]({{site.baseurl}}/tutorial/)
