"use strict";
var fs = require("fs");
var path = require("path");
var ssh2 = require("ssh2");
var child_process = require("child_process");
var logger = require("./logger");
var serverUtility = require("./serverUtility");
var SwfState = require("./swfState");
var SwfType = require("./swfType");
var SwfJobScheduler = require("./swfJobScheduler");
var SwfScriptType = require("./swfScriptType");
/**
 * Operator of SWF project.
 */
var ProjectOperator = (function () {
    /**
     * Create new instance.
     * @param path_project
     */
    function ProjectOperator(path_project) {
        this.projectJson = serverUtility.createProjectJson(path_project);
        var dir_project = path.dirname(path_project);
        var path_workflow = path.resolve(dir_project, this.projectJson.path_workflow);
        var treeJson = serverUtility.createTreeJson(path_workflow);
        this.tree = ProjectOperator.createTaskTree(treeJson);
        ProjectOperator.initializePathAbsolute(this.tree, path.dirname(this.projectJson.log.path));
    }
    /**
     * Run project.
     * @param host_passSet
     */
    ProjectOperator.prototype.run = function (host_passSet) {
        ProjectOperator.setPassToHost(this.tree, host_passSet);
        TaskManager.cleanUp(this.tree);
        this.projectJson.state = SwfState.RUNNING;
        try {
            logger.info("Run Project : " + this.projectJson.name);
            TaskManager.run(this.tree);
        }
        catch (err) {
            logger.error('Catch exception.');
            logger.error(err);
        }
    };
    /**
     * Clean up project.
     */
    ProjectOperator.prototype.clean = function () {
        TaskManager.cleanUp(this.tree);
    };
    /**
     * Asynchronous clean up project.
     * @param callback
     */
    ProjectOperator.prototype.cleanAsync = function (callback) {
        TaskManager.cleanUpAsync(this.tree, callback);
    };
    /**
     * set time stamp
     * @param tree taeget tree
     * @param path_to_root path to root of tree
     */
    ProjectOperator.setTimeStamp = function (tree, timeStamp) {
        if (tree.type == SwfType.REMOTETASK || tree.type == SwfType.JOB) {
            var remoteTask = tree;
            remoteTask.timeStamp = timeStamp;
        }
        for (var i = 0; i < tree.children.length; i++) {
            ProjectOperator.setTimeStamp(tree.children[i], timeStamp);
        }
    };
    /**
     * set absolute path of directory of the task
     * @param tree taeget tree
     * @param path_to_root path to root of tree
     */
    ProjectOperator.initializePathAbsolute = function (tree, local_root_path) {
        var date = new Date();
        var timeStamp = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds();
        ProjectOperator.setTimeStamp(tree, timeStamp);
        ProjectOperator.setPathAbsolute(tree, local_root_path, '');
    };
    ProjectOperator.setPathAbsolute = function (tree, local_root_path, path_from_root) {
        path_from_root = path.join(path_from_root, tree.path);
        tree.local_path = path.join(local_root_path, path_from_root);
        if (tree.type == SwfType.REMOTETASK || tree.type == SwfType.JOB) {
            var remoteTask = tree;
            tree.remote_path = path.posix.join(remoteTask.remote.path, remoteTask.timeStamp, path_from_root.replace('\\', '/'));
        }
        for (var i = 0; i < tree.children.length; i++) {
            ProjectOperator.setPathAbsolute(tree.children[i], local_root_path, path_from_root);
        }
    };
    ProjectOperator.resetPathAbsolute = function (tree) {
        var root = ProjectOperator.getRootTree(tree);
        var local_root_path = path.dirname(root.local_path);
        var path_from_root = path.relative(local_root_path, path.dirname(tree.local_path));
        ProjectOperator.setPathAbsolute(tree, local_root_path, path_from_root);
    };
    ProjectOperator.getRootTree = function (tree) {
        if (tree.parent != null) {
            return ProjectOperator.getRootTree(tree.parent);
        }
        return tree;
    };
    /**
     * Create TaskTree.
     * @param treeJson base of tree
     * @param parent parent of tree
     * @return created tree
     */
    ProjectOperator.createTaskTree = function (treeJson, parent) {
        if (parent === void 0) { parent = null; }
        var tree = treeJson;
        tree.parent = parent;
        for (var i = 0; i < treeJson.children.length; i++) {
            this.createTaskTree(treeJson.children[i], tree);
        }
        return tree;
    };
    /**
     * Set password and passphrase for remote host authentication
     * @param tree target tree
     * @param host_passSet set of password and passphrase for remote host authentication
     */
    ProjectOperator.setPassToHost = function (tree, host_passSet) {
        if (tree.type == SwfType.REMOTETASK || tree.type == SwfType.JOB) {
            var remoteTask = tree;
            if (host_passSet.hasOwnProperty(remoteTask.remote.name)) {
                remoteTask.remote.pass = host_passSet[remoteTask.remote.name];
            }
        }
        for (var i = 0; i < tree.children.length; i++) {
            this.setPassToHost(tree.children[i], host_passSet);
        }
    };
    /**
     * Copy task tree.
     * @param _tree origin tree
     * @return created tree
     */
    ProjectOperator.copyTaskTree = function (_tree) {
        var object = {};
        for (var key in _tree) {
            if (key == 'children' || key == 'parent') {
                continue;
            }
            object[key] = _tree[key];
        }
        object['children'] = new Array();
        var tree = object;
        for (var i = 0; i < _tree.children.length; i++) {
            var child = ProjectOperator.copyTaskTree(_tree.children[i]);
            tree.children.push(child);
            child.parent = tree;
        }
        return tree;
    };
    return ProjectOperator;
}());
/**
 * Task Manager
 */
