/*


TRACKER FUNCTIONS GO HERE

THE TRACKER FUNCTIONS HANDLE ANYTHING TO DO WITH AN ICON
THAT IS SHOWN ON THE MAP.

CREATING IT.

VALIDATING THE DATA.

ANIMATING IT.

ETC.


*/


function tracker_alert_cancel() {
	/*
	
	This clears the alert popup and hides it.
	
	*/
	$("#alert_popup").empty();
	$("#alert_popup").hide();
}

function tracker_alert_fire(id) {
	
	/*
		This creates and populates an alert popup. The popup has three elements:
		
		1. A title
		2. Body text, which consists of an array of paragraphs.
		3. Options, for which the first option in the array will be presented as the "default"
		
		A line of body text bracked by "$$line$$" will be presented as a special <span> used for emphasis.
	*/
	
	$("#alert_popup").empty();
	var alert_data = alerts[id];
	var alert_title = $("<div />",{"id":"alert_title","text":alert_data.title});
	var alert_text = $("<div />",{"id":"alert_body"});
	for(var i in alert_data.text) {
		var text_sub = alert_data.text[i];
		//var re = /(\$\$)(.*)(\$\$)/;
		var re = /(\$\$|__)(.*?)\1/g;
		var rep = '<span>$2</span>'
		
		text_sub = text_sub.replace(re,rep);
		alert_text.append("<div class='alert_text'>"+text_sub+"</div>");
	}
	$("#alert_popup").append(alert_title);
	$("#alert_popup").append(alert_text);
	for(var i in alert_data.options) {
		var alert_option = $("<div />");
		if(i==0) {
			alert_option.addClass("alert_button_default");
		}
		else if(i==alert_data.options.length-1) {
			alert_option.addClass("alert_button_dismiss");
		}
		else {
			alert_option.addClass("alert_button");
		}
		var alert_cancel = function() {tracker_alert_cancel(); };
		alert_option.on("click",alert_cancel);
		alert_option.append(alert_data.options[i]);
		$("#alert_popup").append(alert_option);
	}
	$("#alert_popup").show();
}

function tracker_create(id) {
	var fname = "tracker_create";
	var marker = $("<div />",{"class":"marker_container","id":"marker_"+id});
	var icon = $("<div />",{"class":"marker_icon"});
	marker.css({left:-500});
	marker.css({top:-500});
	icon.css({backgroundImage:"url('./images/"+trackers[id].icon+".png')"})
	icon.on("click",{arg1:id},function(e) { tracker_select({"id":id,"caller":fname}); });
	$(marker).append(icon);
	tracker_origins[id] = [-500,-500];
	$("#tracker_layer").append(marker);
}

function tracker_create_all() {
	var context_trackers;
	if(use_trackers.length>1) {
		context_trackers = use_trackers;
	}
	else {
		context_trackers = Object.keys(trackers);
	}
	
	for(var i=0;i<context_trackers.length;i++) {
		var thing_data = trackers[context_trackers[i]];
		tracker_create(context_trackers[i]);
	}
}

function tracker_data_limit(value,dataclass,color) {
	/*
	
	Given a value and the type of data it represents, returns whether the value
	is within acceptable parameters.
	
	Returns: 0 for normal
	1 for amber
	2 for critical
	
	Or, if color is set to true, returns a standardised HTML color code
	
	*/
	
	var return_value;
	var vneg = 1.0;
	if(color===undefined) {
		color = false;
	}
	
	var class_params = dataclasses[dataclass];
	if(class_params.isnonnumeric===true) {
		return_value = "#ffffff";
	}
	else {
		if(class_params.invert===true) { vneg = -1.0; }
		if(vneg*value>=vneg*class_params.red) {
			if(color===false) { return_value = 2; }
			else { return_value = "#c41c33"; }
		}
		else if(vneg*value>=vneg*class_params.amber) {
			if(color===false) { return_value = 1; }
			else { return_value = "#fab800"; }
		}
		else {
			if(color===false) { return_value = 0; }
			else { return_value = "#06b87c"; }
		}
	}
	return return_value;
}

function tracker_data_sidebar_routematch(params) {
	/**
	 * 
	 * Handles everything for the car9 routematch.
	 * 
	 * Again, SAP NOW hack
	 */
	var mode = params.mode;
	var fname = "tracker_data_sidebar_routematch";
	map_last_call = "pda";
	var skip_replot = false;
	if(mode=="trace") {
		if(pda_mode=="trace" || pda_mode=="adjusted") {
			pda_mode = "";
			pda_path_mode = "";
			skip_replot = true;
			pda_obj.adjusted=true;
			pda_obj.adjust();
			$("#routematch_div").css({"background-color":"","color":"var(--herebluegreen)"});
			$("#routematch_div").hide();
			$("#show_trace_div").css({"background-color":"","color":"var(--herebluegreen)"});	
			$("#rmopts_header").hide();
			$("#rmopts_container").hide();
			pda_obj.unplot();
		}
		else {
			pda_mode = "trace";
			$("#show_trace_div").css({"background-color":"var(--herebluegreen)","color":"var(--herewhite)"});
			$("#routematch_div").show();
			pda_obj.plot();
		}
		
	}
	else if(mode=="plan") {
		if(pda_path_mode=="") {
			$("#show_plan_div").css({"background-color":"var(--herebluegreen)","color":"var(--herewhite)"});	
			pda_path_mode = "plan";
		}
		else {
			if(pda_path_mode == "plan_adjusted") {
				pda_path_mode = "adjusted";
				$("#show_plan_div").css({"background-color":"","color":"var(--herebluegreen)"});
			}
			else if(pda_path_mode=="plan_traffic") {
				pda_path_mode = "traffic";
				$("#show_plan_div").css({"background-color":"","color":"var(--herebluegreen)"});
			}
			else if(pda_path_mode=="plan_speed") {
				pda_path_mode = "speed";
				$("#show_plan_div").css({"background-color":"","color":"var(--herebluegreen)"});
			}
			else if(pda_path_mode=="adjusted") {
				$("#show_plan_div").css({"background-color":"var(--herebluegreen)","color":"var(--herewhite)"});
				pda_path_mode = "plan_adjusted";
			}
			else if(pda_path_mode=="traffic") {
				$("#show_plan_div").css({"background-color":"var(--herebluegreen)","color":"var(--herewhite)"});
				pda_path_mode = "plan_traffic";
			}
			else if(pda_path_mode=="speed") {
				$("#show_plan_div").css({"background-color":"var(--herebluegreen)","color":"var(--herewhite)"});
				pda_path_mode = "plan_speed";
			}
			else {
				pda_path_mode = "";
				$("#show_plan_div").css({"background-color":"","color":"var(--herebluegreen)"});
			}
				
		}
	}
	else if(mode=="match") {
		if(pda_mode=="trace") {
			pda_obj.adjust();
			$("#routematch_div").css({"background-color":"var(--herebluegreen)","color":"var(--herewhite)"});
			pda_mode = "adjusted";
			if(pda_path_mode=="plan") {
				pda_path_mode = "plan_adjusted";
			}
			else {
				pda_path_mode = "adjusted";
			}
			$("#rmopts_header").show();
			$("#rmopts_container").show();
		}
		else {
			pda_obj.adjust();
			$("#routematch_div").css({"background-color":"","color":"var(--herebluegreen)"});
			pda_mode = "trace";
			if(pda_path_mode=="plan_adjusted") {
				pda_path_mode = "plan";
			}
			else {
				pda_path_mode = "";
			}
			$("#rmopts_header").hide();
			$("#rmopts_container").hide();
		}
	}
	else if(mode=="traffic") {
		if(pda_path_mode=="plan" || pda_path_mode=="plan_adjusted" || pda_path_mode == "plan_speed") {
			pda_path_mode = "plan_traffic";
		}
		else if(pda_path_mode=="plan_traffic") {
			pda_path_mode = "plan_adjusted";
		}
		else {
			if(pda_path_mode=="traffic") {
				pda_path_mode = "adjusted";
			}
			else {
				pda_path_mode = "traffic";
			}
			
		}
	}
	else if(mode=="speed") {
		if(pda_path_mode=="plan" || pda_path_mode=="plan_adjusted" || pda_path_mode=="plan_traffic") {
			pda_path_mode = "plan_speed";
		}
		else if(pda_path_mode=="plan_speed") {
			pda_path_mode = "plan_adjusted";
		}
		else {
			if(pda_path_mode=="speed") {
				pda_path_mode = "adjusted";
			}
			else {
				pda_path_mode = "speed";
			}
			
		}
	}
	if(mode!="match" && skip_replot==false) {
		tracker_draw_trace({id:active_tracker,caller:fname,redraw:true});
		map_zoom({"level":map_zlevel,"caller":fname});
	}
}

