var journey_summary = {};
var assets_summary = {};
var gates_summary = {};
var gate_asset_list = {};
var chart_properties = {};
var global_duration = 10;
var alive_mode = "realtime";
var alive_search_default = {
    "routes":"Find routes",
    "checkpoints":"Find checkpoints",
    "gate":"Find "+msmap["gen_plural"]+" at this checkpoint",
    "journeys":"Find "+msmap["gen_plural"]+" on this journey"
}


var alive_variable_values = {
    "avar_c_lh":{"name":"Cost per lot/hour","value":2.50},
    "avar_c_ms":{"name":"Cost to reroute asset","value":2400.00},
    "avar_p_ls":{"name":"Percentage of very late deliveries resulting in product loss","value":50},
    "avar_c_ls":{"name":"Cost of lost product","value":3000.00}
}

var alive_asset_cost = {
    0:1660,
    1:1580,
    2:1610,
    3:1520,
    4:1500,
    5:1960,
    6:1980,
    7:1910,
    8:1820,
    9:1800,
    10:1650,
    11:1900,
    12:1500,
    13:1450,
    14:1700,
    15:1400,
    16:150
}

/*
var alive_variable_values = {
    "avar_c_lh":{"name":"Cost per lot/hour","value":0.20},
    "avar_c_ms":{"name":"Cost to reroute asset","value":2400.00},
    "avar_p_ls":{"name":"Percentage of very late deliveries resulting in lost sales","value":50},
    "avar_c_ls":{"name":"Cost of lost sale","value":3000.00}
}
var alive_asset_cost = {
    0:1300,
    1:1250,
    2:1500,
    3:1500,
    4:1450,
    5:1700,
    6:1400,
    7:1350,
    8:1600,
    9:1700,
    10:1650,
    11:1900,
    12:1500,
    13:1450,
    14:1700
}*/

function alive_asset_map(id) {

    // Draws a trace and the gate icons on the map, color coded by delay status
	var fname = "alive_asset_map";
    
    if(alive_blocking_map==false) {
        if(center[0]!=alive_active_asset_center[0] || center[1]!=alive_active_asset_center[1]) {
        //if(center[0]!=44.1972425 || center[1]!=-43.319285384615355) {
            alive_blocking_map = true;
            map_move_to({"dcoord":alive_active_asset_center,"zdir":3,"aliveasset":id});
            return;
        }
        else {
            
            //console.log("center matched");
        }
    }
    else {
        alive_blocking_map = false;
    }

    
    $(".alive_gate_marker").remove();
    $(".alive_gate_marker_canvas").hide();
    tcx.clearRect(0,0,tcv.width,tcv.height);
	trace_points = [[0,0]];
    trace_params = [];
    var asset_data = raw_assetdata[id];
    var asset_gates = Object.keys(asset_data.progress);
    var g,g_params,g_plantime,g_overtime,s_id,g_complete,g_delaycat,g_div;
    var delcolors = ["#9b9da2","#06b87c","#52a3db","#fab800","#c41c33"];
    for(var i=0;i<asset_gates.length;i++) {
        g = asset_data.progress[asset_gates[i]];
        if(time<g[1]) {
            g_complete = -1; // not started
            g_delcat = 0; // not started but planned
        }
        else {
            if(time<(g[1] + g[3] * 3600)) {
                g_complete = ((g[1] + (g[3] * 3600))-time)/(g[3]*3600) // should be a % value
            }
            else {
                g_complete = 1; // completed
            }

            if(g[4]>36) {
                g_delcat = 4; // severely delayed
            }
            else if(g[4]>12) {
                g_delcat = 3; // slightly delayed
            }
            else if(g[4]<-6) {
                g_delcat = 1; // well ahead of schedule
            }
            else {
                g_delcat = 2; // pretty much on time
            }
        }
        if(i<(asset_gates.length-1)) {
            g_params = raw_alivegates[g[0]];
        }
        else {
            g_params = raw_alivegates[asset_data.progress[asset_gates[i-1]][0]];
        }
        
        if(g_params.type=="Long Transport") {
            // If this is true we need to pull which ship this was on...
            //console.log(g[0]);
            s_id = raw_aliveroutedata[asset_data.template].destination;
            s_id = s_id + "-" + raw_alivegates[raw_aliveroutedata[asset_data.template].departure_gate].name;
            s_id = s_id.replace(" ","").toLowerCase();
            //console.log(s_id);
            alive_asset_map_draw_trace({"caller":fname,"id":s_id,"complete":g_complete,"delay":g_delcat});
            //console.log(raw_aliveroutedata[asset_data.template].destination);
        }
        else if(g_params.type=="Short Transport") {
            alive_asset_map_draw_trace({"caller":fname,"id":g[0],"complete":g_complete,"delay":g_delcat});
        }
        else {
            g_div = $("<div />",{"class":"alive_gate_marker","id":"marker_"+g_params.name});
            var origin = get_normalized_coord(g_params.position);
            var delta_y = origin[0]-normalized_origin[0];
            var delta_x = origin[1]-normalized_origin[1];
            var pos_offset = 11; //(ie half the width of the tracker icon so it can be accurately placed)
            var pleft = map_tile_offset_x+(delta_x*512);
            var ptop = map_tile_offset_y+(delta_y*512);
            g_div.css({"left":pleft-pos_offset,"top":ptop-pos_offset,"border-color":delcolors[g_delcat]});
            $("#tracker_layer").append(g_div);
        }
    }
    setTimeout(function() {$(".marker_container").hide()},50);
}

function alive_asset_map_draw_trace(params) {
    // Called by "alive_asset_map"--draws the actual trace on the canvas
	var fname = "alive_asset_map_draw_trace";
	var id = params.id;
	var caller = params.caller;
    var complete = params.complete;
    var delay = params.delay;
    var ghost = params.ghost; // Set if we want to show a faded version of the complete trace
    var current_block;
	if(caller!=undefined) {
		call_log(fname,caller);
	}

	if(id==false) {
		return;
	}

	trace_params = ["stage_"+id,parseFloat(map_tile_offset_x),parseFloat(map_tile_offset_y)];
	tcx.beginPath();
	tcx.lineWidth = 2;
    tcx.lineJoin="round";
    if(delay==4) {
        tcx.strokeStyle = "#c41c33";
    }
    else if(delay==3) {
        tcx.strokeStyle = "#fab800";
    }
    else if(delay==1) {
        tcx.strokeStyle = "#06b87c";
    }
    else if(delay==2) {
        tcx.strokeStyle = "#52a3db";
    }
    else {
        tcx.strokeStyle = "#9b9da2";
    }

    if(ghost!=undefined) {
        var stage_trace = transport_paths[id];
    }
    else {
        var stage_trace = stage_paths[id];
    }
    

    if(complete==-1) {
        // Define the end of the first stage as the end of the trace
        current_block = 0;

    }
    else if(complete==1) {
        // Define the end of the first stage as the end of the trace
        current_block = 0;
    }
    else {
        // Define the end of the first stage as the closet index to the percent of the trace's completeness
        current_block = stage_trace.length - parseInt((1-complete) * stage_trace.length);
        if(current_block==stage_trace.length) {
            // This means NONE of the path is completed, which will cause problems later
            // Because we start from the end of the array, which is zero-indexed.
            current_block-=1;
        }
        console.log(current_block,stage_trace.length);
    }
	//return;
	var c1,c2,tc1,tc2,dx,dy,tx,ty;
    
	//var indices = Object.keys(trackers[id].updates);
	var m = 78850*360/Math.pow(2,map_zlevel)/512;

    if(ghost!=undefined) {
        // We're just drawing a trace on the map. This trace will be of **a** route
        // But it will be shown dashed and faded.
        tcx.strokeStyle = "#52a3db";
        current_block = stage_trace.length-1;
    }
	//var delta_y = origin[0]-normalized_origin[0];
    //var delta_x = origin[1]-normalized_origin[1];
    tcx.beginPath();
    for(var i=stage_trace.length-1;i>=current_block;i--) {
		c1 = stage_trace[i];
		tc1 = get_normalized_coord(c1);
		dx = tc1[1]-normalized_origin[1];
		dy = tc1[0]-normalized_origin[0];
		tx = (mcx)+(dx*512);
		ty = (1024)+(dy*512);
		trace_points.push([tx,ty]);
		tcx.lineTo(tx,ty);
    }
    tcx.moveTo(dx,dy);
    tcx.stroke();
    tcx.beginPath();
    tcx.setLineDash([2,1]);
    for(var i=current_block;i>=0;i--) {
		c1 = stage_trace[i];
		tc1 = get_normalized_coord(c1);
		dx = tc1[1]-normalized_origin[1];
		dy = tc1[0]-normalized_origin[0];
		tx = (mcx)+(dx*512);
		ty = (1024)+(dy*512);
		trace_points.push([tx,ty]);
		tcx.lineTo(tx,ty);
    }
    tcx.stroke();
    tcx.setLineDash([]);
}

function alive_build_filter_from_type(type,next_data,row_id) {
    var key_assoc = [];
    if(type=="routes_summary") {
        // We will also populate the alive metadata
        if(alive_metadata["origin"].vals[next_data["origin"]]==undefined) {
            alive_metadata["origin"].vals[next_data["origin"]] = ["chart_row_"+row_id];
        }
        else {
            alive_metadata["origin"].vals[next_data["origin"]].push("chart_row_"+row_id);
        }
        if(alive_metadata["destination"].vals[next_data["destination"]]==undefined) {
            alive_metadata["destination"].vals[next_data["destination"]] = ["chart_row_"+row_id];
        }
        else {
            alive_metadata["destination"].vals[next_data["destination"]].push("chart_row_"+row_id);
        }
        key_assoc.push(["origin",next_data["origin"]]);
        key_assoc.push(["destination",next_data["destination"]]);
    }
    else if(type=="gates_summary") {
        // Need to add the filter keys for delay values
        var delay_val = next_data["delayed"]/next_data["fill"];
        var delay_cat;
        if(delay_val>.5) { delay_cat = "Over 50 percent";}
        else if(delay_val>.2) { delay_cat = "Over 20 percent"; }
        else { delay_cat = "No delays"; }

        if(alive_metadata["delay"].vals[delay_cat]==undefined) {
            alive_metadata["delay"].vals[delay_cat] = ["chart_row_"+row_id];
        }
        else {
            alive_metadata["delay"].vals[delay_cat].push("chart_row_"+row_id);
        }

        // Need to add the filter keys for checkpoint
        var cptype = next_data["type"];
        if(alive_metadata["checkpoint"].vals[cptype]==undefined) {
            alive_metadata["checkpoint"].vals[cptype] = ["chart_row_"+row_id];
        }
        else {
            alive_metadata["checkpoint"].vals[cptype].push("chart_row_"+row_id);
        }
        key_assoc.push(["delay",delay_cat]);
        key_assoc.push(["checkpoint",cptype]);
    }
    else if(type=="journey_summary") {
        // Populating the alive metadata for the filters - model name
        if(alive_metadata["model"].vals[next_data["name"]]==undefined) {
            alive_metadata["model"].vals[next_data["name"]] = ["chart_row_"+row_id];
        }
        else {
            alive_metadata["model"].vals[next_data["name"]].push("chart_row_"+row_id);
        }
        // Now let's do delays

        var delay_val = next_data["delay"]/3600;
        var delay_cat;
        if(delay_val>96) { delay_cat = "Severely delayed";}
        else if(delay_val>=12) { delay_cat = "Moderately delayed"; }
        else if(delay_val<0) { delay_cat = "Ahead of schedule"}
        else { delay_cat = "No delays"; }

        if(alive_metadata["delay"].vals[delay_cat]==undefined) {
            alive_metadata["delay"].vals[delay_cat] = ["chart_row_"+row_id];
        }
        else {
            alive_metadata["delay"].vals[delay_cat].push("chart_row_"+row_id);
        }

        // Now let's try checkpoint type

        var cptype = next_data["current_checkpoint"];
        var cptypestring = "";
        if(cptype=="end") { cptypestring = "Out for delivery"; }
        else {
            cptype = raw_alivegates[next_data["current_checkpoint"]].type;
            if(cptype=="Long Transport") { cptypestring = "Maritime"; }
            else if(cptype=="Short Transport") { cptypestring = "Terrestrial"; }
            else { cptypestring = cptype; }
        }
        if(alive_metadata["checkpoint"].vals[cptypestring]==undefined) {
            alive_metadata["checkpoint"].vals[cptypestring] = ["chart_row_"+row_id];
        }
        else {
            alive_metadata["checkpoint"].vals[cptypestring].push("chart_row_"+row_id);
        }
        key_assoc.push(["model",next_data["name"]]);
        key_assoc.push(["delay",delay_cat]);
        key_assoc.push(["checkpoint",cptypestring]);
    }
    else if(type=="asset_at_gate") {
        // Populating the alive metadata for the filters - model name
        if(alive_metadata["model"].vals[next_data["name"]]==undefined) {
            alive_metadata["model"].vals[next_data["name"]] = ["chart_row_"+row_id];
        }
        else {
            alive_metadata["model"].vals[next_data["name"]].push("chart_row_"+row_id);
        }
        // Now let's do delays

        var delay_val = next_data["delay"];
        var delay_cat;
        if(delay_val>24) { delay_cat = "Severely delayed";}
        else if(delay_val>=10) { delay_cat = "Moderately delayed"; }
        else if(delay_val<-2) { delay_cat = "Ahead of schedule"}
        else { delay_cat = "No delays"; }

        if(alive_metadata["delay"].vals[delay_cat]==undefined) {
            alive_metadata["delay"].vals[delay_cat] = ["chart_row_"+row_id];
        }
        else {
            alive_metadata["delay"].vals[delay_cat].push("chart_row_"+row_id);
        }

        key_assoc.push(["model",next_data["name"]]);
        key_assoc.push(["delay",delay_cat]);
    }
    for(var i=0;i<key_assoc.length;i++) {
        if(alive_metadata_assoc[key_assoc[i][0]][key_assoc[i][1]]==undefined) {
            alive_metadata_assoc[key_assoc[i][0]][key_assoc[i][1]]=false;
        }
    }
}

