/**
 *
 */
class SwfTree extends SwfWorkflow implements SwfTreeJson {
    /**
     * root workflow instance
     */
    private static root: SwfTree;
    /**
     * delete directorys
     */
    private static deleteDirectorys: string[] = [];
    /**
     * root index
     */
    private static readonly rootIndex: number = 0;
    /**
     * children tree
     */
    public children: SwfTree[] = [];
    /**
     * script parameter for job
     */
    public script_param: ScriptParams;
    /**
     * old path
     */
    public oldPath: string;
    /**
     * upload script file
     */
    private uploadScript: File;
    /**
     * upload parameter file
     */
    private uploadParamFile: File;
    /**
     * upload send files
     */
    private uploadSendfiles: File[] = [];
    /**
     * other upload files
     */
    private upload_files: File[] = [];
    /**
     * indexes are local task index array from root tree
     */
    private indexes: number[] = [];

    /**
     * create new instance
     * @param treeJson tree json data
     */
    private constructor(treeJson: (SwfTree | SwfTreeJson)) {
        super(treeJson);

        this.oldPath = treeJson.oldPath;
        if (treeJson.children) {
            const children = JSON.parse(JSON.stringify(treeJson.children));
            this.children = children.map(child => new SwfTree(child));
        }

        Object.keys(treeJson).forEach(key => {
            if (this[key] === undefined && treeJson[key] !== undefined) {
                if (typeof treeJson[key] === 'object') {
                    this[key] = JSON.parse(JSON.stringify(treeJson[key]));
                }
                else {
                    this[key] = treeJson[key];
                }
            }
        });

        if (SwfType.isJob(treeJson)) {
            this.script_param = {
                cores: 1,
                nodes: 1
            };
        }
    }

    /**
     * get root index
     * @return root index
     */
    public static getRootIndex(): string {
        return this.rootIndex.toString();
    }

    /**
     * get index string
     * @return index string
     */
    public getIndexString(): string {
        return this.indexes.join('_');
    }

    /**
     * get hierarchy number
     * @return hierarchy number
     */
    public getHierarchy(): number {
        return this.indexes.length - 1;
    }

    /**
     * get delete directorys
     * @return delete directorys
     */
    public static getDeleteDirectorys(): string[] {
        return JSON.parse(JSON.stringify(this.deleteDirectorys));
    }

    /**
     * get unique index number
     * @return unique index number
     */
    public getUniqueIndex(): number {
        let index = 0;
        const search = (tree: SwfTree): number => {
            if (tree === this) {
                return index;
            }
            index++;
            return tree.children.map(child => search(child)).filter(num => num)[0];
        };
        return search(SwfTree.root);
    }

    /**
     * get task index (task index is local index)
     * @return task index
     */
    public getTaskIndex(): number {
        return this.indexes[this.indexes.length - 1];
    }

    /**
     * get hash code
     * @return hash code
     */
    public getHashCode(): number {
        return this.birth;
    }

    /**
     * create tree json instance
     * @param treeJson tree json data
     */
    public static create(treeJson: (SwfTree | SwfTreeJson)): SwfTree {
        this.root = new SwfTree(treeJson);
        this.deleteDirectorys = [];
        this.renumberingIndex(this.root);
        return this.root;
    }

    /**
     * renumbering index
     * @param tree SwfTree instance
     * @param indexes parent index array
     */
    private static renumberingIndex(tree: SwfTree, indexes: number[] = [this.rootIndex]) {
        tree.indexes = indexes;
        tree.oldPath = tree.path;
        tree.children.forEach((child, index) => {
            const newIndexes: number[] = JSON.parse(JSON.stringify(indexes));
            newIndexes.push(index);
            this.renumberingIndex(child, newIndexes);
        });
    }