function tracker_data_sidebar(params) {
	/**
	Populates and maximises the sidebar that contains a list of the tracker's current
	status and historical data.
	**/
	
	/*
	First steps: Clear the sidebar
	Load the right tracker data
	Recenter the map on the thing's last location
	*/
	
	var fname  = "tracker_data_sidebar";
	var id = params.id;
	var caller = params.caller;

	if(caller!=undefined) { 
		call_log(fname,caller);
	}
	
	$("#bottom_bar_header,#bottom_bar_data,#bottom_bar_graphic").empty();
	
	//var ltime = atime(time,id); //ltime replaces "time" in that it's an adjusted time based on the tracker's native interval
	
	var ltime = tracker_steps[id]; // This now returns an indexed time STEP
	var thing_data = trackers[id];
	
	if(ltime==-1) {
		// This is true if the tracker does not have any data at this time.
		return;
	}

	// Everything below is actually populating the sidebar
	
	// Define a location, which if we don't have an address we'll have to use the geocoordinate
	var location = center[0].toFixed(3) + ", " + center[1].toFixed(3);
	
	//Below this is the device telemetry
	var data_id,data_el,data_title,data_value,data_unit,data_limit,data_val_el;
	var pos_s_id = 0;
	var pos_acc = 8;
	var pos_conn = "Online";
	var record_id_string = tracker_steps[id]+"/"+thing_data.totalsteps;
	if(thing_data.updates[ltime].source!=undefined) {
		//console.log(thing_data.updates[time].source);
		pos_s_id = thing_data.updates[ltime].source[0];
		pos_acc = thing_data.updates[ltime].source[1];
	}
	if(pos_s_id>=5) {
		pos_conn = "Offline";
	}
	position_string = thing_data.updates[ltime].position[0].toFixed(4)+", "+thing_data.updates[ltime].position[1].toFixed(4);

	


	if(sidebar_id!=id) {
		//Used if we need to clear the sidebar. Many times we won't.

		sidebar_id = id;
		$("#sidebar").empty();
		var return_link = $("<div />",{"class":"sidebar_return"});
		return_link.append("&lsaquo; <span>ALL DEVICES</span>");
		var list_all_click = function() { tracker_sidebar_list_all({"caller":fname});};
		return_link.on("click",list_all_click);
		$("#sidebar").append(return_link);

		var icon_div = $("<div />",{"class":"sidebar_icon"});
		icon_div.css({backgroundImage:"url('./images/"+thing_data.icon+".png')"});
	
		// Battery status indicator
		var battery_status = $("<div />",{"id":"battery_status"});
		var battery = $("<div />",{"class":"battery_icon"});
		var battery_charge = $("<div />",{"class":"battery_charge"});
		
		var battery_percent = thing_data.updates[1].data.battery;
		if(battery_percent>65) {
			$(battery_charge).css({backgroundColor:"#48dad0"});
		}
		else if(battery_percent>40) {
			$(battery_charge).css({backgroundColor:"#fab800"});
		}
		else {
			$(battery_charge).css({backgroundColor:"#c41c33"});
		}
		$(battery_charge).css({width:((parseFloat(battery_percent)/100)*20)+"px"});
		
		battery.append(battery_charge);
		battery_status.append(battery);
		battery_status.append("<div id='battery_status_text'>"+battery_percent+"%</div>");
		
		var last_updated = $("<div />",{"id":"lastupdated","text":"Location last updated: "});
		last_updated.append("<span>"+date_normal({"unixtime":thing_data.updates[1].time})+"</span>");
		
		var summary_div = $("<div />",{"class":"sidebar_summary"});
		summary_div.append("<div id='name'>"+thing_data.name+"</div>");
		summary_div.append("<div id='last'></div>");
		summary_div.append("<div id='location'>"+location+"</div>");
		summary_div.append(battery_status);
		summary_div.append(last_updated);
		$("#sidebar").append(icon_div);
		$("#sidebar").append(summary_div);

		$("#sidebar").append("<div id='sidebar_alerts'></div>");
		$("#sidebar").append("<hr />");
	
		var summarydiv = $("<div />",{class:"sidebar_summary_container",id:"summary_div_container"});
		$("#sidebar").append("<div class='sidebar_update_headline' style='margin-bottom: 15px'>Notification history</div>");
		summarydiv.append("<div class='sidebar_notification_summary' id='sidebar_notification_history'>No notifications</div>");
		$("#sidebar").append(summarydiv);
	}
	
	if(thing_data.history!=undefined) {
		if(thing_data.history.length>0) {
			//$("#sidebar_notification_history").hide();
			$("#sidebar_notification_history").empty();
			$(".note_history").remove();
			for(var i=thing_data.history.length-1;i>=0;i--) {
				var note_div = $("<div />",{"class":"note_history"});
				if((thing_data.history.length-i) % 2 == 1) {
					note_div.css({"background-color":"var(--heredarkestgrey)"});
				}
				note_div.html(thing_data.history[i]);
				$("#sidebar_notification_history").append(note_div);
			}
		}
		else {
			$("#sidebar_notification_history").show();
			$(".note_history").remove();
		}
	}


	// Check if it has a geofence defined. If so, we'll show the last geofence triggered.
	
	var geofence = thing_data.geofence;
	if(geofence=="none") {
		geofence="";
	}
	$("#last").html(geofence);

	//This is true if the device has registered an alert.
	if(thing_data.alert!==false) {
		var alert_div = $("<div />",{"class":"sidebar_alert","text":"Attention needed"});
		var alert_fire = function() { tracker_alert_fire(thing_data.alert) };
		alert_div.on("click",alert_fire);
		$("#sidebar_alerts").append(alert_div);
	}

	//This is true if the device has a notification for this time interval.
	$("#sidebar_alerts").empty();
	if(thing_data.updates[ltime].data["remarks"]!==undefined) {
		if(thing_data.updates[ltime].data["remarks"]!=="none") {
			var alert_div;
			if(alerts[thing_data.updates[ltime].data["remarks"]].alert!==undefined) {
				alert_div = $("<div />",{"class":"sidebar_alert","text":"Attention needed"});
			}
			else {
				alert_div = $("<div />",{"class":"sidebar_notification","text":"Notification"});
			}
			var notification_fire = function() { tracker_alert_fire(thing_data.updates[ltime].data["remarks"]);}
			alert_div.on("click",notification_fire);
			$("#sidebar_alerts").append(alert_div);
		}
	}

	if(active_tracker=="car9") {
		/**
		 * 
		 * SAP NOW HACK
		 * 
		 * Managing the route trace options for showing route-matching.
		 */
		if(pda_active==false) {
			$("#sidebar").append("<hr />");
			var pddiv = $("<div />",{"class":"sidebar_update_headline","text":"Post-drive analytics"});
			$(pddiv).css({"margin-bottom":"15px"});
			var pdcontainer = $("<div />");
			$(pdcontainer).css({"padding":"15px","height":"44px"});
			var stdiv = $("<div />",{"class":"bottom_bar_switch","id":"show_trace_div","text":"Show trace"});
			var spdiv = $("<div />",{"class":"bottom_bar_switch","id":"show_plan_div","text":"Show plan"});
			var rmdiv = $("<div />",{"class":"bottom_bar_switch","id":"routematch_div","text":"Route match"});
			$(stdiv).on("click",function() { tracker_data_sidebar_routematch({mode:"trace"})});
			$(rmdiv).on("click",function() { tracker_data_sidebar_routematch({mode:"match"})});
			$(spdiv).on("click",function() { tracker_data_sidebar_routematch({mode:"plan"})});
			$(stdiv).css({"float":"left","margin-bottom":"15px"});
			$(spdiv).css({"float":"left","margin-bottom":"15px"});
			$(rmdiv).css({"float":"left","margin-bottom":"15px"});
			$(rmdiv).css({"display":"none"});
			$(pdcontainer).append(stdiv);
			$(pdcontainer).append(rmdiv);
			$(pdcontainer).append(spdiv);
			$("#sidebar").append(pddiv);
			$("#sidebar").append(pdcontainer);
			var rmopts_header = $("<hr />",{"id":"rmopts_header"});
			$(rmopts_header).css({"display":"none"});
			var rdcontainer = $("<div />",{"id":"rmopts_container"});
			$(rdcontainer).css({"padding":"15px","display":"none"});
			var trafficdiv = $("<div />",{"class":"bottom_bar_switch","id":"show_traffic_div","text":"Show traffic"});
			var speeddiv = $("<div />",{"class":"bottom_bar_switch","id":"show_speed_div","text":"Show speed"});
			$(trafficdiv).on("click",function() { tracker_data_sidebar_routematch({mode:"traffic"})});
			$(speeddiv).on("click",function() { tracker_data_sidebar_routematch({mode:"speed"})});
			$(trafficdiv).css({"float":"left","margin-bottom":"15px"});
			$(speeddiv).css({"float":"left","margin-bottom":"15px"});
			$(rdcontainer).append(trafficdiv);
			$(rdcontainer).append(speeddiv);
			$("#sidebar").append(rmopts_header);
			$("#sidebar").append(rdcontainer);
			pda_active = true;
			pda_obj = new ufo_route({plan:"car9_plan",actual:"car9_actual",trace:"car9_actual_trace",adjusted:"car9_actual_adjusted"});
		}
	};

	/*
	
	Everything below is actually updating the __bottom__ bar
	
	*/
	var date_string = $("<div />",{"class":"bottom_bar_record"});
	date_string.append(record_id_string);
	date_string.append("<br />");
	date_string.append(date_normal({"unixtime":time}));
	$("#bottom_bar_header").append($("<div />",{"class":"bottom_bar_title","text":thing_data.name}));;
	$("#bottom_bar_header").append($("<div />",{"class":"bottom_bar_subtext","text":position_string}));;
	$("#bottom_bar_header").append(date_string);
	
	var tracker_has_context_data = false; //because the selected tracker might not always have data selected from the map context. It should but might not always.
	var tracker_refrigerated = false;

	if(thing_data.notification!=false) {
		data_el = $("<div />",{"class":"bottom_bar_update"});
		data_title = "<div class='bottom_bar_update_title'>Last update: </div>";
		data_val_el = $("<div />",{"class":"bottom_bar_update_value"});
		data_val_el.append(thing_data.notification);
		data_val_el.css({"color":"var(--herelightgrey)","font-style":"italic"});
		data_el.append(data_title);
		data_el.append(data_val_el);
		$("#bottom_bar_data").append(data_el);
	}

	for(var d in thing_data.data) {
		data_el = $("<div />",{"class":"bottom_bar_update"});
		data_id = thing_data.data[d];
		if(data_id!="remarks") {
			if(data_id==current_map_context || (current_map_context==="temperature" && data_id==="refrigerated")) {
				tracker_has_context_data = true;
				if(data_id==="refrigerated") {
					tracker_refrigerated = true;
				}
			}
			if(expanded_summary==true || dataclasses[data_id].highpriority==true) {
				data_title = "<div class='bottom_bar_update_title'>"+dataclasses[data_id].name+": </div>";
				data_unit = dataclasses[data_id].metric;
				data_value = thing_data.updates[ltime].data[data_id];
				data_el.append(data_title);
				data_limit = tracker_data_limit(data_value,data_id,true);
				data_val_el = $("<div class='bottom_bar_update_value'>"+data_value+" " +data_unit+"</div>");
				if(data_limit!="#ffffff") {
					data_val_el.css({color:data_limit});
				}
				data_el.append(data_val_el);
				$("#bottom_bar_data").append(data_el);
			}
		}
	}

	if(ltime<=1) {
		$("#time_change_later").css({backgroundImage:"url('./images/icon_time_late_grey.png')"});
	}
	else {
		$("#time_change_later").css({backgroundImage:"url('./images/icon_time_late_black.png')"});
	}
	if(ltime>=thing_data.totalsteps) {
		$("#time_change_earlier").css({backgroundImage:"url('./images/icon_time_early_grey.png')"});
	}
	else {
		$("#time_change_earlier").css({backgroundImage:"url('./images/icon_time_early_black.png')"});
	}
	
	if(expanded_summary==true) {
		$("#bottom_bar_data").append($("<hr />"));
		var sum_titles = ["Position source","Position accuracy","Connectivity"];
		var sum_data = [pos_sources[pos_s_id%5],pos_acc,pos_conn];

		for(var i=0;i<3;i++) {
			data_el = $("<div />",{"class":"bottom_bar_update"});
			data_title = "<div class='bottom_bar_update_title'>"+sum_titles[i]+": </div>";
			data_val_el = $("<div class='bottom_bar_update_value'>"+sum_data[i]+"</div>");

			data_el.append(data_title);
			data_el.append(data_val_el);
			$("#bottom_bar_data").append(data_el);
		}
	}
	

	

	/*
		We append the SVG for the data graph IF there's a context set and it's not "battery" because who cares about battery life?
	*/
	
	if(current_map_context!="battery" && tracker_has_context_data==true) {
		tracker_graph_cycle(true);
		if(tracker_refrigerated===true && current_map_context==="temperature") {
			tracker_graph_data(id,"refrigerated");
		}
		else {
			tracker_graph_data(id,current_map_context);
		}
	}
	else {
		tracker_graph_cycle(false);
	}
	
	//if(expanded_summary==true) { 
	//	tracker_stages_graph_data({"t":id,"caller":"tracker_data_sidebar"});
	//}
}

