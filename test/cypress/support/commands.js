Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})

// softAssert
let itBlockErrors = {} // Define an object to store errors for each 'it' block title globally
let totalFailedAssertionsByDescribe = {} // Keep track of the total number of assertion failures for each "describe" block

Cypress.Commands.add('softAssert', { prevSubject: false }, (actualValue, expectedValue, message) => {
  return cy.wrap(null, { timeout: Cypress.config('defaultCommandTimeout') }).then(() => {
    try {
      expect(actualValue).to.eql(expectedValue, message)
    } catch (err) {
      const itBlockTitle = Cypress.currentTest.title
      const describeBlockTitle = Cypress.currentTest.titlePath[0]
      
      // Initialize the count for the "describe" block if it doesn't exist
      totalFailedAssertionsByDescribe[describeBlockTitle] = totalFailedAssertionsByDescribe[describeBlockTitle] || 0
      totalFailedAssertionsByDescribe[describeBlockTitle]++
  
      if (!itBlockErrors[itBlockTitle]) {
        itBlockErrors[itBlockTitle] = []
      }
      itBlockErrors[itBlockTitle].push({ message, error: err })
    }
  })
})

Cypress.Commands.add('assertAll', () => {
  const errors = itBlockErrors
  itBlockErrors = {}

  if (Object.keys(errors).length > 0) {
    const errorMessages = Object.entries(errors).map(([title, entries], index) => {
      const errorMessage = (entries).map(({ error }) => (
        `${"=> "+error.message}`
      )).join('\n\n')
  
      return `${index + 1}. Test Title: ${title}\n${errorMessage}`
    });
  
    const errorMessage = Object.entries(totalFailedAssertionsByDescribe).map(([describe, count]) => {
      return `Total assertion failures in "${describe}": ${count}`
    }).join('\n')
  
    throw new Error(`Soft assertion failed: Total it block failed (${Object.keys(errors).length})\n${errorMessages.join('\n')}\n\n${errorMessage}`)
  }
})

Cypress.Commands.add("setClipboardPermission", () => {
  cy.wrap(Cypress.automation('remote:debugger:protocol', {
    command: 'Browser.grantPermissions',
    params: {
      permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
      origin: window.location.origin,
    },
  }))
})

Cypress.Commands.add("projectMake", (projectName) => { 
  cy.contains('button', 'NEW').click({force: true})
  cy.contains('label', 'project name').siblings().children('input').type(projectName, {force: true})
  cy.contains('button', 'create').click({force: true})
})

Cypress.Commands.add("projectOpen", (projectName) => {
  cy.visit('/').then(() => {
    cy.get('main').find('table')
  })
  cy.contains('tr', projectName).find('[type="checkbox"]').click({force: true})
  cy.contains('button', 'OPEN').click({force: true})
})

Cypress.Commands.add("projectRemove", (projectName) => { 
  cy.contains('tr', projectName).find('[type="checkbox"]').click({force: true})
  cy.contains('button', 'REMOVE').click()
  cy.contains('button', 'remove').click()
})

// make Task
Cypress.Commands.add("taskMake", (taskName) => {
  cy.dragAndDropTask(300, 500, taskName).then(() => {
    cy.clickTask(taskName)
  })
})

// drag&drop task
Cypress.Commands.add("dragAndDropTask", (x, y, taskName) => {
  cy.wait(500).then(() => {
    cy.get('#task')
  })
  cy.get('#task')
  .trigger("dragstart", { offsetX: 100, offsetY: 100 })
  .trigger('dragend', { clientX: x, clientY: y }).then(() => {
    cy.get('svg').contains(taskName)
  })
})

// click Task
Cypress.Commands.add("clickTask", (taskName) => {
  cy.get('svg').contains(taskName).click()
})

// remove Task
Cypress.Commands.add("removeTask", (taskName) => {
  cy.contains('header', 'name').find('button').eq(2).click().then(() => {
    cy.get('svg').contains(taskName).should('not.exist')
  })
})

// close Task
Cypress.Commands.add("closeTask", () => {
  cy.get('.v-toolbar-items').find('[type="button"]').eq(0).click()
})

// click input/output files tab
Cypress.Commands.add("clickInputOutputFilesTab", () => {
  cy.contains('input/output files').click().wait(100)
})

// add input file
Cypress.Commands.add("addInputFiles", (fileName) => {
  cy.contains('input/output files').next().contains('div', 'input files').next().find('input').type(fileName, {enter: true})
  cy.contains('input/output files').next().contains('div', 'input files').next().find('[role="button"]').eq(1).click()
})

// rename input file
Cypress.Commands.add("renameInputFiles", (fileName, fixName) => {
  cy.contains('input/output files').next().contains('div', 'input files').contains('button', fileName).click()
  cy.get('.v-overlay__content').find('input').clear().type(fixName, {enter: true})
})