function alive_change_time(change_realtime) {
    var d = new Date();
    var t = d.getTime()/1000|0;
    if(alive_p_start!==false && change_realtime!=true) {
        var days = (alive_p_start * 86400);
        time = t-days;
        alive_realtime=false;
        alive_days_ago = alive_p_start;
        alive_duration = alive_p_end-alive_p_start;
    }
    else {
        if(change_realtime==true) {
            time = t;
            alive_realtime=true;
            alive_days_ago = 0;
            alive_duration = 10;
        }
    }
    alive_data_needs_refresh = true;
    $("#loading_icon").show(50,function() { console.log("shown"); alive_panes(alive_data_mode,alive_display_mode); });
}

function alive_checkpoint_data(c_id) {
    if(c_id==undefined) {
        if(alive_active_gate!=undefined) {
            c_id = alive_active_gate;
        }
        else {
            console.log("No checkpoint was passed to the data function, and no gate is active");
        }
    }
    var g_data = raw_alivegates[c_id];
    var g_type = g_data.type;
    var g_name = g_data.shortname;
    var c_date = alive_day(time); // This gives us the starting point
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    c_date = alive_day(c_date); // This should ensure that the starting date is an index integer
    for(var i=0;i<alive_duration;i++) {
        if(g_data.status[alive_day(c_date-i)]!=undefined) {
            //console.log(g_data.status[alive_day(c_date-i)].present);
        }
    }
    $("#alive_container").empty()
    var mode_div = alive_header_builder();
    $("#alive_container").append(mode_div);
    var data_container = $("<div />",{"class":"alive_data_container","id":"alive_data_container"});
    data_container.css({"padding":"15px"});

    if(g_type=="Short Transport") {
        $(data_container).append("<div class=\"alive_expanded_summary_title\">Data for terrestrial route <strong>"+g_name+"</strong></div>");
    }
    else if(g_type=="Long Transport") {
        $(data_container).append("<div class=\"alive_expanded_summary_title\">Data for maritime journey</div>");
    }
    else {
        $(data_container).append("<div class=\"alive_expanded_summary_title\">Data for <strong>"+g_name+"</strong></div>");
    }

    var s_nd = new Date((time - (alive_duration*86400))*1000);
    var e_nd = new Date(time * 1000);
    var c_d = new Date();
    var future = ""
    if(c_d<e_nd) {
        future = " (projected)";
    }
    var s_d_string = months[s_nd.getMonth()]+" "+s_nd.getDate();
    var e_d_string = months[e_nd.getMonth()]+" "+e_nd.getDate();

    $(data_container).append("<div class=\"alive_expanded_summary_subtitle\">between <span>"+s_d_string+" and "+e_d_string+"</span>"+future+"</div>");
    
    //var summary_box = $("<div />",{"class":"alive_gate_summary_box_gate"});
    //summary_box.append("This is a gate");
    //$(data_container).append(summary_box);

    $("#alive_container").append(data_container);
    var text = "";
    var g_sum_vals;
    var g_sum_div;
    var g_sum_perc;
    if(g_type=="Factory") {
        $(data_container).append("<div class=\"gate_summary_graph_block\" id=\"gate_summary_produced\"></div>");
        
        g_sum_vals = gate_value_graph(alive_active_gate,"produced","#gate_summary_produced",s_d_string,e_d_string);
        g_sum_perc = 100*(parseFloat(g_sum_vals.data_b)/parseFloat(g_sum_vals.data_a));
        g_sum_div = $("<div />",{"class":"alive_gate_summary_data_block"});
        g_sum_div.append("<div>Production for this date range and the selected destinations averaged <span class=\"alive_summary_important\">"+(700*g_sum_vals.data_a).toFixed(0)+"</span> "+msmap["type_plural"]+" per week.</div>");
        if( (c_d-e_nd) < 1728000000 ) {
            g_sum_div.append("<div>Based on historical patterns, about "+ g_sum_perc.toFixed(0) +"% of the "+msmap["type_plural"]+" departing this factory will arrive seriously (over 96 hours) delayed.</div>");
        }
        else {
            g_sum_div.append("<div>For the selected range, "+ g_sum_perc.toFixed(0) +"% of the "+msmap["type_plural"]+" departing this factory arrived at their destination seriously delayed.</div>");
        }
        $("#gate_summary_produced").prepend(g_sum_div);
        $("#gate_summary_produced").css({"border-bottom":"1px solid var(--heremidgrey)","margin-bottom":"25px"});
    }
    if(g_type=="Long Transport") {
        $(data_container).append(alive_checkpoint_get_ship_data(c_id));
    }
    else {

        $(data_container).append("<div class=\"gate_summary_graph_block\" id=\"gate_summary_present\"></div>");

        g_sum_vals = gate_value_graph(alive_active_gate, "present", "#gate_summary_present", s_d_string, e_d_string);
        g_sum_div = $("<div />", { "class": "alive_gate_summary_data_block" });
        g_sum_div.append("<div>Fill level for this gate averaged <span class=\"alive_summary_important\">" + (100 * g_sum_vals.data_a).toFixed(0) + "%</span> over the specified time period.</div>");
        console.log(g_sum_vals);
        if(g_sum_vals.overcapacity>10) {
            g_sum_div.append("<div>Capacity problems were a major issue during this time frame, leading to an average delay of "+alive_prettydate(g_sum_vals.overcapacity)+" per "+msmap["type"]+".");            
        }
        else if(g_sum_vals.overcapacity>5) {
            g_sum_div.append("<div>Operating beyond capacity limits led to an average delay of "+alive_prettydate(g_sum_vals.overcapacity)+" per "+msmap["type"]+" over this time frame.");            
        }
        else {
            g_sum_div.append("<div>Checkpoint overutilization was not a major contributing factor to delays, resulting in approximately "+alive_prettydate(g_sum_vals.overcapacity)+" per asset.</div>");
        }
        var num_at_end = g_sum_vals.remaining;
        $("#gate_summary_present").prepend(g_sum_div);
        $("#gate_summary_present").css({"border-bottom":"1px solid var(--heremidgrey)","margin-bottom":"25px"});
        $(data_container).append("<div class=\"gate_summary_graph_block\" id=\"gate_summary_entered\"></div>");
        g_sum_vals = gate_value_graph(alive_active_gate, "entered", "#gate_summary_entered", s_d_string, e_d_string);
        console.log(g_sum_vals);
        var num_enter = g_sum_vals.data_sum_a;
        var num_leave = g_sum_vals.data_sum_b;
        g_sum_div = $("<div />", { "class": "alive_gate_summary_data_block" });
        g_sum_div.append("<div>Total throughput during this period: <span class=\"alive_summary_important\">" + (100*num_enter).toFixed(0) + "</span> "+msmap["type_plural"]+" arrived (blue line) at the checkpoint and <span class=\"alive_summary_important\">" + (100*num_leave).toFixed(0) + "</span> departed (green line). At the end of this reporting period, <span class=\"alive_summary_important\">" + (num_at_end).toFixed(0) + "</span> "+msmap["type_plural"]+" were waiting for processing.");
        $("#gate_summary_entered").prepend(g_sum_div);
    }
}

function alive_checkpoint_get_ship_data(s_id) {
    // Given a ship ID, returns a block of data that includes the shipper profile, etc.
    var ship_flags = {
        "US":["American","flag_us.png"],
        "LN":["Liberian","flag_ln.png"],
        "DE":["German","flag_de.png"],
        "FR":["French","flag_fr.png"],
        "PA":["Panamanian","flag_pa.png"],
        "BE":["Belgian","flag_be.png"]
    }
    var ship_data = raw_alivegates[s_id];
    var ship_origin = ship_data.name.split("Maritime, ");
    ship_origin = ship_origin[1].split("-");
    var status_keys = Object.keys(ship_data.status);
    var s_nd = new Date(2000,0,1,0,0);
    s_nd.setTime( s_nd.getTime() + (alive_day(status_keys[0]) * 86400000));
    var s_unix = s_nd.getTime()/1000;
    var ship_summary_div = $("<div />",{"class":"alive_summary_ship"});
    var ship_title = $("<div />",{"class":"alive_summary_ship_name","text":"M/V "+ship_data.shortname});
    var ship_flag = $("<div />",{"class":"alive_ship_flag"});
    ship_flag.css({"background-image":"url('./images/"+ship_flags[ship_data.flag][1]+"')"});
    ship_title.append(ship_flag);
    var ship_summary;
    var eta_delta = ship_data.actual - ship_data.scheduled;
    if(s_unix>time) {
        ship_summary = $("<div />",{"class":"alive_summary_ship_sub","text":ship_flags[ship_data.flag][0]+"-flagged "+msmap["ship_type"]+" scheduled from "+ship_origin[0]+" to "+ship_origin[1].slice(0,-1)});
    } 
    else {
        ship_summary = $("<div />",{"class":"alive_summary_ship_sub","text":ship_flags[ship_data.flag][0]+"-flagged "+msmap["ship_type"]+" en route from "+ship_origin[0]+" to "+ship_origin[1].slice(0,-1)});
    }
    ship_summary_div.append(ship_title);
    ship_summary_div.append(ship_summary);
    ship_summary_div.append("<div class=\'alive_summary_ship_cat'>Year launched: <span class='alive_summary_ship_cat_detail'>"+ship_data.year+"</span></div>");
    ship_summary_div.append("<div class=\'alive_summary_ship_cat'>GRT: <span class='alive_summary_ship_cat_detail'>"+ship_data.dwt+"</span></div>");
    ship_summary_div.append("<div class=\'alive_summary_ship_cat'>Capacity: <span class='alive_summary_ship_cat_detail'>"+ship_data.capacity+" (loaded: "+ ship_data.status[status_keys[0]].present +")</span></div>");

    
    if(s_unix>time) {
        ship_summary_div.append("<div class=\'alive_summary_ship_cat'>Planned departure: <span class='alive_summary_ship_cat_detail'>"+alive_prettydate(s_unix)+"</span></div>");
    }
    else {
        ship_summary_div.append("<div class=\'alive_summary_ship_cat'>Departed: <span class='alive_summary_ship_cat_detail'>"+alive_prettydate(s_unix)+"</span></div>");
    }
    ship_summary_div.append("<div class=\'alive_summary_ship_cat'>Scheduled journey time: <span class='alive_summary_ship_cat_detail'>"+alive_prettydate(ship_data.scheduled)+"</span></div>");

    var delay_str = "";
    if(eta_delta>24) {
        delay_str = "<span class='alive_inline_bad'>"+alive_prettydate(eta_delta)+" behind schedule</span>";
    }
    else if(eta_delta>12) {
        delay_str = "<span class='alive_inline_mbad'>"+alive_prettydate(eta_delta)+" behind schedule</span>";
    }
    else if(eta_delta<0) {
        delay_str = "<span class='alive_inline_good'>"+alive_prettydate(eta_delta)+" ahead of schedule</span>";
    }

    if((s_unix+(ship_data.actual*3600))>time) {
        // If true, the ship will arrive in the future.
        ship_summary_div.append("<div class=\'alive_summary_ship_cat'>Scheduled arrival: <span class='alive_summary_ship_cat_detail'>"+alive_prettydate(s_unix + (ship_data.actual*3600))+"</span>"+delay_str+"</div>");
    }
    else {
        // Otherwise, the ship has already arrived.
        ship_summary_div.append("<div class=\'alive_summary_ship_cat'>Arrived: <span class='alive_summary_ship_cat_detail'>"+alive_prettydate(s_unix + (ship_data.actual*3600))+"</span>"+delay_str+"</div>");
    }
    return ship_summary_div;
}