function tracker_draw_trace(params) {
	var fname = "tracker_draw_trace";
	var id = params.id;
	var caller = params.caller;
	var redraw = params.redraw;
	if(caller!=undefined) {
		call_log(fname,caller);
	}
	tcx.clearRect(0,0,tcv.width,tcv.height);
	trace_points = [[0,0]];
	trace_params = [];
	if(id==false) {
		return;
	}
	if(id==pda_vehicle && (pda_mode!="" || pda_path_mode!="")) {
		// If this is true, we might need to draw a routematch trace instead of a normal trace.

		if(pda_path_mode=="") {
			return;
		}
		else {
			tracker_draw_pda_path();
			if(pda_mode!="") { return; }
		}
	}

	trace_params = [id,parseFloat(map_tile_offset_x),parseFloat(map_tile_offset_y)];
	tcx.beginPath();
	tcx.lineWidth = 3;
	tcx.lineJoin="round";
	tcx.strokeStyle = "#3f59a7";
	//return;
	var c1,c2,tc1,tc2,dx,dy,tx,ty;
	var pos_index = 1;
	var pos = trackers[id].updates[1];
	//var indices = Object.keys(trackers[id].updates);
	var m = 78850*360/Math.pow(2,map_zlevel)/512;


	//var delta_y = origin[0]-normalized_origin[0];
	//var delta_x = origin[1]-normalized_origin[1];

	while(pos_index<trackers[id].totalsteps) {
		c1 = pos.position;
		pos = trackers[id].updates[pos_index+1];
		pos_index++;
		tc1 = get_normalized_coord(c1);
		dx = tc1[1]-normalized_origin[1];
		dy = tc1[0]-normalized_origin[0];
		tx = (mcx)+(dx*512);
		ty = (1024)+(dy*512);
		trace_points.push([tx,ty]);
		tcx.lineTo(tx,ty);

	}
	tcx.stroke();
}