// delete input file
Cypress.Commands.add("deleteInputFiles", (fileName) => {
  cy.contains('input/output files').next().contains('div', 'input files').contains('tr', fileName).find('[role="button"]').click()
})

// add output file
Cypress.Commands.add("addOutputFiles", (fileName) => {
  cy.contains('input/output files').next().contains('div', 'output files').next().find('input').type(fileName, {enter: true})
  cy.contains('input/output files').next().contains('div', 'output files').next().find('[role="button"]').eq(1).click()
})

// rename output file
Cypress.Commands.add("renameOutputFiles", (fileName, fixName) => {
  cy.contains('input/output files').next().contains('div', 'output files').contains('button', fileName).click()
  cy.get('.v-overlay__content').find('input').clear().type(fixName, {enter: true})
})

// delete output file
Cypress.Commands.add("deleteOutputFiles", (fileName) => {
  cy.contains('input/output files').next().contains('div', 'output files').contains('tr', fileName).find('[role="button"]').click()
})

// Files: click FilesTab
Cypress.Commands.add("clickFilesTab", (i) => {
  if (i > 0) {
    cy.contains('button', 'Files').next().find('button').eq(i).click()
  } else {
    cy.contains('Files').click()
  }
})

// open Host select box
Cypress.Commands.add("openHostListBox", (hostName) => {
  cy.contains('label', 'host').parent().click().wait(100)
})

// select Host
Cypress.Commands.add("selectHost", (hostName) => {
  cy.contains('[role="listbox"]', hostName).contains(hostName).click()
})

// input Submitoption
Cypress.Commands.add("typeSubmitOption", (submitOption) => {
  cy.contains('label', 'submit option').parent().type(submitOption, {enter: true})
})

// open retry setting
Cypress.Commands.add("openRetrySettingTab", () => {
  cy.contains('retry setting').click().wait(100)
})

// input use javascript expression for condition check
Cypress.Commands.add("typeScriptconditionCheck", (script) => {
  cy.contains('button', 'retry setting').siblings().children().children().last().find('textarea').type(script, {enter: true})
})


// open remote file setting tab
Cypress.Commands.add("openRemoteFileSettingTab", () => {
  cy.contains('remote file setting').click()
})

// add include file
Cypress.Commands.add("addIncludeFile", (fileName) => {
  cy.contains('table', 'include').parent().siblings().find('input').type(fileName)
  cy.contains('table', 'include').parent().siblings().find('.v-input__append').click()
})

// delete include file
Cypress.Commands.add("deleteIncludeFile", (fileName) => {
  cy.get('[role="button"]').eq(2).click()
})

// add exclude file
Cypress.Commands.add("addExcludeFile", (fileName) => {
  cy.get('input').eq(9).type(fileName, {enter: true})
  cy.get('[role="button"]').eq(6).click()
})

// delete exclude file
Cypress.Commands.add("deleteExcludeFile", (fileName) => {
  cy.get('[role="button"]').eq(5).click()
})

// select cleanUpFlg
Cypress.Commands.add("setCleanUpFlg", (flgName) => {
  cy.contains(flgName).click()
})

// open select box
Cypress.Commands.add("openScriptSelectBox", () => {
  cy.contains('label', /^script$/).parent().click()
})

// listBoxから指定の値を選択する。
Cypress.Commands.add("selectListBox", (text) => {
  cy.get('[role="listbox"]').find('.v-list-item-title').contains(text).click()
})

// click Console
Cypress.Commands.add("clickConsole", () => {
  cy.get('footer').find('[type="button"]').eq(0).click()
})

// click info tab
Cypress.Commands.add("clickInfoTab", () => {
  cy.contains('span', 'info').click()
})

// click Stdout tab
Cypress.Commands.add("clickStdoutTab", () => {
  cy.contains('span', 'stdout').click()
})

// click output(SSH) tab
Cypress.Commands.add("clickOutputSshTab", () => {
  cy.contains('span', 'output(SSH)').click()
})

// click file/folder
Cypress.Commands.add("clickFileFolder", (name) => {
  cy.contains('button', 'Files').siblings().contains(name).click()
})

// reload project
Cypress.Commands.add("projectReload", (k, projectName, taskName) => {
  if (k == 0) {
    cy.get('[href="./home"]').click()
    cy.projectOpen(projectName)
    cy.clickTask(taskName)
  }
})

// reload Task
Cypress.Commands.add("taskReload", (taskName) => {
  cy.closeTask()
  cy.clickTask(taskName)
})

// swicth use job scheduler
Cypress.Commands.add("switchUseJobScheduler", (flg) => {
  if (flg == 'on') {
    cy.contains('label', 'use job scheduler').siblings().find('input').invoke('is', ':checked').then(($el) => {
      if (!$el) {
        cy.contains('label', 'use job scheduler').click().wait(1000)
      }
    })
  } else if (flg == 'off') {
    cy.contains('use job scheduler').siblings().find('input').invoke('is', ':checked').then(($el) => {
      if ($el) {
        cy.contains('use job scheduler').click().wait(1000)
      }
    })
  }
})

