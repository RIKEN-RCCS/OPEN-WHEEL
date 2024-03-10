/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <versatile-dialog
    v-model="uploadSourceFileDialog"
    :title="uploadSourceFileDialogTitle"
    max-width="50vw"
    :buttons="uploadSourceFileDialogButtons"
    @select="openFileSelectDialog"
    @ok="uploadSourceFileDialogCallback(true)"
    @cancel="uploadSourceFileDialogCallback(false)"
  >
    <template #message >
      <p class="text-h2 text-center pa-4" id="droparea">
        {{ uploadedFilename !== null ?  uploadedFilename : 'drop file here' }}
      </p>
    </template>
  </versatile-dialog>
</template>
<script>
import { mapState } from "vuex"
import versatileDialog from "@/components/versatileDialog.vue";
import SIO from "@/lib/socketIOWrapper.js";
export default {
  name: "SourceFileUploadDialog",
  components: {
    versatileDialog,
  },
  props: {
    value: Boolean,
  },
  data: ()=>{
    return {
      uploadSourceFileDialogTitle:"",
      uploadSourceFileDialogButtons : [
        { icon: "mdi-folder", label: "select" },
        { icon: "mdi-check", label: "ok" },
        { icon: "mdi-close", label: "cancel" },
      ],
      uploadedFilename: null,
      uploading:false,
      percentUploaded: 0,
      ID:null
    };
  },
  computed:{
    ...mapState([
      "componentPath",
      "projectRootDir",
    ]),
    uploadSourceFileDialog: {
      get(){
        return this.value;
      },
      set(v){
        if(v){
          SIO.onUploaderEvent("choose", this.onChoose)
          SIO.onUploaderEvent("complete", this.onUploadComplete)
          SIO.onUploaderEvent("progress", this.updateProgressBar)

          this.$nextTick().then(()=>{
            const el = document.getElementById("droparea")
            if(el){
              SIO.listenOnDrop(el)
            }
          })
        }else{
          SIO.removeUploaderEvent("choose", this.onChoose)
          SIO.removeUploaderEvent("complete", this.onUploadComplete)
          SIO.removeUploaderEvent("progress", this.updateProgressBar)
        }
        this.$emit("update:modelValue", v);
      }
    }
  },
  mounted:function(){
    this.$nextTick().then(()=>{
      SIO.onGlobal("askUploadSourceFile", (ID, name, description, cb)=>{
        this.uploadSourceFileDialogTitle=`upload source file for ${name}`;
        this.ID=ID;
        this.uploadedFilename= null;

        this.uploadSourceFileDialogCallback=(result)=>{
          cb(result && this.uploadedFilename !== null? "UPLOAD_ONDEMAND" : null);
          this.uploadedFilename=null
          this.uploadSourceFileDialog=false;
        };
        this.uploadSourceFileDialog=true;
      });
    }
    );
  },
  beforeDestroy(){
  },
  methods:{
    openFileSelectDialog(){
      SIO.prompt()
    },
    onChoose(event){
      const componentDir=this.componentPath[this.ID];

      for (const file of event.files){
        file.meta.currentDir=componentDir;
        file.meta.orgName="UPLOAD_ONDEMAND"
        file.meta.projectRootDir=this.projectRootDir;
        file.meta.componentDir=componentDir;
        file.meta.clientID=SIO.getID();
        file.meta.skipGit=true;
        file.meta.overwrite=true;
        this.uploadedFilename=file.name;
      }
      this.ID=null;
      this.uploading=true;
    },
    onUploadComplete(){
      this.uploading=false;
    },
    updateProgressBar(event){
      this.percentUploaded=(event.bytesLoaded / event.file.size)*100
    }
  }
};
</script>