function tracker_draw_pda_path() {
/**
 * 
 * Another SAP NOW hack. This will draw one or more routelines.
 */
	if(pda_path_mode=="plan"||pda_path_mode=="plan_adjusted"||pda_path_mode=="plan_traffic"||pda_path_mode=="plan_speed") {
		var path = rm_paths[pda_obj.plan];
		tcx.beginPath();
		tcx.lineWidth = 2;
		tcx.lineJoin = "round";
		tcx.strokeStyle = "#7dbae4";
		tcx.setLineDash([5,2]);
		var tc1,dx,dy;
		for(var i=0;i<path.length;i++) {
			tc1 = get_normalized_coord(path[i]);
			dx = (mcx) + ((tc1[1]-normalized_origin[1])*512);
			dy = (1024) + ((tc1[0]-normalized_origin[0])*512);
			tcx.lineTo(dx,dy);
		}
		tcx.stroke();
		tcx.setLineDash([]);
	}
	if(pda_path_mode=="adjusted"||pda_path_mode=="speed"||pda_path_mode=="traffic"||pda_path_mode=="plan_adjusted"||pda_path_mode=="plan_traffic"||pda_path_mode=="plan_speed") {
		var path = rm_paths[pda_obj.actual];
		
		tcx.lineWidth = 3;
		tcx.lineJoin = "round";
		tcx.strokeStyle = "#3f59a7";
		var tc1,dx,dy;
		if(pda_path_mode=="traffic"||pda_path_mode=="plan_traffic") {
			tcx.lineWidth = 4;
			var sequence = [
				[0,20,"#06b87c"],
				[19,40,"#fab800"],
				[39,50,"#c41c33"],
				[49,60,"#fab800"],
				[59,90,"#06b87c"],
				[89,104,"#fab800"],
				[103,130,"#3f59a7"],
				[129,150,"#fab800"],
				[149,160,"#c41c33"],
				[159,200,"#fab800"],
				[199,240,"#c41c33"],
				[239,260,"#fab800"],
				[259,340,"#06b87c"],
				[339,370,"#fab800"],
				[369,380,"#c41c33"],
				[379,416,"#fab800"],
				[415,475,"#c41c33"],
				[474,540,"#fab800"],
				[539,600,"#06b87c"],
				[599,660,"#fab800"],
				[659,700,"#c41c33"],
				[699,730,"#fab800"],
				[729,754,"#c41c33"],
				[753,780,"#fab800"],
				[779,792,"#c41c33"],
				[791,819,"#fab800"],
				[818,852,"#06b87c"],
				[851,875,"#fab800"],
				[874,891,"#06b87c"],
				[890,910,"#fab800"],
				[909,path.length,"#06b87c"]
			];
		}
		else if(pda_path_mode=="speed"||pda_path_mode=="plan_speed") {
			tcx.lineWidth = 4;
			var sequence = [
				[0,58,"#06b87c"],
				[57,74,"#fab800"],
				[73,76,"#c41c33"],
				[75,81,"#fab800"],
				[80,270,"#06b87c"],
				[269,281,"#fab800"],
				[280,549,"#06b87c"],
				[548,568,"#fab800"],
				[567,569,"#c41c33"],
				[568,577,"#fab800"],
				[576,581,"#c41c33"],
				[580,600,"#fab800"],
				[599,830,"#06b87c"],
				[829,841,"#fab800"],
				[840,846,"#c41c33"],
				[845,851,"#fab800"],
				[850,853,"#c41c33"],
				[852,860,"#fab800"],
				[859,861,"#c41c33"],
				[860,864,"#fab800"],
				[863,866,"#c41c33"],
				[865,888,"#fab800"],
				[887,path.length,"#06b87c"]
			];
		}
		else {
			var sequence = [[0,path.length,"#3f59a7"]];
		}
		var tris = [];
		for(var i=0;i<sequence.length;i++) {
			tcx.strokeStyle = sequence[i][2];
			tcx.beginPath();
			for(var j=sequence[i][0];j<sequence[i][1];j++) {
				tc1 = get_normalized_coord(path[j]);
				dx = (mcx) + ((tc1[1]-normalized_origin[1])*512);
				dy = (1024) + ((tc1[0]-normalized_origin[0])*512);
				if((j==sequence[i][0] || j==sequence[i][1]-1) && (pda_path_mode=="speed" || pda_path_mode=="plan_speed") && sequence[i][2]=="#c41c33") {
					tris.push([dx,dy]);
				}
				tcx.lineTo(dx,dy);
			}
			tcx.stroke();
		}
		for(var i=0;i<tris.length/2;i++) {
			var dx = (tris[i*2][0] + tris[(i*2)+1][0])/2;
			var dy = (tris[i*2][1] + tris[(i*2)+1][1])/2;
			tcx.beginPath();
			tcx.lineWidth = 5;
			tcx.strokeStyle = "#fff";
			tcx.moveTo(dx-9,dy);
			tcx.lineTo(dx+9,dy);
			tcx.lineTo(dx,dy-16);
			tcx.lineTo(dx-9,dy);
			tcx.stroke();
			tcx.fillStyle = "#c41c33";
			tcx.fill();
			tcx.fillStyle = "#fff";
			tcx.font = "12px Arial bold";
			tcx.fillText("!",dx-1.5,dy-2);
		}
	}
}

function tracker_geofence_add_all(params) {
	var fname = "tracker_geofence_add_all";
	var init = params.init;
	var caller = params.caller;

	if(caller!=undefined) {
		call_log(fname,caller);
	}
	geofence_origins = {};
	if(init==undefined) { init = false; }
	if(init==true) {
		$(".geofence").remove();
	}
	for(var i=0;i<geofences.length;i++) {
		geofence_origins[i] = tracker_geofence_add({"id":i,"init":init,"caller":caller});
	}
	
}

function tracker_geofence_add(params) {
	
	//var geofence = document.createElementNS("http://www.w3.org/2000/svg","circle");
	//geofence.setAttribute("class","geofence");
	var fname = "tracker_geofence_add";
	var id = params.id;
	var caller = params.caller;
	var init = params.init;

	if(caller!=undefined) {
		call_log(fname,caller);
	}
	var geofence;
	var gpos = get_normalized_coord(geofences[id].position);
	var gx = (gpos[1]-normalized_origin[1]);
	var gy = (gpos[0]-normalized_origin[0]);
	var gr = geofences[id].radius;
	gr = (gr/(360/(Math.pow(2,map_zlevel)))) * 512;
	var adj_x = mcx+(gx*512);
	var adj_y = 1024+(gy*512);

	if(init==undefined) { init = false; }

	if(init==true) {
		geofence = $("<div />",{"class":"geofence","id":"geofence_"+id});
		geofence.css({"left":adj_x-gr,"top":adj_y-gr,"width":2*gr,"height":2*gr,"border-radius":gr});
		$("#map_canvas").append(geofence);
	}
	else {
		geofence = $("#geofence_"+id);
		geofence.css({"left":adj_x-gr,"top":adj_y-gr,"width":2*gr,"height":2*gr,"border-radius":gr});
	}	
	
	return [adj_x,adj_y];

}

function tracker_geofence_check(tid,step,gid) {
	//console.log(tid,step,gid);
	//var lstep = tracker_steps[tid];
	var trackerpos = trackers[tid].updates[step].position;
	var tracker_valid_for_geofence = false;
	for(var i in geofences[gid].trackers) {
		// Checking to see if the geofence is associated to this tracker.
		// A geofence can also be "global"
		//console.log(tid,geofences[gid].trackers[i]);
		if(geofences[gid].trackers[i]==tid || geofences[gid].trackers[i]=="global") {
			tracker_valid_for_geofence=true;
		}
	}
	if(tracker_valid_for_geofence===true) {
		trackerpos = get_normalized_coord([trackerpos[0],trackerpos[1]]);
		var geofencepos = get_normalized_coord(geofences[gid].position);
		var georad = .5 * parseFloat($("#geofence_"+gid).css("width"));
		
		var tx = ((trackerpos[1]-normalized_origin[1])*512);
		var ty = ((trackerpos[0]-normalized_origin[0])*512);
		var gx = ((geofencepos[1]-normalized_origin[1])*512);
		var gy = ((geofencepos[0]-normalized_origin[0])*512);
		

		//var tx = tracker_origins[tid][0];
		//var ty = tracker_origins[tid][1];
		//var gx = geofence_origins[gid][0];
		//var gy = geofence_origins[gid][1];

		var dist = Math.sqrt((Math.pow((tx-gx),2))+(Math.pow((ty-gy),2)));
		
		//if(tid=="car4" && gid=="11") {
		//	console.log(step,dist,georad);
			//console.log(geofences[gid].name);
			//console.log(tx,ty,gx,gy);
			//console.log(trackerpos,geofencepos);
		//	}
		if(dist<georad) {
			return true;
		}
		else {
			return false;
		}
	}
	else {
		return false;
	}
}

