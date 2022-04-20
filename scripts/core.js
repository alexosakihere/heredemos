// JavaScript Document
"use strict";

var mcx = 2560;
var mcy = 1024;
var gmh = 6;
var anim_pause = false;

//Array(4) [ "1878.75px", "3198px", "3584px", "7168px" ]
//Array(4) [ "1878.75px", "3198px", "3584px", "6144px" ]


function call_log(a,b) {
	/* 
	
	Simple function to switch on or off function call logging.

	*/
	calls++;
	if(show_map_errors==true) {
		$("#console").append("<p>"+calls +": called "+a+" from "+b+"</p>");
	}
	console.log(calls +": called "+a+" from "+b);
}

function cap(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
  }

function core_anim_loop() {
	//console.log($("#map_canvas").css("transform"));
	if(story_text.length>0) {
		var s_car = story_text.substring(0,3);
		story_text = story_text.substring(3);
		s_car = s_car.replace("*","<span class='caption_red'>");
		s_car = s_car.replace("#","<span class='caption_green'>");
		s_car = s_car.replace("^","</span>");
		s_car = s_car.replace(/@/g,"<br />");
		markingup = markingup + s_car;
		$("#story_caption_body").html(markingup);
	}
	else {
		markingup = "";
	}
	if(indicator_on==false) {
		if(indicator_data.length>0) {
			story_indicator({"x":indicator_data[0],"y":indicator_data[1],"indicator_type":indicator_data[2],"caller":"core_anim_loop"});
		}
		else {
			if(lock_movement==true && active_story=="" && timer==0) {
				lock_movement=false;
				$("#indicator").remove();
			}
		}
	}
	if(autoplay>0) {
		if(autoplay_counter==0) {
			time_change({"delta":1,"caller":"core_anim_loop"});
			autoplay_counter = 60;
			autoplay--;
		}
		else {
			autoplay_counter--;
		}
	}
	if(timer>0) {
		timer--;
	}
	if(queuelist.length>0 && blocking_queue==false) {
		queue_function();
	}

	for(let anim of anim_queue) {
		if(anim.timer==anim.delay) {
			anim.next();
		}
		else {
			anim.timer++;
		}
	}

	if(map_tiles_remaining == mtiles.length) {
		for(var i=0;i<mtiles.length;i++) {
			map_add_image(i);
		}
		fleet_needs_redraw = true;
		blocking_queue = false;
		map_finish({"caller":"core_anim_loop"});
		//queue_push({"type":"map_finish",params:{caller:"core_anim_loop"}});
	}


	if(ufo_autoplay==true && anim_pause==false) {
		// Updating the fleet demo time.
		if(time>ufo_stop_at) {
			/*
			 When ufo_set_new() is called before new jobs have been assigned, then
			 ufo_stop_at will be set to midnight+38400. So it will reach this point and halt.
			 
			 If new jobs have been assigned, ufo_stop_at will be set to midnight+50400.
			  
			 */
			ufo_autoplay = false;
			if(ufo_stop_at==(ufo_midnight+38400)) {
				time=(ufo_midnight+37800);
				time_change({"delta":1});
			}
		}
		else {
			time+=6;
		}
	}
	if(fleet==true && ufo_autoplay==true) {
		var any_stop_active = false;
		for(var i=0;i<ufo_tours.length;i++) {
            if(ufo_tours[i].status=="3") {
				any_stop_active = true;
                ufo_tours[i].update_position();
            }
		}
		if(any_stop_active==true) {
			if(ufo_phone.visible==true && ufo_phone.tour_id!=-1) {
				ufo_phone.draw("from step");
			}
			ufo_timechange({drawOnly:true});
		}
		else {
			fleetpaths = [];
			fleet_needs_redraw = true;
			ufo_autoplay = false;
			time = 1576857000;
			time_change({"delta":1});
		}
	}
	//console.log(ufo_remaining_steps);
	animation = requestAnimationFrame(function() {core_anim_loop();});
	//animation = setTimeout(function() { requestAnimationFrame(function() { core_anim_loop(); })},250);
};

function cycle_sidebar(params) {
	var fname = "cycle_sidebar";
	var redraw = params.redraw;
	var caller = params.caller;
	if(caller!=undefined) {
		call_log(fname,caller);
	}

	if(redraw==undefined) {
		redraw=false;
	}
	
	//console.log(maincontainerwidth);
	var cycle_sidebar_finish = function() {
		if(redraw==true) {
			calc_viewport_params();
			o_horz = 5;
			map_zoom({"level":map_zlevel,"caller":fname});
		}
		else {
			blocking_queue = false;
		}
	};
	var maincontainerwidth = parseFloat($("#main_container").width())-2;
	var new_sidebarwidth = .25 * (maincontainerwidth+2);
	if(new_sidebarwidth>402) {
		new_sidebarwidth=402;
		// Because the sidebar has a maximum width of 402, the offset can never be larger than this.
	}
	var bottom_left;
	//console.log("sidebar params:"+maincontainerwidth,new_sidebarwidth,bottom_left);
	if(sidebar_active==true) {
		sidebar_active = false;
		blocking_queue = true;
		sidebar_width = 0;
		container_width = parseFloat($("#main_container").width())-parseFloat(sidebar_width);
		bottom_left = (container_width/2)+2;
		$("#sidebar").empty();
		$("#sidebar").velocity({width:["0%","25%"]},{duration:100,queue:true});
		$("#bottom_bar").velocity({left:bottom_left},{duration:100,queue:true});
		//$("#here_logo").velocity({left:[0,400]},{duration:100});
		$("#map_container,#alive_container").velocity({width:[maincontainerwidth,maincontainerwidth-(sidebar_width)]},{duration:100,queue:false,complete:cycle_sidebar_finish});		
	}
	else {
		sidebar_active = true;
		blocking_queue = true;
		container_width = parseFloat($("#main_container").width())-parseFloat(new_sidebarwidth);
		bottom_left = ((container_width-side_menu_width)/2)+(new_sidebarwidth-8);
		$("#sidebar").velocity({width:["25%","0%"]},{duration:100,queue:true,complete:function() {sidebar_width = parseFloat($("#sidebar").width()); }});
		$("#bottom_bar").velocity({left:bottom_left},{duration:100,queue:false});
		//$("#main_container").velocity({width:container_width-side_menu_width},{duration:100,queue:false});
		//$("#here_logo").velocity({left:[400,0]},{duration:100});
		console.log("sidebar width: "+sidebar_width);
		$("#map_container,#alive_container").velocity({width:[(maincontainerwidth-(new_sidebarwidth)),maincontainerwidth]},{duration:100,queue:false,complete:cycle_sidebar_finish});
	}
}


function date_normal(params) {
	/*
	
	Takes an index as a fixed time delta from the specified start time
	and returns a string that is that date with a new offset.
	
	*/
	var standard_delta = 1;
	var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
	
	var offset;
	if(params.index!=undefined) {
		offset = new Date(canon_date - (params.index*standard_delta*60000))
	}
	else {
		if(params.unixtime!=undefined) {
			var unix_delta = (canon_date.getTime()/1000|0) - params.unixtime;
			if(params.absolute!=undefined) {
				if(params.absolute==true) {
					offset = new Date(params.unixtime*1000.0);
				}
				else {
					offset = new Date(canon_date - (unix_delta*1000))
				}
			}
			else {
				offset = new Date(canon_date - (unix_delta*1000))
			}
		}
		else {
			console.log("Error: A date normalization request was passed with neither an index nor a timestamp");
		}
	}
	if(params.shortmonth==undefined) {
		var shortmonth = true;
	}
	else {
		var shortmonth =false;
	}

	if(params.dayonly==undefined) {
		var dayonly = false;
	}
	else {
		var dayonly = params.dayonly;
	}

	if(params.year==undefined) {
		var showyear = false;
	}
	else {
		var showyear = params.year;
	}

	var mon,day,min,hour,stime,ampm,minpad;
	day = offset.getDate();
	mon = months[offset.getMonth()];
	if(shortmonth==true) {
		mon = mon.substr(0,3);
	}
	hour = offset.getHours();
	min = offset.getMinutes();

	if(showyear==true) {
		day = day +", "+offset.getFullYear();
	}
	if(hour>=12) {
		hour = hour-12;
		ampm = "PM";
	}
	else {
		ampm = "AM";
	}
	if(hour===0) {hour = 12;}
	if(min<10) { minpad = "0"; }
	else { minpad = ""; }
	
	stime = hour + ":" + minpad + min + ampm;
	
	if(dayonly==true) {
		return mon + " " + day;
	}
	else {
		return mon + " " + day + " " + stime;
	}
}

