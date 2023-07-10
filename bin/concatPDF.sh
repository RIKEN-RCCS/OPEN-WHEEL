#!/bin/bash
ROOT_DIR=$(cd $(dirname $(dirname $0)); pwd)
echo ${ROOT_DIR}
cd ${ROOT_DIR}
rm -fr tmp 2> /dev/null
cp -r documentMD/user_guide tmp
npx md-to-pdf --stylesheet=https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/2.10.0/github-markdown.min.css --body-class=markdown-body tmp/*.md tmp/*/*.md tmp/*/*/*.md
cd tmp

pdftk "1_how_to_boot/index.pdf"\
       "2_tutorial/index.pdf"\
       "2_tutorial/1_basic_tutorial/index.pdf"\
       "2_tutorial/2_advanced_tutorial/index.pdf"\
       "3_reference_manual/index.pdf"\
       "3_reference_manual/1_home_screen/index.pdf"\
       "3_reference_manual/2_remotehost_screen/index.pdf"\
       "3_reference_manual/3_workflow_screen/1_graphview.pdf"\
       "3_reference_manual/3_workflow_screen/2_listview.pdf"\
       "3_reference_manual/3_workflow_screen/3_editor.pdf"\
       "3_reference_manual/4_component/00_common.pdf"\
       "3_reference_manual/4_component/01_Task.pdf"\
       "3_reference_manual/4_component/02_If.pdf"\
       "3_reference_manual/4_component/03_For.pdf"\
       "3_reference_manual/4_component/04_while.pdf"\
       "3_reference_manual/4_component/05_Foreach.pdf"\
       "3_reference_manual/4_component/06_PS.pdf"\
       "3_reference_manual/4_component/07_Workflow.pdf"\
       "3_reference_manual/4_component/08_Storage.pdf"\
       "3_reference_manual/4_component/09_Source.pdf"\
       "3_reference_manual/4_component/10_Viewer.pdf"\
       "3_reference_manual/4_component/11_Stepjob.pdf"\
       "3_reference_manual/4_component/12_BulkjobTask.pdf"\
       "4_ATTENTION/index.pdf"\
       cat output ${ROOT_DIR}/user_guide.pdf

rm -fr ${ROOT_DIR}/tmp