    /**
     * add child date to this tree
     * @param treeJson json data
     * @param fileType json file type
     * @param position display position
     * @return added child data
     */
    public addChild(treeJson: SwfTreeJson, fileType: SwfType, position: Position2D): SwfTree {
        const rand = Math.floor(Date.now() / 100) % 100000;
        const dirname = `${treeJson.type}Dir${`00000${rand}`.slice(-5)}`;
        treeJson.birth = Date.now();
        const tree = new SwfTree(treeJson);
        tree.name = SwfTree.getSerialNumberName(tree.name);
        tree.path = dirname;
        this.children.push(tree);
        this.children_file.push(new SwfFile({
            name: tree.name,
            description: tree.description,
            path: `./${dirname}/${ClientUtility.getTemplate(fileType).getDefaultName()}`,
            required: true,
            type: 'file'
        }));
        this.positions.push(JSON.parse(JSON.stringify(position)));
        SwfTree.renumberingIndex(SwfTree.root);
        tree.oldPath = '';
        return tree;
    }

    /**
     * get serial number name
     * @param name search name
     * @return serial number name
     */
    private static getSerialNumberName(name: string): string {
        let max = 0;
        const notSeachedList: SwfTree[] = [this.root];
        const regexp = new RegExp(`^${name}(\\d+)$`);
        while (true) {
            const tree = notSeachedList.shift();
            if (!tree) {
                break;
            }

            if (tree.name.match(regexp)) {
                max = Math.max(max, parseInt(RegExp.$1));
            }
            tree.children.forEach(child => {
                notSeachedList.push(child);
            });
        }
        return `${name}${max + 1}`;
    }

