---
title: While
lang: en
permalink: /reference/4_component/04_while.html
---

![img](./img/while.png "while")


The While component, like the While loop in various programming languages, iterates through the subcomponents while the condition is true.

The properties you can set for the While component are:

### use javascript expression for condition check
Specifies whether to use a shell script or a javascript expression to determine whether to repeat the execution, similar to the retry decision for the Task component.

### script name for condition check
Select the shell script to be used for condition determination from the drop-down list only when use javascript expression for condition check is disabled.

### jacascript expression
Sets the javascript expression used for condition judgment only when use javascript expression for condition check is enabled.

__About Referencing Index Values__  
To use the current index value from a subcomponent during a loop, it can be referenced in the __$WHEEL_CURRENT_INDEX__ environment variable.  
{: .notice--info}

### number of instances to keep
Specifies the maximum number of directories to keep for each index.
If unspecified, all directories are saved.

For details, see [While Component Run-time Behavior](#while-component-run-time-behavior) below.

### While Component Run-time Behavior
The While component behaves similarly to the For component, but uses a zero-based number at the end of the directory name instead of an index value.

Also, the termination decision is not calculated by the index value, but by the return value of the configured shell script or the evaluation result of the javascript expression.

--------
[Return to Component Details]({{site.baseurl}}/reference/4_component/)

