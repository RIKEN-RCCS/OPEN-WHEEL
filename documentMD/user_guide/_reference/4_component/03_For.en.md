---
title: For
---

![img](./img/for.png "for")

The For component depends on the index value specified, like a Fortran Do loop.
Repeats the subordinate component.

You can set the following properties for the For component:

### start
Sets the starting value of the index.

### end
Sets the closing price of the index.

### step
Sets the update width for index updates.

__ About Referencing Index Values __  
To use the current index value from a subcomponent during a loop, it can be referenced in the __$ WHEEL_CURRENT_INDEX__ environment variable.  
{: .notice--info}

### number of instances to keep
Specifies the maximum number of directories to keep for each index.
If unspecified, all directories are saved.

### For Component Run-time Behavior
The first time the For component is executed, the component directory is named with the index value at the end.
copied.
When all the subordinate components in the copied directory have finished executing, the new index value is calculated.
More directories are copied based on that value.

This process is repeated sequentially until the index value exceeds the closing price.
When the closing price is exceeded, the directory is copied to the original directory, and processing of the For component ends.
Note that even if you set a negative value for step, if the opening price is > closing price, the operation will be successful.
In this case, execution ends when the index falls below the closing price.


For example, a component called `for` with start=1, end=3, step=2
The process is as follows:

1. Copy `for` directory as `for_1` directory
2. Sequentially execute components in the `for_1` directory
3. index Calculation1 +2 = 3  => equal to the closing price of 3, run the next loop
4. Copy `for_1` directory as `for_3` directory
5. Sequentially execute components in the `for_3` directory
6. index Calculation3 +2 = 5  => Since the closing price has exceeded 3, the closing process is performed.
7. Copy `for_3` directory as `for` directory

If the number of instance to keep value is set to a nonzero value, after processing 4, 7
Removes more old directories (for example, `for_1` or `for_ 3`) than the configured number.

--------
Return to Component Details ({{site.baseurl}}/reference/4_component /)