function alive_checkpoint_data_all() {
    // Function to populate the "data" column with a card for every currently active gate in the time window
    var active_gates = Object.keys(gates_summary);
    var historical = alive_get_gate_status(time-(604800+(alive_duration*86400)));
    var c_delayed,h_delayed; // current and historical delayed
    var c_present,h_present; // current and historical present
    $("#alive_container").empty()
    var mode_div = alive_header_builder();
    $("#alive_container").append(mode_div);
    $("#alive_container").append("<div class=\"alive_data_container\" id=\"alive_data_container\"></div>");
    var sub_block,del_block,hist_block,c_percdelayed,h_percdelayed,h_delta;
    for(var i=0;i<active_gates.length;i++) {
        del_block = "";
        hist_block ="";
        
        if(gates_summary[active_gates[i]].type=="Staging") {
            sub_block = $("<div />",{"class":"alive_gate_summary_box_gate"});
            sub_block.append("<div class=\"alive_gate_summary_title\">Staging area</div>");
        }
        else if(gates_summary[active_gates[i]].type=="Terrestrial") {
            sub_block = $("<div />",{"class":"alive_gate_summary_box_stage"});
            sub_block.append("<div class=\"alive_gate_summary_title\">Terrestrial ("+gates_summary[active_gates[i]].name+")</div>");
        }
        else if(gates_summary[active_gates[i]].type=="Maritime") {
            sub_block = $("<div />",{"class":"alive_gate_summary_box_stage"});
            sub_block.append("<div class=\"alive_gate_summary_title\">Maritime: "+gates_summary[active_gates[i]].name+"</div>");
        }
        else {
            sub_block = $("<div />",{"class":"alive_gate_summary_box_gate"});
            sub_block.append("<div class=\"alive_gate_summary_title\">"+gates_summary[active_gates[i]].type+" ("+gates_summary[active_gates[i]].name+")</div>");
        }
        c_delayed = gates_summary[active_gates[i]].delayed;
        c_present = gates_summary[active_gates[i]].fill;
        c_percdelayed = c_delayed/c_present;
        
        if(c_percdelayed > .55) {
            del_block = "The checkpoint is reporting an <span class=\"alive_inline_bad\">extremely high</span> amount of delay: <span class=\"alive_summary_important\">"+(100*(c_delayed/c_present)).toFixed(2)+"%</span> of the "+msmap["gen_plural"]+" at this checkpoint are predicted to arrive at their destination much later than predicted.";
        }
        else if(c_percdelayed > .25) {
            del_block = "This checkpoint is reporting a <span class=\"alive_inline_bad\">moderate</span> amount of delay: <span class=\"alive_summary_important\">"+(100*(c_delayed/c_present)).toFixed(2)+"%</span> of the "+msmap["gen_plural"]+" at this checkpoint are predicted to arrive at their destination much later than predicted.";
        }
        else {
            del_block = "None of the "+msmap["gen_plural"]+" at this checkpoint are delayed based on current and historical information.";
        }

        if(gates_summary[active_gates[i]].type!="Maritime") {
            // This is used for historical performance. For maritime voyages, it doesn't really make sense to talk about "historical" performance.
            // So we'll include other information.
            // Otherwise, we'll actually run a historical calculation.
            if(historical[active_gates[i]]!=undefined) {
                // If it's maritime, we'll use a special reporting metric...
                h_delayed = historical[active_gates[i]].delayed;
                h_present = historical[active_gates[i]].fill;
                h_percdelayed = h_delayed/h_present;
                h_delta = h_percdelayed-c_percdelayed;
                if(h_delta>=0) {
                    // Then the historical delay is LARGER than the current delay
                    if(Math.abs(h_delta)>.2) {
                        hist_block = " Compared to previous performance, this is <span class=\"alive_inline_good\">much better</span> than average";
                    }
                    else if(Math.abs(h_delta)>.05) {
                        hist_block = " Compared to previous performance, this is <span class=\"alive_inline_good\">slightly better</span> than average";
                    }
                    else {
                        hist_block = " This performance is unchanged from historical patterns.";
                    }
                }
                else {
                    if(Math.abs(h_delta)>.2) {
                        hist_block = " Compared to previous performance, this is <span class=\"alive_inline_bad\">much worse</span> than average";
                    }
                    else if(Math.abs(h_delta)>.05) {
                        hist_block = " Compared to previous performance, this is <span class=\"alive_inline_mbad\">slightly worse</span> than average";
                    }
                    else {
                        hist_block = " This performance is unchanged from historical patterns.";
                    }
                }
            }
            else {
                console.log("no historical data for "+active_gates[i]);
                hist_block = " There is no historical data for this checkpoint.";
            }
        }
        else {
            h_delta = raw_alivegates[active_gates[i]].actual - raw_alivegates[active_gates[i]].scheduled;
            if(h_delta>0) {
                // In other words the ship travel time is later than its scheduled time.
                h_percdelayed = h_delta/raw_alivegates[active_gates[i]].scheduled;
                if(h_percdelayed>.15) {
                    hist_block = " Compared to scheduled ETA, the ship is predicted to arrive <span class=\"alive_inline_bad\">well behind schedule</span>";
                    if(c_percdelayed>.15) {
                        hist_block = hist_block + ", which is likely to cause further severe impact to the delivery schedule."
                    }
                    else {
                        hist_block = hist_block + ", however, which may impact delivery schedules."
                    }
                }
                else if(h_percdelayed>.07) {
                    hist_block = " Compared to scheduled ETA, the ship is <span class=\"alive_inline_mbad\">slightly behind schedule</span>";
                    if(c_percdelayed>.15) {
                        hist_block = hist_block + ", which is likely to cause severe impact to the delivery schedule."
                    }
                    else {
                        hist_block = hist_block + ", however, which may impact delivery schedules."
                    }
                }
                else {
                    hist_block = " Compared to scheduled ETA, the ship is performing as expected.";
                }
            }
            else {
                // In other words the ship travel time is better than its scheduled time.
                h_percdelayed = h_delta/raw_alivegates[active_gates[i]].scheduled;
                if(h_percdelayed<.15) {
                    hist_block = " Compared to scheduled ETA, the ship is predicted to arrive <span class=\"alive_inline_good\">well ahead of schedule</span>";
                    if(c_percdelayed>.15) {
                        hist_block = hist_block + ", which may allow for some delayed "+msmap["gen_plural"]+" to be delivered on-schedule."
                    }
                    else {
                        hist_block = hist_block + "."
                    }
                }
                else if(h_percdelayed<.07) {
                    hist_block = " Compared to scheduled ETA, the ship is <span class=\"alive_inline_good\">slightly ahead of schedule</span>";
                    if(c_percdelayed>.15) {
                        hist_block = hist_block + ", although delayed "+msmap["gen_plural"]+" are unlikely to be positively impacted based on historical data."
                    }
                    else {
                        hist_block = hist_block + ", but delivery schedules are unlikely to be impacted."
                    }
                }
                else {
                    hist_block = " Compared to scheduled ETA, the ship is performing as expected";
                    if(c_percdelayed>.15) {
                        hist_block = hist_block + ", so delivery schedules are likely to remain impacted."
                    }
                    else {
                        hist_block = hist_block + "."
                    }
                }
            }
        }

        $(sub_block).append("<div><span class=\"alive_summary_important\">"+c_present+"</span> "+msmap["gen_plural"]+" are currently present. "+del_block+hist_block+"</div>");
        $(sub_block).on("click",{arg1:active_gates[i]},function(e) { alive_active_gate=e.data.arg1; alive_data_needs_refresh=true; alive_panes("gate","list"); });
        $("#alive_data_container").append(sub_block);
    }
}

function alive_daterange(daterange) {
    /*
        Currently expects this in the format [start year, start day],[end year, end day]
    */
    var startdate,enddate;
    if(daterange==undefined) {
        startdate = 6205;
        enddate = 7300;
    }
    else {
        startdate = (parseInt(daterange[0][0]) * 365) + (parseInt(daterange[0][1])-1);
        if(daterange[1]==undefined) {
            enddate = 7300;
        }
        else {
            enddate = (parseInt(daterange[1][0]) * 365) + (parseInt(daterange[1][1])-1);
        }
    }
    return [startdate,enddate]
}

function alive_day(date) {
    /*
        If given a date string in the form yy.ddd, returns a naive integer value of the day (yy * 365) + ddd)
        If given an integer day, returns the associated date string of the form yy.ddd
        If given a time index, returns the associated date string of the form yy.ddd
    */
    var converted_date;
    var years,days;
    var date_object;
    var date_zero;
    if(date.length!=undefined) {
        var date_components = date.split(".");
        years = parseInt(date_components[0]);
        days = parseInt(date_components[1]);
        converted_date = (365 * years) + (days-1);
    }
    else {
        if(date>100000) {
            // In other words this is a time value, not a conventional "alive day"
            date_object = new Date(date*1000);
            date_zero = new Date(date_object.getFullYear(), 0, 0);
            years = date_object.getFullYear().toString().substring(2);
            days = Math.floor((date_object - date_zero)/86400000);
            //days = date_object.getDate();
        }
        
        else {
            years = (Math.floor(date/365));
            days = (date % 365)+1;
        }
        if(days<100) {
            if(days<10) {
                converted_date = years + ".00" + days;
            }
            else {
                converted_date = years + ".0" + days;
            }
        }
        else {
            converted_date = years + "." + days;
        }
    }
    return converted_date;
}

function alive_demo() {
/**
 * 
 * Single-purpose function that is designed solely to show the expected and actual departure times from a port
 * 
 */
    $("#alive_container").empty(); // Clear the alive canvas
    $("#alive_container").html("<iframe src='./normal.html' class='demo_iframe'></iframe>");
}

function alive_get_assets_on_journey(journey_id,start) {
    if(start==undefined) {
        start = time;
    }
    start = parseInt(start);
    assets_summary = {};
    var assets = []; 
    if(Array.isArray(journey_id)) {
        for(var i=0;i<journey_id.length;i++) {
            assets.push.apply(assets,raw_alivejourneydata[journey_id[i]].assets);
        }
    }
    else {
        assets = raw_alivejourneydata[journey_id].assets;
    }
    for(var i=0;i<assets.length;i++) { 
        var asset = raw_assetdata[assets[i]];

        if(asset==undefined) {
            console.log("Asset had invalid ID");
        }
        //else if(parseInt(asset.start) > time && parseInt(asset.start) < (time+(alive_duration*86400))) {
        //    console.log("Asset started after given time");
        //}
        else {
            var checkpoints = asset.progress;
            var last_checkpoint = -2;
            var num_gates = Object.keys(checkpoints).length;
            var gate,delay,eta;
            var elapsed_time = 0;
            var future_time = asset.naiveeta;
            for(var j=0;j<num_gates;j++) {
                var next_entry_time = parseInt(checkpoints[j][1]);
                //console.log(next_entry_time);
                if(next_entry_time<start) {
                    last_checkpoint = j-1;
                    future_time -= checkpoints[j][2];
                }
                else {
                    elapsed_time += checkpoints[j][3];
                }
            }
            if(last_checkpoint<0) {
                var exit = parseInt(checkpoints[num_gates-1][1]) + (parseInt(checkpoints[num_gates-1][3]) * 3600);
                if(start<exit) {
                    last_checkpoint = num_gates-1;
                    gate = checkpoints[last_checkpoint][0];
                    delay = (checkpoints[num_gates-1][3]-checkpoints[num_gates-1][2]) * 3600;
                    eta = parseInt(asset.start) + (elapsed_time * 3600) + (future_time * 3600) + delay;
                }
                else {
                    gate = "end";
                    eta = asset.start + (elapsed_time * 3600);
                    delay = (checkpoints[num_gates-1][3]-checkpoints[num_gates-1][2]) * 3600;
                }
            }
            else {
                gate = checkpoints[last_checkpoint][0];
                delay = (checkpoints[last_checkpoint][3]-checkpoints[last_checkpoint][2]) * 3600;
                eta = parseInt(asset.start) + ((elapsed_time + future_time) * 3600);
            }
            assets_summary[assets[i]] = {
                "uid":asset.uid,
                "name":asset.name,
                "current_checkpoint":gate,
                "delay":delay,
                "eta":eta
            }
            //console.log(last_checkpoint);
        }
    }
    //var assets = journey.assets;
    //console.log(assets, assets.length)
}

function alive_get_gate_assets(gate_id,start,days) {
    var start_day,start_time;
    var check_dates = [];
    gate_asset_list = {}
    if(start.length==6) {
        start_day = alive_day(start);
        var d_components = start.split(".");
        var d = new Date("2017-01-01T00:00:00.000Z");
        d.setYear(2000+parseInt(d_components[0]));
        start_time = d.getTime() + (parseInt(d_components[1])-1)*86400000;
    }
    else {
        var d = new Date(start*1000);
        var sd = new Date(d.getFullYear(),0,0);
        var diff = d-sd;
        var num_days = Math.floor(diff/86400000);
        d.setHours(1,0,0,0);
        var d_string = (d.getFullYear() % 100) + "." + ("00"+num_days).slice(-3);
        start_day = alive_day(d_string);
        start_time = d.getTime();
    }
    //console.log(start_day,start_time);
    if(days==undefined) {
        days = 1;
    }
    for(var i=0;i<days;i++) {
        check_dates.push(alive_day(start_day-i));
    }
    gate_asset_list = {
        "id":gate_id,
        "name":raw_alivegates[gate_id].shortname,
        "type":raw_alivegates[gate_id].type,
        "capacity":raw_alivegates[gate_id].capacity,
        "assets":{}
    }
    for(var i=0;i<days;i++) {
        var status = raw_alivegates[gate_id].status[check_dates[i]];
        if(status!=undefined) {
            var present = status.present_assets;
            for(var j=0;j<present.length;j++) {
                var asset = raw_assetdata[present[j]];
                if(asset==undefined) {
                    console.log(present[j]);
                }
                else { 
                    var age = (start_time - (asset.start * 1000))/3600000;
                    var steps = Object.keys(asset.progress);
                    var delay = 0;
                    for(var k=0;k<steps.length;k++) {
                        var step = asset.progress[steps[k]];
                        if(step[0]==gate_id) {
                            delay = step[4];
                        }
                    }
                    var eta = (asset.start * 1000) + ((asset.naiveeta + delay)*3600000); 
                    gate_asset_list.assets[present[j]] = {
                        "uid":asset.uid,
                        "name":asset.name,
                        "age":age,
                        "delay":delay,
                        "eta":eta
                    };
                }
            }
        }

    }
    //console.log(check_dates);
}

