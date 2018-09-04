//https://github.com/likerRr/jq-ajax-progress/blob/master/src/jq-ajax-progress.js
//http://stackoverflow.com/questions/19126994/what-is-the-cleanest-way-to-get-the-progress-of-jquery-ajax-request
/*
 * jQuery Ajax Progress - Lightweight jQuery plugin that adds support of `progress` and `uploadProgress` promises to $.ajax()
 * Copyright (c) 2015 Alexey Lizurchik <al.lizurchik@gmail.com> (http://likerrr.ru)
 * Licensed under the MIT license
 * http://likerrr.mit-license.org/
 */

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function($) {
  var $originalAjax = $.ajax;

  $.ajax = function (url, options) {
    if (typeof(url) === 'object') {
      options = url;
      url = undefined;
    }
    options = options || {};

    // Instantiate our own.
    var xmlHttpReq;

    if (!options.xhr) {
      xmlHttpReq = $.ajaxSettings.xhr();
      // Make it use our own.
      options.xhr = function () {
        return xmlHttpReq;
      };
    } else {
      xmlHttpReq = options.xhr;
    }

    var chunking = options.chunking || $.ajaxSettings.chunking;

    // this line looks strange, but without it chrome doesn't catch `progress` event on uploading. Seems like engine bug
    xmlHttpReq.upload.onprogress = null;

    var $newPromise = $originalAjax(url, options).promise();

    // Extend our own.
    $newPromise.progress = function (handler) {
      // Download progress
      var lastChunkLen = 0;
      xmlHttpReq.addEventListener('progress', function (e) {
        var params = [e],
          chunk = '';

        if (this.readyState === 3 && chunking) {
          chunk = this.responseText.substr(lastChunkLen);
          lastChunkLen = this.responseText.length;
          params.push(chunk);
        }
        handler.apply(this, params);
      }, false);

      return this;
    };

    $newPromise.uploadProgress = function(handler) {
      // Upload progress
      if (xmlHttpReq.upload) {
        xmlHttpReq.upload.addEventListener('progress', function (e) {
          handler.apply(this, [e]);
        }, false);
      }

      return this;
    };

    return $newPromise;
  };
}));