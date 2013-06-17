var setupSandbox=function(params){
	var h_untrusted1;
	var h_untrusted2;
  (typeof params.base === 'undefined') && (params.base = 'http://localhost/php/beta/');
   var base = params.base;
(function(){
var cached_xhr_objects={};
var cached_window_objects={};
var cached_child={};

var sendToLow = function(msg, h_untrusted){
	if(typeof h_untrusted === 'undefined'){ return;}
	if(typeof msg === 'object'){
	h_untrusted.postMessage(msg,'*');
	}
};



var handle_messages = function(event){
	var msg = event.data;
	switch(msg.type){
	case 'login': 
		var child = document.getElementById("sender").contentWindow;
		child.postMessage(msg,'*');
		break;
	case 'handleDirectLoginClick':
		var child = document.getElementById("sender").contentWindow;
		child.postMessage(msg,'*');
		break;	
	case 'key_update':
		var child = document.getElementById("mainframe").contentWindow;
		child.postMessage(msg,'*');
		break;
	case 'handleLinkClick': window.open(msg.url, "_blank"); break;
	case 'xhr_new'		:     
				cached_xhr_objects[msg.id] = new XMLHttpRequest(); 
				cached_child[msg.id]=msg.child;
					break;
	case 'xhr_open'	: 	

					msg.url = base+msg.url;

					var monitor_obj;
					if(cached_child[msg.id]==1) {
						monitor_obj={type:'postMessage',url:msg.url, id:"mainframe"}
					}else{
						monitor_obj={type:'postMessage',url:msg.url, id:"sender"}
					}
					if(!monitor(monitor_obj)){
						delete cached_xhr_objects[msg.id];
						return;
					}

					cached_xhr_objects[msg.id].open(msg.method,msg.url,msg.async,msg.user,msg.password);
					//console.log("making XHR request",msg.id," to",msg.url);
					cached_xhr_objects[msg.id].onreadystatechange = function(event){
						if(cached_xhr_objects[msg.id].readyState !== 4){return;}
						//console.log("responseText is = "+cached_xhr_objects[msg.id].responseText)
						var temp = {'readyState': cached_xhr_objects[msg.id].readyState,
							     'responseText': cached_xhr_objects[msg.id].responseText,
							     'type' : 'cb_xhr.onreadystatechange',
							     'status':cached_xhr_objects[msg.id].status,
							      'id': msg.id };
						if(cached_child[msg.id]==1){
							sendToLow(temp, h_untrusted1);
						}else{
							sendToLow(temp, h_untrusted2);
						}					
						};
					break;
	case 'xhr_send'	:	if(typeof cached_xhr_objects[msg.id] === 'undefined'){ throw "Can't find object";}
					//console.log("XHR sending message "+ msg.body)
					cached_xhr_objects[msg.id].send(msg.body || null); 
					break;

	case 'xhr_setRequestHeader' :	if(typeof cached_xhr_objects[msg.id] === 'undefined'){ throw "can't find object"; }
					cached_xhr_objects[msg.id].setRequestHeader(msg.header,msg.value);
					break;
	case 'xhr_overrideMimeType' :
		if(typeof cached_xhr_objects[msg.id] === 'undefined'){ throw "can't find object"; }
		cached_xhr_objects[msg.id].overrideMimeType(msg.mimeType);
		break;
    case 'window.location.hash.set' : window.location.hash=msg.value;break;
  	case 'window.open' : 
  		var myWindow=window.open(msg.url, msg.name);
  		cached_window_objects[msg.id]=myWindow;
  		break;
  	case 'write':
  		var myWindow = cached_window_objects[msg.id];
  		myWindow.document.write(msg.string);
  		break;
  	case 'createElement':
  		var myWindow = cached_window_objects[msg.id];
  		myWindow.document.createElement(msg.name);
  		break;
  	case 'createTextNode':
  		var myWindow = cached_window_objects[msg.id];
  		myWindow.document.createTextNode(msg.text);
  		break;
  	case 'submit':
  		var myWindow = cached_window_objects[msg.id];
  		myWindow.document.forms[msg.formname].submit();
  		break;
	case 'appendChild':
		var myWindow = cached_window_objects[msg.id];
		var new_elem;
		switch(msg.child_type){
			case 'H1': new_elem= myWindow.document.createElement('h1'); new_elem.innerHTML = msg.obj.innerHTML; break;
			case 'H3': new_elem = myWindow.document.createElement('h3'); new_elem.innerHTML = msg.obj.innerHTML; break;
			case 'FORM': new_elem = myWindow.document.createElement('form');
				new_elem.id = msg.obj.id;
				new_elem.action = msg.obj.action;
				new_elem.method = msg.obj.method;
				break;
			case 'DIV': new_elem = myWindow.document.createElement('div');
				new_elem.style.display='none';
				new_elem.style.visibility = 'hidden';
				new_elem.id = msg.obj.id;
				break;
			case 'INPUT': new_elem = myWindow.document.createElement('input');
				new_elem.name=msg.obj.name;
				new_elem.value=msg.obj.value;
				new_elem.type = msg.obj.type;
				break;
		} 
		var parent;
		switch(msg.where){
			case 'body': parent = myWindow.document.body; break;
			default:
				parent = myWindow.document.getElementById(msg.where); break;
		}
		parent.appendChild(new_elem);
		break;
	}
};



window.addEventListener('message',handle_messages);
})();

(function(){
var req1 = new XMLHttpRequest();
req1.open("GET",params.url1,false);
req1.send(null);

var content = "<html><head><base href='"+params.base+"'><script src='shim1.js' type='text/javascript' ><"+"/script>"+req1.responseText;
content=encodeURIComponent(content);
var fr = document.createElement("iframe");
fr.setAttribute("dcfsandbox","allow-scripts")
fr.setAttribute("frameBorder","0");
fr.setAttribute("height","100%");
fr.setAttribute("id","mainframe");
fr.src="data:text/html,"+content;
document.body.appendChild(fr);
h_untrusted1=fr.contentWindow;

var req2 = new XMLHttpRequest();
req2.open("GET",params.url2,false);
req2.send(null);

var content2 = "<html><head><base href='"+params.base+"'><script src='shim2.js' type='text/javascript' ><"+"/script>"+req2.responseText;
content2=encodeURIComponent(content2);
var fr2 = document.createElement("iframe");
fr2.setAttribute("dcfsandbox","allow-scripts")
fr2.setAttribute("frameBorder","0");
fr2.setAttribute("height","100%");
fr2.setAttribute("id","sender");
fr2.setAttribute("style","display:none;")
fr2.src="data:text/html,"+content2;
document.body.appendChild(fr2);
h_untrusted2 = fr2.contentWindow;

})();
};