function alive_get_gate_status(start) {
    console.log(start);
    if(start==undefined) {
        start = time;
    }
    var d = new Date(start*1000);
    var sd = new Date(d.getFullYear(),0,0);
    var diff = d-sd;
    var num_days = Math.floor(diff/86400000);
    var d_string = (d.getFullYear() % 100) + "." + ("00"+num_days).slice(-3);
    var start_day = alive_day(d_string);
    console.log(start_day);
    var gate_ids = Object.keys(raw_alivegates);
    local_gates_summary = {}
    for(var i=0;i<gate_ids.length;i++) {
        var sub_alive_day;
        var gate = raw_alivegates[gate_ids[i]];
        var gate_day_count = 0;
        var ontime = 0.0;
        var delayed = 0.0;
        var fill = 0.0;
        for(var j=0;j<alive_duration;j++) {
            sub_alive_day = alive_day(start_day-j);
            if(gate.status[sub_alive_day]!==undefined) {
                var status = gate.status[sub_alive_day];
                gate_day_count++;
                ontime += (status.present-status.offschedule);
                delayed += (status.offschedule);
                fill += (status.present);
            }
        }
        if(gate_day_count>0) {
            var typestring;
            if(gate.type == "Short Transport") {
                typestring = "Terrestrial";
            }
            else if(gate.type=="Long Transport") {
                typestring = "Maritime";
            }
            else {
                typestring = gate.type;
            }
            local_gates_summary[gate_ids[i]] = {
                "name":gate.shortname,
                "type":typestring,
                "ontime":parseInt(ontime/gate_day_count),
                "delayed":parseInt(delayed/gate_day_count),
                "capacity":gate.capacity,
                "fill":parseInt(fill/gate_day_count)
            }
        }
    }
    return local_gates_summary;
}

function alive_get_journey_summary(start,days,mode) {
    /*
    For a given start date and time bound, populates the journey summary object with a summary of all the unique journeys representing all routes
    
    mode:
        "all": Includes any journey that took place within this range
        "start": Includes only journeys that started within N days after the given start date
    */
    journey_summary = {};
    var routes = Object.keys(raw_aliveroutedata);
    var journeys = [];
    var start_day;
    if(start==undefined) {
        start = time;
    }
    if(start.length==6) {
        end_day = alive_day(start);
    }
    else {
        var d = new Date(start*1000);
        var sd = new Date(d.getFullYear(),0,0);
        var diff = d-sd;
        var num_days = Math.floor(diff/86400000);
        d.setHours(1,0,0,0);
        var d_string = (d.getFullYear() % 100) + "." + ("00"+num_days).slice(-3);
        end_day = alive_day(d_string);
    }
    var route_journeys = [];
    var sub_journey;
    var j_origin,j_destination,j_total,j_late,j_delay,j_routetime;
    if(days===undefined) {
        start_day = end_day - 1;
    }
    else {
        start_day = end_day - parseInt(days);
    }
    for(var i=0;i<routes.length;i++) {
        route_journeys = raw_aliveroutedata[routes[i]].journeys;
        j_total = 0;
        j_late = 0;
        j_delay = 0;
        j_routetime = 0;
        journeys = [];
        for(var j=0;j<route_journeys.length;j++) {
            if(raw_alivejourneydata[route_journeys[j]]!==undefined) {
                sub_journey = raw_alivejourneydata[route_journeys[j]];

                //if( alive_day(sub_journey.started) >= start_day && alive_day(sub_journey.started) <= end_day ) { 
                if( alive_day(sub_journey.ended) >= start_day && alive_day(sub_journey.started) <= end_day ) {
                    journeys.push(route_journeys[j]);
                    j_total += parseInt(sub_journey.total);
                    j_late += parseInt(sub_journey.late);
                    j_delay += parseInt(sub_journey.totaldelay);
                    j_routetime += parseInt(sub_journey.totaltime);
                }     
            }
        }
        j_origin = raw_aliveroutedata[routes[i]].origin;
        j_destination = raw_aliveroutedata[routes[i]].destination;
        if(journeys.length>0) { 
            journey_summary[i] = {
                "origin":j_origin,
                "destination":j_destination,
                "total":j_total,
                "late":j_late,
                "lead":j_routetime/j_total,
                "delay":j_delay/j_total,
                "components":journeys
            }
        }
        //console.log(j_origin,j_destination,j_total,j_late,j_delay);
        //console.log(aliveroutedata[routes[i]].origin)
        
    }
    //console.log(journeys);

}

function alive_header_builder() {
    var mode_div = $("<div />",{"class":"alive_mode_bar"});
    var mode_div_l,mode_div_d,mode_div_m;
    if(alive_display_mode=="list") {
        mode_div_l = $("<div />",{"class":"alive_mode_tab_sel"});
        mode_div_d = $("<div />",{"class":"alive_mode_tab"});
    }
    else if(alive_display_mode=="data") {
        mode_div_l = $("<div />",{"class":"alive_mode_tab"});
        mode_div_d = $("<div />",{"class":"alive_mode_tab_sel"});
    }
    else {
        mode_div_l = $("<div />",{"class":"alive_mode_tab"});
        mode_div_d = $("<div />",{"class":"alive_mode_tab"});
    }
    mode_div_l.append("<span>List view</span>");
    mode_div_d.append("<span>Data view</span>");

    
    

    mode_div_l.on("click",function() { alive_panes(alive_data_mode,"list")});
    mode_div_d.on("click",function() { alive_panes(alive_data_mode,"data")});
    
    
    mode_div.append(mode_div_l);
    mode_div.append(mode_div_d);

    if(alive_chart_mode=="cost") {
        mode_div_m = $("<div />",{"class":"alive_mode_tab"});
        mode_div_m.append("<span>Model values</span>");
        mode_div_m.on("click",function() { alive_variable_popup(); });
        mode_div.append(mode_div_m);
    }
    
    return mode_div;
}

function alive_last() {
    // Should track the history and configuration of the alive charts, so that hitting the back button works.
    var last_data = alive_history[alive_history.length-2];
    console.log(last_data);
    if(last_data==undefined) {
        map_data_context_switch({'mode':'map','caller':'alive_last'});
        return;
    }
    else {
    /*
        
        alive_active_asset = last_data[2];
        alive_active_gate = last_data[3];
        alive_active_journeys = last_data[4];
        alive_active_route = last_data[5];
        alive_days_ago = last_data[6];
        time = last_data[7];
        alive_duration = last_data[8];
        alive_data_needs_refresh = true;
        alive_panes(last_data[0],last_data[1]);
    */
        alive_history.splice(-2,2);
        if(alive_data_mode=="gate") {
            alive_panes("checkpoints","list");
        }
        else if(alive_data_mode=="asset") {
            alive_panes(last_data[0],last_data[1]);
        }
        else if(alive_data_mode=="journeys") {
            alive_panes("routes","list");
        }
        else {
            map_data_context_switch({'mode':'map','caller':'alive_last'});
        }
    }
}

function alive_map(params) {
	var fname = "alive_map";
    var caller = params.caller;
    var redraw = params.redraw;

	if(caller!=undefined) {
		call_log(fname,caller);
	}

    /*
    Plots the location of gates and routes on the map to provide a quick overview of their information
    */

    // Step one. We need to get the positions of every gate.
    var gate_ids = Object.keys(raw_alivegates);
    $(".alive_gate_marker_canvas").hide();
    $(".alive_gate_marker").remove();
    var g_params;
    var delcolors = ["#9b9da2","#06b87c","#52a3db","#fab800","#c41c33"];
    var arc_flagged = 0.0;
    var arc_offschedule = 0.0;
    var day_present = 0;
    var day_offschedule = 0;
    var day_flagged = 0;
    var gcv,gct,img;
    var g_id,g_atday;
    var origin,delta_x,delta_y,pos_offset,pleft,ptop,t_path;
    var data_at_time = false;
    var position;
    var t_id;
    if(redraw==true || redraw==false) {
        tcx.clearRect(0,0,tcv.width,tcv.height);
        var trace_ids = Object.keys(transport_paths);
        var origin,dx,dy,tx,ty;
        for(var i=0;i<trace_ids.length;i++) {
            if(trace_ids[i].split("_")[0]!="t") {
                alive_asset_map_draw_trace({"caller":fname,"id":trace_ids[i],"complete":1,"ghost":true,"delay":2});
            }
        }
        // This next block draws some connectors for the terrestrial transport...
        for(var i=0;i<terrestrial_paths.length;i++) {
            var t_block = terrestrial_paths[i];
            //For this, the array format is [start,end,gate]
            g_params = raw_alivegates[t_block[2]];
            g_atday = g_params["status"][alive_day(time)];
            tcx.beginPath();
            position = raw_alivegates[t_block[0]].position;
            origin = get_normalized_coord(position);
            dx = origin[1]-normalized_origin[1];
		    dy = origin[0]-normalized_origin[0];
		    tx = (mcx)+(dx*512);
            ty = (1024)+(dy*512);
            tcx.moveTo(tx,ty);
            position = raw_alivegates[t_block[1]].position;
            origin = get_normalized_coord(position);
            dx = origin[1]-normalized_origin[1];
		    dy = origin[0]-normalized_origin[0];
		    tx = (mcx)+(dx*512);
            ty = (1024)+(dy*512);
            tcx.lineTo(tx,ty);
            tcx.strokeStyle = delcolors[0];
            tcx.lineWidth = 6;
            tcx.stroke();
            if(g_atday==undefined) {
                tcx.strokeStyle = delcolors[0];
            }
            else {
                day_present = parseFloat(g_atday["present"]);
                day_offschedule = parseFloat(g_atday["offschedule"]);
                day_flagged = parseFloat(g_atday["late"]);
                if( (day_offschedule / day_present) > .2) {
                    tcx.strokeStyle = delcolors[3];
                    if( (day_flagged / day_offschedule) > .4 ) {
                        tcx.strokeStyle = delcolors[4];
                    }
                }
                else {
                    tcx.strokeStyle = delcolors[1];
                }
            }
            tcx.lineWidth = 3;
            tcx.stroke();
        }   
    }


    for(var i=0;i<gate_ids.length;i++) {
        g_params = raw_alivegates[gate_ids[i]];
        if(g_params.type!="Short Transport" && g_params.type!="Last Transport") {
            g_id = gate_ids[i];
            g_atday = g_params["status"][alive_day(time)];
            position = g_params.position;
            if(g_atday==undefined) { 
                arc_flagged = -.5 * Math.PI;
                arc_offschedule = -.5 * Math.PI;
                data_at_time = false;
            }
            else {
                day_present = parseFloat(g_atday["present"]);
                day_offschedule = parseFloat(g_atday["offschedule"]);
                day_flagged = parseFloat(g_atday["late"]);
                arc_flagged = ((2 * day_flagged/day_present) - .5) * Math.PI;
                arc_offschedule = ((2 * day_offschedule/day_present) - .5) * Math.PI;
                data_at_time = true;
            }
            if(g_params.type=="Long Transport") {
                if(data_at_time==true) {
                    t_id = g_params.name.split("Maritime, ")[1];
                    t_id = t_id.replace(" ","").toLowerCase().replace(")","");
                    t_id = t_id.split("-");
                    t_path = stage_paths[t_id[1]+"-"+t_id[0]];
                    var valid_days = Object.keys(g_params["status"]);
                    var v_idx = -1;
                    var perc_complete = 0.0;
                    for(var v=0;v<valid_days.length;v++) {
                        if(valid_days[v]==alive_day(time)) {
                            v_idx = v;
                        }
                    }
                    perc_complete = v_idx / valid_days.length;
                    var perc_idx = parseInt((1-perc_complete) * (t_path.length-1));
                    position = t_path[perc_idx];
                    if(g_params.shortname=="Great Newton") {
                        console.log("Ship active at: "+alive_day(time));
                    }
                    alive_map_position_gate({"caller":fname,"id":g_id,"position":position,"data":data_at_time,"type":g_params.type,"arc_params":[arc_flagged,arc_offschedule]});
                }
                else {
                    //console.log("This ship had no data at this time: "+g_params.name);
                }
            }
            else {
                alive_map_position_gate({"caller":fname,"id":g_id,"position":position,"data":data_at_time,"type":g_params.type,"arc_params":[arc_flagged,arc_offschedule]});
            }
        }
    }
}

function alive_map_position_all_gates(params) {
/*
    This will create the gate objects, so that we don't have to recreate them every time. It should save at least a little time.
*/
    var fname = "alive_map_position_all_gates";
    var caller = params.caller;

    try {
        raw_alivegates.length;
    }
    catch(err) {
        console.log(err);
        return;// Set so that if there is no alive data, we don't try to initialize any gates.
    }

    if(caller!=undefined) {
        call_log(fname,caller);
    }
    $(".alive_gate_marker_canvas").remove();
    var g_id;
    var gate_ids = Object.keys(raw_alivegates);
    for(var i=0;i<gate_ids.length;i++) {
        g_params = raw_alivegates[gate_ids[i]];
        if(g_params.type!="Short Transport" && g_params.type!="Last Transport") {
            g_id = gate_ids[i];
            var gcv = $("<canvas />",{"class":"alive_gate_marker_canvas","id":"marker_"+g_id});
            if(g_params.type=="Long Transport" || g_params.type=="Staging") {
                gcv.attr("width",32);
                gcv.attr("height",32);
                gcv.css({"left":-400,"top":-400,"width":"32px","height":"32px"});
            }
            else {
                gcv.attr("width",40);
                gcv.attr("height",40);
                gcv.css({"left":-400,"top":-400,"width":"40px","height":"40px"});
            }
            gcv.on("click",{arg1:g_id},function(e) {
                alive_active_gate = e.data.arg1;
                map_data_context_switch({'mode':'gate','caller':fname});
                //alive_active_gate = e.data.arg1; alive_data_needs_refresh = true; alive_panes("gate", "list");
            });
            //console.log("adding gcv "+g_id);
            $("#tracker_layer").append(gcv);
        }
    }

}