var TaskManager = (function () {
    function TaskManager() {
    }
    /**
     * run task tree
     * @param tree
     */
    TaskManager.run = function (tree) {
        if (tree == null) {
            // finish all or error
            logger.info('Finish Project');
            return;
        }
        if (tree.type == SwfType.JOB) {
            // push local queue
            LocalQueue.push(function () {
                TaskManager.writeLogRunning(tree);
                TaskOperator.runJob(tree);
            });
            return;
        }
        TaskManager.writeLogRunning(tree);
        switch (tree.type) {
            case SwfType.WORKFLOW:
                TaskOperator.runWorkflow(tree);
                break;
            case SwfType.TASK:
                TaskOperator.runTask(tree);
                break;
            case SwfType.REMOTETASK:
                TaskOperator.runRemoteTask(tree);
                break;
            case SwfType.JOB:
                //TaskOperator.runJob(tree);
                break;
            case SwfType.FOR:
                TaskOperator.runFor(tree);
                break;
            case SwfType.IF:
                TaskOperator.runIf(tree);
                break;
            case SwfType.ELSE:
                TaskOperator.runIf(tree);
                break;
            case SwfType.BREAK:
                TaskOperator.runTask(tree);
                break;
            case SwfType.CONDITION:
                TaskOperator.runTask(tree);
                break;
            case SwfType.PSTUDY:
                // TODO make special
                TaskOperator.runPStudy(tree);
                break;
        }
    };
    /**
     * Completed tree. Write log.
     * @param tree Task
     */
    TaskManager.completed = function (tree) {
        TaskManager.writeLogCompleted(tree);
        // run parent
        TaskManager.run(tree.parent);
    };
    /**
     * Failed tree. Write log.
     * @param tree Task
     */
    TaskManager.failed = function (tree) {
        if (tree == null) {
            // finish all or error
            logger.info('Finish Project');
            return;
        }
        TaskManager.writeLogFailed(tree);
        if (tree.type == SwfType.CONDITION) {
            var if_tree = tree.parent;
            TaskManager.completed(if_tree);
            TaskManager.run(if_tree.parent);
        }
        else if (tree.type == SwfType.BREAK) {
            var break_for = tree.parent;
            while (break_for.type != SwfType.FOR) {
                if (break_for.parent == null) {
                    logger.error('The "break"\'s parent isn\'t "For"');
                    return;
                }
                TaskManager.writeLogCompleted(break_for);
                break_for = break_for.parent;
            }
            TaskManager.completed(break_for);
        }
        else {
            TaskManager.failed(tree.parent);
        }
    };
    /**
     * Clean up log file and index file and copyed directry.
     * @param tree Task
     */
    TaskManager.cleanUp = function (tree) {
        var path_logFile = path.resolve(tree.local_path, TaskManager.name_logFile);
        var path_index = path.resolve(tree.local_path, TaskManager.name_indexFile);
        if (fs.existsSync(path_logFile)) {
            fs.unlinkSync(path_logFile);
        }
        if (fs.existsSync(path_index)) {
            fs.unlinkSync(path_index);
        }
        if (tree.type == SwfType.FOR || tree.type == SwfType.PSTUDY) {
            var parent_path = path.dirname(tree.local_path);
            var files = fs.readdirSync(parent_path);
            var regexp = new RegExp("^" + tree.path + "_([0-9]+)$");
            for (var i = 0; i < files.length; i++) {
                if (files[i].match(regexp)) {
                    serverUtility.unlinkDirectory(path.join(parent_path, files[i]));
                }
            }
        }
        for (var i = 0; i < tree.children.length; i++) {
            TaskManager.cleanUp(tree.children[i]);
        }
        return;
    };
    /**
     * Asynchronous clean up project.
     * @param tree Task
     * @param callback The function to call when we have finished cleanup project
     */
    TaskManager.cleanUpAsync = function (tree, callback) {
        var queue = [];
        (function ready(tree) {
            queue.push(tree);
            tree.children.forEach(function (child) { return ready(child); });
        })(tree);
        (function cleanup() {
            var tree = queue.shift();
            if (!tree) {
                callback();
                return;
            }
            var path_logFile = path.resolve(tree.local_path, TaskManager.name_logFile);
            var path_index = path.resolve(tree.local_path, TaskManager.name_indexFile);
            fs.unlink(path_logFile, function (err) {
                fs.unlink(path_index, function (err) {
                    if (tree.type !== SwfType.FOR && tree.type !== SwfType.PSTUDY) {
                        cleanup();
                        return;
                    }
                    var parent_path = path.dirname(tree.local_path);
                    var regexp = new RegExp("^" + tree.path + "_([0-9]+)$");
                    fs.readdir(parent_path, function (err, files) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        var loop = function () {
                            var file = files.shift();
                            if (!file) {
                                cleanup();
                                return;
                            }
                            if (file.match(regexp)) {
                                serverUtility.unlinkDirectoryAsync(path.join(parent_path, file), loop);
                            }
                            else {
                                loop();
                            }
                        };
                        loop();
                    });
                });
            });
        })();
    };
    /**
     * Write log for running.
     * @param tree Task
     */
    TaskManager.writeLogRunning = function (tree) {
        if (TaskManager.isRun(tree)) {
            return;
        }
        logger.info("Run " + tree.type + " : " + tree.name);
        var dir_task = tree.local_path;
        var path_logFile = path.resolve(dir_task, TaskManager.name_logFile);
        var logJson = {
            name: tree.name,
            description: tree.description,
            state: SwfState.RUNNING,
            path: tree.local_path,
            type: tree.type,
            execution_start_date: new Date().toLocaleString(),
            execution_end_date: '',
            children: []
        };
        fs.writeFileSync(path_logFile, JSON.stringify(logJson, null, '\t'));
    };
    /**
     * Write log for completed.
     * @param tree Task
     */
    TaskManager.writeLogCompleted = function (tree) {
        if (!TaskManager.isRun(tree)) {
            TaskManager.writeLogRunning(tree);
        }
        var dir_task = tree.local_path;
        var path_logFile = path.resolve(dir_task, TaskManager.name_logFile);
        var data = fs.readFileSync(path_logFile);
        var logJson = JSON.parse(data.toString());
        logger.info("Completed " + tree.type + " : " + tree.name);
        logJson.execution_end_date = new Date().toLocaleString();
        logJson.state = SwfState.COMPLETED;
        fs.writeFileSync(path_logFile, JSON.stringify(logJson, null, '\t'));
    };
    /**
     * Write log for failed.
     * @param tree Task
     */
    TaskManager.writeLogFailed = function (tree) {
        logger.error("Failed " + tree.type + " : " + tree.name);
        logger.error("path : " + tree.local_path);
        var dir_task = tree.local_path;
        var path_logFile = path.resolve(dir_task, TaskManager.name_logFile);
        var data = fs.readFileSync(path_logFile);
        var logJson = JSON.parse(data.toString());
        logJson.execution_end_date = new Date().toLocaleString();
        logJson.state = SwfState.FAILED;
        fs.writeFileSync(path_logFile, JSON.stringify(logJson, null, '\t'));
    };
    /**
     * Check whether task run.
     * @param tree Task
     * @return whether run task
     */
    TaskManager.isRun = function (tree) {
        var path_logFile = path.resolve(tree.local_path, TaskManager.name_logFile);
        return fs.existsSync(path_logFile);
    };
    /**
     * Check whether task completed.
     * @param tree Task
     * @return whether task completed
     */
    TaskManager.isCompleted = function (tree) {
        if (!TaskManager.isRun(tree)) {
            return false;
        }
        var path_logFile = path.resolve(tree.local_path, TaskManager.name_logFile);
        var data = fs.readFileSync(path_logFile);
        var logJson = JSON.parse(data.toString());
        var isCompleted = (logJson.state == SwfState.COMPLETED);
        return isCompleted;
    };
    /**
     * Check whether failed task.
     * @param tree Task
     * @return whether task failed
     */
    TaskManager.isFailed = function (tree) {
        if (!TaskManager.isRun(tree)) {
            return false;
        }
        var path_logFile = path.resolve(tree.local_path, TaskManager.name_logFile);
        var data = fs.readFileSync(path_logFile);
        var logJson = JSON.parse(data.toString());
        var isCompleted = (logJson.state == SwfState.FAILED);
        return isCompleted;
    };
    /**
     * Get index for Loop and PStudy.
     * @param tree Task
     * @return index of Loop and PStudy
     */
    TaskManager.getIndex = function (tree) {
        var path_index = path.resolve(tree.local_path, TaskManager.name_indexFile);
        if (!fs.existsSync(path_index)) {
            return NaN;
        }
        var data = fs.readFileSync(path_index);
        var json = JSON.parse(data.toString());
        return json.index;
    };
    /**
     * Set index for Loop and PStudy
     * @param tree Task
     * @param index of Loop and PStudy
     */
    TaskManager.setIndex = function (tree, index) {
        var path_index = path.resolve(tree.local_path, TaskManager.name_indexFile);
        if (fs.existsSync(path_index)) {
            fs.unlinkSync(path_index);
        }
        var json = { index: index };
        fs.writeFileSync(path_index, JSON.stringify(json, null, '\t'));
    };
    return TaskManager;
}());
/**
 * name of log file
 */
