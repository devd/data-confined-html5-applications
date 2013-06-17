function setupSandbox(childBody) {
  var h_untrusted;
  // this is hardcoded for now, can be easily fixed
  var cached_xhr_objects = {};
  var policy = {
    state: 'start',
    authId: null,
    allowcall: function (msg) {
      if (!(msg.type === 'xhr_new' ||
            msg.type === 'xhr_open' ||
            msg.type === 'xhr_setRequestHeader' ||
            msg.type === 'xhr_send' ||
            msg.type === 'window.location.hash.set' ||
            msg.type === 'post_to_opener')) { return false; }

      // always allow dialog stuff
      if (msg.type === 'xhr_open' &&
          msg.method === 'GET' &&
          msg.url.substr(0, 8) === '/dialog/') { return true; }

      // only allow XHR to wsapi
      if (msg.type === 'xhr_open' &&
          msg.url.substr(0, 7) !== '/wsapi/') { return false; }

      // enforce certain dialog sequence
      if (window.location.pathname === '/sign_in' &&
          msg.type === 'xhr_open') {
        switch (this.state) {
        case 'start':
          if (msg.method === 'GET' && msg.url === '/wsapi/session_context') this.state = 'context_received';
          else return false;
          break;
        case 'context_received':
          if (msg.method === 'GET' && msg.url === '/wsapi/list_emails') this.state = 'listed_emails'; // logged in
          else if (msg.method === 'GET' && msg.url.substr(0, 26) === '/wsapi/address_info?email=') this.state = 'got_address_info'; // not logged in and entered email
          else return false;
          break;
        case 'got_address_info':
          if (msg.method === 'POST' && msg.url === '/wsapi/authenticate_user') this.state = 'maybe_authenticated_user', this.authId = msg.id; // registered email
          else if (msg.method === 'POST' && msg.url === '/wsapi/stage_user') this.state = 'staged_user'; // new account
          else if (msg.method === 'GET' && msg.url.substr(0, 26) === '/wsapi/address_info?email=') this.state = 'got_address_info'; // cancel and enter another address
          else return false;
          break;
        case 'maybe_authenticated_user':
          if (msg.method === 'POST' && msg.url === '/wsapi/authenticate_user') this.state = 'maybe_authenticated_user', this.authId = msg.id; // wrong password and retry
          else if (msg.method === 'GET' && msg.url === '/wsapi/list_emails') this.state = 'listed_emails';
          else return false;
          break;
        case 'listed_emails':
        case 'staged_user':
          if (msg.method === 'POST' && msg.url === '/wsapi/cert_key') this.state = 'got_cert_key'; // picked email
          else return false;
          break;
        default:
          return false;
        }
      }

      // monitored password prompt
      if (window.location.pathname === '/sign_in' &&
          msg.type === 'xhr_send' &&
          this.authId !== null &&
          msg.id === this.authId) {
        try {
          var body = JSON.parse(msg.body);
        } catch (e) { return false; }
        var password = window.prompt('password');
        if (password !== null) body.pass = password;
        msg.body = JSON.stringify(body);
      }

      return true;
    }
  };

  var sendToLow = function (msg) {
    if (typeof h_untrusted === 'undefined') { return; }
    if (typeof msg === 'object') {
      h_untrusted.postMessage(msg, '*');
    }
  };



  var handle_messages = function (event) {
    if (typeof event.data == 'string') {
      // forward to child
      sendToLow({
        __forwarded_for_winchan: true,
        origin: event.origin,
        data: event.data
      });
    }
    if (event.origin !== 'null') { return; }
    var msg = event.data;
    if (!(policy.allowcall(msg))) { console.error('policy denied message', msg); return; } // %%%
    switch (msg.type) {
    case 'xhr_new':
      cached_xhr_objects[msg.id] = new XMLHttpRequest();
      break;
    case 'xhr_open':
      cached_xhr_objects[msg.id].open(msg.method, msg.url, msg.async, msg.user, msg.password);
      console.log('making XHR request', msg.id, ' to', msg.url); // %%%
      cached_xhr_objects[msg.id].onreadystatechange = function (event) {
        if (cached_xhr_objects[msg.id].readyState !== 4) { return; }
        var temp = {
          readyState: cached_xhr_objects[msg.id].readyState,
          responseText: cached_xhr_objects[msg.id].responseText,
          type: 'cb_xhr.onreadystatechange',
          status: cached_xhr_objects[msg.id].status,
          id: msg.id
        };
        sendToLow(temp);
      };
      break;
    case 'xhr_send':
      if (typeof cached_xhr_objects[msg.id] === 'undefined') { throw 'Can\'t find object'; }
      cached_xhr_objects[msg.id].send(msg.body || null);
      break;

    case 'xhr_setRequestHeader':
      if (typeof cached_xhr_objects[msg.id] === 'undefined') { throw "can't find object"; }
      cached_xhr_objects[msg.id].setRequestHeader(msg.header, msg.value);
      break;
    case 'window.location.hash.set':
      window.location.hash = msg.value;
      break;
    case 'post_to_opener':
      opener.postMessage(msg.message, msg.targetOrigin);
      break;
    }
  };



  window.addEventListener('message', handle_messages);

  window.monitor = function FXTry_monitor(params) {
    var a = document.createElement('a');
    a.href = params.url;
    // enforce same origin
    var allow = (a.host == window.location.host &&
                 a.protocol == window.location.protocol);
    if (!allow) console.warn('disallowing child request to', params.url);
    return allow;
  };

  var iframe = document.createElement('iframe');
  iframe.setAttribute('dcfsandbox', 'allow-scripts allow-forms allow-top-navigation');
  iframe.src = (window.URL || window.webkitURL).createObjectURL(new Blob([childBody], {type: 'text/html'}));
  document.body.appendChild(iframe);
  h_untrusted = iframe.contentWindow;
}