function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
    }
    return(false);
}

function reload_display() {
    
}

function loadScripts(id){
    /*
    Asynchronously loads scripts or stylesheets from the variable "jsscripts" which is assumed to be global.
    
    undefined => 0
    load[0]
    scriptsremaining: 2 => 1

    load[1]
    scriptsremaining: 1 => 0


    */

	console.log(jsscripts[id]);
	var sltime = new Date();
	console.log(sltime-start_time);
    var script;
    var is_js = true;

	if(id==undefined) {
		id=0;
	}


	if(scripts_remaining<=0) {
		setup_finish();
		var resizetimeout;
		$(window).on("resize",(function() { 
			clearTimeout(resizetimeout);
			resizetimeout = setTimeout(reload_display,150);
		}));
		return;
	}
    else {
        if(jsscripts[id].substr(-4)==".css") {
            is_js = false;
            script = document.createElement("link");
            script.rel = "stylesheet";
            script.type = "text/css";
        }
        else {
            script = document.createElement("script")
            script.type = "text/javascript";
        }
    }
    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
				script.onreadystatechange = null;
				scripts_remaining--;
				loadScripts(jsscripts.length-scripts_remaining);
            }
        };
    } else {  //Others
        script.onload = function(){
            scripts_remaining--;
			loadScripts(jsscripts.length-scripts_remaining);
        };
    }
    if(is_js==true) {
        script.src = jsscripts[id];
        document.getElementsByTagName("head")[0].appendChild(script);
    }
    else {
        script.href = jsscripts[id];
        document.getElementsByTagName("head")[0].appendChild(script);
    }

}