TaskManager.name_logFile = 'swf.log';
/**
 * name of index file
 */
TaskManager.name_indexFile = 'loop.idx.json';
/**
 * Task Operator
 */
var TaskOperator = (function () {
    function TaskOperator() {
    }
    /**
     * Run Workflow.
     * @param tree Task
     */
    TaskOperator.runWorkflow = function (tree) {
        var workflow = tree;
        // check finish all children
        var isCompletedList = {};
        var isCompletedAll = true;
        for (var i = 0; i < tree.children.length; i++) {
            var birth = tree.children[i].birth;
            isCompletedList[birth] = TaskManager.isCompleted(tree.children[i]);
            isCompletedAll = isCompletedAll && isCompletedList[birth];
        }
        if (isCompletedAll) {
            // TODO check whether success
            // unlink file relation
            for (var i = 0; i < workflow.file_relations.length; i++) {
                var relation = workflow.file_relations[i];
                var path_dst = path.resolve(tree.local_path, relation.path_input_file);
                TaskOperator.unlink(path_dst);
            }
            TaskManager.completed(tree);
            return;
        }
        for (var index_task = 0; index_task < tree.children.length; index_task++) {
            var child = tree.children[index_task];
            if (TaskManager.isRun(child)) {
                continue;
            }
            var isFinishPreTask = true;
            // check relation
            for (var i = 0; i < workflow.relations.length; i++) {
                var relation = workflow.relations[i];
                if (relation.index_after_task == child.birth) {
                    isFinishPreTask = isFinishPreTask && isCompletedList[relation.index_before_task];
                }
            }
            for (var i = 0; i < workflow.file_relations.length; i++) {
                var relation = workflow.file_relations[i];
                if (relation.index_after_task == child.birth) {
                    isFinishPreTask = isFinishPreTask && isCompletedList[relation.index_before_task];
                }
            }
            if (!isFinishPreTask) {
                continue;
            }
            // link file relation
            for (var i = 0; i < workflow.file_relations.length; i++) {
                var relation = workflow.file_relations[i];
                if (relation.index_after_task != child.birth) {
                    continue;
                }
                var path_src = path.resolve(tree.local_path, relation.path_output_file);
                var path_dst = path.resolve(tree.local_path, relation.path_input_file);
                TaskOperator.link(path_src, path_dst);
            }
            TaskManager.run(child);
        }
    };
    /**
     * Run Task
     * @param tree Workflowask
     */
    TaskOperator.runTask = function (tree) {
        var task = tree;
        if (!fs.existsSync(path.join(tree.local_path, task.script.path))) {
            logger.error('Script file is not found');
            failed();
            return;
        }
        var command;
        if (serverUtility.isUnix()) {
            // TODO test Linux
            if (SwfScriptType.isBash(task)) {
                command = "sh " + task.script.path + ";\n";
            }
            else if (SwfScriptType.isLua(task)) {
                command = "lua " + task.script.path + ";\n";
            }
        }
        else {
            // Windows
            if (SwfScriptType.isBatch(task)) {
                command = task.script.path;
            }
            else if (SwfScriptType.isLua(task)) {
                command = path.resolve('lua.exe') + " " + task.script.path + ";\n";
            }
            else {
                command = task.script.path;
            }
        }
        TaskOperator.exec(command, tree.local_path, completed, failed);
        function completed() {
            var isCompleted = true;
            for (var i = 0; i < task.output_files.length; i++) {
                var file_path = task.output_files[i].path;
                isCompleted = isCompleted && fs.existsSync(path.join(tree.local_path, file_path));
            }
            if (isCompleted) {
                TaskManager.completed(tree);
            }
            else {
                TaskManager.failed(tree);
            }
        }
        function failed() {
            TaskManager.failed(tree);
        }
    };
    /**
     * Run RemoteTask
     * @param tree RemoteTask
     */
    TaskOperator.runRemoteTask = function (tree) {
        var remoteTask = tree;
        var client = new ssh2.Client();
        if (!fs.existsSync(path.join(tree.local_path, remoteTask.script.path))) {
            logger.error('Script file is not found');
            failed();
            return;
        }
        var config = {
            host: remoteTask.remote.host,
            port: 22,
            username: remoteTask.remote.username,
        };
        // TODO get password from dialog
        if (remoteTask.remote.privateKey) {
            config.privateKey = fs.readFileSync(remoteTask.remote.privateKey);
            config.passphrase = remoteTask.remote.pass;
        }
        else {
            config.password = remoteTask.remote.pass;
        }
        client.connect(config);
        client.on('ready', readyCallback);
        function readyCallback() {
            TaskOperator.setUpRemote(remoteTask, client, runScript, failed);
        }
        function runScript() {
            var command;
            if (SwfScriptType.isBash(remoteTask)) {
                command = "sh " + remoteTask.script.path + "\n";
            }
            else if (SwfScriptType.isLua(remoteTask)) {
                command = "lua " + remoteTask.script.path + "\n";
            }
            else {
                // default
                command += "./" + remoteTask.script.path + "\n";
            }
            TaskOperator.execRemote(client, command, tree.remote_path, execCallback, failed);
            function execCallback() {
                // TODO check whether success
                TaskOperator.cleanUpRemote(remoteTask, client, completed, failed);
            }
        }
        function completed() {
            TaskManager.completed(tree);
            client.end();
        }
        function failed() {
            TaskManager.failed(tree);
            client.end();
        }
    };
    /**
     * Run Job.
     * @param tree Job
     */
    TaskOperator.runJob = function (tree) {
        var job = tree;
        var client = new ssh2.Client();
        var t = path.join(tree.local_path, job.script.path);
        if (!fs.existsSync(path.join(tree.local_path, job.script.path))) {
            logger.error('Script file is not found');
            failed();
            return;
        }
        var config = {
            host: job.remote.host,
            port: 22,
            username: job.remote.username,
        };
        if (job.remote.privateKey) {
            config.privateKey = fs.readFileSync(job.remote.privateKey);
            config.passphrase = job.remote.pass;
        }
        else {
            config.password = job.remote.pass;
        }
        client.connect(config);
        client.on('ready', readyCallback);
        function readyCallback() {
            TaskOperator.setUpRemote(job, client, submit, failed);
        }
        function submit() {
            var command = '';
            command += "cd " + tree.remote_path + "\n";
            command += "sh " + job.script.path + "\n";
            client.exec(command, submitCallback);
            function submitCallback(err, channel) {
                if (err) {
                    TaskManager.failed(tree);
                    logger.error("error : " + err);
                    logger.error("working directory : " + tree.remote_path);
                    logger.error("command : " + command);
                    return;
                }
                channel.on('close', onCloseCallback);
                channel.on('data', onOutCallback);
                channel.stderr.on('data', onErrCallback);
                var jobId = '';
                function onCloseCallback(exitCode, signalName) {
                    // TODO check whether success
                    //logger.info(`Stream :: close :: code: ${exitCode}, signal: ${signalName}`);
                    // set interval 10 sec.
                    var intervalId = setInterval(checkFinish, 10000);
                    function checkFinish() {
                        // check job scheduler
                        if (jobId == '') {
                            return;
                        }
                        var command = '';
                        if (job.remote.job_scheduler == SwfJobScheduler.TCS) {
                            command += "pjstat " + jobId + "\n";
                        }
                        else if (job.remote.job_scheduler == SwfJobScheduler.TORQUE) {
                            command += "qstat -l " + jobId + " -x\n";
                        }
                        else {
                            // default TCS
                            command += "pjsub " + job.script.path + "\n";
                        }
                        client.exec(command, getStateCallback);
                        function getStateCallback(err, channel) {
                            if (err) {
                                TaskManager.failed(tree);
                                logger.error("error : " + err);
                                logger.error("working directory : " + tree.remote_path);
                                logger.error("command : " + command);
                                return;
                            }
                            channel.on('close', onCloseStateCallback);
                            channel.on('data', onOutStateCallback);
                            channel.stderr.on('data', onErrCallback);
                        }
                        function onCloseStateCallback(exitCode, signalName) {
                        }
                        function onOutStateCallback(data) {
                            var stdout = String(data);
                            // check state of job
                            var isFinish = false;
                            if (job.remote.job_scheduler == SwfJobScheduler.TCS) {
                                var regExp = /JOB_ID/i;
                                isFinish = (!regExp.test(stdout));
                            }
                            else if (job.remote.job_scheduler == SwfJobScheduler.TORQUE) {
                                var regExp = /<job_state>C<\/job_state>/i;
                                isFinish = (regExp.test(stdout));
                            }
                            else {
                                // default TCS
                                var regExp = /JOB_ID/i;
                                isFinish = (!regExp.test(stdout));
                            }
                            if (isFinish) {
                                clearInterval(intervalId);
                                TaskOperator.cleanUpRemote(job, client, completed, failed);
                            }
                        }
                    }
                }
                function onOutCallback(data) {
                    // TODO test
                    var stdout = new String(data);
                    var regEtp;
                    if (job.remote.job_scheduler == SwfJobScheduler.TCS) {
                        regEtp = /Job\s(\d+)\ssubmitted/i;
                    }
                    else if (job.remote.job_scheduler == SwfJobScheduler.TORQUE) {
                        regEtp = /(\d+)/;
                    }
                    else {
                        // default TCS
                        regEtp = /Job\s(\d+)\ssubmitted/i;
                    }
                    if (stdout.search(regEtp) != -1) {
                        jobId = stdout.match(regEtp)[1];
                    }
                    logger.info("submitted " + job.type + " : " + job.name);
                    logger.info("Job ID : " + jobId);
                    logger.info("STDOUT : " + data);
                }
                function onErrCallback(data) {
                    TaskManager.failed(tree);
                    logger.error("STDERR : " + data);
                }
            }
        }
        function completed() {
            // TODO check whether success
            TaskManager.completed(tree);
            client.end();
            LocalQueue.finish();
        }
        function failed() {
            TaskManager.failed(tree);
            client.end();
            LocalQueue.finish();
        }
    };
    /**
     * Run Lopp.
     * @param tree Loop
     */
    TaskOperator.runFor = function (tree) {
        var loop = tree;
        var index = TaskManager.getIndex(tree);
        if (isNaN(index)) {
            index = loop.forParam.start;
        }
        else {
            // increment
            index += loop.forParam.step;
        }
        TaskManager.setIndex(tree, index);
        if (loop.forParam.end < index) {
            // TODO check whether success
            TaskManager.completed(tree);
            return;
        }
        var child = ProjectOperator.copyTaskTree(tree);
        var workflow = child;
        workflow.name = loop.name + "_" + index;
        workflow.path = loop.path + "_" + index;
        workflow.type = SwfType.WORKFLOW;
        child.parent = tree;
        ProjectOperator.resetPathAbsolute(child);
        // copy directory
        serverUtility.copyFolder(tree.local_path, child.local_path);
        TaskManager.cleanUp(child);
        TaskManager.setIndex(child, index);
        TaskManager.run(child);
    };
    /**
     * Run If.
     * @param tree If
     */
    TaskOperator.runIf = function (tree) {
        var condition_tree = tree.children[0];
        if (!TaskManager.isRun(condition_tree)) {
            TaskManager.run(condition_tree);
        }
        else if (TaskManager.isCompleted(condition_tree)) {
            // TODO solve other way
            var else_index = tree.parent.children.indexOf(tree) + 1;
            if (else_index < tree.parent.children.length) {
                var else_tree = tree.parent.children[else_index];
                if (else_tree.type == SwfType.ELSE) {
                    TaskManager.completed(else_tree);
                }
            }
            TaskOperator.runWorkflow(tree);
        }
        else {
            if (tree.type == SwfType.ELSE) {
                TaskManager.completed(condition_tree);
            }
        }
    };
    /**
     * Run Condtion.
     * @param tree Condition
     */
    TaskOperator.runCondition = function (tree) {
        var condition = tree;
        if (!fs.existsSync(path.join(tree.local_path, condition.script.path))) {
            TaskManager.completed(tree);
            return;
        }
        var command;
        if (serverUtility.isUnix()) {
            // TODO test Linux
            if (SwfScriptType.isBash(condition)) {
                command = "sh " + condition.script.path + ";\n";
            }
            else if (SwfScriptType.isLua(condition)) {
                command = "lua " + condition.script.path + ";\n";
            }
        }
        else {
            // Windows
            if (SwfScriptType.isBatch(condition)) {
                command = condition.script.path;
            }
            else if (SwfScriptType.isLua(condition)) {
                command = path.resolve('lua.exe') + " " + condition.script.path + ";\n";
            }
            else {
                command = condition.script.path;
            }
        }
        TaskOperator.exec(command, tree.local_path, completed, failed);
        function completed() {
            var isCompleted = true;
            for (var i = 0; i < condition.output_files.length; i++) {
                var file_path = condition.output_files[i].path;
                isCompleted = isCompleted && fs.existsSync(path.join(tree.local_path, file_path));
            }
            if (isCompleted) {
                TaskManager.completed(tree);
            }
            else {
                TaskManager.failed(tree);
            }
        }
        function failed() {
            TaskManager.failed(tree);
        }
    };
    /**
     * Run PStudy.
     * @param tree PStudy
     */
    TaskOperator.runPStudy = function (tree) {
        var pstudy = tree;
        var index = TaskManager.getIndex(tree);
        if (isNaN(index)) {
            index = 0;
        }
        else {
            // increment
            index++;
        }
        TaskManager.setIndex(tree, index);
        var parameter_file_path = path.resolve(tree.local_path, pstudy.parameter_file.path);
        var data = fs.readFileSync(parameter_file_path);
        var parameter = JSON.parse(data.toString());
        var ps_size = TaskOperator.getSizePSSpace(parameter.target_params);
        if (ps_size <= index) {
            var isCompleted = true;
            if (tree.hidden_children != null) {
                for (var i = 0; i < tree.hidden_children.length; i++) {
                    isCompleted = isCompleted && TaskManager.isCompleted(tree.hidden_children[i]);
                }
            }
            if (isCompleted) {
                TaskManager.completed(tree);
            }
            return;
        }
        var child = ProjectOperator.copyTaskTree(tree);
        var workflow = child;
        workflow.name = pstudy.name + "_" + index;
        workflow.path = pstudy.path + "_" + index;
        workflow.type = SwfType.WORKFLOW;
        child.parent = tree;
        if (tree.hidden_children == null) {
            tree.hidden_children = new Array();
        }
        tree.hidden_children.push(child);
        ProjectOperator.resetPathAbsolute(child);
        serverUtility.copyFolder(tree.local_path, child.local_path);
        TaskManager.cleanUp(child);
        TaskManager.setIndex(child, index);
        var src_path = path.join(tree.local_path, parameter.target_file);
        var dst_path = path.join(child.local_path, parameter.target_file.replace('.svy', ''));
        var values = TaskOperator.getPSVector(parameter.target_params, index);
        serverUtility.writeFileKeywordReplaced(src_path, dst_path, values);
        TaskManager.run(child);
        TaskManager.run(tree);
    };
    /**
     * Get parameter vector of PStudy space.
     * @param psSpace PStudy space
     * @param index index of vector for PStudy space.
     * @return parameter vector of PStudy space
     */
    TaskOperator.getPSVector = function (psSpace, index) {
        var vector = {};
        for (var i = 0; i < psSpace.length; i++) {
            var psAxis = psSpace[i];
            var length_1 = TaskOperator.getSizePSAxis(psAxis);
            var position = index % length_1;
            if (psAxis.list != null) {
                vector[psAxis.keyword] = psAxis.list[position];
            }
            else {
                // check direction
                vector[psAxis.keyword] = (0 < psAxis.step ? psAxis.min : psAxis.max) + psAxis.step * position;
            }
            index = Math.floor(index / length_1);
        }
        return vector;
    };
    /**
     * Get size of PStudy space.
     * @param psSpace
     * @return size of PStudy space
     */
    TaskOperator.getSizePSSpace = function (psSpace) {
        var size = 1;
        for (var i = 0; i < psSpace.length; i++) {
            size *= TaskOperator.getSizePSAxis(psSpace[i]);
        }
        return size;
    };
    /**
     * Get size of PStudy axis.
     * @param psAxis PStudy axis
     * @return size of PStudy axis
     */
    TaskOperator.getSizePSAxis = function (psAxis) {
        var size = 0;
        if (psAxis.list != null) {
            size = psAxis.list.length;
        }
        else {
            var length_2 = Math.floor((psAxis.max - psAxis.min) / Math.abs(psAxis.step));
            if (length_2 < 1) {
                logger.error('Wrong parameter of parameter study.');
                logger.error("keyword: " + psAxis.keyword + ", min: " + psAxis.min + ", max: " + psAxis.max + ", step: " + psAxis.step);
                length_2 = 0;
            }
            size = length_2 + 1;
        }
        return size;
    };
    /**
     * Link output and input of task.
     * @param src_path path of source file
     * @param dst_path path of destination file
     */
    TaskOperator.link = function (src_path, dst_path) {
        if (fs.existsSync(dst_path) && !fs.statSync(dst_path).isDirectory()) {
            fs.unlinkSync(dst_path);
        }
        // make hard link
        fs.linkSync(src_path, dst_path);
        //// make symbolic link
        //const path_src_relative: string = path.relative(path_dst, path_src);
        //fs.symlinkSync(path_src_relative, path_dst);
    };
    /**
     * Unlink output and input of task.
     * @param dst_path path of destination file
     */
    TaskOperator.unlink = function (dst_path) {
        if (fs.existsSync(dst_path)) {
            fs.unlinkSync(dst_path);
        }
    };
    /**
     * Execute server side.
     * @param command command for execution
     * @param working_dir path of directory for execution
     * @param callback function to call when end of execution without error
     * @param callbackErr function ro call when we get error
     */
    TaskOperator.exec = function (command, working_dir, callback, callbackErr) {
        var exec = child_process.exec;
        var option = {
            cwd: working_dir
        };
        exec(command, option, execCallback);
        function execCallback(err, stdout, stderr) {
            if (err) {
                logger.error("error : " + err);
                logger.error("STDERR : " + stderr);
                logger.error("STDOUT : " + stdout);
                logger.error("command : " + command);
                logger.error("working_dir : " + working_dir);
                if (callbackErr) {
                    callbackErr();
                }
                return;
            }
            if (callback) {
                callback();
            }
        }
    };
    /**
     * Execute remote side.
     * @param client connection of remote side
     * @param command command for execution
     * @param working_dir path of directory for execution
     * @param callback function to call when end of execution without error
     * @param callbackErr function ro call when we get error
     */
    TaskOperator.execRemote = function (client, command, working_dir, callback, callbackErr) {
        if (command != '') {
            command = "cd " + working_dir + ";\n" + command;
        }
        client.exec(command, execCallback);
        function execCallback(err, channel) {
            if (err) {
                logger.error("error : " + err);
                logger.error("command : " + command);
                logger.error("working_dir : " + working_dir);
                if (callbackErr) {
                    callbackErr();
                }
                return;
            }
            channel.on('close', onCloseCallback);
            channel.on('data', onOutCallback);
            channel.stderr.on('data', onErrCallback);
            function onCloseCallback(exitCode, signalName) {
                if (callback) {
                    callback();
                }
            }
            function onOutCallback(data) {
                logger.info("STDOUT : " + data);
            }
            function onErrCallback(data) {
                logger.error("STDERR : " + data);
            }
        }
    };
    /**
     * Make directory remote side.
     * @param client connection of remote side
     * @param path path of directory you want
     * @param working_dir path of directory for execution
     * @param callback function to call when end of execution without error
     * @param callbackErr function ro call when we get error
     */
    TaskOperator.mkdirRemote = function (client, path, working_dir, callback, callbackErr) {
        var command = "mkdir -p " + path + ";";
        TaskOperator.execRemote(client, command, working_dir, callback, callbackErr);
    };
    /**
     * Remove file remote side
     * @param client connection of remote side
     * @param path path of file you want
     * @param working_dir path of directory for execution
     * @param callback function to call when end of execution without error
     * @param callbackErr function ro call when we get error
     */
    TaskOperator.rmFileRemote = function (client, path, working_dir, callback, callbackErr) {
        var command = "rm " + path + ";";
        TaskOperator.execRemote(client, command, working_dir, callback, callbackErr);
    };
    /**
     * Set up remote to execute RemoteTask
     * @param remoteTask taeget RemoteTask
     * @param client connection of remote side
     * @param callback function to call when end of execution without error
     * @param callbackErr function ro call when we get error
     */
    TaskOperator.setUpRemote = function (remoteTask, client, callback, callbackErr) {
        var tree = remoteTask;
        // make working directory
        TaskOperator.mkdirRemote(client, tree.remote_path, '', mkdirCallback, callbackErr);
        function mkdirCallback() {
            // send files
            compressFiles();
        }
        var tarFile_name = 'send_files.tar.gz';
        function compressFiles() {
            var command = "tar czvf \"" + tarFile_name + "\"";
            if (serverUtility.isWindows()) {
                // Windows
                command = path.resolve('tar.exe') + " czvf \"" + tarFile_name + "\"";
            }
            // send_files
            for (var i = 0; i < remoteTask.send_files.length; i++) {
                var file = remoteTask.send_files[i];
                command += " " + file.path;
            }
            // input_files
            for (var i = 0; i < remoteTask.input_files.length; i++) {
                var file = remoteTask.input_files[i];
                command += " " + file.path;
            }
            // script file
            if (remoteTask.script.path != '') {
                var file = remoteTask.script;
                command += " " + file.path;
            }
            // job script file
            if (remoteTask.type == SwfType.JOB) {
                var job = remoteTask;
                if (job.job_script.path != '') {
                    var file = job.job_script;
                    command += " " + file.path;
                }
            }
            TaskOperator.exec(command, tree.local_path, compressCallback, callbackErr);
        }
        function compressCallback() {
            // send file
            client.sftp(sftpCallback);
        }
        function sftpCallback(err, sftp) {
            if (err) {
                logger.error('connecting SFTP is failed');
                logger.error(err);
                callbackErr();
                return;
            }
            // send script file
            var local_path = path.join(tree.local_path, tarFile_name);
            var remote_path = path.posix.join(tree.remote_path, tarFile_name);
            sftp.fastPut(local_path, remote_path, sendFileCallback);
            function sendFileCallback(err) {
                if (err) {
                    logger.error("ERR " + remoteTask.type + " : " + remoteTask.name);
                    logger.error("error : " + err);
                    logger.error("path_local : " + local_path);
                    logger.error("path_remote : " + remote_path);
                    callbackErr();
                    return;
                }
                extractFilesRemote();
            }
        }
        function extractFilesRemote() {
            var command = "tar xvf \"" + tarFile_name + "\";";
            TaskOperator.execRemote(client, command, tree.remote_path, extractCallback, callbackErr);
        }
        function extractCallback() {
            // remove compressed files
            fs.unlinkSync(path.join(tree.local_path, tarFile_name));
            // if this failed, callback next
            TaskOperator.rmFileRemote(client, tarFile_name, tree.remote_path, callback, callback);
        }
    };
    /**
     * Clean up remote after execute RemoteTask
     * @param remoteTask taeget RemoteTask
     * @param client connection of remote side
     * @param callback function to call when end of execution without error
     * @param callbackErr function ro call when we get error
     */
    TaskOperator.cleanUpRemote = function (remoteTask, client, callback, callbackErr) {
        var tree = remoteTask;
        var tarFile_name = 'recieve_files.tar.gz';
        if (remoteTask.receive_files.length + remoteTask.output_files.length < 1) {
            callback();
            return;
        }
        compressFilesRemote();
        function compressFilesRemote() {
            var command = "tar czvf \"" + tarFile_name + "\"";
            // receive_files
            for (var i = 0; i < remoteTask.receive_files.length; i++) {
                var file = remoteTask.receive_files[i];
                command += " " + file.path;
            }
            // output_files
            for (var i = 0; i < remoteTask.output_files.length; i++) {
                var file = remoteTask.output_files[i];
                command += " " + file.path;
            }
            TaskOperator.execRemote(client, command, tree.remote_path, compressCallback, callbackErr);
        }
        function compressCallback() {
            // recieve file
            client.sftp(sftpCallback);
        }
        function sftpCallback(err, sftp) {
            if (err) {
                logger.error('connecting SFTP is failed');
                logger.error(err);
                callbackErr();
                return;
            }
            // send script file
            var local_path = path.join(tree.local_path, tarFile_name);
            var remote_path = path.posix.join(tree.remote_path, tarFile_name);
            sftp.fastGet(remote_path, local_path, recieveFileCallback);
            function recieveFileCallback(err) {
                if (err) {
                    logger.error("ERR " + remoteTask.type + " : " + remoteTask.name);
                    logger.error("error : " + err);
                    logger.error("path_local : " + local_path);
                    logger.error("path_remote : " + remote_path);
                    callbackErr();
                    return;
                }
                extractFiles();
            }
        }
        function extractFiles() {
            var command = "tar xvf \"" + tarFile_name + "\";";
            if (serverUtility.isWindows()) {
                // Windows
                command = "\"" + path.resolve('tar.exe') + "\" xvf \"" + tarFile_name + "\"";
            }
            TaskOperator.exec(command, tree.local_path, extractCallback, callbackErr);
        }
        function extractCallback() {
            // remove compressed files
            fs.unlinkSync(path.join(tree.local_path, tarFile_name));
            // if this failed, callback next
            TaskOperator.rmFileRemote(client, tarFile_name, tree.remote_path, callback, callback);
        }
    };
    return TaskOperator;
}());
/**
 * local job queue
 */
var LocalQueue = (function () {
    function LocalQueue() {
    }
    /**
     * Push job queue.
     * @param job function to submit job
     */
    LocalQueue.push = function (job) {
        LocalQueue.queue.push(job);
        LocalQueue.checkQueue();
    };
    /**
     * Finish submited Job.
     */
    LocalQueue.finish = function () {
        LocalQueue.num_job--;
        LocalQueue.checkQueue();
    };
    /**
     * Check whether job can be submit.
     */
    LocalQueue.checkQueue = function () {
        while (0 < LocalQueue.queue.length && LocalQueue.num_job < LocalQueue.MAX_JOB) {
            var job = LocalQueue.queue.shift();
            if (job != null) {
                job();
                LocalQueue.num_job++;
            }
        }
    };
    return LocalQueue;
}());
/**
 * upper number limit for job submit
 */
LocalQueue.MAX_JOB = 5;
/**
 * number of job submited
 */
LocalQueue.num_job = 0;
/**
 * queue of job
 */
LocalQueue.queue = new Array();
module.exports = ProjectOperator;
//# sourceMappingURL=projectOperator.js.map