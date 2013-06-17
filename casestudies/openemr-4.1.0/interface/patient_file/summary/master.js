var setupSandbox=function(params){
	var h_untrusted;
    //this is hardcoded for now, can be easily fixed
   var base = params.base;
(function(){

  var whitelist_xhr = {
    'POST stats.php': true,
    'GET pnotes_fragment.php': true,
    'GET disc_fragment.php': true,
    'POST clinical_reminders_fragment.php': true,
    'GET patient_reminders_fragment.php': true,
    'GET vitals_fragment.php': true,
    'POST ../../../library/ajax/user_settings.php': true
  };
  var navigate_whitelist = {
    '../history/history.php': true,
    '../report/patient_report.php': true,
    '../transaction/transactions.php': true,
    'stats_full.php?active=all': true,
    '/openemr-4.1.0/interface/patient_file/summary/rx_frameset.php': true
  };
  if (params.pid) {
    navigate_whitelist['../../../controller.php?document&list&patient_id=' + params.pid] = true;
    navigate_whitelist['../reminder/clinical_reminders.php?patient_id=' + params.pid] = true;
  }
  var webroot = location.protocol + '//' + location.host + params.web_root;
  var monitor_whitelist = {};
  monitor_whitelist[webroot + '/interface/patient_file/summary/shim.js'] = true;
  monitor_whitelist[webroot + '/interface/themes/style_oemr.css'] = true;
  monitor_whitelist[webroot + '/library/js/fancybox/jquery.fancybox-1.2.6.css'] = true;
  monitor_whitelist[webroot + '/library/dynarch_calendar.css'] = true;
  monitor_whitelist[webroot + '/library/textformat.js'] = true;
  monitor_whitelist[webroot + '/library/dynarch_calendar.js'] = true;
  monitor_whitelist[webroot + '/library/dynarch_calendar_setup.js'] = true;
  monitor_whitelist[webroot + '/library/dialog.js'] = true;
  monitor_whitelist[webroot + '/library/js/jquery.1.3.2.js'] = true;
  monitor_whitelist[webroot + '/library/js/common.js'] = true;
  monitor_whitelist[webroot + '/library/js/fancybox/jquery.fancybox-1.2.6.js'] = true;
  monitor_whitelist[webroot + '/interface/pic/ajax-loader.gif'] = true;

  window.monitor = function FXTry_monitor(params) {
    if (!monitor_whitelist[params.url]) {
      console.error('monitored request disallows', params.url);
      return false;
    } else {
      return true;
    }
  };

var cached_xhr_objects={};
var policy = {
  allowcall : function(msg){
    if(!(msg.type === 'xhr_new' ||
         msg.type === 'xhr_open' ||
         msg.type === 'xhr_setRequestHeader' ||
         msg.type === 'xhr_send' ||
         msg.type === 'top_restoreSession' ||
         msg.type === 'left_nav_setPatient' ||
         msg.type === 'left_nav_setPatientEncounter' ||
         msg.type === 'left_nav_setRadio' ||
         msg.type === 'navigate')){return false;}

    if (msg.type === 'xhr_open') {
      var summary = msg.method + ' ' + msg.url;
      if (!whitelist_xhr[summary]) {
        console.error('xhr not whitelisted', msg.method, msg.url);
        return false;
      }
    }

    if (msg.type === 'navigate') {
      if (!navigate_whitelist[msg.href]) {
        console.error('navigation not whitelisted', msg.href);
        return false;
      }
    }

    return true;
  }
};

var sendToLow = function(msg){
	if(typeof h_untrusted === 'undefined'){ return;}
	if(typeof msg === 'object'){
	h_untrusted.postMessage(msg,'*');
	}
    };



var handle_messages = function(event){
	if(event.origin !== 'null'){ return;}
	var msg = event.data;
    if(!(policy.allowcall(msg))){return;}
	switch(msg.type){
	case 'xhr_new'		:       cached_xhr_objects[msg.id] = new XMLHttpRequest(); 
					break;
	case 'xhr_open'	: 	
					cached_xhr_objects[msg.id].open(msg.method,msg.url,msg.async,msg.user,msg.password);
					//console.log("making XHR request",msg.id," to",msg.url);
					cached_xhr_objects[msg.id].onreadystatechange = function(event){
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
  case 'top_restoreSession' : top.restoreSession(); break;
  case 'left_nav_setPatient' : top.left_nav.setPatient(msg.pname, msg.pid, msg.pubpid, msg.frname, msg.str_dob); break;
  case 'left_nav_setPatientEncounter' : top.left_nav.setPatientEncounter(msg.EncounterIdArray, msg.EncounterDateArray, msg.CalendarCategoryArray); break;
  case 'left_nav_setRadio' : top.left_nav.setRadio(msg.raname, msg.rbid); break;
  case 'navigate' : location = msg.href; break;
	}
};



window.addEventListener('message',handle_messages);
})();

(function(){
var req = new XMLHttpRequest();
req.open("GET",params.url,false);
req.send(null);

content = "<html><head><base href='"+params.base+"'><script src='shim.js' type='text/javascript' ><"+"/script>"+req.responseText;
var fr = document.createElement("iframe");
fr.setAttribute("frameBorder","0");
fr.setAttribute("dcfsandbox","allow-scripts allow-forms");
fr.setAttribute("height","100%");
fr.setAttribute("id","mainframe");
fr.src = (window.URL || window.webkitURL).createObjectURL(new Blob([content], {type: 'text/html'}));
document.body.appendChild(fr);
h_untrusted = fr.contentWindow;
})();
};
