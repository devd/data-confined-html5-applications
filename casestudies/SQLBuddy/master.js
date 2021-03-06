var setupSandbox=function(params){
	var h_untrusted;
  (typeof params.base === 'undefined') && (params.base = 'http://localhost/sqlbuddy/');
  (typeof params.url === 'undefined') && (params.url= 'index.php');
   var base = params.base;
(function(){
var cached_xhr_objects={};

var sendToLow = function(msg){
	if(typeof h_untrusted === 'undefined'){ return;}
	if(typeof msg === 'object'){
	h_untrusted.postMessage(msg,'*');
	}
    };



var handle_messages = function(event){
	console.log("Master heard event from origin "+event.origin+ " for msg of type "+event.data.type)
	//if(event.origin !== 'null'){ return;}
	var msg = event.data;
	switch(msg.type){
	case 'window.top.location': window.top.location=msg.location; break;
	case 'xhr_new'		:       cached_xhr_objects[msg.id] = new XMLHttpRequest(); 
					break;
	case 'xhr_open'	: 	
					//This enforces that XHR only to base/file.php is made

					msg.url = base+msg.url;
					var monitor_obj = {type:'postMessage', url:msg.url, id:'mainframe'};
					if(!monitor(monitor_obj)){
						delete cached_xhr_objects[msg.id];
						return;
					} 
					cached_xhr_objects[msg.id].open(msg.method,msg.url,msg.async,msg.user,msg.password);
					console.log("making XHR request",msg.id," to",msg.url);
					cached_xhr_objects[msg.id].onreadystatechange = function(event){
						console.log("Calling cached")
						if(cached_xhr_objects[msg.id].readyState !== 4){return;}
						var temp = {'readyState': cached_xhr_objects[msg.id].readyState,
							     'responseText': cached_xhr_objects[msg.id].responseText,
							     'type' : 'cb_xhr.onreadystatechange',
							     'status':cached_xhr_objects[msg.id].status,
							      'id': msg.id };
						sendToLow(temp);
						};
					break;
	case 'xhr_send'	:	if(typeof cached_xhr_objects[msg.id] === 'undefined'){ throw "Can't find object";}
					cached_xhr_objects[msg.id].send(msg.body || null); 
					break;

	case 'xhr_setRequestHeader' :	if(typeof cached_xhr_objects[msg.id] === 'undefined'){ throw "can't find object"; }
					cached_xhr_objects[msg.id].setRequestHeader(msg.header,msg.value);
					break;
  case 'window.location.hash.set' : window.location.hash=msg.value;break;
	}
};



window.addEventListener('message',handle_messages);
})();

(function(){
var req = new XMLHttpRequest();
req.open("GET",params.url,false);
req.send(null);

content = "<html><head><base href='"+params.base+"'><script src='shim.js' type='text/javascript' ><"+"/script>"+req.responseText;
content=encodeURIComponent(content);
var fr = document.createElement("iframe");
fr.setAttribute("dcfsandbox","allow-scripts allow-forms allow-top-navigation")
fr.setAttribute("frameBorder","0");
fr.setAttribute("height","100%");
fr.setAttribute("id","mainframe");
fr.src="data:text/html,"+content;
document.body.appendChild(fr);
h_untrusted = fr.contentWindow;
})();
};
