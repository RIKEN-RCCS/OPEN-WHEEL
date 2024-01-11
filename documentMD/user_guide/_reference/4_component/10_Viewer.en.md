---
title: Viewer
lang: en
permalink: /reference/4_component/10_Viewer.html
---

![img](./img/viewer.png "viewer")

The Viewer component can be used to generate image files, etc., during project execution.
A component for viewing from the browser.
You can view the following files:

- apng (Animated Portable Network Graphics)
- avif (AV1 Image File Format)
- gif (Graphics Interchange Format)
- jpeg (Joint Photographic Expert Group image)
- png (Portable Network Graphics)
- webp (Web Picture format)
- tiff (Tagged Image File Format)
- bmp (BitMaP image)
- svg (Scalable Vector Graphics)

There are no unique properties that you can specify for the Viewer component.
Also, you cannot set the output files property for the Viewer component.

### Viewer Component Behavior
After the Viewer component has finished executing its predecessor,
Receive connected files from input files.

__When "./" is set for input files__  
Setting input files to __./__ places all files passed as input files (For extensions visible in the Viewer component) directly under the viewer component directory.
{: .notice--info}

If these files contain image files that can be viewed in a browser
The dialog appears in the browser only the first time.
Click the __ok__ button to display the viewer screen in a separate tab.

![img](./img/viewer_dialog.png "viewer_dialog")

Also, the __open viewer screen__ <!-- Viewer Screen Display --> button at the top of the screen is enabled.
After that, you can click this button to display the viewer screen.

![img](./img/open_viewer_screen.png "open viewer screen button")


--------
[Return to Component Details]({{site.baseurl}}/reference/4_component/)
