(function () {

	var dest = window.parent,
	     extension_origin = '*',//change chrome-extension:// value later
	     cached_callbacks={},
	     callbackID = 0;

	var onMessage = function(event){
		//add origin check
		var msg = event.data, cb_id;

		if(msg.type === 'cb_xhr.onreadystatechange'){
			//console.log("Recvd callback for",msg.id);
			cached_callbacks[msg.id].call(window,{readyState:msg.readyState,responseText:msg.responseText,status:msg.status});
		}	


	};

	window.addEventListener('message',onMessage);

/* FIXME Need to proxy window.addEventListener 
and save calls to 'message' event and make sure that
they are forwarded if the msg doesn't match our code */

XMLHttpRequest = function(){
//	console.log("xhr constructor called");
	var xhrid= callbackID++;
	var that = this;
	dest.postMessage({'type':'xhr_new','id':xhrid},extension_origin);
	this.open= function(method,url,async,user,password){
//			console.log("making request for",method,url,async,"id is",xhrid);
			if(async ===false){
				throw "Do not support synchronous XHR inside sandbox";
			}
			var temp ={'type':'xhr_open','method':method,'url':url,'async':async,
				'user':user,'password':password,'id':xhrid};
			dest.postMessage(temp,extension_origin);
			};

	this.send= function(body){
//			console.log("id:",xhrid," sending request");
			dest.postMessage({type:'xhr_send','body':body,'id':xhrid},extension_origin);
		    };
	
	this.setRequestHeader = function(header,value){
					dest.postMessage({'id':xhrid,'type':'xhr_setRequestHeader',
							  'header': header,'value':value},extension_origin);
				};

  this.getResponseHeader = function (header) {
    switch (header) {
    case 'content-type':
      return 'text/html; charset=utf-8';
    case 'Last-Modified':
      throw 0;
    default:
      console.error(new Error('getResponseHeader not implemented, wanted ' + header));
      return '';
    }
  };

	cached_callbacks[xhrid]=function(params){
		//console.log("callback xhr: ",xhrid,params);
		that.readyState = params.readyState;
		that.responseText = params.responseText;
		that.status = params.status;
	};

	Object.defineProperties(this, {
		"onreadystatechange" : {
			"set" : function(){
        throw 'lol, no onreadystatechange setter here';
					}
				     }
                                 } 
                             );
	

	

	};

  window.top_restoreSession = function () {
    dest.postMessage({type: 'top_restoreSession'}, extension_origin);
  };

  window.left_nav_setPatient = function (pname, pid, pubpid, frname, str_dob) {
    dest.postMessage({
      type: 'left_nav_setPatient',
      pname: pname,
      pid: pid,
      pubpid: pubpid,
      frname: frname,
      str_dob: str_dob
    }, extension_origin);
  };

  window.left_nav_setPatientEncounter = function (EncounterIdArray,EncounterDateArray,CalendarCategoryArray) {
    dest.postMessage({
      type: 'left_nav_setPatientEncounter',
      EncounterIdArray: EncounterIdArray,
      EncounterDateArray: EncounterDateArray,
      CalendarCategoryArray: CalendarCategoryArray
    }, extension_origin);
  };

  window.left_nav_setRadio = function (raname, rbid) {
    dest.postMessage({
      type: 'left_nav_setRadio',
      raname: raname,
      rbid: rbid
    }, extension_origin);
  };

  function interceptNavigation(e) {
    if (e.defaultPrevented) return;
    for (var node = e.target; node; node = node.parentNode) {
      if (node.tagName == 'A') { // lol, only <a> tags
        dest.postMessage({type: 'navigate', href: node.getAttribute('href')}, extension_origin);
        e.preventDefault();
        break;
      }
    }
  }

  window.addEventListener('click', interceptNavigation);

})();