function date_string_from_index(t) {
	var d_string = "";
	var h_string = "";
	var m_string = "";
	var remainder = 0;
	var days,hours,minutes;
	var standard_delta = 1;
	
	if((t*standard_delta)>1440) {
		days = (t*standard_delta)/1440;
		remainder = (t*standard_delta)-(Math.floor(days)*1440);
		if(days==1) {
			d_string = "1 day, ";
		}
		else {
			d_string = Math.floor(days) + " days, ";
		}
	}
	else {
		remainder = t*standard_delta;
	}
	//console.log(remainder);
	if((remainder)>60) {
		hours = (remainder)/60;
		remainder = remainder-(Math.floor(hours)*60);
		if(hours==1) {
			h_string = "1 hour, ";
		}
		else {
			h_string = Math.floor(hours) + " hours, ";
		}
	}
	m_string = remainder + " minutes";
	return d_string + h_string + m_string;
}

function calc_viewport_params() {
	/*
	Determines the width of the viewport and the sidebar
	Used for determining the map width and positioning of
	elements on the map canvas.
	*/

	sidebar_width = $("#sidebar").width();
	sidebar_height = $("#sidebar").height();
	side_menu_width = $("#side_menu").width();

	if(sidebar_active==true) {
		container_width = $("#map_container").width();
	}
	else {
		container_width = $("#map_container").width();
	}
	//container_width += (mcx-1024);
	container_height = $("#map_container").height();
	
	gmwidth = Math.floor(container_width/512)+6;
	gmheight = Math.floor(container_height/512)+4;
	gmh = Math.floor(gmwidth/2);
	mcx = gmh * 512;
	$("#map_canvas").css({height:gmheight*512,width:gmwidth*512});
	$("#trace_layer").css({height:gmheight*512,width:gmwidth*512});
	$("#trace_layer").attr("width",gmwidth*512);
	$("#trace_layer").attr("height",gmheight*512);
	


	$("#main_container").css({"transform":"translate3d("+side_menu_width+"px,0px,0px)"});
	if(container_width<800) {
		graph_width = 260;
	}
}

function getQueryVariable(variable)
{
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	//console.log(vars);
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable){return pair[1];}
	}
	return(false);
}

function setQueryVariable() {
	/*
	
	Sets all URL variables appropriately
	
	*/
	
	var qcenter = "?center="+center[0].toFixed(4)+","+center[1].toFixed(4) // this is the map window center
	var qzoom = "&z="+map_zlevel;
	var qthing = "";
	var qtime = "";
	var qgroup = "";
	var qcontext = "";
	var qerror = "";
	if(time!==1) {
		qtime = "&time="+time;
	}
	
	if(active_tracker!=="") {
		qthing = "&thing="+active_tracker;
	}
	
	if(limit_to_group!="") {
		qgroup = "&group="+limit_to_group;
	}
	
	if(current_map_context!="") {
		qcontext = "&context="+current_map_context;
	}

	if(show_map_errors==true) {
		qerror = "&debug=true";
	}
	window.history.replaceState("Object","Title",window.location.pathname+qcenter+qzoom+qtime+qthing+qgroup+qcontext+qerror);	
}

function mouse_interaction(event) {
	var fname = "mouse_interaction";
	anim_pause = true;
	if(lock_movement==true) { return; }
	if(event.type=="mousemove") {
		if(mouse_x>=0 && mouse_y>=0) {
			var mx=(mouse_x+o_horz-event.pageX);
			var my=(mouse_y+o_vert-event.pageY);
			t_horz = mx;
			t_vert = my;
			$("#map_canvas").css({"transform":"translate3d("+(-1*(mx-map_tile_offset_x))+"px,"+(-1*(my-map_tile_offset_y))+"px,0px)"});
			$("#tracker_layer").css({"transform":"translate3d("+(mcx-(mx))+"px,"+(1024-(my))+"px,0px)"});
		}
		else {
			anim_pause = false;
		}
	}
	else {
		anim_pause = false;
		var mx=event.pageX;
		var my=event.pageY;
		var dx=mouse_x-event.pageX;
		var dy=mouse_y-event.pageY;
		if(Math.abs(dx)>5 || Math.abs(dy)>5) {
			o_horz = t_horz;
			o_vert = t_vert;
			//console.log(t_horz,t_vert);
			var dlat = ((1024-t_vert)/madjy) * (170/(Math.pow(2,map_zlevel)));
			var dlon = ((t_horz-mcx)/madjx) * (360/(Math.pow(2,map_zlevel)));
			if(Math.abs(o_horz-mcx)>150 || Math.abs(o_vert-1024)>75) {
				var ncx = parseFloat(center[1]+dlon);
				var ncy = parseFloat(center[0]+dlat);
				if(ncx>180) {
					ncx = -180 + (ncx%180);
				}
				else if(ncx<-180) {
					ncx = 180 + (ncx%180);
				}
				if(ncy < -80) {
					ncy = -80;
				}
				else if(ncy>80) {
					ncy = 80;
				}
				center = [parseFloat(ncy),parseFloat(ncx)];
				//console.log("VARS:"+o_horz,o_vert,ncx,ncy);
				map_zoom({"level":map_zlevel,"caller":fname});
			}
		}
		else {
			var tgtclass = "";
			try {
				tgtclass = event.target.getAttribute("class");
			}
			catch (err) {
				last_err = err;
				if(err.name=="TypeError") {
					try {
						tgtclass = event.target.getAttribute("class");
					}
					catch(err2) {
						console.log(err2);
					}
				}
			}
			if(tgtclass!="marker_icon" && active_tracker!="") {
				get_trace_point(mouse_x,mouse_y);
			}
		}
		mouse_x = -1;
		mouse_y = -1;
	}
}

function queue_push(next_f) {
	var process_queue = false;
	for(var i=0;i<queuelist.length;i++) {
		if(next_f.type==queuelist[i].type) {
			process_queue = true;
		}
	}
	if(process_queue==true) {
		return;
	}
	else {
		queuelist.push(next_f);
	}
}

function queue_function() {
	console.log("executing next queue function");
	var next_f = queuelist.pop();
	var process_queue = false;
	for(var i=0;i<queuelist.length;i++) {
		if(next_f.type==queuelist[i].type) {
			process_queue = true;
		}
	}
	if(process_queue==true) {
		return;
	}
	if(next_f.type=="map_move_to") {
		map_move_to(next_f.params);
	}
	else if(next_f.type=="tracker_select") {
		tracker_select(next_f.params);
	}
	else if(next_f.type=="time_change") {
		time_change(next_f.params);
	}
	else if(next_f.type=="alive_panes") {
		alive_panes(next_f.params.arg1,next_f.params.arg2);
	}
	else if(next_f.type=="tracker_geofence_add_all") {
		tracker_geofence_add_all({caller:"queue_function"});
	}
	else if(next_f.type=="tracker_position_all") {
		tracker_position_all(next_f.params);
	}
	else if(next_f.type=="map_finish") {
		map_finish(next_f.params);
	}
	else if(next_f.type=="draw_panels") {
		assignments_panel.draw(next_f.params);
		order_panel.draw(next_f.params);
	}
	else if(next_f.type=="ufo_activate_stops") {
		ufo_activate_stops(next_f.params);
	}
	else if(next_f.type=="ufo_draw_fleet_paths") {
		ufo_draw_fleet_paths(next_f.params);
	}
	else if(next_f.type=="ufo_position_tours") {
		ufo_position_tours(next_f.params);
	}
	else if(next_f.type=="ufo_position_stops") {
		ufo_position_stops(next_f.params);
	}
	else if(next_f.type=="ufo_create_tours") {
		ufo_create_tours(next_f.params);
	}
	else if(next_f.type=="ufo_update_tours") {
		ufo_update_tours(next_f.params);
	}
	else if(next_f.type=="map_zoom") {
		map_zoom(next_f.params);

	}

}


function get_trace_point(x,y) {
	var fname = "get_trace_point";
	/*
	
	1. Check if there's an active tracker
	2. If there's an active tracker, there should be a number of line segments
	3. Loop through the line segments and find the one closest to the center
	
	*/
	x = x + (o_horz-map_tile_offset_x) - (sidebar_width+side_menu_width);
	y = y + (o_vert-map_tile_offset_y);
	//console.log(x,y,sidebar_width,side_menu_width);

	var traces = trace_points;
	var tx,ty,tid,dist,closest,cid;
	closest = 1000;
	cid = -1;
	for(var idx in trace_points) {
		var trace = trace_points[idx];
		tx = parseFloat(trace[0]);
		ty = parseFloat(trace[1]);
		//dist = Math.sqrt((((x-tx)**2)+((y-ty)**2)));
		dist = Math.sqrt(Math.pow((x-tx),2)+Math.pow((y-ty),2));
		//console.log(dist);
		if(dist<closest) {
			closest = dist;
			cid = idx
		}
	};
	//console.log(closest,cid);
	if(closest<10) {
		var newtime = trackers[active_tracker].updates[cid].time;
//		var newtime = (cid-1) * trackers[active_tracker].updateinterval;
//		time = parseInt(cid)-trackers[active_tracker].updateinterval;
		time_set({index:(cid),caller:fname});
		
		map_move_to({"dcoord":trackers[active_tracker].updates[cid].position,"zdir":map_zlevel,"caller":fname});
	}
	
}

