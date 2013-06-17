/*jshint browser: true, forin: true, laxbreak: true */
/*global BrowserID: true, _: true */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
BrowserID.Renderer = (function() {
  "use strict";

  var bid = BrowserID,
      dom = bid.DOM,
      templateCache = {};

  function getTemplateHTML(templateName, vars) {
    var config,
        templateText = bid.Templates[templateName],
        vars = vars || {};

    if(templateText) {
      config = {
        text: templateText
      };
    }
    else {
      // TODO - be able to set the directory
      config = {
        url: "/dialog/views/" + templateName + ".ejs"
      };
    }

    var template = templateCache[templateName];
    if(!template) {
      template = new EJS(config);
      templateCache[templateName] = template;
    }

    var html = template.render(vars);
    return html;
  }

  function render(target, templateName, vars) {
    var html = getTemplateHTML(templateName, vars);
    return dom.setInner(target, html);
  }

  function append(target, templateName, vars) {
    var html = getTemplateHTML(templateName, vars);
    return dom.appendTo(html, target);
  }

  function getTemplateHTMLAsync(templateName, vars, callback) {
    function receiveTemplate(template) {
      callback(template.render(vars));
    }

    function receiveText(templateText) {
      template = new EJS({text: templateText});
      templateCache[templateName] = template;
      receiveTemplate(template);
    }

    var template = templateCache[templateName],
        templateText = bid.Templates[templateName],
        vars = vars || {};

    if(template) {
      receiveTemplate(template);
    } else {
      if(templateText) {
        receiveText(templateText);
      }
      else {
        // TODO - be able to set the directory
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
          if (xhr.readyState < 4) return;
          if (xhr.status != 200) return; // uh-oh
          receiveText(xhr.responseText);
        };
        xhr.open("GET", "/dialog/views/" + templateName + ".ejs");
        xhr.send(null);
      }
    }
  }

  function renderAsync(target, templateName, vars, callback) {
    getTemplateHTMLAsync(templateName, vars, function (html) {
      callback(dom.setInner(target, html));
    });
  }

  function appendAsync(target, templateName, vars, callback) {
    getTemplateHTMLAsync(templateName, vars, function (html) {
      callback(dom.appendTo(html, target));
    });
  }

  return {
    render: render,
    append: append,
    renderAsync: renderAsync,
    appendAsync: appendAsync
  };
}());