function tracker_geofence_check_all(params) {
	var id = params.id;
	var complete = params.complete;
	var past,present,future;
	var tvalid = [];
	trackers[id].geofence = "none";
	var interval = parseInt(trackers[id].updateinterval);
	var lsmin = 0;
	var lsmax = 0;
	var lstep = 0;
	trackers[id].history = [];
	if(complete==false) {
		lsmin = tracker_steps[id];
		lsmax = tracker_steps[id];
	}
	else {
		lsmin = parseInt(trackers[id].totalsteps) - 1;
		lsmax = tracker_steps[id];
	}
	for(var s=lsmin;s>=lsmax;s--) {
		lstep = s;
		for(var i=0;i<geofences.length;i++) {
			if(lstep==-1) {
				return;
			}
			present = tracker_geofence_check(id,lstep,i);
			//if(id=="car4") { console.log("present",i,present); }
			if(lstep>1) {
				future = tracker_geofence_check(id,(lstep-1),i);
				//if(id=="car4") { console.log("future",i,future); }
				if(trackers[id].totalsteps>lstep) {
					past = tracker_geofence_check(id,(lstep+1),i);
					//if(id=="car4") { console.log("past",i,past); }
				}
				else {
					console.log("test")
					past = present;
				}
				
				/*
				
				tdiff is a variable that is set when the time-changing command is called
				
				If tdiff is -1, then the time has been changed to closer to the future (ie normal playback)
				If tdiff is 1, then the time is being changed to closer in the past (ie going back further)
				
				Cases:
				If tdiff is -1, present is true and past is false, then the tracker has just ENTERED the geofence—ie it wasn't there before and is now
				If tdiff is -1, present is true and future is false, then the tracker is about to LEAVE the geofence
				If tdiff is -1, present is false and past is true, then the tracker has just LEFT the geofence
				If tdiff is -1, present is false and future is true, then the tracker is about to ENTER a geofence
				If tdiff is 1, present is true and past is false, then the tracker has just ENTERED the geofence
				
				Show alert:
				LEAVING when tdiff -1, present 0, past 1
				LEAVING when tdiff 1, present 0, future 1
				ENTERING when tdiff -1, present 1, past 0
				ENTERING when tdiff 1, present 0, future 1
				
				nothing:
				tdiff -1, present 1, future 1
				tdiff -1, present 1, 
				
				*/
				if(present==true && lstep==tracker_steps[id]) {
					tvalid.push(geofences[i].name);
				}
				
				if(present==true && past==false) {
					//console.log(id + " past was different.");
					if(lstep==tracker_steps[id]) {
						tracker_geofence_flash(i);
					}
					console.log(id,"entered",geofences[i].name);
					trackers[id].notification = "Entered '"+geofences[i].name+"'";
					trackers[id].history.push("<span>"+alive_prettydate(trackers[id].updates[s].time) + "</span>:<br /> Entered <span>'"+geofences[i].name+"'</span>");
				}
				else if (future==false && present==false && past==true) {
					if(lstep==tracker_steps[id]) {
						tracker_geofence_flash(i);
					}
					console.log(id,"left",geofences[i].name);
					trackers[id].notification = "Left '"+geofences[i].name+"'";
					trackers[id].history.push("<span>"+alive_prettydate(trackers[id].updates[s].time) + "</span>:<br /> Left <span>'"+geofences[i].name+"'</span>");
				}
				else {
					//trackers[id].notification = false;
				}
			}
			else {
				if(present==true && lstep==tracker_steps[id]) {
					tvalid.push(geofences[i].name);
				}
			}
		}
	}
	//console.log(tvalid);
	if(tvalid.length>0) {
		var geofence_string = "";
		for(var i in tvalid) {
			geofence_string = geofence_string + tvalid[i];
			if(i<tvalid.length-1) {
				geofence_string = geofence_string + ", ";
			}
		}
		trackers[id].geofence = geofence_string;
	}
}

function tracker_geofence_flash(id) {
	if(geofences[id].active==undefined) {
		geofences[id].active=false;
	}
	if(geofences[id].active==true) {
		return;
	}
	else {
		geofences[id].active=true;
		var switch_off = function() { geofences[id].active=false; };
		var geoanimation = [
			{ e: $("#geofence_"+id),p:{"background-color":["rgba(6,184,124,.5)","rgba(6,184,124,.1)"],"border-width":[3,1]},o:{duration:(150),queue:false}},
			{ e: $("#geofence_"+id),p:{"background-color":["rgba(6,184,124,.1)","rgba(6,184,124,.5)"],"border-width":[1,3]},o:{duration:(150),queue:false,complete:switch_off}},
		]
		$.Velocity.RunSequence(geoanimation);
	}

	//$("#geofence_"+id).velocity({fillOpacity:[0.75,0.25],strokeWidth:[3,1]},{duration:150}).velocity("reverse");
	
}

function tracker_get_steps_at_time(params) {

	/*
	 * This function takes a given time index (unix time) and determines which step this represents for each tracker
	 * It then writes to tracker_steps, an object consisting of the key-pairs
	 * 
	 * tracker_name:step
	 * 
	 * If the specified time index is more recent than the last data retrieved by the tracker, it returns step 1.
	 * 
	 * If the specified time index is older than the oldest data provided by the tracker, it returns -1
	 */

	var fname = "tracker_get_steps_at_time";
	var time_index;
	if(params.index!=undefined) {
		time_index = parseInt(params.index);
	}
	else {
		time_index = time;
	}
	var caller = params.caller;
	var context_trackers = Object.keys(trackers);
	if(caller!=undefined) {
		call_log(fname,caller);
	}
	var t_data,t_start,t_interval,t_step,t_delta,t_name;
	for(var i=0;i<context_trackers.length;i++) {
		t_data = trackers[context_trackers[i]];
		t_start = parseInt(t_data.lastupdate);
		t_interval = t_data.updateinterval;
		t_delta = 0;
		t_step = 0;
		t_name = t_data.name;
		if(time_index>t_start) {
			t_step = 1;
		}
		else {
			t_delta = t_start-time_index;
			
			t_step = 1+Math.round(t_delta/(t_interval*60))
			//console.log(t_delta,t_start,time_index,t_step);
		}
		if(t_step > t_data.totalsteps) {
			t_step = t_data.totalsteps-1; // SAP NOW HACK????
		}
		tracker_steps[context_trackers[i]] = t_step;
		//console.log(t_step);
	}

}

function tracker_graph_cycle(active) {
	var gheight = parseInt($("#bottom_bar_graphic").css("height"));
	var dwidth = parseInt($("#bottom_bar").css("width"));
	var openanimation;
	if(active==false) {
		if(expanded_summary==true) {
			if(gheight!=0 && dwidth!=400) {
				openanimation = [
					{ e: $("#bottom_bar_graphic"),p:{height:[0,324]},o:{duration:(150),queue:false}},
					{ e: $("#bottom_bar"),p:{width:[400,800],"margin-left":[-200,-400],queue:false}}
				]
				$.Velocity.RunSequence(openanimation);
			}
		}
		graph_active = false;
	}
	else {
		if(expanded_summary==true) {
			if(gheight==0 && dwidth==400) {
				openanimation = [
					{ e: $("#bottom_bar"),p:{width:[800,400],"margin-left":[-400,-200],queue:false}},
					{ e: $("#bottom_bar_graphic"),p:{height:[324,0]},o:{duration:(350),queue:false}}
				]
				$.Velocity.RunSequence(openanimation);
			}
		}
		graph_active = true;
	}
}