    /**
     * whether specified directory name is duplicate or not
     * @param dirname directory name
     * @return whether specified directory name is duplicate or not
     */
    public isDirnameDuplicate(dirname: string): boolean {
        if (this.children.filter(child => child.path === dirname)[0]) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * get SwfTree instance
     * @param index index string (ex '0_1_0')
     * @return SwfTree instance
     */
    public static getSwfTree(index: string): SwfTree {
        const notSeachedList: SwfTree[] = [this.root];
        while (true) {
            const tree = notSeachedList.shift();
            if (!tree) {
                break;
            }
            if (tree.getIndexString() === index) {
                return tree;
            }
            tree.children.forEach(child => {
                notSeachedList.push(child);
            });
        }
    }

    /**
     * get relative directory from root workflow
     * @return relative directory path
     */
    public getCurrentDirectory(): string {
        return (function searchDirectory(tree: SwfTree, path: string = ''): string {
            path = ClientUtility.normalize(tree.path, path);
            const parent = tree.getParent();
            if (parent == null) {
                return path;
            }
            else {
                return searchDirectory(parent, path);
            }
        })(this);
    }

    /**
     * get parent tree instance
     * @return parent instance
     */
    public getParent(): SwfTree {
        if (this.isRoot()) {
            return null;
        }

        const searchParent = (tree: SwfTree, indexes: number[]): SwfTree => {
            if (indexes.length == 0) {
                return tree;
            }
            const index: number = indexes.shift();
            return searchParent(tree.children[index], indexes);
        };

        const length = this.indexes.length;
        const parentIndexes: number[] = this.indexes.slice(1, length - 1);
        return searchParent(SwfTree.root, parentIndexes);
    }

    /**
     * whether this instance is root or not
     * @return whether this instance is root or not
     */
    public isRoot(): boolean {
        return this === SwfTree.root;
    }

    /**
     * convet SwfTreeJson object
     * @return SwfTreeJson object
     */
    public toSwfTreeJson(): SwfTreeJson {
        const root = new SwfTree(this);
        const notSeachedList: SwfTree[] = [root];
        while (true) {
            const tree = notSeachedList.shift();
            if (!tree) {
                break;
            }
            tree.children.forEach(child => {
                notSeachedList.push(child);
            });

            delete tree.indexes;
            delete tree.uploadScript;
            delete tree.uploadSendfiles;
            delete tree.uploadParamFile;
            delete tree.upload_files;
            Object.keys(this).forEach(key => {
                if (this[key] == null) {
                    delete this[key];
                }
            });
        }

        return root;
    }

    /**
     * convet SwfFile object
     * @return SwfFile object
     */
    public toSwfFile(): SwfFile {
        return new SwfFile({
            name: this.name,
            description: this.description,
            path: this.path,
            type: 'file',
            required: true
        });
    }

    /**
     * whether specified path name is valid or not
     * @param path path name
     * @return whether specified path name is valid or not
     */
    public isEnablePath(path: string): boolean {
        if (!path) {
            return true;
        }

        const fullpath = this.getFullpath(path);

        const input = this.input_files.filter(file => {
            return this.getFullpath(file.path) === fullpath;
        });
        const output = this.output_files.filter(file => {
            return this.getFullpath(file.path) === fullpath;
        });

        if (input[0] || output[0]) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * get relative path from root workflow to specified path name
     * @param path path string
     * @return relative path from root workflow
     */
    public getFullpath(path: string): string;

    /**
     * get relative path from root workflow to specified path name
     * @param file SwfFile instance
     * @return relative path from root workflow
     */
    public getFullpath(file: (SwfFile | SwfFileJson)): string;

    /**
     * get relative path from root workflow to specified path name
     * @param object path string or SwfFile instance
     * @return relative path from root workflow
     */
    public getFullpath(object: (SwfFile | SwfFileJson | string)): string {
        let path: string;
        if (typeof object === 'string') {
            path = object;
        }
        else {
            path = object.path;
        }
        const directory = this.getCurrentDirectory();
        const basename = ClientUtility.basename(path);
        return ClientUtility.normalize(directory, path);
    }

    /**
     * get relative path from this directory to specified path name
     * @param path path string
     * @return relative path from this directory
     */
    public getRelativePath(path: string);

    /**
     * get relative path from this directory to specified path name
     * @param file SwfFile instance
     * @return relative path from this directory
     */
    public getRelativePath(file: (SwfFile | SwfFileJson));

    /**
     * get relative path from this directory to specified path name
     * @param object path string or SwfFile instance
     * @return relative path from this directory
     */
    public getRelativePath(object: (SwfFile | SwfFileJson | string)) {
        let path: string;
        if (typeof object === 'string') {
            path = object;
        }
        else {
            path = this.getFullpath(object);
        }
        const directory = this.getCurrentDirectory();
        return `./${path.replace(new RegExp(`${directory}`), '')}`;
    }

    /**
     * add input file to parent tree
     * @param index child task index number
     * @param filepath filepath string
     */
    public addInputFileToParent(index: number, filepath: string);

    /**
     * add input file to parent tree
     * @param tree add target tree
     * @param filepath filepath string
     */
    public addInputFileToParent(tree: SwfTree, filepath: string);

    /**
     * add input file to parent tree
     * @param object child task index number or add target tree
     * @param filepath filepath string
     */
    public addInputFileToParent(object: (number | SwfTree), filepath: string) {
        if (this.isRoot()) {
            return;
        }
        let child: SwfTree;
        if (typeof object === 'number') {
            child = this.children[object];
        }
        else {
            child = object;
        }
        const file = child.findInputFile(filepath).clone();
        const fullpath = child.getFullpath(file);
        SwfTree.addFileToParent(this, file, fullpath, true);
    }

    /**
     * add output file to parent tree
     * @param index child task index number
     * @param filepath filepath string
     */
    public addOutputFileToParent(index: number, filepath: string);

    /**
     * add output file to parent tree
     * @param tree add target tree
     * @param filepath filepath string
     */
    public addOutputFileToParent(tree: SwfTree, filepath: string);

    /**
     * add output file to parent tree
     * @param object child task index number or add target tree
     * @param filepath filepath string
     */
    public addOutputFileToParent(object: (number | SwfTree), filepath: string) {
        if (this.isRoot()) {
            return;
        }
        let child: SwfTree;
        if (typeof object === 'number') {
            child = this.children[object];
        }
        else {
            child = object;
        }
        const file = child.findOutputFile(filepath).clone();
        const fullpath = child.getFullpath(file);
        SwfTree.addFileToParent(this, file, fullpath, false);
    }

    /**
     *　add output file to parent tree
     * @param tree target tree
     * @param file add file
     * @param fullpath add target relative path from root workflow
     * @param isInput whether input files or not
     */
    private static addFileToParent(tree: SwfTree, file: SwfFile, fullpath: string, isInput: boolean) {
        if (tree.isRoot()) {
            return;
        }
        const files: SwfFile[] = isInput ? tree.input_files : tree.output_files;
        this.deleteFileFromParent(tree, fullpath, isInput);
        file.path = tree.getRelativePath(fullpath);
        files.push(file);
        console.log(`add parent path ${file.path}`);
        const parent = tree.getParent();
        this.addFileToParent(parent, file.clone(), fullpath, isInput);
    }

    /**
     * delete input file from parent tree
     * @param index child task index number
     * @param filepath filepath string
     */
    public deleteInputFileFromParent(index: number, filepath: string);

    /**
     * delete input file from parent tree
     * @param tree delete target tree
     * @param filepath filepath string
     */
    public deleteInputFileFromParent(tree: SwfTree, filepath: string);

    /**
     * delete input file from parent tree
     * @param object child task index number or delete target tree
     * @param filepath filepath string
     */
    public deleteInputFileFromParent(object: (number | SwfTree), filepath: string) {
        let child: SwfTree;
        if (typeof object === 'number') {
            child = this.children[object];
        }
        else {
            child = object;
        }

        const file = child.findInputFile(filepath);
        if (file) {
            const cloneFile = file.clone();
            const fullpath = child.getFullpath(cloneFile);
            SwfTree.deleteFileFromParent(this, fullpath, true);
        }
    }

    /**
     * delete output file from parent tree
     * @param index child task index number
     * @param filepath filepath string
     */
    public deleteOutputFileFromParent(index: number, filepath: string);

    /**
     * delete output file from parent tree
     * @param tree delete target tree
     * @param filepath filepath string
     */
    public deleteOutputFileFromParent(tree: SwfTree, filepath: string);

    /**
     * delete output file from parent tree
     * @param object child task index number or delete target tree
     * @param filepath filepath string
     */
    public deleteOutputFileFromParent(object: (number | SwfTree), filepath: string) {
        let child: SwfTree;
        if (typeof object === 'number') {
            child = this.children[object];
        }
        else {
            child = object;
        }
        const file = child.findOutputFile(filepath);
        if (file) {
            const cloneFile = file.clone();
            const fullpath = child.getFullpath(cloneFile);
            SwfTree.deleteFileFromParent(this, fullpath, false);
        }
    }

    /**
     * delete input files or output files from parent tree
     * @param tree target tree
     * @param fullpath delete target relative path from root workflow
     * @param isInput whether input files or not
     */
    private static deleteFileFromParent(tree: SwfTree, fullpath: string, isInput: boolean) {
        if (tree == null || tree.isRoot()) {
            return;
        }

        const files: SwfFile[] = isInput ? tree.input_files : tree.output_files;

        for (let index = files.length - 1; index >= 0; index--) {
            if (fullpath === tree.getFullpath(files[index].path)) {
                console.log(`delete parent path ${files[index].path}`);
                files.splice(index, 1);
            }
        }

        const parent = tree.getParent();

        for (let index = parent.file_relations.length - 1; index >= 0; index--) {
            const relation = parent.file_relations[index];

            if (isInput) {
                if (fullpath === parent.getFullpath(relation.path_input_file)) {
                    console.log(`delete parent relation ${relation.path_input_file}`);
                    if (!parent.isExistDuplicateOutputFilePath(relation.path_output_file)) {
                        parent.addOutputFileToParent(relation.index_before_task, relation.path_output_file);
                    }
                    parent.file_relations.splice(index, 1);
                }
            }
            else {
                if (fullpath === parent.getFullpath(relation.path_output_file)) {
                    console.log(`delete parent relation ${relation.path_output_file}`);
                    parent.addInputFileToParent(relation.index_after_task, relation.path_input_file);
                    parent.file_relations.splice(index, 1);
                }
            }
        }

        this.deleteFileFromParent(parent, fullpath, isInput);
    }

    /**
     * update child input files
     * @param oldFile old file data
     * @param newFile new file data
     */
    public updateInputFile(oldFile: SwfFile, newFile: SwfFile) {
        const file = this.findInputFile(oldFile.path).clone();
        const oldFullpath = this.getFullpath(file.path);
        const newFullpath = this.getFullpath(newFile.path);
        SwfTree.updateChildFile(this, oldFile, newFile, oldFullpath, newFullpath, true);
    }

    /**
     * update child output files
     * @param oldFile old file data
     * @param newFile new file data
     */
    public updateOutputFile(oldFile: SwfFile, newFile: SwfFile) {
        const file = this.findOutputFile(oldFile.path).clone();
        const oldFullpath = this.getFullpath(file.path);
        const newFullpath = this.getFullpath(newFile.path);
        SwfTree.updateChildFile(this, oldFile, newFile, oldFullpath, newFullpath, false);
    }

    /**
     * update child input files or output files
     * @param tree target tree
     * @param oldFile old file data
     * @param newFile new file data
     * @param oldFullpath old relative path from root workflow
     * @param newFullpath new relative path from root workflow
     * @param isInput whether input files or not
     */
    private static updateChildFile(tree: SwfTree, oldFile: SwfFile, newFile: SwfFile, oldFullpath: string, newFullpath: string, isInput: boolean) {

        const parent = tree.getParent();
        const newPath = `./${ClientUtility.normalize(tree.path, newFile.path)}`;

        if (oldFile.path !== newFile.path) {
            for (let index = parent.file_relations.length - 1; index >= 0; index--) {
                const relation = parent.file_relations[index];
                if (isInput) {
                    if (oldFullpath === parent.getFullpath(relation.path_input_file)) {
                        console.log(`update relation path ${relation.path_input_file} to ${newPath}`);
                        relation.path_input_file = newPath;
                        if (oldFile.type !== newFile.type) {
                            parent.file_relations.splice(index, 1);
                        }
                    }
                }
                else {
                    if (oldFullpath === parent.getFullpath(relation.path_output_file)) {
                        console.log(`update relation path ${relation.path_output_file} to ${newPath}`);
                        relation.path_output_file = newPath;
                        if (oldFile.type !== newFile.type) {
                            parent.file_relations.splice(index, 1);
                        }
                    }
                }
            }
        }

        if (parent.isRoot()) {
            return;
        }

        const files: SwfFile[] = isInput ? parent.input_files : parent.output_files;

        files.forEach(input => {
            console.log(`oldfull=${oldFullpath}, newfull=${newFullpath}`);
            const newRelative = parent.getRelativePath(newFullpath);

            if (oldFullpath === parent.getFullpath(input.path)) {
                console.log(`convert ${input.path} to ${newRelative}`);
                const old = new SwfFile(input);
                input.path = newRelative;
                input.name = newFile.name;
                input.description = newFile.description;
                input.required = newFile.required;
                input.type = newFile.type;
                this.updateChildFile(parent, old, new SwfFile(input), oldFullpath, newFullpath, isInput);
            }
        });
    }

    /**
     * update path name
     * @param file updated file data
     */
    public updatePath(file: SwfFile) {
        const oldFullpath = this.getFullpath(`${ClientUtility.getTemplate(this).getDefaultName()}`);
        const oldDirectory = this.getCurrentDirectory();
        this.path = file.path;
        const newFullpath = this.getFullpath(`${ClientUtility.getTemplate(this).getDefaultName()}`);
        const newDirectory = this.getCurrentDirectory();

        console.log(`old=${oldFullpath} new=${newFullpath}`);
        const parent = this.getParent();
        if (parent == null) {
            return;
        }

        parent.children_file.forEach(child => {
            const fullpath = parent.getFullpath(child);
            if (fullpath === oldFullpath) {
                child.set(file);
                child.path = parent.getRelativePath(newFullpath);
            }
        });

        (function renamePath(tree: SwfTree) {
            if (tree == null) {
                return;
            }
            tree.file_relations.forEach(relation => {
                relation.renameInputPath(tree, oldDirectory, newDirectory);
                relation.renameOutputPath(tree, oldDirectory, newDirectory);
            });
            tree.input_files.forEach(file => file.renamePath(tree, oldDirectory, newDirectory));
            tree.output_files.forEach(file => file.renamePath(tree, oldDirectory, newDirectory));
            renamePath(tree.getParent());
        })(parent);
    }

    /**
     * get the file with the same input file path name as the specified path name
     * @param path path name
     * @returns get the file with the same input file path name as the specified path name
     */
    public findInputFile(path: string): SwfFile {
        const file: SwfFile = this.getInputFile(path);
        if (file) {
            return file;
        }
        else {
            return this.input_files.filter(file => `${this.path}/${file.getNormalPath()}` === ClientUtility.normalize(path))[0];
        }
    }

    /**
     * get the file with the same output file path name as the specified path name
     * @param path path name
     * @returns get the file with the same output file path name as the specified path name
     */
    public findOutputFile(path: string): SwfFile {
        const file: SwfFile = this.getOutputFile(path);
        if (file) {
            return file;
        }
        else {
            return this.output_files.filter(file => `${this.path}/${file.getNormalPath()}` === ClientUtility.normalize(path))[0];
        }
    }

    /**
     * add script file for upload
     * @param file upload script file
     */
    public addScriptFile(file: File) {
        this.uploadScript = file;
        this.script.path = file.name;
    }

    /**
     * add job script file for upload
     * @param file upload job script file
     */
    public addJobScriptFile(file: File) {
        this.uploadScript = file;
        const job = <SwfJobJson><any>this;
        job.job_script.path = file.name;
    }

    /**
     * add parameter file for upload
     * @param file upload parameter file
     */
    public addParameterFile(file: File) {
        this.uploadParamFile = file;
        const pstudy = <SwfPStudyJson><any>this;
        pstudy.parameter_file.path = file.name;
    }

    /**
     * add send file for upload
     * @param files upload send file list
     */
    public addSendFile(files: FileList) {
        const rtask = <SwfRemoteTask><any>this;
        for (let index = 0; index < files.length; index++) {
            this.deleteSendfile(files[index].name);
            this.uploadSendfiles.push(files[index]);
            rtask.send_files.push(new SwfFile({
                name: 'name',
                description: '',
                path: files[index].name,
                type: 'file',
                required: true
            }));
        }
    }

    /**
     * delete specified file from send files
     * @param path path name
     */
    public deleteSendfile(path: string);

    /**
     * delete specified file from send files
     * @param file delete file
     */
    public deleteSendfile(file: SwfFile);

    /**
     * delete specified file from send files
     * @param object path name or delete file
     */
    public deleteSendfile(object: (SwfFile | string)) {
        let filepath: string;
        if (typeof object === 'string') {
            filepath = object;
        }
        else {
            filepath = object.path;
        }

        const rtask = <SwfRemoteTask><any>this;
        for (let index = rtask.send_files.length - 1; index >= 0; index--) {
            if (rtask.send_files[index].path === filepath) {
                rtask.send_files.splice(index, 1);
            }
        }

        for (let index = this.uploadSendfiles.length - 1; index >= 0; index--) {
            if (this.uploadSendfiles[index].name === filepath) {
                this.uploadSendfiles.splice(index, 1);
            }
        }
    }

    /**
     * add scpecified files to upload files
     * @param files upload files
     */
    public addUploadFile(files: FileList) {
        this.upload_files = [];
        for (let index = 0; index < files.length; index++) {
            this.upload_files.push(files[index]);
        }
    }

    /**
     * delete specified file in upload files
     * @param file file instance
     */
    public deleteUploadfile(file: File) {
        for (let index = this.upload_files.length - 1; index >= 0; index--) {
            if (this.upload_files[index].name === file.name) {
                this.upload_files.splice(index, 1);
            }
        }
    }

    /**
     * whether specified file is exist in upload send files or not
     * @param sendFile send file
     * @return whether specified file is exist in upload send files or not
     */
    public isExistSendfile(sendFile: SwfFile) {
        const target = this.uploadSendfiles.filter(file => file.name === sendFile.path)[0];
        if (target) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * whether upload script is exist or not
     * @return whether upload script is exist or not
     */
    public isExistUploadScript(): boolean {
        return this.uploadScript != null;
    }

    /**
     * get upload files
     * @param projectDirectory project directory name
     * @return upload files
     */
    public static getUploadFiles(projectDirectory: string): UploadFileData[] {
        const files: UploadFileData[] = [];
        const notSeachedList: SwfTree[] = [this.root];
        while (true) {
            const tree = notSeachedList.shift();
            if (!tree) {
                break;
            }
            if (tree.uploadScript) {
                files.push({
                    filepath: ClientUtility.normalize(projectDirectory, tree.getFullpath(tree.uploadScript.name)),
                    file: tree.uploadScript
                });
            }
            if (tree.uploadParamFile) {
                files.push({
                    filepath: ClientUtility.normalize(projectDirectory, tree.getFullpath(tree.uploadParamFile.name)),
                    file: tree.uploadParamFile
                });
            }
            tree.uploadSendfiles.forEach(file => {
                files.push({
                    filepath: ClientUtility.normalize(projectDirectory, tree.getFullpath(file.name)),
                    file: file
                });
            });
            tree.upload_files.forEach(file => {
                files.push({
                    filepath: ClientUtility.normalize(projectDirectory, tree.getFullpath(file.name)),
                    file: file
                });
            });

            tree.children.forEach(child => {
                notSeachedList.push(child);
            });
        }
        return files;
    }

    /**
     * whether circular reference is occurred or not
     * @param before before task index
     * @param after after task index
     * @return whether circular reference is occurred or not
     */
    public isExistCircularReference(before: number, after: number): boolean {
        if (before === after) {
            return true;
        }

        const relations = this.relations.filter(relation => relation.index_before_task === after);
        const fileRelations = this.file_relations.filter(relation => relation.index_before_task === after);
        if (!relations[0] && !fileRelations[0]) {
            return false;
        }
        else {
            const results1 = relations.filter(relation => this.isExistCircularReference(before, relation.index_after_task));
            const results2 = fileRelations.filter(relation => this.isExistCircularReference(before, relation.index_after_task));
            if (!results1[0] && !results2[0]) {
                return false;
            }
            else {
                return true;
            }
        }
    }

    /**
     * whether there is a For workflow at parent or not
     * @return whether there is a For workflow at parent or not
     */
    public isExistForWorkflowAtParent(): boolean {
        if (SwfType.isFor(this)) {
            return true;
        }
        else {
            const parent = this.getParent();
            if (parent == null) {
                return false;
            }
            else {
                return parent.isExistForWorkflowAtParent();
            }
        }
    }

    /**
     * remove SwfTree instance from project
     */
    public remove() {

        (function removeFileRelation(tree: SwfTree) {
            const parent = tree.getParent();
            parent.input_files.forEach(file => parent.deleteInputFileFromParent(tree, file.path));
            parent.output_files.forEach(file => parent.deleteOutputFileFromParent(tree, file.path));
            if (tree.children) {
                tree.children.forEach(child => removeFileRelation(child));
            }
        })(this);

        const taskIndex = this.getTaskIndex();
        const parent = this.getParent();
        parent.children.splice(taskIndex, 1);
        parent.children_file.splice(taskIndex, 1);
        parent.positions.splice(taskIndex, 1);

        for (let index = parent.relations.length - 1; index >= 0; index--) {
            const relation = parent.relations[index];
            const hashcode = this.getHashCode();
            if (hashcode === relation.index_before_task || hashcode === relation.index_after_task) {
                parent.relations.splice(index, 1);
            }
        }

        if (this.oldPath) {
            const dirname = ClientUtility.dirname(this.getCurrentDirectory());
            SwfTree.deleteDirectorys.push(ClientUtility.normalize(dirname, this.oldPath));
        }

        SwfTree.renumberingIndex(SwfTree.root);
    }
}