function alive_map_position_gate(params) {
    var fname = "alive_map_position_gate";
	var caller = params.caller;
	if(caller!=undefined) {
		call_log(fname,caller);
	}
    var g_id = params.id;
    if(g_id=="s90") {
        console.log("Tried to position this ship");
    }
    var g_pos = params.position;
    var g_type = params.type;
    var g_arc = params.arc_params;
    var g_live = params.data;
    var origin,delta_x,delta_y,pos_offset,pleft,ptop,t_path;
    var delcolors = ["#9b9da2","#06b87c","#52a3db","#fab800","#c41c33"];
    origin = get_normalized_coord(g_pos);
    delta_y = origin[0]-normalized_origin[0];
    delta_x = origin[1]-normalized_origin[1];
    gct = document.getElementById("marker_"+g_id).getContext("2d");
    if(g_type=="Long Transport" || g_type=="Staging") {
        pos_offset = 16;
        gct.lineWidth = 4;
    }
    else {
        pos_offset = 20;
        gct.lineWidth = 4;
    }
    pleft = map_tile_offset_x+(delta_x*512);
    ptop = map_tile_offset_y+(delta_y*512);
    
    $("#marker_"+g_id).show();
    $("#marker_"+g_id).css({"left":pleft-pos_offset,"top":ptop-pos_offset});
    
    gct.clearRect(0,0,100,100);
    gct.beginPath();
    gct.arc(pos_offset,pos_offset,pos_offset,0,2*Math.PI);
    gct.fillStyle = "#ffffff";
    gct.fill();
    gct.globalCompositeOperation = "source-atop";        
    if(g_type=="Port of Arrival" || g_type=="Port of Departure") {
        img = document.getElementById("icon_port");
    }
    else if(g_type=="Factory") {
        img = document.getElementById("icon_factory");
    }
    else if(g_type=="Long Transport") {
        img = document.getElementById("icon_ship");
    }
    else {
        img = document.getElementById("icon_staging");
    }
    gct.drawImage(img,0,0,72,72,2,2,(pos_offset*2)-4,(pos_offset*2)-4);
    gct.globalCompositeOperation = "source-over";
    gct.beginPath();
    
    if(g_live==true) {
        gct.strokeStyle = delcolors[1];
    }
    else {
        gct.strokeStyle = delcolors[0];
    }
    gct.arc(pos_offset,pos_offset,pos_offset-2,-.5*Math.PI,2*Math.PI);
    gct.stroke();
    //This has built the outer ring. Now to build the delay ring...
    gct.beginPath();
    gct.strokeStyle = delcolors[3];
    gct.arc(pos_offset,pos_offset,pos_offset-2,-.5*Math.PI,g_arc[0]);
    gct.stroke();
    //And now to build the offschedule-ring...
    gct.beginPath();
    gct.strokeStyle = delcolors[4];
    gct.arc(pos_offset,pos_offset,pos_offset-2,-.5*Math.PI,g_arc[1]);
    gct.stroke();
}

function alive_panes(alive_mode,display_mode) {
    // Wrapper function so that we can display a "loading" icon so you know when the web app is trying to load more data.
    $("#loading_icon").show(50,function() { console.log("loading next with: "+alive_mode+","+alive_display_mode); alive_panes_action(alive_mode,display_mode); } );
}

function alive_panes_action(alive_mode, display_mode) {
    /* 
    Controller for the ALIVE visualizer.

    Display modes:
    "List" : "Data" : "Map" ???? -- need to solve "Map" later

    Alive modes:
    Routes:
        List: All of the current routes at the specified time
        Data: Graph of the route performance at a specified time grouped by route origin
    Journeys:
        List: All of the VINs on the journey (s) and their current position
        Data: ?????
    Gates:
        List: All of the current gates at the specified time
        Data: ?????
    Gate:
        List: All of the VINs at the current gate at the current time
        Data: Fill level, on time performance, summaries

    Sidebar will also have modes.
    */
    
    $("#alive_container").empty();
    alive_chart_counter = 0;
    alive_history.push([alive_mode,display_mode,alive_active_asset,alive_active_gate,alive_active_journeys,alive_active_route,alive_days_ago,time,alive_duration]);
    alive_data_mode = alive_mode;
    alive_display_mode = display_mode;
    /**if(display_mode=="map") {
        $("#map_container").show();
        $("#map_container").css({"margin-top":"38px"});
        $("#alive_container").css({"height":"38px","margin-bottom":"-38px"});
        $("#alive_container").append(alive_header_builder());
    }**/

    if(alive_data_mode==="asset") {
		$("#map_container").show();
        $(".map_zoom_in,.map_zoom_out,.map_data_selector,.map_time_control").show();
        $("#here_logo").show();
        $("#alive_container").hide();
	}
	else {
        $("#map_container").hide();
        $(".map_zoom_in,.map_zoom_out,.map_data_selector,.map_time_control").hide();
        $("#here_logo").hide();
		$("#alive_container").show();
	}

    if (alive_data_needs_refresh==true) {
        alive_search_term = "";
    }

    if (alive_mode == "routes") {
        alive_metadata = {"origin":{"name":"Filter by journey origin","vals":{}},"destination":{"name":"Filter by journey destination","vals":{}}};
        alive_metadata_assoc = {"origin":{},"destination":{}};
        if (alive_data_needs_refresh == true) {
            alive_get_journey_summary(time, alive_duration);

            alive_data_needs_refresh = false;
        }
        else {
            console.log("skipped refreshing data");
        }
        if (display_mode == "list") {
            chart_builder("routes_summary");
        }
        else if (display_mode == "data") {
            data_builder("routes_summary");
        }
    }
    else if (alive_mode == "journeys") {
        //alive_metadata = {"model":{"name":"Filter by model","vals":{}},"checkpoint":{"name":"Filter by checkpoint type","vals":{}},"delay":{"name":"Filter by delay status","vals":{}}};
        alive_metadata = {"model":{"name":"Filter by "+msmap["class"],"vals":{}},"checkpoint":{"name":"Filter by checkpoint type","vals":{}},"delay":{"name":"Filter by delay status","vals":{}}};
        alive_metadata_assoc = {"model":{},"checkpoint":{},"delay":{}};
        if (alive_data_needs_refresh == true) {
            alive_get_journey_summary(time, alive_duration);
            alive_active_journeys = journey_summary[alive_active_route].components;
            alive_get_assets_on_journey(alive_active_journeys);
            alive_data_needs_refresh = false;
            
        }
        else {
            console.log("skipped refreshing data");
        }

        if (display_mode == "list") {
            chart_builder("journey_summary");
        }
        else if (display_mode == "data") {
            data_builder("journey_summary");
        }
    }
    else if (alive_mode == "checkpoints") {
        alive_metadata = {"checkpoint":{"name":"Filter by checkpoint type","vals":{}},"delay":{"name":"Filter by number of delayed "+msmap["gen_plural"],"vals":{}}};
        alive_metadata_assoc = {"checkpoint":{},"delay":{}};
        gates_summary = alive_get_gate_status(time);
        if (display_mode == "list") {
            chart_builder("gates_summary");
        }
        else if (display_mode == "data") {
            alive_checkpoint_data_all();
        }
    }
    else if (alive_mode == "gate") {
        alive_metadata = {"model":{"name":"Filter by "+msmap["class"],"vals":{}},"delay":{"name":"Filter by delay status","vals":{}}};
        alive_metadata_assoc = {"model":{},"delay":{}};
        gates_summary = alive_get_gate_status(time);
        alive_get_gate_assets(alive_active_gate, time, alive_duration);

        if (display_mode == "list") {
            chart_builder("asset_at_gate");
        }
        else if (display_mode == "data") {
            alive_checkpoint_data(alive_active_gate);
        }
    }
    else if (alive_mode == "asset") {
        alive_asset_map(alive_active_asset);
    }
   
   alive_sidebar();
}

function alive_prettydate(number) {
    // Given a non-unixtime number, returns a string in the format "2 days, 5 hours, 30 minutes"
    // Minutes are rounded to the nearest 15 minutes.
    // Given a unixtime, returns a string in the format dd/mm/yy, hh:mm
    number = Math.abs(parseFloat(number));
    var days, hours, minutes;
    var day_string,hour_string,minute_string;
    if(number<10000000) {
        days = Math.floor(number/24);
        if(days==0) {
            day_string = "";
            //minutes = Math.round(((number % 24) * 60) / 15);
            minutes = Math.round(4 * (number-Math.floor(number)));
            if(minutes>0 && minutes <4) {
                minute_string = " "+(minutes * 15)+" min";
            }
            else if(minutes==4) {
                minute_string = "1 h";
            }
            else {
                minute_string = "";
            }
        }
        else if(days==1) {
            day_string = "1 day";
            minute_string = "";
        }
        else {
            day_string = days + " days";
            minute_string = "";
        }
        hours = Math.floor(number % 24);
        if(hours==0) {
            hour_string = "";
        }
        else {
            if(minute_string=="1 h") {
                hours = hours + 1;
                minute_string = "";
            }
            hour_string = hours + " h"
            if(days>0) {
                hour_string = ", " + hour_string;
            }
        }
        return day_string + hour_string + minute_string;
    }
    else {
        var d = new Date(number*1000);
        return d.getDate() + "/" + (d.getMonth()+1) + "/" + (d.getYear() % 100) + ", " + d.getHours() + ":" + ("00"+d.getMinutes()).slice(-2);
    }
}