function pdist(a,b) {
	/*
	 * 
	 *	 Returns the distance between two points 
	 */

	var distance = Math.sqrt((Math.pow((a[0]-b[0]),2)) + (Math.pow((a[1]-b[1]),2)));
	return distance;
}

function loadScripts(id){
	console.log(jsscripts[id]);
	var sltime = new Date();
	console.log(sltime-start_time);

    var script = document.createElement("script")
	script.type = "text/javascript";

	if(id==undefined) {
		id=0;
	}
	if(scripts_remaining==0) {
		setup_finish();
		var resizetimeout;
		$(window).on("resize",(function() { 
			clearTimeout(resizetimeout);
			resizetimeout = setTimeout(reload_display,150);
		}));
		return;
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

	script.src = jsscripts[id];
	//console.log(script.src);
    document.getElementsByTagName("head")[0].appendChild(script);
}

function setup() {
	start_time = new Date();
	var restricted;

	try {
		restricted = restricted_mode;
	}
	catch (err) {
		console.log(err);
	}

	if(restricted===undefined) {
		if(getQueryVariable("center")!==false) {
			var qvcenter = getQueryVariable("center").split(",");
			if(Math.abs(qvcenter[0])<180 && Math.abs(qvcenter[1]<80)) {
				center = [parseFloat(qvcenter[0]),parseFloat(qvcenter[1])];
			}
			else {
				center = [0,0];
			}
			
		}
		if(getQueryVariable("z")!==false) {
			map_zlevel = parseInt(getQueryVariable("z"));
		}
		if(getQueryVariable("group")!==false) {
			var group = getQueryVariable("group");
			limit_to_group = group;
			if(group=="telco") {
				use_trackers = ["watch1","watch2","watch3","watch4","watch5","watch6","watch7","watch8","watch9"];
			}
			else if(group=="logistics") {
				use_trackers = ["shipment1","shipment2","shipment3","shipment4","shipment5"];
			}
			else if(group=="notelco") {
				var telcotracker = ["watch1","watch2","watch3","watch4","watch5","watch6","watch7","watch8","watch9"];
				var all_trackers = Object.keys(trackers);
				console.log(all_trackers);
				var add_tracker = true;
				for(var i in all_trackers) {
					add_tracker = true;
					for(var j in telcotracker) {
						if(telcotracker[j]==all_trackers[i]) {
							add_tracker=false;
						}
					}
					if(add_tracker===true) {
						use_trackers.push(all_trackers[i]);
					}
				}
			}
		}
	
		if(getQueryVariable("context")!==false) {
			current_map_context = getQueryVariable("context");
		}
		else {
			// Switching this off as of 2019.07.16 so that it should use whatever is initialized in the HTML
			//current_map_context = "logistics";
		}
	}
	
	scripts_remaining = jsscripts.length;
	loadScripts();
	
	/*
	if(start_date==false) {
		canon_date.set(Date.now());
	}*/
	

}

function setup_finish() {

	var restricted;

	try {
		restricted = restricted_mode;
	}
	catch(err) {
		console.log(err);
	}

	if(restricted!=undefined) {
		$("#loading_icon").hide();
		$("#loading_screen").hide();
		eval(restricted);
		return;
	}

	if(getQueryVariable("debug")!==false) {
		show_map_errors = true;
		$("#console").show();
	}

	$("#loading_icon").show();
	

	var fname = "setup_finish";

	/*
	In the time block here we'll set the current time
	*/
	if(getQueryVariable("time")!==false && fleet==false) {
		var qtime = parseInt(getQueryVariable("time"));
		if(qtime!==time) {
			time = qtime;
		}
	}
	else {
		var d = new Date();
		if(fleet==true) {
			d.setHours(7);
			d.setMinutes(0);
			d.setSeconds(0);
		}
		time = d.getTime()/1000|0;
	}

	if(time<631152000) {
		time = canon_date.getTime()/1000|0;
	}

	
	if(fleet==true) {
		$("#ufo_time_startdate").text(date_normal({"unixtime":time}));
		var midnight = new Date();
		midnight.setHours(0);
		midnight.setMinutes(0);
		midnight.setSeconds(0);
		ufo_midnight = midnight.getTime()/1000|0;
		var pdelta = (time-ufo_midnight)/846;
		$("#ufo_current_time").css({left:pdelta+"%"});
		document.title = "HERE Fleet CES Demo: "+lmdemo;
		ufo_phone = new smartphone({parent:"#ufo_smartphone"});
	}
	else {
		$("#time_current").text(date_normal({"unixtime":time}));
		predefs[3].time=time;
	}

	/*
	Time block over.
	*/

	if(getQueryVariable("thing")!==false) {
		sidebar_active = false;
		$("#bottom_bar").show();
		$("#map_time_control").hide();
		active_tracker = getQueryVariable("thing");
		if(trackers[active_tracker].lastupdate<time) {
			time = trackers[active_tracker].lastupdate;
		}
		
	}

	if(fleet==true) {
		ufo_firstrun();
		ufo_sidebar_icons();
		ufo_calculate_adjacency_map();
		ufo_add_all_stops();
	}

	$(".bottom_bar_switch").remove();

	var summary_switcher = $("<div />",{"class":"bottom_bar_switch","id":"summary_switcher","text":"Full Details"})
	var graph_switcher = $("<div />",{"class":"bottom_bar_switch","id":"graph_switcher","text":"Show Journey Details"})
	var summary_switcher_fire = function() {tracker_summary_cycle({"caller":fname})};
	var graph_switcher_fire = function() {tracker_stages_view_cycle({"caller":fname})};
	summary_switcher.on("click",summary_switcher_fire);
	graph_switcher.on("click",graph_switcher_fire);

	if(stages_active==true) {
		graph_switcher.show();	
	}
	else {
		graph_switcher.hide();
	}
	
	$("#bottom_bar_buttons").append(summary_switcher);
	$("#bottom_bar_buttons").append(graph_switcher);

	

	$("#map_data_selector").on("click",function() {map_data_options();});
	$("#side_back").on("click",function() { alive_last(); });
	$("#side_back").css({backgroundImage:"url('./images/icon_arrow_left.png')"});
	$("#side_map").css({backgroundImage:"url('./images/icon_map_white.png')"});
	$("#side_map").css({borderLeftColor:"#48dad0"});
	$("#side_devices").css({backgroundImage:"url('./images/icon_devices_grey.png')"});
	$("#side_geofences").css({backgroundImage:"url('./images/icon_geofences_grey.png')"});
	$("#side_scenarios").css({backgroundImage:"url('./images/icon_scenarios_grey.png')"});
	$("#side_routes").css({backgroundImage:"url('./images/icon_routes_grey.png')"});
	$("#side_checkpoints").css({backgroundImage:"url('./images/icon_checkpoints_grey.png')"});
	$("#side_asset_tracking").css({backgroundImage:"url('./images/icon_asset_tracking_grey.png')"});
	$("#predef1,#predef2,#predef3,#predef4").css({backgroundImage:"none"});
	//$("#here_logo").css({top:(container_height-60)});
	map_data_option_select({"context":current_map_context,"redraw":false,"caller":fname});
	o_horz = mcx;
	o_vert = 1024;
	t_horz = 0;
	t_vert = 0;

	tcv = document.getElementById("trace_layer");
	tcx = tcv.getContext("2d");

	tcx.clearRect(0,0,tcv.width,tcv.height);
	if("ontouchstart" in document.documentElement===true) {
		console.log("touchstart detected");
		document.getElementById("tracker_layer").addEventListener("touchstart",function(event) { touch_event(event)},false);
		document.getElementById("tracker_layer").addEventListener("touchmove",function(event) { touch_event(event)},false);
		document.getElementById("tracker_layer").addEventListener("touchend",function(event) { touch_event(event)},false);					
	}
	else {
		document.getElementById("tracker_layer").addEventListener("mousedown",function(event) { mouse_x = event.pageX; mouse_y = event.pageY; });
		document.getElementById("tracker_layer").addEventListener("mousemove",function(event) { mouse_interaction(event); });
		document.getElementById("tracker_layer").addEventListener("mouseup",function(event) { mouse_interaction(event); });
	}
	document.onkeydown = function(e) {
		console.log(e);
		var ltime,ltimeshift;
		if(active_tracker!="") {
			ltimeshift = parseInt(trackers[active_tracker].updateinterval);
		}
		else {
			ltimeshift = 10;
		}
		if(e.keyCode===37) {
			if(e.shiftKey==true) {
				ltime = time-ltimeshift;
				center = trackers[active_tracker].updates[ltime].position;
				o_horz = 2000;
			}
			time_change({"delta":-1});
		}
		else if(e.keyCode===39) {
			if(e.shiftKey==true) {
				ltime = time+ltimeshift;
				center = trackers[active_tracker].updates[ltime].position;
				o_horz = 2000;
			}
			time_change({"delta":1});
		}
		else if(e.keyCode===40) {
			time=canon_date.getTime()/1000|0;
			if(e.shiftKey==true) {
				ltime = time-ltimeshift;
				center = trackers[active_tracker].updates[time].position;
				o_horz = 2000;
			}
			time_change({"delta":-1});
		}
		else if(e.keyCode===38) {
			if(active_tracker!=="") {
				ltime = Object.keys(trackers[active_tracker].updates);
				if(e.shiftKey==true) {
					center = trackers[active_tracker].updates[ltime[(ltime.length-1)]].position;
					o_horz = 2000;
				}
				time = parseInt(ltime[ltime.length-1])+ltimeshift;
				time_change({"delta":-1});
			};
		}
		else if(e.keyCode===220) {
			ufo_next_step();
		}
		else if(e.keyCode===187 || e.keyCode===61) {
			map_zoom({'level':1,'caller':'key_event'});
		}
		else if(e.keyCode===189 || e.keyCode===173) {
			map_zoom({'level':-1,'caller':'key_event'});
		}
		else if(e.keyCode>=49 && e.keyCode<57) {
			var nlparams = predefs[e.keyCode-49];
			var temp_queue = [];
			if(nlparams!=undefined && (alive_data_mode=="" || alive_data_mode==undefined)) {
				active_tracker = "";
				time = nlparams.time;
				current_map_context = nlparams.context;
				$(".marker_container").hide();
				$(".alive_gate_marker_canvas").hide();
				//map_move_to({"dcoord":nlparams.position,"zdir":nlparams.zoom});
				//tracker_get_steps_at_time({index:time,caller:fname});
				temp_queue.push({"type":"tracker_select","params":{"id":nlparams.thing,caller:"queue_function"}});
				temp_queue.push({"type":"map_move_to","params":{"dcoord":nlparams.position,"zdir":nlparams.zoom,caller:"queue_function"}});
				temp_queue.push({"type":"tracker_select","params":{"id":false,caller:"queue_function"}});
				temp_queue.push({"type":"time_change","params":{delta:0,caller:"queue_function"}});
				queuelist = temp_queue;
			}
		}
	};



	if(time==0) {
		$("#time_change_earlier").css({backgroundImage:"url('./images/icon_time_early_grey.png')"});
	}
	else {
		$("#time_change_earlier").css({backgroundImage:"url('./images/icon_time_early_black.png')"});
	}
	$("#time_change_later").css({backgroundImage:"url('./images/icon_time_late_black.png')"});

	predefs[3].time = canon_date.getTime()/1000|0; // updating so that it will set to the present when "4" is pressed
	var d = new Date();
	var t = d.getTime()/1000|0;
	alive_days_ago = parseInt((t-time) / 86400);
	if(alive_days_ago!=0) { alive_realtime=false; }
	calc_viewport_params();
	//map_zoom(map_zlevel,"setup_finish");
	cycle_sidebar({"caller":fname,"redraw":true});
	tracker_get_steps_at_time({index:time,caller:fname});
	
	tracker_create_all();
	if(fleet!=true) {
		tracker_geofence_add_all({"init":true,"caller":fname});
		alive_map_position_all_gates({"caller":fname});
	}
	
	core_anim_loop();
	$("#alive_container").hide();
	$("#loading_icon").hide();
	$("#loading_screen").hide();
	console.log(d-start_time);
	
}

function reload_display() {
	var fname = "reload_display";
	map_needs_firstdraw=true;
	o_horz = mcx;
	o_vert = 1024;
	t_horz = 0;
	t_vert = 0;

	//map_zoom(map_zlevel,"setup_finish");
	sidebar_active = true;
	cycle_sidebar({"caller":fname,"redraw":true});
	//calc_viewport_params();
	tracker_get_steps_at_time({index:time,caller:fname});
	
	tracker_create_all();
	if(fleet!=true) {
		tracker_geofence_add_all({"init":true,"caller":fname});
		alive_map_position_all_gates({"caller":fname});
	}
}

function time_set(params) {
	//console.log(index);
	/*
	This is meant to clean up the places in code where we set a time by changing the value of "time" and then calling time_change() 
	*/
	var fname = "time_set";
	var interval = 30;
	var index = params.index;
	var recenter = params.recenter;
	var caller = params.caller;
	console.log(params);

	if(caller!=undefined) {
		call_log(fname,caller);
	}

	if(recenter==undefined) {
		recenter=false;
	}
	/*
	if(active_tracker!="") {
		interval = trackers[active_tracker].updateinterval;
	}
	if(index % interval !=0) {
		index = interval*Math.round(parseInt(index)/interval);
	}*/
	time = trackers[active_tracker].updates[index].time;
	tdiff = -1;
	if(recenter==true) {
		if(active_tracker!="") {
			o_horz = 5000;
			center = trackers[active_tracker].updates[index].position;
			
		}
		else {
			console.log("Time set somehow called without an active tracker set!");
		}
	}
	if(fleet!=true) {
		tracker_get_steps_at_time({index:time,caller:fname});
		$("#time_current").text(date_normal({"unixtime":time}));
	}
	else {
		$("#ufo_time_startdate").text(date_normal({"unixtime":time}));
		var pdelta = (time-ufo_midnight)/864;
		$("#ufo_current_time").css({left:pdelta+"%"});
	}
	
}

function time_change(params) {
	/*
	This takes only one argument, delta.

	If delta is 1, we're moving forward in time, i.e. closer to the present.
	If delta is -1, we're moving backward in time, i.e. further away from the present
	
	If there's an active tracker present, we'll manually set the time to the value of the next or previous step.
	*/

	var fname = "time_change";
	var delta = params.delta;
	var caller = params.caller;
	var ltime,ptime;

	if(caller!=undefined) {
		call_log(fname,caller);
	}

	if(active_tracker!="") {
		ltime = tracker_steps[active_tracker]-delta; // i.e. try to adjust the current step by the provided delta
		if(ltime<=1) {
			ltime = 1;
			tdiff = 0;
		}
		else {
			if(ltime>trackers[active_tracker].totalsteps) {
				ltime = trackers[active_tracker].totalsteps;
			}
			tdiff = delta;
		}
		console.log("Set time_change from active tracker, new step is: "+ltime);
		time = trackers[active_tracker].updates[ltime].time;
	}
	else {
		if(current_map_context == "logistics") {
			ptime = time + (86400 * delta);
		}
		else {
			if(fleet==true) {
				ptime = time + (600 * delta);
			}
			else {
				ptime = time + (1800 * delta);
			}
			
		}
		if(ptime>canon_date.getTime()/1000|0 && fleet==false) {
			//We're trying to set to a time in the future, so we'll just reset to the current time.
			time = canon_date.getTime()/1000|0;
			tdiff = 0;
			$("#time_current").text("Now");
		}
		else {
			time = ptime;
			if(fleet==false) {
				$("#time_current").text(date_normal({"unixtime":time}));
				tdiff = delta;
			}
			
			else {
				$("#ufo_time_startdate").text(date_normal({"unixtime":time}));
				var pdelta = (time-ufo_midnight)/864;
				$("#ufo_current_time").css({left:pdelta+"%"});
			}
		}
	}
	var d = new Date();
	var t = d.getTime()/1000|0;
	alive_days_ago = parseInt((t-time) / 86400);
	if(fleet!=true) {
		tracker_get_steps_at_time({index:time,caller:fname});
		ufo_force_stops_update = false;
	}
	map_zoom({"level":map_zlevel,"caller":fname});
}

function time_change_old(params) {
	/*
	 This needs to be aware of the time change interval.
	 If there's a tracker active, then we need to take its own step value and adjust by a relevant amount.
	 It's possible that "time" was set to something with a different resolution than before, for example
	 if we transition from a tracker with an update interval of 15 minutes to one with an interval of 10 minutes
	 so this all needs to be taken into account.
	 */
	var fname = "time_change";

	var delta = params.delta;
	var caller = params.caller;

	if(caller!=undefined) {
		call_log(fname,caller);
	}

	var interval = 30; // This is the default.


	if(active_tracker!="") {
		interval = trackers[active_tracker].updateinterval;
		if(delta==1) {
			var updates = Object.keys(trackers[active_tracker].updates);
			if(time>=updates[updates.length-1]) {
				return;
			}
		}
	}

	if(time % interval != 0) {
		/*
		If this is the case, then the currently set time is incompatible with the new interval. We need to rationalize these first.
		*/
		time = Math.round((time/interval))*interval; // Should now be an even multiple of the currently accepted interval
	}

	//console.log(time)

	if(delta===-1) {
		if(time>interval) {
			time = time-interval;
			tdiff = -1;
			$("#time_current").text(date_normal({"index":time}));
		}
		else {
			time = 0;
			tdiff = 0;
			$("#time_current").text("Now");
		}
	}
	else {
		time = time+interval;
		tdiff = 1;
		$("#time_current").text(date_normal({"index":time}));
	}
	tracker_get_steps_at_time({caller:fname});
	map_zoom({"level":map_zlevel,"caller":fname});
}

function touch_event(ev) {
	var evtx,evty;
	console.log(ev.target.getAttribute("class"));
	if(ev.target.getAttribute("class")!="tracker_layer") {
		ev.stopPropagation();
	}
	else {
		ev.preventDefault();
	}
	if(ev.type=="touchstart") {
		touchpoints = {};
		if(ev.touches.length==1) {
			mouse_x = ev.touches[0].pageX;
			mouse_y = ev.touches[0].pageY;
		}
		else {
			ev.preventDefault();
			for(var i=0;i<ev.touches.length; i++) {
				touchpoints[""+ev.touches[i].identifier] = { sx:ev.touches[i].clientX, sy:ev.touches[i].clientY, ex:ev.touches[i].clientX, ey:ev.touches[i].clientY}
			}
			mouse_x = (ev.touches[0].pageX + ev.touches[1].pageX)/2;
			mouse_y = (ev.touches[0].pageY + ev.touches[1].pageY)/2;
		}
		
	}
	else if(ev.type=="touchmove") {
		if(Object.keys(touchpoints).length==0) {
			evtx = ev.changedTouches[0].pageX;
			evty = ev.changedTouches[0].pageY;
			if(touchpoint_move==false) {
				mouse_interaction({"pageX":evtx,"pageY":evty,"type":"mousemove"});
			}
		}
		else{
			ev.preventDefault();
			ev.stopPropagation();
			var rheight = $("#tracker_layer").height();
			for(var i=0;i<ev.changedTouches.length; i++) {
				touchpoints[""+ev.changedTouches[i].identifier].ex = ev.changedTouches[i].clientX;
				touchpoints[""+ev.changedTouches[i].identifier].ey = ev.changedTouches[i].clientY;
			}
			var ts = Object.keys(touchpoints);
			var sdist = pdist([touchpoints[ts[0]].sx,touchpoints[ts[0]].sy],[touchpoints[ts[1]].sx,touchpoints[ts[1]].sy]);
			var edist = pdist([touchpoints[ts[0]].ex,touchpoints[ts[0]].ey],[touchpoints[ts[1]].ex,touchpoints[ts[1]].ey]);
			var rat;
			if(sdist-edist>0) {
				//This means the distance at start was greater than at end, i.e. we're zooming OUT
				rat = 2*(sdist-edist)/rheight; // this gives how much of the screen we've zoomed out?
				evtx = (touchpoints[ts[0]].sx + touchpoints[ts[1]].sx)/2;
				evty = (touchpoints[ts[0]].sy + touchpoints[ts[1]].sy)/2;
				$("#map_container").css({"transform":"scale("+(1-rat)+")"})
			}
			else {
				evtx = (touchpoints[ts[0]].sx + touchpoints[ts[1]].sx)/2;
				evty = (touchpoints[ts[0]].sy + touchpoints[ts[1]].sy)/2;
				rat = 4*(edist-sdist)/rheight;
				$("#map_container").css({"transform":"scale("+(1+rat)+")"})
			}
			console.log(ev);
			console.log(evtx,evty);
			if(touchpoint_move==false) {
				mouse_interaction({"pageX":evtx,"pageY":evty,"type":"mousemove"});
			}
		}
	}
	else if(ev.type=="touchend") {
		//console.log(ev);
		var rheight = $("#tracker_layer").height();
		if(Object.keys(touchpoints).length==0) {
			if(touchpoint_move==true) {
				touchpoint_move = false;
			}
			else {
				
				evtx = ev.changedTouches[0].pageX;
				evty = ev.changedTouches[0].pageY;
				console.log("touchend called passing "+evtx+"/"+evty);
				mouse_interaction({"pageX":evtx,"pageY":evty,"type":"mousetouch"});
			}
		}
		else {
			ev.preventDefault();
			ev.stopPropagation();
			var ts = Object.keys(touchpoints);
			var sdist = pdist([touchpoints[ts[0]].sx,touchpoints[ts[0]].sy],[touchpoints[ts[1]].sx,touchpoints[ts[1]].sy]);
			var edist = pdist([touchpoints[ts[0]].ex,touchpoints[ts[0]].ey],[touchpoints[ts[1]].ex,touchpoints[ts[1]].ey]);
			var rat;
			var zfactor;
			if(sdist-edist>0) {
				rat = (sdist-edist)/rheight;
				if(rat >= .45) {
					zfactor = -2;
				}
				else if(rat >= .25) {
					zfactor = -1;
				}
				else {
					zfactor = 0;
				}
			}
			else{
				rat = (edist-sdist)/rheight;
				if(rat >=.5) {
					zfactor = 3;
				}
				if(rat >= .4) {
					zfactor = 2;
				}
				else if(rat >= .20) {
					zfactor = 1;
				}
				else {
					zfactor = 0;
				}
			}
			console.log((sdist-edist),rat,zfactor);
			//var lat_offset = pcenter[0]+(o_vert*2);
			//var lon_offset = pcenter[1]+(o_horz*2);
			//var canvas_offset = ptrans_invert([lon_offset,lat_offset]);
			//var delta_latlon = get_projected_coord(canvas_offset);
			map_zlevel = map_zlevel + zfactor;
			touchpoints = {};
			touchpoint_move = true;
			//move_to_coord(delta_latlon);
			map_zoom({"level":map_zlevel,"caller":"touch_event"});
		}
	}
	

}

/**

MAP FUNCTIONS

HERE IS EVERYTHING TO DO WITH INITIALIZING
DISPLAYING
INTERACTING WITH

THE MAP

**/

function map_data_option_select(params) {
	/*
	Sets the context that is shown for the map. The list of possible contexts
	are defined in data.js in the "dataclasses" array. Each element contains the
	name it will use and the possible range of values associated with that data class.
	
	Context is used to evaluate whether or not a given Thing is displayed on the map.
	
	When a context is chosen, a checkbox will be added next to it so that it is visibly selected.
	*/
	var fname = "map_data_option_select";
	var context = params.context;
	var redraw = params.redraw;
	var caller = params.caller;

	if(caller!=undefined) {
		call_log(fname,caller);
	}

	if(redraw==undefined) {
		redraw = true;
	}
	

	$("#map_data_options").empty();
	$("#map_data_options").hide();
	map_options_visible = false;
	current_map_context=context;
	//console.log(context);
	
	for(var i in contexts) {
		var checkbox = "";
		var list_context = contexts[i];
		if(current_map_context===list_context) {
			checkbox = "<span>✓</span>";
		}
		var context_selector = $("<div />",{class:"map_data_selector_option",id:"selector_"+list_context,text:dataclasses[list_context].name});
		context_selector.append(checkbox);
		$("#map_data_options").append(context_selector);
		if(i<contexts.length-1) { $("#map_data_options").append("<hr />"); }
		bind_selector_click(list_context);
	}
	if(sidebar_active===true && active_tracker==="" && map_needs_firstdraw===false) {
		tracker_sidebar_list_all("map_data_option_select");
	}
	if(redraw==true) {
		$(".marker_container").hide();
		$(".alive_gate_marker_canvas").hide();
		tracker_select({"id":false,"caller":fname});
		map_zoom({"level":map_zlevel,"caller":fname});
	}
}

function bind_selector_click(id) {
	var fname = "bind_selector_click";
	/*
	I f**king hate you, JavaScript
	I hate that I have to do this and I don't know why so f**king much
	JFC
	FJCHAHDArjkhd
	kjarhdkjhtth
	
	why are you doing this to me ;-;
	fuck
	
	fuck
	*/
	
	//console.log(id);
	$("#selector_"+id).on("click",{arg1:id},function(e) { map_data_option_select({"context":id,"caller":fname}); });
}

function map_add_image(idx) {
	var mtparams = mtiles[idx];
	var url = mtparams[0];
	var idh = mtparams[1];
	var idw = mtparams[2];
	var tile = $("#m-"+idh+"-"+idw);
	//tile.css({"transform":"translate("+w+"px,"+h+"px)",backgroundImage:"url('"+url+"')"});
	tile.css({backgroundImage:"url('"+url+"')"});
	//var ow = parseFloat(tile.css("left"));
	//var oh = parseFloat(tile.css("top"));
	//console.log(ow,oh,w,h);
	//var update_image = function() { tile.css({backgroundImage:"url('"+url+"')"}); };
	//tile.velocity({"left":[w,ow],"top":[h,oh]},{duration:10,complete:update_image});
	if(idx==map_tiles_remaining+1) {
		console.log(idx);
		mtiles = [];
		blocking_queue = false;
		queue_push({"type":"map_finish",params:{caller:"map_add_image"}});
		//queue_push({"type":"tracker_position_all","params":{"redraw":true}});
		//queue_push({"type":"tracker_geofence_add_all","params":{"caller":"queue_function"}});
	}
}

function map_log_bad(u,retrieve,h,w) {
	/*

	Simple function

	*/
	//console.log(u);
	var tile_id,add_tile,emsg;
	if(retrieve===undefined) {
		retrieve=false;
	}
	if(retrieve==true) {
		emsg = "man = ["
		for(var i=0;i<bad_tiles.length;i++) {
			emsg = emsg + "\"" + bad_tiles[i] + "\""
			if(i<bad_tiles.length-1) {
				emsg = emsg + ","
			}
		}
		emsg = emsg + "]";
		$("#summary_div_container").text(emsg);
		var copyarea = $("#map_error");
		copyarea.select();
		var success = document.execCommand("copy");
		console.log(emsg);
	}
	else {
		tile_id = u.split("/");
		tile_id = tile_id[2].split(".")[0];
		add_tile = true;
		for(var i=0;i<bad_tiles.length;i++) {
			if(tile_id==bad_tiles[i]) {
				add_tile=false;
			}
		}
		if(add_tile==true) {
			bad_tiles.push(tile_id);
			if(show_map_errors==true) {
				$("#map_error").show();
				$("#map_error").text(bad_tiles.length);
			}
		}
		var tile = $("#m-"+h+"-"+w);
		tile.css({backgroundImage:"url('./images/no_map.png')"});
	}
	
}

function map_draw(params) {
	var fname = "map_draw";
	var redraw = params.redraw;
	var caller = params.caller;

	if(caller!=undefined) {
		call_log(fname,caller);
	}

	if(blocking_map==true) {
		tracker_draw_trace(false);
		$(".marker_container").hide();
		$(".alive_gate_marker_canvas").hide();
		console.log("halted clear on blocking_map = true");
		return;
	}

	if(redraw===true) {
		tcx.clearRect(0,0,tcv.width,tcv.height);
		var height=gmheight;
		var width=gmwidth;

		if(blocking_map==true) {
			console.log("halted redraw on blocking_map = true");
			return;
		}
		console.log("redrawing map");
		blocking_map = true;
		blocking_queue = true;

		var start_y = normalized_origin[0]-2;
		var start_x = normalized_origin[1]-gmh;
		var y_correction = 0;
		var x_correction = 0;
		if(map_tile_offset_y>=512) {
			//start_y--;
			//height++;
			//y_correction=-512;
		}
		if(map_tile_offset_x>=512) {
			//start_x--;
			//width++;
			//x_correction=-512;
		}



		map_tiles_remaining = (width+1)*(height+2);
		//map_needs_redraw = true;
		//lock_movement = true;
		if(map_needs_firstdraw==true) {
			$(".map_tile").remove();
			for(var h=-2;h<height;h++) {
				for(var w=-1;w<width;w++) {
					var tile = $("<div />",{"class":"map_tile","id":"m-"+h+"-"+w});
					$(tile).css({"transform":"translate("+512*w+"px,"+512*h+"px)"});
					$("#map_canvas").append(tile);
				}
			}
			map_needs_firstdraw=false;
		}
		var cw,ch; //corrected width and height
		mtiles = [];
		for(var h=-2;h<height;h++) {
			for(var w=-1;w<width;w++) {
				var style;
				if(mapstyle=="" || mapstyle=="normal") {
					style = "";
				}
				else {
					style = "-"+mapstyle;
				}
				ch = start_y+h;
				cw = start_x+w;
				if(cw < 0) {
					cw = (2**map_zlevel) + cw;
				}
				else if(cw>=2**map_zlevel) {
					cw = cw % 2**map_zlevel;
				}
				if(ch < 0) {
					ch = (2**map_zlevel) + ch;
				}
				else if(ch>=2**map_zlevel) {
					ch = ch % 2**map_zlevel;
				}
				var imgurl = "./screens/"+map_zlevel+"-"+(ch)+"-"+(cw)+style+".png";
				$("<img />").attr("src",imgurl).on("load",{arg1:h,arg2:w,arg3:imgurl},function(e) {
					var ih = e.data.arg1;
					var iw = e.data.arg2;
					var iurl = e.data.arg3;
					$(this).remove();
					mtiles.push([iurl,ih,iw]);
				}).on("error",{arg1:imgurl,arg2:h,arg3:w},function(e) { mtiles.push([e.data.arg1,e.data.arg2,e.data.arg3]); map_log_bad(e.data.arg1,false,e.data.arg2,e.data.arg3); });
				
							
			}
		}
		
	}
	else {
		blocking_queue = false;
		queue_push({"type":"map_finish","caller":fname});

	}
}

function map_finish(params) {
	if(params==undefined) { 
		console.log ("map_finish called without parameters"); 
		var params = {}; 
	}
	//console.log("map_last_call:"+map_last_call);
	//console.log("finished");
	var fname = "map_finish";
	var caller = params.caller;
	if(caller!=undefined) {
		call_log(fname,caller);
	}


		var trans_x = (map_tile_offset_x-mcx);
		var trans_y = (map_tile_offset_y-1024);
		//console.log("Corrections: "+trans_x,trans_y);
		$("#map_canvas").css({"transform":"translate3d("+trans_x+"px,"+trans_y+"px,0px)"});
		$("#tracker_layer").css({transform:"translate3d(-0px,-0px,0px)"});

	
	blocking_map=false;
	blocking_queue=false;
	mtiles = [];
	//core_anim_loop();
	
	if(fleet==true) {
		//ufo_map_all_interlinks();
		queue_push({"type":"ufo_draw_fleet_paths",params:{caller:"map_finish"}});
		ufo_position_tours({caller:fname});
		ufo_position_stops({caller:fname});
	}
	else {
		if(map_last_call!="pda") {
			tracker_geofence_add_all({"caller":fname});
		}
		tracker_position_all({"caller":fname,"redraw":true});
	}
	map_last_call = "";
}

function map_move_to(params) {

	var fname = "map_move_to";
	var dcoord = params.dcoord;
	var zdir = params.zdir;
	var text = params.text;
	var alertdata = params.alertdata;
	var caller = params.caller;
	var after = params.after;
	var timing = 300;
	if(after==undefined) { after = dcoord; }
	// After is a corrective offset so that the map center isn't misplaced after the sidebar is exposed.
	var start_autoplay = params.start_autoplay;
	if(start_autoplay==undefined) {
		start_autoplay = 0;
	}

	if(caller!=undefined) {
		call_log(fname,caller);
	}

	var target = get_normalized_coord(dcoord);
	var ncenter = get_normalized_coord(center);
	var side_panel_adjust = 0.0; // Correction factor if side panels are open.

	var dx = 512*(ncenter[1]-target[1])+side_panel_adjust;
	var dy = 512*(ncenter[0]-target[0]);
	var matrix = $("#map_canvas").css("transform").replace(/[^0-9\-.,]/g, '').split(',');
	var ox = parseFloat(matrix[4]);
	var oy = parseFloat(matrix[5]);
	var ax = ox+dx;
	var ay = oy+dy;
	$("#story_caption").hide(); 

	//$("#map_canvas").velocity({translateX:[ax,ox],translateY:[ay,oy]},{duration:550});
	$("#map_canvas").velocity({"transform":["translate3d("+ax+"px,"+ay+"px,0px)","translate3d("+ox+"px,"+oy+"px,0px)"]})
	//$("#trace_layer").velocity({"transform":["translate("+dx+"px,"+dy+"px)","translate(0px,0px)"]});
	var move_to_complete = function() {
		if(text!=undefined) {
			$("#story_caption").show(); o_horz = 2000; center = after; story_text = text; story_indicator({"x":alertdata[0],"y":alertdata[1],"indicator_type":alertdata[1],"caller":fname}); 
			if(start_autoplay!=0) {
				autoplay = start_autoplay;
			}
			else {
				queue_push({"type":"map_zoom",params:{"level":zdir,"caller":"map_move_to"}});
				//map_zoom({"level":zdir,"caller":fname});
			}
		}
		else {
			o_horz = 2000; center = after; map_zoom({"level":zdir,"caller":fname});; 
		}
		if(params.aliveasset!=undefined) {
			alive_asset_map(params.aliveasset);
		}
		
	}
	blocking_queue = true;
	if(target[0]==ncenter[0] && target[1]==ncenter[1]) {
		$("#tracker_layer").css({"transform":"translate3d("+dx+"px,"+dy+"px,0px)"});
		move_to_complete();
	}
	else {
		$("#tracker_layer").velocity({"transform":["translate3d("+dx+"px,"+dy+"px,0px)","translate3d(0px,0px,0px)"]},{complete:move_to_complete});
	}
	
}

function map_zoom(params) {
	//console.log(center);
	var fname = "map_zoom";
	var level = params.level;
	var caller = params.caller;
	var redraw_map = false;

	if(caller!=undefined) {
		call_log(fname,caller);
		if(caller=="tracker_select") {
			redraw_map = true;
		}
	}
	
	document.getSelection().removeAllRanges();

	if(blocking_map==true) {
		console.log("halted zoom on map blocking");
		return;
	}
	/*
	
	This first if statement is an ugly hack.
	
	And so am I.
	
	
	
	if(active_tracker!="") {
		if(trackers[active_tracker].updates[time].camera!==undefined) {
			center = trackers[active_tracker].updates[time].position;
			map_zlevel = trackers[active_tracker].updates[time].camera;
			level = map_zlevel;
			redraw_map=true;
		}
	}
	
	*/

	if(level===undefined || level===false) {
		level = map_zlevel;
	}
	
	if(level===-1) {
		map_zlevel = map_zlevel-1;
		redraw_map=true;
	}
	else if(level===1) {
		map_zlevel = map_zlevel+1;
		redraw_map=true;
	}
	else {
		map_zlevel = level;
		if(caller=="touch_event") { redraw_map = true; }
	}
	var origin = get_normalized_coord(center);
	if(expanded_summary==true) {
		origin[0]+=.5;
	}
	if(fleet==true) {
		if(assignments_panel!=undefined) {
			if(assignments_panel.visible==true) {
				origin[1]-=.75
			}
		}
	}
	
	var start_y = parseInt(Math.floor(origin[0]));
	var start_x = parseInt(Math.floor(origin[1]));
	var delta_y = origin[0]-normalized_origin[0];
	var delta_x = origin[1]-normalized_origin[1];
	
	if(o_horz!=mcx || o_vert!=1024) {
		o_horz = mcx;
		o_vert = 1024;
		redraw_map=true;
	}
	
	map_tile_offset_y = container_height/2 + 512*(start_y-origin[0]);
	map_tile_offset_x = container_width/2 + 512*(start_x-origin[1]);
	normalized_origin = [start_y,start_x];
	//console.log(normalized_origin);
	var map_zoom_complete = function() {
		//$(".marker_icon").hide();
		$("#map_container").css({"transform":"scale(1)"});
		map_draw({"redraw":redraw_map,"caller":fname});
		tracker_position_all({"caller":fname,"redraw":redraw_map});
		if(fleet==true) {
			ufo_position_stops({caller:fname});
			ufo_draw_fleet_paths({caller:fname});
			//ufo_map_all_interlinks();
		}
	}
	if(level===1) { 
		$("#map_container").velocity({"transform":["scale(2)","scale(1)"]},{duration:150,queue:false,complete:map_zoom_complete}); 
	}
	else if(level===-1) {
		$("#map_container").velocity({"transform":["scale(.5)","scale(1)"]},{duration:150,queue:false,complete:map_zoom_complete}); 		
	}
	else {
		if(caller=="touch_event") {
			$("#map_container").velocity({"transform":["scale(1)","scale(1)"]},{duration:0,queue:false,complete:map_zoom_complete});
		}
		else {
			map_draw({"redraw":redraw_map,"caller":fname});
		}
		
	}
	if(active_tracker!="" && active_tracker!==false) {
		console.log(active_tracker);
		tracker_data_sidebar({"id":active_tracker,"caller":"map_zoom"});
	}
	setQueryVariable();
}

function get_normalized_coord(args) {
	/**
	Takes as argument an array [lat,lon,(zoom)]
	
	Returns an array consisting of the normalized top left coordinate based on a specified zoom level
	**/
	var lat = args[0];
	var lon = args[1];
	var zoom;
	if(args[2]===undefined) {
		zoom = map_zlevel;
	}
	else {
		zoom = args[2];
	}
	var lrad = lat * Math.PI / 180;
	var n = Math.pow(2,zoom);
	var start_x = n * ((lon+180)/360);
	var start_y = n * (1-(Math.log(Math.tan(lrad) + 1/Math.cos(lrad)) / Math.PI)) / 2;

	return([start_y,start_x]);
}

function get_projected_coord(args) {
	/*
	Takes as an argument an x and y coordinate.

	Returns an array consisting of the latitude and longitude represented by this coordinate
	*/

	var y = args[0];
	var x = args[1];
	var n = Math.pow(2,map_zlevel);

	var lon = ((x / n) * 360)-180;
	var lat = -9999;

	var lrad_match = false;
	var lrad_check = 0.0;
	var lrad_implied_lat = 0.0;
	var lat_max = 85.0;
	var lat_min = -85.0;
	var iterations = 0;
	while(lrad_match==false) {
		iterations ++;
		lrad_implied_lat = lrad_check * Math.PI/180;
		lrad_implied_lat = n * (1-(Math.log(Math.tan(lrad_implied_lat) + 1/Math.cos(lrad_implied_lat)) / Math.PI)) / 2;
		//console.log(lrad_implied_lat);
		//console.log(Math.abs(lrad_implied_lat/y));
		if(Math.abs(1.0-(lrad_implied_lat/y))<.00000001) {
			lrad_match = true;
			lat = lrad_check;
			
		}
		else {
			if(lrad_implied_lat>y) {
				// Then the true latitude is *higher* than the suggested one.
				// i.e., it cannot be LOWER.
				// So we now set this as a new minimum bound
				lat_min = lrad_check;
				lrad_check = (lrad_check + lat_max)/2;
			}
			else {
				// Then the true latitude is *higher* than the suggested one.
				// i.e. it cannot be LOWER.
				// So we set the new maximum bound to the previously checked value.
				lat_max = lrad_check;
				lrad_check = (lrad_check + lat_min)/2;
			}
			//console.log(lrad_check);

		}
		if(iterations>50) {
			lrad_match = true;
		}
	}

	return([lat,lon]);
}

function map_data_context_switch(params) {
	console.log(params);
	var fname = "map_data_context_switch";
	var mode = params.mode;
	var caller = params.caller;

	if(caller!=undefined) {
		call_log(fname,caller);
	}
	if(mode==="routes" || mode==="checkpoints" || mode==="gate" || mode==="assets") {
		$("#map_container").hide();
		$(".map_zoom_in,.map_zoom_out,.map_data_selector,.map_time_control").hide();
		$("#alive_container").show();
		$("#alive_container").css({"background-color":"#f3f3f4"});
		$("#here_logo").hide();
	}
	else {
		time_change({"delta":0});
		$("#map_container").show();
		$(".map_zoom_in,.map_zoom_out,.map_data_selector,.map_time_control").show();
		$("#alive_container").hide();
		$("#here_logo").show();
		alive_active_gate = "";
		alive_active_journeys = "";
		alive_active_asset = "";
		alive_data_mode = "";
		alive_display_mode = "";
	}

	if(mode==="map") {
		//active_tracker="";
		tracker_select({"id":active_tracker,"caller":fname});
		if(sidebar_active===true) {
			cycle_sidebar({"caller":fname});
		}
		$("#side_map").css({backgroundImage:"url('./images/icon_map_white.png')"});
		$("#side_map").css({borderLeftColor:"#48dad0"});
		$("#side_devices").css({backgroundImage:"url('./images/icon_devices_grey.png')"});
		$("#side_devices").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_geofences").css({backgroundImage:"url('./images/icon_geofences_grey.png')"});
		$("#side_geofences").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_scenarios").css({backgroundImage:"url('./images/icon_scenarios_grey.png')"});
		$("#side_scenarios").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_routes").css({backgroundImage:"url('./images/icon_routes_grey.png')"});
		$("#side_routes").css({borderLeftColor:"var(--heredarkgrey)"});		
		$("#side_checkpoints").css({backgroundImage:"url('./images/icon_checkpoints_grey.png')"});
		$("#side_checkpoints").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_asset_tracking").css({backgroundImage:"url('./images/icon_asset_tracking_grey.png')"});
		$("#side_asset_tracking").css({borderLeftColor:"var(--heredarkgrey)"});
	}
	else if(mode==="devices") {
		if(sidebar_active===false) {
			cycle_sidebar({"caller":fname});
		}
		if(active_tracker==""){
			tracker_sidebar_list_all("map_data_context_switch");
		}
		$("#side_map").css({backgroundImage:"url('./images/icon_map_grey.png')"});
		$("#side_map").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_devices").css({backgroundImage:"url('./images/icon_devices_white.png')"});
		$("#side_devices").css({borderLeftColor:"#48dad0"});
		$("#side_geofences").css({backgroundImage:"url('./images/icon_geofences_grey.png')"});
		$("#side_geofences").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_scenarios").css({backgroundImage:"url('./images/icon_scenarios_grey.png')"});
		$("#side_scenarios").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_routes").css({backgroundImage:"url('./images/icon_routes_grey.png')"});
		$("#side_routes").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_checkpoints").css({backgroundImage:"url('./images/icon_checkpoints_grey.png')"});
		$("#side_checkpoints").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_asset_tracking").css({backgroundImage:"url('./images/icon_asset_tracking_grey.png')"});
		$("#side_asset_tracking").css({borderLeftColor:"var(--heredarkgrey)"});
	}
	else if(mode==="scenarios") {
		if(sidebar_active===false) {
			cycle_sidebar({"caller":fname});
		}
		$("#side_map").css({backgroundImage:"url('./images/icon_map_grey.png')"});
		$("#side_map").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_devices").css({backgroundImage:"url('./images/icon_devices_grey.png')"});
		$("#side_devices").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_geofences").css({backgroundImage:"url('./images/icon_geofences_grey.png')"});
		$("#side_geofences").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_scenarios").css({backgroundImage:"url('./images/icon_scenarios_white.png')"});
		$("#side_scenarios").css({borderLeftColor:"#48dad0"});
		$("#side_routes").css({backgroundImage:"url('./images/icon_routes_grey.png')"});
		$("#side_routes").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_checkpoints").css({backgroundImage:"url('./images/icon_checkpoints_grey.png')"});
		$("#side_checkpoints").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_asset_tracking").css({backgroundImage:"url('./images/icon_checkpoints_grey.png')"});
		$("#side_asset_tracking").css({borderLeftColor:"var(--heredarkgrey)"});
		story_list_all();
	}
	else if(mode==="routes") {
		tracker_select({"id":active_tracker,"caller":fname});
		if(sidebar_active===false) {
			cycle_sidebar({"caller":fname});
		}
		$("#side_map").css({backgroundImage:"url('./images/icon_map_grey.png')"});
		$("#side_map").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_devices").css({backgroundImage:"url('./images/icon_devices_grey.png')"});
		$("#side_devices").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_geofences").css({backgroundImage:"url('./images/icon_geofences_grey.png')"});
		$("#side_geofences").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_scenarios").css({backgroundImage:"url('./images/icon_scenarios_grey.png')"});
		$("#side_scenarios").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_routes").css({backgroundImage:"url('./images/icon_routes_white.png')"});
		$("#side_routes").css({borderLeftColor:"#48dad0"});
		$("#side_checkpoints").css({backgroundImage:"url('./images/icon_checkpoints_grey.png')"});
		$("#side_checkpoints").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_asset_tracking").css({backgroundImage:"url('./images/icon_asset_tracking_grey.png')"});
		$("#side_asset_tracking").css({borderLeftColor:"var(--heredarkgrey)"});
		alive_panes("routes","list");
	}
	else if(mode==="checkpoints" || mode==="gate") {
		if(active_tracker!="") {
			tracker_select({"id":active_tracker,"caller":fname});
		}
		
		if(sidebar_active===false) {
			cycle_sidebar({"caller":fname});
		}
		$("#side_map").css({backgroundImage:"url('./images/icon_map_grey.png')"});
		$("#side_map").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_devices").css({backgroundImage:"url('./images/icon_devices_grey.png')"});
		$("#side_devices").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_geofences").css({backgroundImage:"url('./images/icon_geofences_grey.png')"});
		$("#side_geofences").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_scenarios").css({backgroundImage:"url('./images/icon_scenarios_grey.png')"});
		$("#side_scenarios").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_routes").css({backgroundImage:"url('./images/icon_routes_grey.png')"});
		$("#side_routes").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_checkpoints").css({backgroundImage:"url('./images/icon_checkpoints_white.png')"});
		$("#side_checkpoints").css({borderLeftColor:"#48dad0"});
		$("#side_asset_tracking").css({backgroundImage:"url('./images/icon_asset_tracking_grey.png')"});
		$("#side_asset_tracking").css({borderLeftColor:"var(--heredarkgrey)"});
		if(mode==="gate" && alive_active_gate!="") {
			queue_push({"type":"alive_panes","params":{arg1:"gate",arg2:"list"}});
		}
		else {
			queue_push({"type":"alive_panes","params":{arg1:"checkpoints",arg2:"list"}});
			// 26.11.2020 removing this mode
			/*if(alive_data_mode=="checkpoints") {
				alive_demo();
				// If checkpoints is clicked when it's already active, then we show the canned demo.
			}
			
			else {
				
			}
			*/
		}
	}
	else if(mode==="assets") {
		$("#side_map").css({backgroundImage:"url('./images/icon_map_grey.png')"});
		$("#side_map").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_devices").css({backgroundImage:"url('./images/icon_devices_grey.png')"});
		$("#side_devices").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_geofences").css({backgroundImage:"url('./images/icon_geofences_grey.png')"});
		$("#side_geofences").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_scenarios").css({backgroundImage:"url('./images/icon_scenarios_grey.png')"});
		$("#side_scenarios").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_routes").css({backgroundImage:"url('./images/icon_routes_grey.png')"});
		$("#side_routes").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_checkpoints").css({backgroundImage:"url('./images/icon_checkpoints_grey.png')"});
		$("#side_checkpoints").css({borderLeftColor:"var(--heredarkgrey)"});
		$("#side_asset_tracking").css({backgroundImage:"url('./images/icon_asset_tracking_white.png')"});
		$("#side_asset_tracking").css({borderLeftColor:"#48dad0"});
		if(active_tracker!="") {
			tracker_select({"id":active_tracker,"caller":fname});
		}
		
		if(sidebar_active===true) {
			cycle_sidebar({"caller":fname});
		}
		asset_tracking_demo_stage = 0;
		asset_tracking_demo(); // Lives in storylogic.js because it's basically a story.
	}
}

function map_data_options() {
	/* 
	Shows the map data options panel. Or hides it if true.
	*/
	console.log(map_options_visible);
	if(map_options_visible===true) {
		$("#map_data_options").hide();
		map_options_visible=false;
	}
	else {
		$("#map_data_options").show();
		map_options_visible=true;
	}
}

function atime(s,t) {
	/*
	Takes in a time step "s" and, for the given tracker "t" returns the corresponding update index for tracker.
	
	Tracker updates are defined by minutes before the present. A tracker might not have every update for every minute.

	If the tracker doesn't have data for that particular step, it should preferentially take the next oldest data.
	*/

	var step = parseInt(s);
	var thing_data = trackers[t];
	var thing_step = parseInt(thing_data.updateinterval);
	var adjusted_step;
	var divisions;
	if(thing_data.updates[step]!==undefined) {
		/*
		This would be true if the tracker has an exact match for this time index. This might happen and is okay.
		*/
		divisions = Math.floor(step/thing_step);
		adjusted_step = step;
	}
	else {
		divisions = Math.floor(step/thing_step);
		adjusted_step = (thing_step * (divisions+1));
	}
	return adjusted_step;
}



function redo_time(id) {
	var fname = "redo_time";
	time = id;
	map_zoom({"level":map_zlevel,"caller":fname});
}

function in_array(s,a) {
	var value_in_array = false;
	for(var i=0;i<a.length;i++) {
		if(a[i]==s) {
			value_in_array = true;
		}
	}
	return value_in_array;
}

function trigger_predef(params) {
	/*

	Wrapper that changes the overall parameters based on the options set in the predefs list
	This is called via dummy buttons on the sidebar to allow the app to be retriggered without a keyboard

	*/
	var nlparams = predefs[params.index];
	var temp_queue = [];
	if(nlparams!=undefined && (alive_data_mode=="" || alive_data_mode==undefined)) {
		active_tracker = "";
		time = nlparams.time;
		current_map_context = nlparams.context;
		$(".marker_container").hide();
		$(".alive_gate_marker_canvas").hide();
		//map_move_to({"dcoord":nlparams.position,"zdir":nlparams.zoom});
		//tracker_get_steps_at_time({index:time,caller:fname});
		temp_queue.push({"type":"tracker_select","params":{"id":nlparams.thing,caller:"queue_function"}});
		temp_queue.push({"type":"map_move_to","params":{"dcoord":nlparams.position,"zdir":nlparams.zoom,caller:"queue_function"}});
		temp_queue.push({"type":"tracker_select","params":{"id":false,caller:"queue_function"}});
		temp_queue.push({"type":"time_change","params":{delta:0,caller:"queue_function"}});
		queuelist = temp_queue;
	}

}