function tracker_graph_data(t_id,dataclass) {
	
	/*

	Handles everything for graphing a particular set of data for a particular tracker
	Identifies the appropriate scale
	Pushes data to the sidebar in the data graph svg (id "datagraph")

	*/
	
	$("#bottom_bar_graphic").append("<div class='graph_title'>"+dataclasses[dataclass].graph_title+"</div>");
	//var svggraph = $("<svg />",{"id":"datagraph","class":"datagraph"});
	//svggraph.css({"width":graph_width});
	$("#bottom_bar_graphic").append("<svg id='datagraph' class='datagraph'></svg>");

	

	var svg_width = graph_width;
	var tdata = trackers[t_id];
	var interval = parseInt(trackers[t_id].updateinterval);
	var d_pts = [] //i.e. datapoints for this tracker
	var max = 0;
	var min = 0;
	var pvalue = 0.0;
	for(var i in tdata.updates) {
		pvalue = tdata.updates[i].data[dataclass];
		if(pvalue>max) {
			max = pvalue;
		}
		if(pvalue<min) {
			min = pvalue;
		}
		d_pts.push(pvalue);
		
	}
	var x1,x2,y1,y2,d_range,d_floor,line_seg,line_title,text_val,seg_g,maxdiff,mindiff;
	if(max>dataclasses[dataclass].max || min<dataclasses[dataclass].min ) {
		maxdiff = 1+Math.ceil(max/dataclasses[dataclass].max);
		mindiff = 1+Math.ceil(min/dataclasses[dataclass].min);
		//console.log(maxdiff,mindiff);
		var adj_max = maxdiff*parseFloat(dataclasses[dataclass].max);
		var adj_min = mindiff*parseFloat(dataclasses[dataclass].min);
		d_range = adj_max-adj_min;
		d_floor = adj_min;
	}
	else {
		d_range = dataclasses[dataclass].max-dataclasses[dataclass].min;
		d_floor = dataclasses[dataclass].min;
	}

	var rlimit = 1;
	if(dataclass=="ozone") { rlimit = 3; }
	
	if(trackers[t_id].graphs[dataclass]!==undefined) {
		seg_g = trackers[t_id].graphs[dataclass];
	}
	else {
		seg_g = document.createElementNS("http://www.w3.org/2000/svg","g");

		for(var i=1;i<4;i++) {
			line_seg = document.createElementNS("http://www.w3.org/2000/svg","line");
			line_title = document.createElementNS("http://www.w3.org/2000/svg","text");
			x1 = 0;
			x2 = svg_width;
			y1 = i*75;
			y2 = i*75;
			line_seg.setAttribute("x1",x1);
			line_seg.setAttribute("x2",x2);
			line_seg.setAttribute("y1",y1);
			line_seg.setAttribute("y2",y2);
			line_seg.setAttribute("stroke","#6a6d74");
			line_seg.setAttribute("stroke-width",1);
			line_title.setAttribute("x",2);
			line_title.setAttribute("y",(y1-3));
			line_title.setAttribute("fill","#6a6d74");
			line_title.setAttribute("font-family","Fira Sans");
			text_val = d_floor + (d_range * (((4-i)*75)/300));
			text_val = text_val.toFixed(rlimit);
			line_title.appendChild(document.createTextNode(text_val));
			$(seg_g).append(line_seg);
			$(seg_g).append(line_title);	
		}
		
		line_seg = document.createElementNS("http://www.w3.org/2000/svg","polyline");
		var points = "";
		for(var i=0;i<d_pts.length;i++) {
			x1 = (i/(d_pts.length-1)) * svg_width;
			y1 = (300*(d_floor/d_range)+300)-((d_pts[i]/(d_range))*300);
			points+=x1+","+y1+" "
/*
			x2 = ((i+1)/(d_pts.length-1)) * svg_width;
			y2 = 300-((d_pts[(i+1)]/(d_range))*300);
			line_seg = document.createElementNS("http://www.w3.org/2000/svg","line");
			line_seg.setAttribute("x1",x1);
			line_seg.setAttribute("x2",x2);
			line_seg.setAttribute("y1",y1+300*(d_floor/d_range));
			line_seg.setAttribute("y2",y2+300*(d_floor/d_range));
			line_seg.setAttribute("stroke","#48dad0");
			line_seg.setAttribute("stroke-width",2);
			$(seg_g).append(line_seg);
*/

		}
		line_seg.setAttribute("points",points);
		line_seg.setAttribute("stroke","#48dad0");
		line_seg.setAttribute("stroke-width",2);
		line_seg.setAttribute("fill","none");
		$(seg_g).append(line_seg);
		if(trackers[t_id].graphs===undefined) {
			trackers[t_id].graphs = {dataclass:seg_g};
		}
		else {
			trackers[t_id].graphs[dataclass] = seg_g;
		}
	}

	line_seg = document.createElementNS("http://www.w3.org/2000/svg","line");
	x1 = (((trackers[t_id].lastupdate-time)/(interval*60))/(d_pts.length-1)) * svg_width;
	line_seg.setAttribute("stroke","#cdced0");
	line_seg.setAttribute("stroke-width",1);
	line_seg.setAttribute("x1",x1);
	line_seg.setAttribute("x1",x1);
	line_seg.setAttribute("x2",x1);
	line_seg.setAttribute("y1",0);
	line_seg.setAttribute("y2",320);
	$("#datagraph").append(seg_g);
	$("#datagraph").append(line_seg);
	$("#datagraph").on("click",function(e) { tracker_graph_time_select(e)});
	$("#datagraph").css({"width":graph_width});
//	console.log(d_pts);
}

function tracker_graph_time_select(e) {
	var fname = "tracker_graph_time_select";
	var percdone = e.offsetX/graph_width;
	var ntimeindex = Math.round(percdone * trackers[active_tracker].totalsteps)
	time_set({"index":ntimeindex,"recenter":true,"caller":fname});
	map_zoom({"level":9,"caller":fname});
}

function tracker_position(id) {
	var marker = $("#marker_"+id);
	var icon = $(marker).children(".marker_icon");
	var geofence_check_active_tracker = false;
	marker.show();
	var lstep = tracker_steps[id];
	if(lstep==-1 || lstep==undefined) {
		return;
	}
	var coord = trackers[id].updates[lstep].position;
	/*
	
	
	old block to make this resemble actual tracking.here.com more
	if(active_tracker===id) {
		var coord = trackers[id].updates[1].position;
	}
	else {
		var coord = trackers[id].updates[time].position;
	}*/

	
	var origin = get_normalized_coord(coord);
	var delta_y = origin[0]-normalized_origin[0];
	var delta_x = origin[1]-normalized_origin[1];
	var pos_offset = 18; //(ie half the width of the tracker icon so it can be accurately placed)
	//console.log(map_tile_offset_x);
	if(current_map_context!="battery") {
		/*
		This is true when the map filter is set to for example temperature
		In this case we color-code the icons based on their current data
		*/
		var context_params = dataclasses[current_map_context];
		var thing_status = trackers[id].updates[lstep].data[current_map_context];
		var data_limit;
		//console.log(thing_status);
		if(thing_status===undefined && current_map_context==="temperature") {
			thing_status = trackers[id].updates[lstep].data["refrigerated"];
			if(thing_status!=undefined) {
				data_limit = tracker_data_limit(thing_status,"refrigerated",true);
			}
			else {
				data_limit = tracker_data_limit(thing_status,current_map_context,true);
			}
		}
		else { 
			data_limit = tracker_data_limit(thing_status,current_map_context,true);
		}
		icon.css({backgroundColor:data_limit});
	}
	if(active_tracker==id) {
		geofence_check_active_tracker = true;
		pos_offset = 28;
		icon.css({width:"56px",height:"56px",backgroundSize:"56px",borderRadius:"56px",zIndex:"150"});
		marker.css({zIndex:"150"});
		//$("#story_caption").css({left:456+map_tile_offset_x-pos_offset+(delta_x*512)});
		//$("#story_caption").css({bottom: sidebar_height-(map_tile_offset_y-pos_offset+(delta_y*512))});
	}
	else {
		icon.css({width:"36px",height:"36px",backgroundSize:"36px",borderRadius:"36px",zIndex:"50"});
		marker.css({zIndex:"50"});
	}
	if(trackers[id].alert!==false) {
		icon.css({backgroundColor:"#c41c33"});
	}
	var pleft = map_tile_offset_x+(delta_x*512);
	var ptop = map_tile_offset_y+(delta_y*512);
	tracker_origins[id] = [pleft,ptop];
	marker.css({"left":pleft-pos_offset,"top":ptop-pos_offset});
	trackers[id].notification = false;
	if(trackers[id].mobile!==undefined && map_last_call!="pda") {
		tracker_geofence_check_all({"id":id,"complete":geofence_check_active_tracker});
	}
}

function tracker_position_all(params) {
	/*
		Adds all of the trackers for a specified context...
		At some point context will be an associative array listing all of the trackers used there
		But we're not to that point yet so right now it just literally adds every tracker in this array.
	*/
	var fname = "tracker_position_all";
	var context = params.context;
	var caller = params.caller;
	var redraw = params.redraw;

	if(caller!=undefined) {
		call_log(fname,caller);
	}

	if(alive_data_mode=="asset" && alive_active_asset!="") {
		alive_asset_map(alive_active_asset);
		return;
	}
	else {
		$(".alive_gate_marker").remove();
		$(".alive_gate_marker_canvas").hide();
	}

	var context_trackers;
	if(current_map_context=="logistics") {
		alive_map({"caller":fname,"redraw":redraw});
		return;
	}

	if(use_trackers.length>1) {
		context_trackers = use_trackers;
	}
	else {
		context_trackers = Object.keys(trackers);
	}
	
	for(var i=0;i<context_trackers.length;i++) {
		var thing_data = trackers[context_trackers[i]];
		//console.log(context_trackers[i]);
		if(tracker_valid_for_context(context_trackers[i],current_map_context)===true) {
			if(tracker_steps[thing_data.name]!=-1) {
				tracker_position(context_trackers[i]);
			}
			else {
				console.log("no data at time");
			}
		}
	}
	if(active_tracker!=="") {
		if(pda_mode!="") {
			// This is to move the PDA route object if necessary.
			pda_obj.plot();
		}
		if(active_tracker!=trace_params[0]) {
			tracker_draw_trace({"id":active_tracker,"caller":fname});
		}
		else {
			if(map_tile_offset_x!=trace_params[1] || map_tile_offset_y!=trace_params[2]) {
				tracker_draw_trace({"id":active_tracker,"caller":fname});				
			}
		}
	}
}

