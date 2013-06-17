(function () {

  var dest = window.parent,
  extension_origin = __ORIGIN,
  cached_callbacks = {},
  callbackID = 0;

  var onMessage = function (event) {
    // add origin check
    var msg = event.data, cb_id;

    if (msg.type === 'cb_xhr.onreadystatechange') {
      // console.log('Recvd callback for', msg.id);
      cached_callbacks[msg.id].call(window, {
        readyState: msg.readyState,
        responseText: msg.responseText,
        status: msg.status
      });
    }


  };

  window.addEventListener('message', onMessage);

  /* FIXME Need to proxy window.addEventListener 
     and save calls to 'message' event and make sure that
     they are forwarded if the msg doesn't match our code */

  XMLHttpRequest = function () {
    // console.log('xhr constructor called');
    var xhrid = callbackID++;
    var that = this;
    dest.postMessage({type: 'xhr_new', id: xhrid}, extension_origin);
    this.open = function (method, url, async, user, password) {
      // console.log('making request for', method, url, async, 'id is', xhrid);
      if (async === false) {
        console.error('lol, sync xhr');
        throw 'Do not support synchronous XHR inside sandbox';
      }
      var temp = {
        type: 'xhr_open',
        method: method,
        url: url,
        async: async,
        user: user,
        password: password,
        id: xhrid
      };
      dest.postMessage(temp, extension_origin);
    };

    this.send = function (body) {
      // console.log('id:', xhrid, ' sending request');
      dest.postMessage({
        type: 'xhr_send',
        body: body,
        id: xhrid
      }, extension_origin);
    };

    this.setRequestHeader = function (header, value) {
      dest.postMessage({
        id: xhrid,
        type: 'xhr_setRequestHeader',
        header: header,
        value: value
      }, extension_origin);
    };

    Object.defineProperties(this, {
      onreadystatechange: {
        'set': function (lambda) {
          // console.log('saving', xhrid, lambda);
          // if (lambda.toString().indexOf('[native code]') >= 0) { }
          cached_callbacks[xhrid] = function (params) {
            // console.log('callback xhr: ', xhrid, params);
            that.readyState = params.readyState;
            that.responseText = params.responseText;
            that.status = params.status;
            // console.log(xhrid, 'calling ', lambda);
            lambda.call(that);
          };
        }
      }
    });




  };


  var Storage = function (type) {
    var saveToMainCache = function (data){
      console.log("saving: ",data);
      if(type==='local'){
        dest.postMessage({"type":"localStorage_save","value":data},extension_origin);
      }
    }


    var data = {};

  // initialise if there's already data
    if(type ==='local' && typeof window._localStorageCache !== 'undefined' ){
      data = window._localStorageCache;
      delete window._localStorageCache;
    }

    return {
      length: 0,
      clear: function () {
        data = {};
        this.length = 0;
        saveToMainCache(data);
      //clearData();
      },
      getItem: function (key) {
        console.log(type+"getting: ",key,data[key]);
        return data[key] === undefined ? null : data[key];
      },
      key: function (i) {
      // not perfect, but works
        var ctr = 0;
        for (var k in data) {
          if (ctr == i) return k;
          else ctr++;
        }
        return null;
      },
      removeItem: function (key) {
        console.log(type+"removing: ",key);
        delete data[key];
        this.length--;
        saveToMainCache(data);
      //setData(data);
      },
      setItem: function (key, value) {

        data[key] = value+''; // forces the value to a string
        console.log(type+"setting: ",key,"to",value," data is ",data);
        this.length++;
        saveToMainCache(data);
      //setData(data);
      }
    };
  };

  window._sessionStorage = new Storage('session');

  window.__opener_post = {
    postMessage: function (message, targetOrigin) {
      dest.postMessage({
        type: 'post_to_opener',
        message: message,
        targetOrigin: targetOrigin
      }, extension_origin);
    }
  };

})();