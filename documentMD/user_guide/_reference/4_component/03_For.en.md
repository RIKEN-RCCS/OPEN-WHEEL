---
title: For
lang: en
permalink: /reference/4_component/03_For.html
---

![img](./img/for.png "for")

The For component iterates through the subcomponents depending on the index value specified, like a Fortran Do loop.

You can set the following properties for the For component:

### start
Sets the starting value of the index.

### end
Sets the closing price of the index.

### step
Sets the update width for index updates.

__About Referencing Index Values__  
To use the current index value from a subcomponent during a loop, it can be referenced in the __$WHEEL_CURRENT_INDEX__ environment variable.  
{: .notice--info}

### number of instances to keep
Specifies the maximum number of directories to keep for each index.
If unspecified, all directories are saved.

For details, see [For Component Run-time Behavior](#for-component-run-time-behavior) below.

### skip copy

Sets the list of files, directories, or glob patterns to exclude from the copy operation between loop iterations.

Files and directories matching the specified patterns are not copied when WHEEL creates a new iteration directory from the previous one.
This is useful for excluding large output files or temporary files generated during previous iterations.

Enter the desired pattern in the input field and click the + button to add it.
Glob patterns (e.g., `*.log`, `output_*`, `results/`) are supported.

### For Component Run-time Behavior
When the For component runs for the first time, the component directory is copied with the index value appended.
When all the subcomponents in the copied directory have finished executing, a new index value is calculated and further directories are copied based on that value.

This process is repeated sequentially until the index value exceeds the closing price.
When the closing price is exceeded, the directory is copied to the original directory, and processing of the For component ends.
Note that even if you set a negative value for step, if the opening price is > closing price, the operation will be successful.
In this case, execution ends when the index falls below the closing price.


For example, a `for` component with start=1, end=3, step=2 is processed as follows:

1. Copy `for` directory as `for_1` directory
2. Sequentially execute components in the `for_1` directory
3. index Calculation 1 +2 = 3  => equal to the closing price of 3, run the next loop
4. Copy `for_1` directory as `for_3` directory
5. Sequentially execute components in the `for_3` directory
6. index Calculation 3 +2 = 5  => Since the closing price has exceeded 3, the closing process is performed.
7. Copy `for_3` directory as `for` directory

If the number of instance to keep value is set to nonzero, delete the old directories (such as `for_1` and `for_3`) that exceed the number set after the 4, 7 operation.

--------
[Return to Component Details]({{site.baseurl}}/reference/4_component/)