function tracker_select(params) {
  /*
  Selects a given tracker from the map.
  
  If the tracker is already selected, it unselects it.
  */
	var fname = "tracker_select";
	var id = params.id;
	var suppress = params.suppress;
	var caller = params.caller;
	blocking_queue = true;
	if(caller!=undefined) {
		call_log(fname,caller);
	}

	if(suppress==undefined) {
		suppress = false;
	}

	if(lock_movement==true) { return; }
	if(active_tracker===id || id=="") {
		active_tracker = "";
		sidebar_id = "";
		pda_active = false;
		if(pda_obj!="" && pda_obj!=undefined) {
			pda_obj.unset();
			pda_obj = "";
		}
		pda_mode = "";
		pda_path_mode = "";
		tracker_draw_trace({"id":false,"caller":fname});;
		if(sidebar_active==true && id!==false) {
			cycle_sidebar({"caller":fname});
		}
		$("#bottom_bar").hide();
		$("#map_time_control").show();
		if(suppress==false) {
			map_zoom({"level":map_zlevel,"caller":fname});
		}
	}
	else {
		active_tracker = id;
		map_data_context_switch({"mode":"devices","caller":fname});
		$("#bottom_bar").show();
		$("#map_time_control").hide();
		if(suppress==false) {
			//map_zoom({"level":map_zlevel,"caller":fname});
		}
	}
	
}

function tracker_sidebar_bind_selector(id) {
	var fname = "tracker_sidebar_bind_selector";
	var tracker_selector = function() {tracker_select({"id":id,"caller":fname});}
	$("#tracker_selector_"+id).on("click",tracker_selector);
}

function tracker_sidebar_list_all(params) {
	
	/*
	
	Populates the sidebar with all of the relevant devices for a particular context
	So if a context is set, will return
	
	*/
	var fname = "tracker_sidebar_list_all";
	var caller = params.caller;
	if(caller!=undefined) {
		call_log(fname,caller);
	}
	
	if(active_tracker!="") {
		tracker_select({"id":false,"caller":fname});
	}
	map_zoom({"level":map_zlevel,"caller":fname});
	$("#sidebar").empty();
	
	var return_link = $("<div />",{"class":"sidebar_return"});
	return_link.css({marginBottom:32});
	return_link.append("<span>DEVICES</span>");
	$("#sidebar").append(return_link);
	
	var devices_all = $("<div />",{"class":"device_list"});
	
	var t_ids;
	if(use_trackers.length>1) {
		t_ids = use_trackers;
	}
	else {
		t_ids = Object.keys(trackers);
	}
	for(var i in t_ids) {
		if(tracker_valid_for_context(t_ids[i],current_map_context)===true) {
			var thing_data = trackers[t_ids[i]];
			var id = t_ids[i];
			var t_el = $("<div />",{"class":"sidebar_list_data","id":"tracker_selector_"+id});
			var t_icon = $("<div />",{"class":"sidebar_list_img"});
			t_icon.css({backgroundImage:"url('./images/"+thing_data.icon+".png')"});
			t_el.append(t_icon);
			t_el.append("<div class='sidebar_list_name'>"+thing_data.name+"</div>");
			t_el.append("<div class='sidebar_list_address'>"+thing_data.address+"</div>");
			if(i%2===0) {
				t_el.css({backgroundColor:"#2C313A"});
			}
			$(devices_all).append(t_el);
		}
		
	}
	$("#sidebar").append(devices_all);
	for(var i in t_ids) {
		var id = t_ids[i];
		tracker_sidebar_bind_selector(id);
	}
}

function tracker_stages_retrieve(t) {
	/*
	 * 
	 * Given a tracker, t, identifies all the gates it has gone through
	 * 
	 * Gates are defined in the "gates" section of "data.js"
	 * 
	 * If the tracker does not have any identified gates, returns false
	 * 
	 * Otherwise returns an array of the gates
	 * 
	 */
	
	var thing_data = trackers[t].updates;
	var interval = parseInt(trackers[t].updateinterval);
	var status;
	var last_status = "";
	var time_in_status = 0;
	var total_time = 0;
	var start_status_delay = 0.0;
	var end_status_delay = 0.0;
	var gates = {};
	var num_gates = 0;
	for(let u in thing_data) {
		let val = thing_data[u];
		status = val.data.shipstatus;
		if(status!=="Delivered") {
			if(status===last_status) {
				time_in_status++;
				end_status_delay = parseFloat(thing_data[u].data.delay);
			}
			else {
				if(num_gates!=0) {
					gates[num_gates] = {
						"status":last_status,
						"time":time_in_status,
						"intime":u-(time_in_status*interval),
						"outtime":u,
						"delay":(start_status_delay-end_status_delay).toFixed(1)
					};
				}
				total_time = total_time + time_in_status;
				last_status = status;
				time_in_status = 1;
				start_status_delay = parseFloat(thing_data[u].data.delay);
				num_gates++;
			}
		}
	}
	
	var max = interval*(Object.keys(thing_data).length);
	
	gates[num_gates] = {
		"status":last_status,
		"time":time_in_status,
		"intime":max-(time_in_status*interval),
		"outtime":max,
		"delay":(start_status_delay-end_status_delay).toFixed(1)
	};
	total_time = total_time + time_in_status;
	
	var return_gate_data = {
		"time":total_time,
		"count":num_gates,
		"gates":gates
	}
	
	if(num_gates>1) {
		return return_gate_data;
	}
	else {
		return false;
	}
}

function tracker_stages_delay_color(d) {
	//console.log(d);
	var delay = parseFloat(d);
	var color = "";
	//var ranges = [-45,-25,-10,30,99999];
	var ranges = [45,25,15,-10,-35,-45,-9000]
	var colors = ["#c41c33","#ec610e","#fab800","#06b87c","#ec610e","#c41c33","#c41c33"];
	var idx = 0;
	while(color=="") {
		
		if(delay>ranges[idx]) {
			color = colors[idx];
			//console.log(idx);
		}
		idx++;
		if(idx>ranges.length) {
			color = "#ffffff";
		}
	}
	return color;
}

