(function () {

	var dest = window.parent,
	     extension_origin = '*',//change chrome-extension:// value later
	     cached_callbacks={},
	     callbackID = 0;

	var onMessage = function(event){
		var msg = event.data, cb_id;

		if(msg.type === 'cb_xhr.onreadystatechange'){
			//console.log("Recvd callback for",msg.id);
			cached_callbacks[msg.id].call(window,{readyState:msg.readyState,responseText:msg.responseText,status:msg.status});
		}	


	};

	window.addEventListener('message',onMessage);

var window_id = 0;

window.handleLinkClick = function(url){
	dest.postMessage({'type':'handleLinkClick', 'url': url}, extension_origin);
}

openBody = function(id){
	var id = id;
}

openDocument = function(id){
		var id = id;
		this.write = function(string){
			dest.postMessage({'type': 'write', id: id, string: string}, extension_origin);
		}
		this.createElement = function(name){
			dest.postMessage({'type': 'createElement', 'id': id, 'name': name}, extension_origin);
		}
		this.createTextNode = function(text){
			dest.postMessage({'type': 'createTextNode','id': id, 'text': text}, extension_origin);
		}
		this.body = new openBody(id);
		this.appendChild = function(where, type, obj){
			dest.postMessage({'type': 'appendChild', 'id': id, 'where': where, 'child_type': type, 'obj': obj},extension_origin)
		}
		this.submit = function(formname){
			dest.postMessage({'type': 'submit', 'id': id, 'formname': formname}, extension_origin)
		}
}

openWindow = function(url, name){
	var id = window_id;
	window_id++;
	dest.postMessage({'type': 'window.open', id: id, url: url, name: name},extension_origin);
	this.document = new openDocument(id);
	this.appendChildNodes = function(where, type, obj){
		this.document.appendChild(where, type, obj)
	}
	this.submit = function(formname){
		this.document.submit(formname)
	}
}

//WINDOW.OPEN
window.open = function(url, name){
	return new openWindow(url, name)
}




/* FIXME Need to proxy window.addEventListener 
and save calls to 'message' event and make sure that
they are forwarded if the msg doesn't match our code */

XMLHttpRequest = function(){
	//console.log("xhr constructor called");
	var child=2;
	callbackID=callbackID+2;
	var xhrid= callbackID;
	var that = this;
	dest.postMessage({'type':'xhr_new','id':xhrid,'child':child},extension_origin);
	this.open= function(method,url,async,user,password){
			//console.log("making request for",method,url,async,"id is",xhrid);
			if(async ===false){
				throw "Do not support synchronous XHR inside sandbox";
			}
			var temp ={'type':'xhr_open','method':method,'url':url,'async':async,
				'user':user,'password':password,'id':xhrid, 'child':child};
			dest.postMessage(temp,extension_origin);
			};

	this.send= function(body){
			//console.log("id:",xhrid," sending request");
			dest.postMessage({type:'xhr_send','body':body,'id':xhrid, 'child':child},extension_origin);
		    };
	
	this.setRequestHeader = function(header,value){
					dest.postMessage({'id':xhrid,'type':'xhr_setRequestHeader',
							  'header': header,'value':value, 'child':child},extension_origin);
				};
	this.overrideMimeType = function(mimeType){
					dest.postMessage({'id': xhrid, 'type':'xhr_overrideMimeType', 
						'mimeType': mimeType, 'child':child}, extension_origin);
	}
	Object.defineProperties(this, {
		"onreadystatechange" : {
			"set" : function(lambda){
					//console.log("saving",xhrid,lambda);
//					if(lambda.toString().indexOf("[native code]") >= 0){}
					cached_callbacks[xhrid]=function(params){
						//console.log("callback xhr: ",xhrid,params);
						that.readyState = params.readyState;
						that.responseText = params.responseText;
						that.status = params.status;
						//console.log(xhrid,"calling ",lambda);
						lambda.call(that);
						   };
					}
				     }
                                 } 
                             );
	

	

	};   

})();
