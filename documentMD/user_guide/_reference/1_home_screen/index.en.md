---
title: Home Screen
---
Create a new project or edit an existing project from the Home screen.
The Home screen is organized as follows.

![img](./img/home.png "home")

|| Component | Description |
|----------|----------|---------------------------------|
|1| OPEN button                | Opens an existing project                                                                           |
|2| NEW button                 | Creates a new project                                                                         |
|3| REMOVE FROM LIST button    | Deletes the project from the project list area (the entity file remains).                       |
|4| REMOVE button              | Deletes the project                                                                             |
|5| batch mode switch        | Switches to mass delete mode for multiple projects. When enabled, multiple projects can be selected |
|6| Navigation drawer     | Opens a drawer with links to the User Guide, Remote Host Configuration screen                               |
|7| Project List Area | Lists previously opened projects.                                                         |

The following items are displayed in the Project List area.
- Project name
- Description
- The root directory path of the project file
- Creation Date
- Updated
- Execution status


## Creating a New Project
To create a new project:

1. Click the __NEW__ button to display the Create New Project dialog.
1. Optionally, select a project data creation location in the directory tree.
1. Enter a project name.
1. Click the __CREATE__ button.

![img](./img/new.png "new")

When a new project is created, it appears in the Project List area.
Follow the steps in the next section, Open Project (# Open Project)
Switch to the workflow screen.

## Open Project
To open a project and transition to the workflow screen:

1. In the Project Browser area, click to select the check box to the left of the project name you want to open.
1. Click the __OPEN__ button to switch to the workflow screen.

![img](./img/open.png "open")

## Rename Project
Click a project name in the Project List area to display the Rename Project dialog.
Edit the project name and press the __Enter__ key to rename the project.

![img](./img/changeName.png "changeName")

__ About Project Names ___  
The project name is used as part of the directory name.  
Therefore, if the directory name after the project name change overlaps with an existing directory name, the project name will end with .1
(When .1 is also used, the value of .2.3 ・・・ is successively larger.) is automatically granted.
{: .notice--info}

## Delete Project
To delete a project:
1. In the Project List area, click to select the check box to the left of the project name that you want to delete.
1. Click the __REMOVE__ button to delete the selected project.  
   Click the __REMOVE FROM LIST__ button instead.
   It is removed from the project list area, but the files that constitute the project can remain on the server side.

## Mass Delete Multiple Projects
Enabling the __batch mode__ switch allows you to select multiple projects.
In this state, you can delete multiple projects at once by clicking the __REMOVE__ or __REMOVE FROM LIST__ button.

--------
Return to Reference Manual home page ({{site.baseurl}}/reference /)