function tracker_stages_graph_data(params) {
	var fname = "tracker_stages_graph_data";
	var graph_object;
	var t = params.t;
	var caller = params.caller;
	if(caller!=undefined) {
		call_log(fname,caller);
	}
	if(trackers[t].graphs["journey"]!==undefined) {
		if(expanded_summary==true) {
			graph_object = trackers[t].graphs["journey"];
			$("#graph_switcher").show();
		}
		else {
			$("#graph_switcher").hide();
			return;
		}
		if(stages_active==false) {
			return;
		}
	}
	else {
		if(trackers[t].updates[1].data["delay"]==undefined) {
			$("#graph_switcher").hide();
			return;
		}
		if(expanded_summary==true) {
			$("#graph_switcher").show();
		}
		else {
			$("#graph_switcher").hide();
			return;
		}
		if(stages_active==false) {
			return;
		}
		var alive_graph = $("<div />",{"class":"alive_graph"});
		var gate_data = tracker_stages_retrieve(t);
		var summary_div;
		var t_width = 0.0;
		var interval = parseInt(trackers[t].updateinterval);
		if(gate_data!=false) {
			var stages = gate_data.gates;
			var graph_width = parseFloat($("#bottom_bar").width()) - (0*parseInt(gate_data.count));
			var time_slices = gate_data.time;
			var g_time,g_div,g_type,g_class,g_color;
			for(let s in stages) {
				if(time>=stages[s].intime && time<stages[s].outtime) {
					g_class = "alive_graph_cell_active";
				}
				g_class = "alive_graph_cell";
				g_time = (stages[s].time/time_slices) * graph_width;
				g_div = $("<div />",{"class":g_class,"id":stages[s].intime+"_"+stages[s].outtime});
				/*
				
				Block to handle shading the delay cell based on the delay value

				*/
				g_color = tracker_stages_delay_color(stages[s].delay);
				
				//g_div.css({width:g_time,backgroundColor:stagekeycolors[stagekeys[stages[s].status]]});
				g_div.css({width:g_time,backgroundColor:g_color});
				summary_div = $("<div />",{"class":"alive_cell_summary"});
				summary_div.css({left:0-t_width});
				summary_div.append("<div class='bottom_bar_update'><div class='bottom_bar_update_title'>Status:</div><div class='bottom_bar_update_value'>"+stages[s].status+"</div></div>");
				summary_div.append("<div class='bottom_bar_update'><div class='bottom_bar_update_title'>Time:</div><div class='bottom_bar_update_value'>"+date_string_from_index(interval*stages[s].time)+"</div></div>");
				if(stages[s].delay<0) {
					summary_div.append("<div class='bottom_bar_update'><div class='bottom_bar_update_title'>Impact on ETA:</div><div class='bottom_bar_update_value'>Reduced delay "+Math.abs(stages[s].delay)+" minutes</div></div>");
				}
				else {
					summary_div.append("<div class='bottom_bar_update'><div class='bottom_bar_update_title'>Impact on ETA:</div><div class='bottom_bar_update_value'>Added "+stages[s].delay+" minute delay</div></div>");
				}
				g_div.append(summary_div);
				$(alive_graph).append(g_div);
				t_width = t_width + g_time;
				//console.log(stages[s].status);
			}
			var total_delay = trackers[t].updates[1].data.delay;
			var journey_time = gate_data.time;
			var journey_string = date_string_from_index(journey_time*interval);
			var delay_string = "";
			if(total_delay>0) {
				delay_string = Math.round(total_delay) + " minutes late";
			}
			else {
				delay_string = Math.round(total_delay) + " minutes early";
			}
			$(alive_graph).append("<div class='alive_spacer'></div>");
			summary_div = $("<div />",{"class":"alive_summary","id":"alive_summary"});
			summary_div.append("<div class='bottom_bar_update'><div class='bottom_bar_update_title'>Journey time:</div><div class='bottom_bar_update_value'>"+journey_string+"</div></div>");
			summary_div.append("<div class='bottom_bar_update'><div class='bottom_bar_update_title'>Arrived:</div><div class='bottom_bar_update_value'>"+delay_string+"</div></div>");
			$(alive_graph).append(summary_div);
			trackers[t].graphs["journey"] = alive_graph;
			graph_object = alive_graph;
		}
	}
	var graph_subs = graph_object.children(".alive_graph_cell");
	var timers = [];
	if(stages_active==true) {
		$("#bottom_bar_stages").empty();
	}
	graph_subs.each(function(idx,g_sub) {
		timers = g_sub.id.split("_");
		
		$(g_sub).off();
		$(g_sub).on("click",{arg1:(parseInt(timers[1])-trackers[t].updateinterval)},function(e) { time_set({"index":e.data.arg1,"recenter":true,"caller":fname}); map_zoom({"level":false,"caller":fname}); });

		if(time>=timers[0] && time<timers[1]) {
			$(g_sub).addClass("alive_graph_cell_active");
		}
		else {
			$(g_sub).removeClass("alive_graph_cell_active");	
		}
	})
	if(stages_active==true) {
		$("#bottom_bar_stages").append("<div class='graph_title'>Journey details:</div>");
		$("#bottom_bar_stages").append(graph_object);
	}
	else {
		$("#bottom_bar_stages").empty();
	}
}

function tracker_stages_view_cycle() {
	console.log("called tracker stages view cycle");
	var gheight = parseInt($("#bottom_bar_stages").css("height"));
	var dwidth = parseInt($("#bottom_bar").css("width"));
	var openanimation;
	if(stages_active==true) {
		stages_active = false;
		if(expanded_summary==true) {
			if(gheight!=0 && dwidth!=400) {
				if(graph_active==true) {
					openanimation = [
						{ e: $("#bottom_bar_stages"),p:{height:[0,134]},o:{duration:(50),queue:false}},
					]
					$.Velocity.RunSequence(openanimation);
				}
				else {
					openanimation = [
						{ e: $("#bottom_bar_stages"),p:{height:[0,134]},o:{duration:(50),queue:false}},
						{ e: $("#bottom_bar"),p:{width:[400,800],"margin-left":[-200,-400],queue:false}}
					]
					$.Velocity.RunSequence(openanimation);
				}
			}
		}
		$("#graph_switcher").text("Show Journey Details");

	}
	else {
		current_map_context = "delay";
		if(expanded_summary==true) {
			if(gheight==0 && dwidth==400) {
				openanimation = [
					{ e: $("#bottom_bar"),p:{width:[800,400],"margin-left":[-400,-200],queue:false}},
					{ e: $("#bottom_bar_stages"),p:{height:[134,0]},o:{duration:(150),queue:false}}
				]
				$.Velocity.RunSequence(openanimation);
			}
			else {
				openanimation = [
					{ e: $("#bottom_bar_stages"),p:{height:[134,0]},o:{duration:(150),queue:false}}
				]
				$.Velocity.RunSequence(openanimation);
			}
		}
		$("#graph_switcher").text("Hide Journey Details");
		stages_active = true;
	}
	tracker_data_sidebar({"id":active_tracker,"caller":"tracker_stages_view_cycle"});;
}

function tracker_summary_cycle(params) {
	var suppress = params.suppress;
	var caller = params.caller;
	var fname = "tracker_summary_cycle";

	if(caller!=undefined) {
		call_log(fname,caller);
	}
	var openanimation,w,h,d;
	if(suppress==undefined) { suppress= false; }
	if(graph_active==true || stages_active==true) {
		if(container_width<850) {
			w = container_width-(side_menu_width+30);
		}
		else {
			w = 800;
		}
		h = 324;
		d = 1;
	}
	else {
		w = 400;
		h = 0;
		d = 0;
	}

	if(expanded_summary==false) {
		var finish_summary_cycle = function() {
			$("#summary_switcher").text("Summary");
			expanded_summary = true;
			
			if(suppress==false) {
				o_horz = 5000;
				map_zoom({"level":map_zlevel,"caller":fname});
			}
			//else {
			//	tracker_data_sidebar({"id":active_tracker,"caller":"tracker_summary_cycle"});
			//}
		}
		openanimation = [
			{ e: $("#bottom_bar"),p:{width:[w,400],"margin-left":[(-1*w/2),-200]}},
			{ e: $("#bottom_bar_graphic"),p:{height:[h,0]},o:{duration:(d*150),complete:finish_summary_cycle}},
		]
	}
	else {
		var finish_summary_cycle = function() {
			$("#summary_switcher").text("Full details");
			expanded_summary = false;
			stages_active = false;
			
			if(suppress==false) {
				o_horz = 5000;
				map_zoom({"level":map_zlevel,"caller":fname});
			}
			//else {
			//	tracker_data_sidebar({"id":active_tracker,"caller":"tracker_summary_cycle"});
			//}
		}
		openanimation = [
			{ e: $("#bottom_bar_graphic"),p:{height:[0,h]},o:{duration:(d*350)}},
			{ e: $("#bottom_bar"),p:{width:[400,w],"margin-left":[-200,(-1*w/2)]},o:{queue:false,complete:finish_summary_cycle}},
		]
		if(stages_active==true) {
			$("#graph_switcher").text("Show Journey Details");
			openanimation.unshift({ e: $("#bottom_bar_stages"),p:{height:[0,134]},o:{duration:(d*100),queue:false}},);
		}
		
	}
	if(graph_active==true || stages_active==true) {
		$.Velocity.RunSequence(openanimation);
	}
	else {
		if(expanded_summary==true) {
			expanded_summary = false;
		}
		else {
			expanded_summary = true;
		}
		//tracker_data_sidebar({"id":active_tracker,"caller":"tracker_summary_cycle"});
	}
}

function tracker_valid_for_context(t,c) {
	/*
	
	Given tracker t and context c, determines whether
	the tracker has that context listed in its valid types
	Returns "true" if so
	Otherwise returns false
	
	*/
	var valid = false;
	
	var thing_data = trackers[t].data;
	for(var i in thing_data) {
		if(thing_data[i]===c) {
			valid=true;
		}
		else if(c==="temperature" && thing_data[i]==="refrigerated") {
			valid=true;
		}
	}
	return valid;
}