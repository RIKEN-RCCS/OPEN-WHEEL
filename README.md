# WHEEL
__W__ orkflow in __H__ ierarchical distribut __E__ d parall __EL__.

[public repo] (https://github.com/RIKEN-RCCS/WHEEL)

[docker image] (https://hub.docker.com/r/tmkawanabe/wheel)

## Prerequirements
latest version of [docker](https://www.docker.com/)

## user guide
user guild and tutorials are availbale here.

https://riken-rccs.github.io/WHEEL/

## How to use with docker
1. create new directory (hereafter referrd to as `CONFIG_DIR`)
2. download following 2 files to the `CONFIG_DIR`
    - [jobScheduler.json](https://raw.githubusercontent.com/RIKEN-RCCS/WHEEL/master/app/config/jobScheduler.json)
    - [server.json](https://raw.githubusercontent.com/RIKEN-RCCS/WHEEL/master/app/config/server.json)
3. create or server certification and key file for https, and put them into `CONFIG_DIR`
4. type following command

```
> docker run -d -v ${HOME}:/root -v CONFIG_DIR:/usr/src/app/config -p 8089:8089 tmkawanabe/wheel:latest
```

`CONFIG_DIR` must be absolute path in host machine.

above command line, we specify following options

- project files will be create under ${HOME}
- port 8089 is used for WHEEL

for detailed information about configuration, see [administrator's guide](./documentMD/AdminGuide.md)

## History
WHEEL was originaly developed by Research Institute for Information Technology(RITT), Kyushu University in 2016

It is still hosted at https://github.com/RIIT-KyushuUniv/WHEEL

RIKEN R-CCS forks it and continues the development


## for developpers
### directory structure
we have 4 main directories at top level

- docs
- documentMD
- client
- server

docs contains html documents it will generated from md documents in `documentMD/user_guide` by gitlab's CI/CD pipeline.
and it is publishd by github.io pages. please do not change any files under this directory.

documentMD contains document written in markdown. as mentioned above, files under `documentMD/user_guide`
will be publishd at github.io pages. please put detaild information and/or documents for developers
to outside of user\_guide directory

client and server has client and server code respectively.

### how to run without docker
1. install and build
```
> ./build.sh
```
2. start serever
```
> cd server
> npm start
```

### CI/CD process
if you push new commit which includes user guide update,
CI runner will commit new version of html user guide.
so, you have to git pull for master branch after CI process is finished.
