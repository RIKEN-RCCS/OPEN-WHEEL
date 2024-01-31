---
title: Foreach
lang: en
permalink: /reference/4_component/05_Foreach.html
---

![img](./img/foreach.png "foreach")

A Foreach component iterates through its subcomponents based on a list of configured indexes, like a for loop in a shell script.

You can set the following properties for Foreach components:

### indexList
![img](./img/loop_setting.png "loop setting")

Sets the list of index values.  
Enter the desired index value in the input field and click the + button to add it. 

__About Referencing Index Values__  
To use the current index value from a subcomponent during a loop, it can be referenced in the __$WHEEL_CURRENT_INDEX__ environment variable.  
{: .notice--info}

### number of instances to keep
Specifies the maximum number of directories to keep for each index.
If unspecified, all directories are saved.

For details, see [Foreach Component Run-time Behavior](#foreach-component-run-time-behavior) below.


### Foreach Component Run-time Behavior
The Foreach component behaves the same way as the For component, but the index value is not calculated; instead, the values set in indexList are used starting from the beginning of the list.
Terminates execution of the entire component when it reaches the end of the list.

--------
[Return to Component Details]({{site.baseurl}}/reference/4_component/)

