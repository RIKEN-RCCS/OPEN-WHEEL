---
title: About WHEEL
layout: single
permalink: /about/
toc: true
toc_sticky: true
lang: en
---
WHEEL is a web tool that allows you to interactively create and execute analysis jobs.
By creating workflows in the browser, you can run complex analysis jobs without using CUIs.

WHEEL was first developed by the Kyushu University Institute of Information Technology (RITT) in 2016.
It is still hosted on [https://github.com/RIIT-KyushuUniv/WHEEL](https://github.com/RIIT-KyushuUniv/WHEEL "WHEEL"), and RIKEN R-CCS forked it to continue development ([https://github.com/RIKEN-RCCS/OPEN-WHEEL](https://github.com/RIKEN-RCCS/OPEN-WHEEL "OPEN-WHEEL")).

## WHEEL System Configuration Diagram
The following is an image of the system configuration.

![System Configuration]({{site.baseurl}}/{{site.include}}{{page.url}}img/system_diagram.svg "System Configuration")

## System Requirements
WHEEL starts on Docker. Therefore, install the latest Docker on the WHEEL server.

## Usage Notes
WHEEL does not have account control.
Therefore, WHEEL must be used by one user.
For multiple users, provide a WHEEL environment (Docker container+WHEEL) for each user.

Also, you cannot stop the WHEEL environment while a calculation is running.
Therefore, do not stop Docker.
If you stop Docker, you won't get any results.


--------
[Return to home page]({{site.baseurl}}/)