// type retry number
Cypress.Commands.add("retryNumberType", (retryNum) => {
  cy.openRetrySettingTab()
  cy.contains('number of retry').siblings().type(retryNum, {enter: true})
})

// swicth use javascript expression for condition check
Cypress.Commands.add("swicthUseJavascriptExpressionForConditionCheck", (flg) => {
  if (flg == 'on') {
    cy.contains('use javascript expression for condition check').siblings().find('input').invoke('is', ':checked').then(($el) => {
      if (!$el) {
        cy.contains('use javascript expression for condition check').siblings().find('input').click().wait(100)
      }
    })
  } else if (flg == 'off') {
    cy.contains('use javascript expression for condition check').siblings().find('input').invoke('is', ':checked').then(($el) => {
      if ($el) {
        cy.contains('use javascript expression for condition check').siblings().find('input').click().wait(100)
      }
    })
  }
})

// edit script
Cypress.Commands.add("scriptEdit", (scriptName, script) => {
  cy.contains(scriptName).click()
  cy.get('[href="/editor"]').click().wait(100)
  cy.get('#editor').find('textarea').type(script, {force: true})
  cy.get('[href="/graph"]').click().wait(100)
  cy.get('.v-overlay__content').contains('button', 'Save All').click().wait(100)
})

// select script
Cypress.Commands.add("scriptSelect", (scriptName) => {
  cy.openScriptSelectBox()
  cy.selectListBox(scriptName)
})

// select script at script name for condition check
Cypress.Commands.add("scriptNameForConditionCheckSelect", (scriptName) => {
  cy.contains('label', 'script name for condition check').parent().click()
  cy.selectListBox(scriptName)
})

// make script
Cypress.Commands.add("scriptMake", (scriptName, script) => {
  cy.clickFilesTab()
  cy.fileFolderMake('file', scriptName)

  cy.scriptEdit(scriptName, script)
  cy.clickFilesTab()
})

// open stdout
Cypress.Commands.add("stdoutOpen", (time) => {
  cy.wait(time)
  cy.clickConsole()
  cy.clickStdoutTab()
})

// open output ssh
Cypress.Commands.add("outputSshOpen", (time) => {
  cy.wait(time)
  cy.clickConsole()
  cy.clickOutputSshTab()
})

// open info
Cypress.Commands.add("infoOpen", (time) => {
  cy.wait(time)
  cy.clickConsole()
  cy.clickInfoTab()
})

// Project　exec
Cypress.Commands.add("execProject", () => {
  cy.closeTask()
  cy.get('header').find('.v-card__loader').siblings().eq(0).click().wait(100)
})

// Project Reset
Cypress.Commands.add("resetProject", () => {
  cy.get('header').find('.v-card__loader').siblings().eq(2).click().wait(100)
  cy.contains('[type="button"]', 'ok').click()
})

// input remotehost password
Cypress.Commands.add("passwordType", (password) => {
  cy.contains('input password or passphrase').parent().parent().next().find('input').type(password)
  cy.contains('[type="button"]', 'ok').click()
})

// select host
Cypress.Commands.add("hostSelect", (hostName) => {
  cy.openHostListBox(hostName)
  cy.selectHost(hostName).wait(200)
})

// make file/folder
Cypress.Commands.add("fileFolderMake", (type, name) => {
  if(type == 'file') {
    cy.contains('button', 'Files').next().find('button').eq(1).click()
    cy.contains('label', 'new file name').siblings().find('input').type(name)
  } else if(type == 'folder') {
    cy.contains('button', 'Files').next().find('button').eq(0).click()
    cy.contains('label', 'new directory name').siblings().find('input').type(name)
  }
  cy.contains('button', 'ok').click()
})

// make folder
Cypress.Commands.add("folderMake", (folderName) => {
  cy.contains('button', 'Files').next().find('button').eq(0).click()
  cy.contains('label', 'new directory name').siblings().find('input').type(folderName)
  cy.contains('button', 'ok').click()
})

// reneme file/folder
Cypress.Commands.add("fileFolderRename", (name, name2) => {
  cy.clickFileFolder(name)
  cy.contains('button', 'Files').next().find('button').eq(2).click()
  cy.contains('label', 'new name').next().type(name2)
  cy.contains('button', 'ok').click()
})

// delete file/folder
Cypress.Commands.add("fileFolderDelete", (name) => {
  cy.clickFileFolder(name)
  cy.contains('button', 'Files').next().find('button').eq(3).click()
  cy.contains('button', 'ok').click()
})

// send command
Cypress.Commands.add("sendCommand", () => {
  const configObj = {host:'localhost', port:4000, user:'testuser', pass:'passw0rd'}
  cy.task("sshExecuteCmd",{
    sshconn: configObj,
    command:'dirs=`ls -tF | grep / | head -1`; ls -t ${dirs} | grep -v / | wc -l;'
  })
})
