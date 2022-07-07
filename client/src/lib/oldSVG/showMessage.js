/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import $ from "jquery"
import "jquery-ui/ui/widgets/dialog"

import "jquery-ui/themes/base/theme.css"
import "jquery-ui/themes/base/dialog.css"

export default function (message, options) {
  const html = `<p class="dialogMessage">${message}</p>`
  const dialogID = "#dialog"
  var def = $.Deferred()
  $(dialogID).html(html)
    .dialog({
      title: "Error",
      autoOpen: false,
      draggable: false,
      resizable: false,
      modal: true,
      width: "auto",
      height: "auto",
      buttons: [
        {
          class: "notUseButton",
        },
        {
          text: "OK",
          class: "okButton",
          click: function () {
            def.resolve()
            $(this).dialog("close")
          },
        },
      ],
    })
  if (options != null) $(dialogID).dialog("option", options)
  $(dialogID).dialog("open")
  return def.promise()
}