function alive_prettycost(number) {
    number = number.toFixed(2);
    return "$"+number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function alive_route_summary(sub_route,sub_journeys,cost_delta) {
    var r_summary = $("<div />",{"class":"alive_route_summary",text:raw_aliveroutedata[sub_route].destination});
    r_summary.append("<div><strong>"+journey_summary[sub_route].total+"</strong> "+msmap["gen_plural"]+" tracked during this time window.</div>");
    var l_routes = raw_aliveroutedata[sub_route].journeys;
    var earliest_journey_key = 0;
    var latest_journey_key = 0;
    var historical_journey = 0;
    var missed_routes = 0;
    for(var i in l_routes) {
        if(l_routes[i]==sub_journeys[0]) {
            earliest_journey_key = i;
        }
        if(l_routes[i]==sub_journeys[sub_journeys.length-1]) {
            latest_journey_key = i;
        }
    }
    var avg_delay = 0;
    for(var i=(1*earliest_journey_key);i<=(1*latest_journey_key);i++) {
        if(raw_alivejourneydata[l_routes[i]]!=undefined) {
            avg_delay += parseFloat(raw_alivejourneydata[l_routes[i]].totaldelay)/parseFloat(raw_alivejourneydata[l_routes[i]].total);
        }
        else {
            missed_routes++; // THIS IS BAD WE NEED TO INVESTIGATE WHAT'S GOING ON LATER
        }
    }
    avg_delay = avg_delay / ((latest_journey_key-earliest_journey_key)-missed_routes);
    r_summary.append("<div>The average delay over this time was <strong>"+alive_prettydate(avg_delay)+"</strong>. <strong>"+journey_summary[sub_route].late+"</strong> "+msmap["gen_plural"]+" arrived at their destination seriously late.</div>");
    
    if(alive_chart_mode=="delay") {
        if(parseInt(earliest_journey_key)>=15) {
            historical_journey = earliest_journey_key-15;
        }
        if(earliest_journey_key==0) { earliest_journey_key=2; };
    
        var hist_delay = 0;
        missed_routes = 0;
        for(var i=historical_journey;i<=earliest_journey_key;i++) {
            if(raw_alivejourneydata[l_routes[i]]!=undefined) {
                hist_delay += parseFloat(raw_alivejourneydata[l_routes[i]].totaldelay)/parseFloat(raw_alivejourneydata[l_routes[i]].total);
            }
            else {
                missed_routes++;
            }
        }
        hist_delay = hist_delay / ((earliest_journey_key-historical_journey)+missed_routes);
    
        var delay_change = avg_delay - hist_delay;
        var later;
        var delta_str;
        if(delay_change>=0) { later = "worse"; }
        else { later = "better"; }
    
        if(Math.abs(delay_change)>12) {
            delta_str = "ETA accuracy over this time was <strong>"+later+"</strong> than average by <strong>"+alive_prettydate(delay_change)+"</strong>";
        }
        else {
            delta_str = "ETA accuracy over this time was <strong>average</strong> for this route.";
        }
    
        r_summary.append("<div>"+delta_str+"</div>");

    }
    else {
        var projected_cost = alive_asset_cost[sub_route] * parseInt(journey_summary[sub_route].total);
        var cost_from_misdelivery = parseInt(alive_variable_values["avar_c_ls"].value) * Math.round(parseFloat(alive_variable_values["avar_p_ls"].value)/100 * journey_summary[sub_route].late);
        var overage = (100 * (((projected_cost + cost_from_misdelivery + cost_delta)/projected_cost)-1)).toFixed(2);
        //console.log(projected_cost,cost_from_misdelivery,cost_delta);
        var cost_str = "The total shipping cost was <strong>$" + (projected_cost+cost_from_misdelivery+cost_delta).toFixed(2) + "</strong>, " + overage + "% more than predicted.";
        r_summary.append("<div>"+cost_str+"</div>");
    }

    

    return r_summary;
}

function alive_route_summary_expanded(params) {
    var sub_route = params.sub_route;
    var sub_journeys = params.sub_journeys;
    var gateavgdata = params.gateavgdata;
    var missed_ship = params.missed_ship;
    var delay_cost = params.delay_cost;
    var all_storage_cost = params.storage_cost;
    var assets_requiring_storage = params.storage_count;
    var exp_summary = $("<div />",{"class":"alive_expanded_summary"});
    var s_nd = new Date(2000,0,1,0,0);
    var e_nd = new Date(2000,0,1,0,0);
    var s_al = alive_day(raw_alivejourneydata[sub_journeys[0]].started);
    var e_al = alive_day(raw_alivejourneydata[sub_journeys[sub_journeys.length-1]].ended);
    s_nd.setTime( s_nd.getTime() + s_al * 86400000);
    e_nd.setTime( e_nd.getTime() + e_al * 86400000);
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var c_d = new Date();
    var future = ""
    if(c_d<e_nd) {
        future = " (projected)";
    }

    exp_summary.append("<div class=\"alive_expanded_summary_title\">Data along the <strong>"+raw_aliveroutedata[sub_route].origin+"-"+raw_aliveroutedata[sub_route].destination+" route</div>");
    exp_summary.append("<div class=\"alive_expanded_summary_subtitle\">between <span>"+months[s_nd.getMonth()]+" "+s_nd.getDate()+" and "+months[e_nd.getMonth()]+" "+e_nd.getDate()+"</span>"+future+"</div>");
    
    if(alive_chart_mode=="delay") {
        exp_summary.append("<div class=\"alive_expanded_summary_sectiontitle\">ETA prediction accuracy: summary</div>");
        var delay_prediction = "";
        var delay_str;
        var gatesummary,gaterange;
        gatesummary = $("<div />",{"class":"expanded_gatesummary","text":"Average "});
        gaterange = (gateavgdata["exit"][1] - gateavgdata["exit"][2]) * 12;
        gatesummary.append("ETA projections for <span class=\"summary_exit\" id=\"summary_exit\">Port of Departure: "+raw_alivegates[raw_aliveroutedata[sub_route].departure_gate].name+"</span> ");
        if(gaterange>24) { 
            delay_prediction = " were extremely inaccurate during this time period, with "+msmap["gen_plural"]+" arriving from their originating factory along a time period of "; 
            delay_str = $("<span />",{"class":"alive_note_vbad","text":"+/- "+alive_prettydate(gaterange)});
            $(delay_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else if(gaterange>12) { 
            delay_prediction = " were slightly outside of predicted values during this time period, with a variation ";
            delay_str = $("<span />",{"class":"alive_note_mbad","text":"+/- "+alive_prettydate(gaterange)});
            $(delay_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else { 
            delay_prediction = " stayed within expected bounds for this time period, with an average inaccuracy of less than ";
            delay_str = $("<span />",{"class":"alive_note_good","text":alive_prettydate(gaterange)});
            $(delay_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        gatesummary.append(delay_prediction);
        gatesummary.append(delay_str);
        exp_summary.append(gatesummary);
    
        gatesummary = $("<div />",{"class":"expanded_gatesummary","text":"Projections "});
        gaterange = (gateavgdata["ship"][1] - gateavgdata["ship"][2]) * 12;
        gatesummary.append(" of loading and departure time for <span class=\"summary_ship\" id=\"summary_ship\">Maritime Transport</span> ");
        if(gaterange>24) { 
            delay_prediction = " were extremely inaccurate during this time period, with "+missed_ship+" "+msmap["gen_plural"]+" missing their intended departure vessel and necessitating extensive rescheduling. Overall deviation from the expected time was "; 
            delay_str = $("<span />",{"class":"alive_note_vbad","text":"+/- "+alive_prettydate(gaterange)});
            $(delay_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else if(gaterange>12) { 
            delay_prediction = " were outside of predicted values during this time period, leading to "+missed_ship+" "+msmap["gen_plural"]+" missing their allocated vessel. Total variation was ";
            delay_str = $("<span />",{"class":"alive_note_mbad","text":"+/- "+alive_prettydate(gaterange)});
            $(delay_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else { 
            delay_prediction = " stayed within expected bounds for this time period, with an average inaccuracy of less than ";
            delay_str = $("<span />",{"class":"alive_note_good","text":alive_prettydate(gaterange)});
            $(delay_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        gatesummary.append(delay_prediction);
        gatesummary.append(delay_str);
        exp_summary.append(gatesummary);
    
        gatesummary = $("<div />",{"class":"expanded_gatesummary","text":"Projected "});
        gaterange = (gateavgdata["entry"][1] - gateavgdata["entry"][2]) * 12;
        gatesummary.append(" times for processing at <span class=\"summary_entry\" id=\"summary_entry\">Port of Entry: "+raw_aliveroutedata[sub_route].destination+"</span> ");
        if(gaterange>24) { 
            delay_prediction = " were extremely inaccurate during this time period, leading to impacts in delivering "+msmap["gen_plural"]+" on time, with an average deviation from predicted values of "; 
            delay_str = $("<span />",{"class":"alive_note_vbad","text":"+/- "+alive_prettydate(gaterange)});
            $(delay_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else if(gaterange>12) { 
            delay_prediction = " were somewhat outside of predicted values during this time period, with "+msmap["gen_plural"]+" missing their planned time by ";
            delay_str = $("<span />",{"class":"alive_note_mbad","text":"+/- "+alive_prettydate(gaterange)});
            $(delay_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else { 
            delay_prediction = " stayed within expected bounds for this time period, with an average inaccuracy of less than ";
            delay_str = $("<span />",{"class":"alive_note_good","text":alive_prettydate(gaterange)});
            $(delay_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        gatesummary.append(delay_prediction);
        gatesummary.append(delay_str);
        exp_summary.append(gatesummary);
    }
    else if(alive_chart_mode=="cost") {
        exp_summary.append("<div class=\"alive_expanded_summary_sectiontitle\">Cost overrun: summary</div>");
        var projected_cost = alive_asset_cost[sub_route] * parseInt(journey_summary[sub_route].total);
        var cost_from_misdelivery = parseInt(alive_variable_values["avar_c_ls"].value) * Math.round(parseFloat(alive_variable_values["avar_p_ls"].value)/100 * journey_summary[sub_route].late);
        var overage = (100 * (((projected_cost + cost_from_misdelivery + delay_cost)/projected_cost)-1)).toFixed(2);
        var gatesummary,overrun_str;
        gatesummary = $("<div />",{"class":"expanded_gatesummary","text":"The total cost for all "+msmap["gen_plural"]+" shipped over this journey was estimated at "})
        gatesummary.append("<strong>"+alive_prettycost(projected_cost)+"</strong>. Total actual cost is");
        if(c_d<e_nd) {
            gatesummary.append(" projected to be ")
        }
        if(overage>40) {
            overrun_str = $("<span />",{"class":"alive_note_vbad","text":alive_prettycost(projected_cost+delay_cost+cost_from_misdelivery)});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else if(overage>15) {
            overrun_str = $("<span />",{"class":"alive_note_mbad","text":alive_prettycost(projected_cost+delay_cost+cost_from_misdelivery)});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else if(overage>5) {
            overrun_str = $("<span />",{"class":"alive_note_neutral","text":alive_prettycost(projected_cost+delay_cost+cost_from_misdelivery)});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else {
            overrun_str = $("<span />",{"class":"alive_note_good","text":alive_prettycost(projected_cost+delay_cost+cost_from_misdelivery)});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        gatesummary.append(overrun_str);
        gatesummary.append(" representing excess costs of ");
        if(overage>40) {
            overrun_str = $("<span />",{"class":"alive_note_vbad","text":alive_prettycost(delay_cost+cost_from_misdelivery)+" ("+overage+"%)."});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else if(overage>15) {
            overrun_str = $("<span />",{"class":"alive_note_mbad","text":alive_prettycost(delay_cost+cost_from_misdelivery)+" ("+overage+"%)."});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else if(overage>5) {
            overrun_str = $("<span />",{"class":"alive_note_neutral","text":alive_prettycost(delay_cost+cost_from_misdelivery)+" ("+overage+"%)."});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        else {
            overrun_str = $("<span />",{"class":"alive_note_good","text":alive_prettycost(delay_cost+cost_from_misdelivery)+" ("+overage+"%)."});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
        }
        gatesummary.append(overrun_str);
        gatesummary.append(". The excess cost can be attributed to the following factors: ");
        exp_summary.append(gatesummary);

        gatesummary = $("<div />",{"class":"expanded_gatesummary"});
        gatesummary.append("<strong>Late deliveries: </strong>");
        gatesummary.append(journey_summary[sub_route].late+" "+msmap["gen_plural"]+" arrived with damage attributable to delay");
        if(cost_from_misdelivery>9000) {
            gatesummary.append(", resulting in an estimated cost of ");
            overrun_str = $("<span />",{"class":"alive_note_vbad","text":alive_prettycost(cost_from_misdelivery)});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
            gatesummary.append(overrun_str);
            gatesummary.append(" due to lost sales opportunities.");
        }
        else if(cost_from_misdelivery>3000) {
            gatesummary.append(", resulting in an estimated cost of ");
            overrun_str = $("<span />",{"class":"alive_note_mbad","text":alive_prettycost(cost_from_misdelivery)});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});    
            gatesummary.append(overrun_str);
            gatesummary.append(" due to lost sales opportunities.");        
        }
        else {
            gatesummary.append(", resulting in minimal contribution to excess cost.");
        }
        exp_summary.append(gatesummary);

        if(missed_ship>0) {
            gatesummary = $("<div />",{"class":"expanded_gatesummary"});
            gatesummary.append("<strong>Rerouting: </strong>");
            gatesummary.append(missed_ship+" "+msmap["type_plural"]+" missed their assigned vessel, creating ");
            var missed_ship_cost = missed_ship * alive_variable_values["avar_c_ms"].value;
            if(missed_ship_cost>20000) {
                overrun_str = $("<span />",{"class":"alive_note_vbad","text":alive_prettycost(missed_ship_cost)});
                $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
                gatesummary.append(overrun_str);
                gatesummary.append(" in unplanned costs due to the need to find new transportation.");
            }
            else {
                overrun_str = $("<span />",{"class":"alive_note_vbad","text":alive_prettycost(missed_ship_cost)});
                $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
                gatesummary.append(overrun_str);
                gatesummary.append(" in unplanned costs due to the need to find new transportation.");
            }
            exp_summary.append(gatesummary);
        }

        gatesummary = $("<div />",{"class":"expanded_gatesummary"});
        gatesummary.append("<strong>Storage costs: </strong>");
        gatesummary.append("On "+assets_requiring_storage+" occasions, "+msmap["gen_plural"]+" had inaccurate ETA predictions at the port of departure, port of arrival, or in staging areas");
        if(all_storage_cost>20000) {
            gatesummary.append(", resulting in an estimated cost of ");
            overrun_str = $("<span />",{"class":"alive_note_vbad","text":alive_prettycost(all_storage_cost)});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
            gatesummary.append(overrun_str);
            gatesummary.append(" due to unanticipated storage and maintenance costs.");
        }
        else if(all_storage_cost>3000) {
            gatesummary.append(", resulting in an estimated cost of ");
            overrun_str = $("<span />",{"class":"alive_note_mbad","text":alive_prettycost(all_storage_cost)});
            $(overrun_str).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});    
            gatesummary.append(overrun_str);
            gatesummary.append(" due to unanticipated storage and maintenance costs.");        
        }
        else {
            gatesummary.append(", resulting in minimal contribution to excess cost.");
        }

        //gatesummary.append("ETA projections for <span class=\"summary_exit\" id=\"summary_exit\">Port of Departure: Bremerhaven</span> ");
        exp_summary.append(gatesummary);
    }

    
    var gates = {};

    exp_summary.append("<div class=\"alive_expanded_summary_sectiontitle\">Overview of "+msmap["gen_plural"]+" by checkpoint</div>");
    var summary_box = $("<div />",{"class":"alive_summary_box"});
    var a_idx = Object.keys(assets_summary);
    for(var i in a_idx) {
        if(gates[assets_summary[a_idx[i]].current_checkpoint]==undefined) {
            gates[assets_summary[a_idx[i]].current_checkpoint] = {
                "count":1,
                "delay":parseFloat(assets_summary[a_idx[i]].delay)
            }
        }
        else {
            gates[assets_summary[a_idx[i]].current_checkpoint].count+=1;
            gates[assets_summary[a_idx[i]].current_checkpoint].delay+=parseFloat(assets_summary[a_idx[i]].delay);
        }
    }
    var g_idx = Object.keys(gates);
    var g_title;
    var g_type;
    var statstr;
    var delstr;
    var delbubble;
    var del_avg;
    var ship_route;
    for(var i in g_idx) {
        summary_box = $("<div />",{"class":"alive_summary_box"});
        if(g_idx[i]=="end") {
            g_title = "";
            statstr = " have left the final checkpoint and are scheduled for delivery.";
            g_type = "end";
        }
        else {
            g_title = raw_alivegates[g_idx[i]].shortname;
            g_type = raw_alivegates[g_idx[i]].type;
            if(g_type=="Long Transport") {
                ship_route = raw_alivegates[g_idx[i]].name.split("Maritime, ")[1].replace(")","");
                statstr = " are currently aboard the " + g_title.toUpperCase() + " on the route <strong>"+ship_route+"</strong>.";
            }
            else if(g_type=="Short Transport") {
                statstr = " are in transit to the next gate."
            }
            else if(g_type=="Port of Arrival") {
                statstr = " are at <strong>Port of Entry: " + g_title + "</strong>.";
            }
            else if(g_type=="Port of Departure") {
                statstr = " are waiting at <strong>Port of Departure: " + g_title + "</strong>.";
            }
            else {
                statstr = " are at gate &quot;"+g_title+"&quot;.";
            }
        }
        del_avg = (gates[g_idx[i]].delay / gates[g_idx[i]].count)/3600;
        if(del_avg >= 24) {
            del_bubble = $("<span />",{"class":"alive_note_vbad","text":alive_prettydate(del_avg)});
            $(del_bubble).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
            if(g_type=="end") {
                delstr = " Updated delivery time is later than predicted by "
            }
            else {
                delstr = " Delays are above projected values with an ETA impact of ";
            }
        }
        else if(del_avg >= 12) {
            del_bubble = $("<span />",{"class":"alive_note_mbad","text":alive_prettydate(del_avg)});
            $(del_bubble).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
            if(g_type=="end") {
                delstr = " The route is slightly behind schedule, with final delivery delayed by ";
            }
            else {
                delstr = " Traffic through this gate is delayed slightly by ";
            }
        }
        else if(del_avg <= 6) {
            del_bubble = $("<span />",{"class":"alive_note_good","text":alive_prettydate(del_avg)});
            $(del_bubble).css({"width":"fit-content","float":"unset","display":"inline-block","margin-left":"0"});
            if(g_type=="end") {
                delstr = " "+msmap["gen_plural"]+" are expected to arrive earlier than predicted by "
            }
            else {
                delstr = " "+msmap["gen_plural"]+" at this gate are ahead of schedule by ";
            }
        }
        else {
            if(g_type=="end") {
                delstr = " The route should be completed on schedule."
            }
            else {
                delstr = "";
            }
            del_bubble = "";
        }

        summary_box.append("<span class=\"alive_summary_important\">"+gates[g_idx[i]].count + "</span> "+msmap["gen_plural"]+" on this route "+statstr+delstr);
        summary_box.append(del_bubble);
        exp_summary.append(summary_box);
    }

    return exp_summary;
}

function alive_searchbar() {
    var def_search;
    if(alive_search_term=="") {
        def_search = alive_search_default[alive_data_mode];
        if(def_search==undefined) { def_search = "Search"; }
    }
    else {
        def_search = alive_search_term;
    }
    
    var searchbar = $("<input />",{"class":"alive_search","value":def_search,"id":"alive_searchbar"});
    searchbar.attr({"type":"text"});
    searchbar.on("focus",function() { alive_searchbar_cycle(true); });
    searchbar.on("blur",function() { alive_searchbar_cycle(false); });
    searchbar.on("input",function() { alive_searchbar_filter(); });
    return searchbar;
}

function alive_searchbar_cycle(activate) {
    var search_text = $("#alive_searchbar").val();
    var def_search = alive_search_default[alive_data_mode];
    if(def_search==undefined) { def_search = "Search"; }
    if(activate==true) {
        $("#alive_searchbar").addClass("alive_search_active");
        if(search_text==def_search) {
            $("#alive_searchbar").val("");
        }
    }
    else {
        $("#alive_searchbar").removeClass("alive_search_active");
        if(search_text=="") {
            $("#alive_searchbar").val(def_search);
        }
    }
}

function alive_searchbar_filter() {
    var current_search_text = $("#alive_searchbar").val();
    var search_text;
    if(current_search_text != alive_search_default[alive_data_mode]) {
        alive_search_term = current_search_text;
        search_text = current_search_text.toLowerCase();
    }
    else {
        search_text = "";
    }

    var filtered_cats = Object.keys(alive_metadata_assoc);
    var filtered_ids = {};
    var filters_active = false;
    var keypairs;
    for(var i=0;i<filtered_cats.length;i++) {
        keypairs = Object.keys(alive_metadata_assoc[filtered_cats[i]]);
        for(var j=0;j<keypairs.length;j++) {
            if(alive_metadata_assoc[filtered_cats[i]][keypairs[j]]==true) {
                filters_active = true;
                console.log(alive_metadata[filtered_cats[i]].vals[keypairs[j]]);
                for(var k=0;k<alive_metadata[filtered_cats[i]].vals[keypairs[j]].length;k++) {
                    filtered_ids[alive_metadata[filtered_cats[i]].vals[keypairs[j]][k]]=true;
                }
            }
        }
    }
    
    var content;
    var match_in_row;
    $(".alive_chart_row").each(function (i,row) {
        match_in_row = false;
        $(row).children().each(function (j,cell) {
            if(j<2) {
                content = $(cell).text().toLowerCase();
                if(content.search(search_text)!=-1) {
                    if((filters_active==true && filtered_ids[$(row)[0].id]==true) || filters_active==false) {
                        match_in_row = true;
                    }
                }
            }
        })
        if(match_in_row==true) {
            $(row).show();
        }
        else {
            $(row).hide();
        }
    });
}

function alive_sidebar() {
    $("#sidebar").empty();
    alive_leftball_active = false;
    alive_rightball_active = false;
    alive_p_start = false;
    alive_p_end = false;
    if(alive_data_mode=="routes") {
        var caption = $("<div />",{"class":"alive_sidebar_title",text:"Filter routes"});
        $("#sidebar").append(caption);
        if(alive_display_mode=="list") {
            var searchbar = alive_searchbar();
            $("#sidebar").append(searchbar);
            alive_sidebar_create_all_filters();
        }
    }
    else if(alive_data_mode=="checkpoints") {
        var caption = $("<div />",{"class":"alive_sidebar_title",text:"Search and filter"});
        $("#sidebar").append(caption);
        if(alive_display_mode=="list") {
            var searchbar = alive_searchbar();
            $("#sidebar").append(searchbar);
            alive_sidebar_create_all_filters();
        }
    }
    else if(alive_data_mode=="journeys") {
        var caption = $("<div />",{"class":"alive_sidebar_title",text:"Route details"});
        $("#sidebar").append(caption);
        var j_data = journey_summary[alive_active_route];
        var routetitle = $("<div />",{"class":"alive_sidebar_journeyname",text:j_data.origin+" to "+j_data.destination});
        var routevia = $("<div />",{"class":"alive_sidebar_journeyvia",text:"Via"});
        routevia.append("<span>"+raw_alivegates[raw_aliveroutedata[alive_active_route].departure_gate].name+"</span>");
        
        $("#sidebar").append(routetitle);
        $("#sidebar").append(routevia);

        var leadtimeheader = $("<div />",{"class":"alive_sidebar_journeyvia","text":"Avg. lead time/delay"});
        $(leadtimeheader).css({"margin-top":24});
        $("#sidebar").append(leadtimeheader);

        
        var leadtime = $("<div />",{"class":"alive_sidebar_leadtime"});
        leadtime.append("<div id=\"leadtime\">"+alive_prettydate(j_data.lead)+"</div>");

        var avg_delay = j_data.delay;
        var delay_str;
        if(avg_delay>=24) {
            delay_str = $("<span />",{"class":"alive_note_vbad","text":"+ "+alive_prettydate(avg_delay)});
        }
        else if(avg_delay>=10) {
            delay_str = $("<span />",{"class":"alive_note_mbad","text":"+ "+alive_prettydate(avg_delay)});
        }
        else if(avg_delay>=0) {
            delay_str = $("<span />",{"class":"alive_note_neutral","text":"+ "+alive_prettydate(avg_delay)});
        }
        else if(avg_delay<2) {
            delay_str = $("<span />",{"class":"alive_note_good","text":"- "+alive_prettydate(avg_delay)});
        }
        leadtime.append(delay_str);
        $("#sidebar").append(leadtime);

        

        $("#sidebar").append("<div class=\"alive_sidebar_leadtime\"></div>");
        if(alive_display_mode=="list") {
            var searchbar = alive_searchbar();
            $("#sidebar").append(searchbar);
            alive_sidebar_create_all_filters();
        }
    }
    else if(alive_data_mode=="gate") {
        var caption = $("<div />",{"class":"alive_sidebar_title",text:"Checkpoint details"});
        $("#sidebar").append(caption);
        var g_data = gates_summary[alive_active_gate];
        var gatetitle = $("<div />",{"class":"alive_sidebar_journeyname",text:g_data.name});
        var gatetype = $("<div />",{"class":"alive_sidebar_journeyvia",text:"Type"});
        gatetype.append("<span>"+g_data.type+"</span>");
        $("#sidebar").append(gatetitle);
        $("#sidebar").append(gatetype);

        var filllevel_header = $("<div />",{"class":"alive_sidebar_journeyvia","text":"Capacity/Fill level"});
        $(filllevel_header).css({"margin-top":24});
        $("#sidebar").append(filllevel_header);

        
        var filllevel = $("<div />",{"class":"alive_sidebar_leadtime"});
        filllevel.append("<div id=\"leadtime\">"+g_data.capacity +"/"+g_data.fill+"</div>");

        $("#sidebar").append(filllevel);

        $("#sidebar").append("<div class=\"alive_sidebar_leadtime\"></div>");
        var searchbar = alive_searchbar();
        $("#sidebar").append(searchbar);
        alive_sidebar_create_all_filters();
    }

    else if(alive_data_mode=="asset") {
        var caption = $("<div />",{"class":"alive_sidebar_title",text:cap(msmap["type"])+" details"});
        $("#sidebar").append(caption);
        var a_data = raw_assetdata[alive_active_asset];
        var atitle = $("<div />",{"class":"alive_sidebar_journeyname",text:a_data.uid});
        var atype = $("<div />",{"class":"alive_sidebar_journeyvia",text:cap(msmap["class"])});
        atype.append("<span>"+a_data.name+"</span>");
        $("#sidebar").append(atitle);
        $("#sidebar").append(atype);

        var progress = a_data.progress;
        var p_stages = Object.keys(progress);
        var progress_div = $("<div />",{"class":"alive_progress_sidebar"});
        var stage_div,stage_ball,stage_title,stage_title_div,stage_sub_1,stage_sub_2,stage_sub_3,s_data,s_type,del_color,del_str;
        var current_delay=0;
        var elapsed_time=0;
        var last_good_time=a_data.start;
        var last_finished_gate = 0;
        var last_finished_name = "";
        var time_remaining = a_data.naiveeta;
        var current_time = new Date().getTime()/1000;
        for(var i=0;i<p_stages.length;i++) {
            s_data = progress[p_stages[i]];
            s_type = raw_alivegates[s_data[0]].type;
            
            stage_div = $("<div />",{"class":"alive_stage_div"});
            stage_ball = $("<div />",{"class":"alive_stage_ball"});
            stage_sub_1 = $("<div />",{"class":"alive_stage_sub"});
            stage_sub_2 = $("<div />",{"class":"alive_stage_sub"});
            stage_sub_3 = $("<div />",{"class":"alive_stage_sub"});
            if(s_type=="Staging") {
                stage_title = "Staging";
            }
            else if(s_type=="Short Transport") {
                stage_title = "Terrestrial";
            }
            else if(s_type=="Long Transport") {
                stage_title = "Maritime: "+raw_alivegates[s_data[0]].shortname;
                if(a_data.missed_ship==true) {
                    if(s_data[1]>current_time) {
                        stage_sub_3.append("<div class=\"alive_stage_missed_possible\">Likely to miss scheduled ship</div>");
                        
                    }
                    else {
                        stage_sub_3.append("<div class=\"alive_stage_missed\">Asset missed planned ship</div>");
                    }
                }
            }
            else {
                stage_title = raw_alivegates[s_data[0]].shortname;
            }
            stage_title_div = $("<div />",{"class":"alive_stage_title","text":stage_title});
            

            if(s_data[1]>current_time) {
                // the time that the gate started is LATER than the current time, i.e. it hasn't hit yet
                stage_div.css({"border-color":"var(--heremidgrey)"});
                stage_ball.css({"background-color":"var(--heremidgrey)"});
                stage_title_div.css({"color":"var(--heremidgrey)"});
                if(i>0) {
                    stage_sub_1.append("ETA planned: " + alive_prettydate(last_good_time + ((elapsed_time + s_data[2]) * 3600)) );
                    stage_sub_2.append("ETA est: " + alive_prettydate(last_good_time + ((elapsed_time + s_data[2] + current_delay) * 3600)) );
                }
                else {
                    stage_sub_1.append("Departed at: " + alive_prettydate(s_data[1]));
                }
                if(current_delay<0) {
                    stage_sub_2.append("<span style=\"color:#06b87c;\">- "+alive_prettydate(current_delay)+"</span>");
                }
                else if(current_delay>6) {
                    stage_sub_2.append("<span style=\"color:#fab800;\">+ "+alive_prettydate(current_delay)+"</span>");
                }
            }
            else {
                // the gate STARTED before the current time, but we need to know if it ended afterwards
                if(s_data[4]>36) {
                    del_color = "#c41c33";
                }
                else if(s_data[4]>12) {
                    del_color = "#fab800";
                }
                else if(s_data[4]<0) {
                    del_color = "#06b87c";
                }
                else {
                    del_color = "#ffffff";
                }
                stage_title_div.css({"color":del_color});
                stage_ball.css({"background-color":del_color});
                stage_div.css({"border-color":del_color});
                stage_sub_1.css({"color":"#ffffff"});
                if(current_time < (s_data[1]+(s_data[3]*3600))) {
                    // the current time is before the asset LEFT the gate, i.e. it's still IN the gate
                    stage_sub_1.append("ETA planned: " + alive_prettydate( s_data[1] + (s_data[2]*3600) ));
                    stage_sub_2.append("ETA est: " + alive_prettydate( s_data[1] + ((s_data[2]+current_delay) * 3600) ));
                    last_finished_name = stage_title;
                }
                else {
                    // this gate is completely finished
                    stage_sub_1.append("ETA planned: " + alive_prettydate( s_data[1] + (s_data[2]*3600) ));
                    stage_sub_2.append("ETA actual: " + alive_prettydate( s_data[1] + (s_data[3]*3600) ));
                    last_finished_gate = i;
                    last_finished_name = stage_title;
                    stage_sub_2.css({"color":"#ffffff"});
                }
                current_delay = s_data[4];
                console.log(stage_title,current_delay);
                if(current_delay>24) {
                    stage_sub_2.append("<span style=\"color:#c41c33;\"> + "+alive_prettydate(current_delay)+"</span>");
                }
                else if(current_delay>6) {
                    stage_sub_2.append("<span style=\"color:#fab800;\"> + "+alive_prettydate(current_delay)+"</span>");
                }
                else if(current_delay<0) {
                    stage_sub_2.append("<span style=\"color:#06b87c;\"> - "+alive_prettydate(current_delay)+"</span>");
                }
                elapsed_time+=s_data[3];
                time_remaining-=s_data[2];
                last_good_time = s_data[1];
            }
            if(i==0) {
                if(s_data[1]>current_time) {
                    stage_sub_1.text("Planned departure: " + alive_prettydate( s_data[1] + (s_data[3]*3600) ));
                }
                else {
                    stage_sub_1.text("Departed at: " + alive_prettydate( s_data[1] + (s_data[3]*3600) ));
                }
                stage_sub_2.text("");
            }

            if(i==p_stages.length-1) {
                stage_div.css({"border-color":"var(--heredarkgrey)"});
            }
            
            stage_div.append(stage_ball);
            stage_div.append(stage_title_div);
            stage_div.append(stage_sub_1);
            stage_div.append(stage_sub_2);
            stage_div.append(stage_sub_3);
            progress_div.append(stage_div);
        }
        
        var acheckpoint = $("<div />",{"class":"alive_sidebar_journeyvia",text:"Checkpoint"});
        if(last_finished_gate==p_stages.length-1) {
            last_finished_name = "Released to carrier";
            time_remaining = 0;
        }
        acheckpoint.append("<span>"+last_finished_name+"</span>");
        $("#sidebar").append(acheckpoint);
        
        console.log(last_good_time,current_delay,elapsed_time,time_remaining);
        var asset_eta_header = $("<div />",{"class":"alive_sidebar_journeyvia","text":"Current ETA"});
        $(asset_eta_header).css({"margin-top":24});

        var asset_eta = $("<div />",{"class":"alive_sidebar_leadtime"});
        asset_eta.append("<div id=\"leadtime\">"+alive_prettydate( a_data.start + ((current_delay+elapsed_time+time_remaining) * 3600) )+"</div>");

        var delay_str;
        if(current_delay>=24) {
            delay_str = $("<span />",{"class":"alive_note_vbad","text":"+ "+alive_prettydate(current_delay)});
        }
        else if(current_delay>=10) {
            delay_str = $("<span />",{"class":"alive_note_mbad","text":"+ "+alive_prettydate(current_delay)});
        }
        else if(current_delay>=0) {
            delay_str = $("<span />",{"class":"alive_note_neutral","text":"+ "+alive_prettydate(current_delay)});
        }
        else if(current_delay<2) {
            delay_str = $("<span />",{"class":"alive_note_good","text":"- "+alive_prettydate(current_delay)});
        }
        asset_eta.append(delay_str);

        $("#sidebar").append(asset_eta_header);
        $("#sidebar").append(asset_eta);
        $("#sidebar").append(progress_div);
    }

    if(alive_data_mode!="asset") {
        var realtimeselector = $("<div />",{"class":"alive_time_selector",text:"Real-time"});
        var historicalselector = $("<div />",{"class":"alive_time_selector",text:"Historical"});
        realtimeselector.on("click",function() { alive_timechange("realtime"); });
        historicalselector.on("click",function() { alive_timechange("historical"); });

        if(alive_realtime==true) {
            $(realtimeselector).append("<div id=\"alive_realtime_radio\" class=\"alive_radio_button_sel\"></div>");
            $(historicalselector).append("<div id=\"alive_historical_radio\" class=\"alive_radio_button\"></div>");
        }
        else {
            $(realtimeselector).append("<div id=\"alive_realtime_radio\" class=\"alive_radio_button\"></div>");
            $(historicalselector).append("<div id=\"alive_historical_radio\" class=\"alive_radio_button_sel\"></div>");
        }
        $("#sidebar").append(realtimeselector);
        $("#sidebar").append(historicalselector);
        if(alive_realtime==false) {
            alive_timechange("historical");
        }
    }
    $("#loading_icon").hide();
}

function alive_sidebar_create_all_filters() {
    var filters = Object.keys(alive_metadata);
    for(var i=0;i<filters.length;i++) {
        if(filters[i]!="keypairs") {
            alive_sidebar_create_filter(filters[i]);
        }
    }
}

function alive_sidebar_create_filter(type) {
    var filter_div;
    var filter_options = $("<div />",{"class":"alive_filter_options","id":"alive_filter_options_"+type});
    var options = Object.keys(alive_metadata[type].vals);
    var filters_active = 0;
    for(var i=0;i<options.length;i++) {
        filter_key = type + "_" + options[i];
        if(alive_metadata_assoc[type][options[i]]==true) {
            filters_active++;
            filter_option = $("<div />",{"class":"alive_filter_option_sel","id":"alive_filter_opt_"+filter_key.replace(" ","_").toLowerCase(),"text":options[i]});
        }
        else {
            filter_option = $("<div />",{"class":"alive_filter_option_unsel","id":"alive_filter_opt_"+filter_key.replace(" ","_").toLowerCase(),"text":options[i]});
        }
        filter_option.on("click",{arg1:[type,options[i]]},function(e) { alive_sidebar_filter_action(e.data.arg1); });
        filter_options.append(filter_option);
    }
    if(filters_active>0) {
        filter_div = $("<div />",{"class":"alive_filter_container_active","id":"alive_filter_"+type,"text":alive_metadata[type].name.replace("Filter","Filtering")+" ("+filters_active+" active)"});
    }
    else {
        filter_div = $("<div />",{"class":"alive_filter_container","id":"alive_filter_"+type,"text":alive_metadata[type].name});
    }
    filter_div.on("click",function() {alive_sidebar_filter_toggle(type); });
    filter_div.append(filter_options);
    $("#sidebar").append(filter_div);
}

function alive_sidebar_filter_action(filter_arr) {
    if(alive_metadata_assoc[filter_arr[0]][filter_arr[1]]==true) {
        $("#alive_filter_opt_"+filter_key.replace(" ","_").toLowerCase()).removeClass("alive_filter_option_sel");
        $("#alive_filter_opt_"+filter_key.replace(" ","_").toLowerCase()).removeClass("alive_filter_option_unsel");
        alive_metadata_assoc[filter_arr[0]][filter_arr[1]]=false;
    }
    else {
        $("#alive_filter_opt_"+filter_key.replace(" ","_").toLowerCase()).removeClass("alive_filter_option_unsel");
        $("#alive_filter_opt_"+filter_key.replace(" ","_").toLowerCase()).removeClass("alive_filter_option_sel");
        alive_metadata_assoc[filter_arr[0]][filter_arr[1]]=true;
    }
    alive_sidebar();
    alive_searchbar_filter();
}

function alive_sidebar_filter_toggle(filter_type) {
    $("#alive_filter_options_"+filter_type).toggle();   
}

function alive_timechange(mode) {
    var apply_button_area = $("<div />",{"class":"alive_time_selector_buttons","id":"alive_time_selector_buttons"});
    var apply_button = $("<div />",{"class":"alive_time_selector_apply","text":"Apply"});
    var reset_button = $("<div />",{"class":"alive_time_selector_reset","text":"Reset"});
    $(apply_button_area).append(reset_button);
    $(apply_button_area).append(apply_button);
    if(alive_realtime==true) {
        apply_button_area.show();
    }
    else {
        apply_button_area.hide();
    }
    if(mode=="historical") {
        $("#alive_realtime_radio").removeClass("alive_radio_button_sel");
        $("#alive_historical_radio").removeClass("alive_radio_button");
        $("#alive_realtime_radio").addClass("alive_radio_button");
        $("#alive_historical_radio").addClass("alive_radio_button_sel");
        if($(".alive_timewidget").length==0) {
            var timechangewidget = alive_timechangewidget();
            var timechangeheader = $("<div />",{"class":"alive_sidebar_title","text":"Days ago"});
            timechangeheader.css({"color":"#95979C","margin-top":25,"margin-left":20,"text-transform":"uppercase"});
            $("#sidebar").append(timechangeheader);
            $("#sidebar").append(timechangewidget);
        }
        reset_button.on("click",function() { alive_sidebar(); });
        apply_button.on("click",function() { alive_change_time(); });
    }
    else if(mode=="realtime") {
        $("#alive_realtime_radio").removeClass("alive_radio_button");
        $("#alive_historical_radio").removeClass("alive_radio_button_sel");
        $("#alive_realtime_radio").addClass("alive_radio_button_sel");
        $("#alive_historical_radio").addClass("alive_radio_button");
        reset_button.on("click",function() { alive_sidebar(); });
        apply_button.on("click",function() { alive_change_time(true); });
        apply_button_area.show();
    }
    $("#sidebar").append(apply_button_area);
}

function alive_timechangewidget() {
    var timechangeparent = $("<div />", { "class": "alive_timewidget", "id": "alive_timewidget" });
    var timechange = $("<div />");
    alive_p_start = alive_days_ago;
    alive_p_end = alive_days_ago + alive_duration;
    $(timechange).slider({
        range: true,
        values: [alive_days_ago, alive_days_ago + alive_duration],
        min: 0,
        max: 180,
        step: 10,
        slide: function (event, ui) {
            for(var i = 0;i<=18;i++) {
                if (i >= (Math.round(ui.values[0]/10)) && i <= (Math.round(ui.values[1]/10))) {
                    $("#timestrip_"+i).addClass("alive_timewidget_num_sel");
                    $("#timestrip_"+i).removeClass("alive_timewidget_num_unsel");
                }
                else {
                    $("#timestrip_"+i).addClass("alive_timewidget_num_unsel");
                    $("#timestrip_"+i).removeClass("alive_timewidget_num_sel");                    
                }
            }
            alive_p_start = ui.values[0];
            alive_p_end = ui.values[1];
            if(alive_p_start!=alive_days_ago || alive_p_end != (alive_days_ago + alive_duration)) {
                $("#alive_time_selector_buttons").show();
            }
            else {
                $("#alive_time_selector_buttons").hide();
            }
        }
    });
    $(timechangeparent).append(timechange);


    var day_sel_width = (sidebar_width-60)/18;
    if(sidebar_width<10) {
        day_sel_width = 18.69444;
    }
    var days_ago = alive_days_ago;
    var day_div;
    var end_dec = days_ago + alive_duration;
    var tick;
    for (var i = 0; i <= 18; i++) {
        if(i%2==0) {
            tick = i*10;
        }
        else {
            tick = "|"
        }
        if (i*10 >= days_ago && i*10 <= end_dec) {
            day_div = $("<div />", { "id":"timestrip_"+i,"class": "alive_timewidget_num_sel", "text": tick });
        }
        else {
            day_div = $("<div />", { "id":"timestrip_"+i,"class": "alive_timewidget_num_unsel", "text": tick });
        }
        day_div.css({ "left": (i*(day_sel_width+1))-5 });
        timechangeparent.append(day_div);
    }
    return timechangeparent;
    //      $( "#amount" ).val( "$" + $( "#slider" ).slider( "value" ) );
}

function alive_variable_popup() {


    /*
        This creates and populates an alert popup. The popup has three elements:
        
        1. A title
        2. Body text, which consists of an array of paragraphs.
        3. Options, for which the first option in the array will be presented as the "default"
        
        A line of body text bracked by "$$line$$" will be presented as a special <span> used for emphasis.
    */

    $("#alert_popup").empty();
    var alert_title = $("<div />", { "id": "alert_title", "text": "Cost calculation variables" });
    var alert_text = $("<div />", { "id": "alert_text" });

    var alive_variable_names = Object.keys(alive_variable_values);
    var avar;
    var ainput;
    var avardiv;
    for(var i=0;i<alive_variable_names.length;i++){
        avardiv = $("<div />");
        avar = alive_variable_values[alive_variable_names[i]];
        ainput = $("<input />",{"id":alive_variable_names[i],"val":parseFloat(avar.value)});
        avardiv.append(ainput);
        avardiv.append(avar.name);
        alert_text.append(avardiv);
    }

    $("#alert_popup").append(alert_title);
    $("#alert_popup").append(alert_text);

    var alert_option = $("<div />",{"text":"Update"});
	alert_option.addClass("alert_button_default");
    alert_option.on("click",function() { alive_variable_update(true); });
    $("#alert_popup").append(alert_option);

    alert_option = $("<div />",{"text":"Close"});
	alert_option.addClass("alert_button_dismiss");
    alert_option.on("click",function() { alive_variable_update(false); });
    $("#alert_popup").append(alert_option);
    $("#alert_popup").show();
}

function alive_variable_update(update) {
    if(update==false) {
        $("#alert_popup").empty();
        $("#alert_popup").hide();
        alive_panes(alive_data_mode,alive_display_mode);
    }
    else {
        var alive_variable_names = Object.keys(alive_variable_values);
        var avarval;
        var ainput;
        var avardiv;
        for (var i = 0; i < alive_variable_names.length; i++) {
            avarval = $("#"+alive_variable_names[i]).val();
            if($.isNumeric(avarval)==true) {
                alive_variable_values[alive_variable_names[i]].value = avarval;
            }
            else {
                console.log(avarval + " was NaN");
            }
        }
        alive_variable_update(false);
    }
    
}