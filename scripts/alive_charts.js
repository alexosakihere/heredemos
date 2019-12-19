function chart_update(cat) {
    console.log(cat);
    if (chart_properties.selected == cat) {
        if (chart_properties.ascend == true) {
            chart_properties.ascend = false;
        }
        else {
            chart_properties.ascend = true;
        }
    }
    else {
        chart_properties.selected = cat;
        chart_properties.ascend = true;
    }
    chart_builder(chart_properties.type);
    alive_searchbar_filter();
}

function gate_value_graph(gate_id, value, target, left_val, right_val) {
    var canvas_height = 360;
    var cv_container_div = $("<div />", { "class": "alive_summary_graph_container" });
    var cv_div = $("<canvas />", { "id": "gate_summary_graph_" + value, "width": 400, "height": canvas_height });
    $(cv_container_div).append(cv_div);
    $(target).append(cv_container_div);
    var ctx = document.getElementById("gate_summary_graph_" + value).getContext("2d");
    ctx.canvas.width = 400;
    ctx.canvas.height = canvas_height;
    var graph_data = [];
    var graph_data_b = [];
    var d = new Date();
    var in_future = false;
    if (((d / 1000) - time) > 1728000) {
        in_future = false;
    }
    else {
        in_future = true;
    }
    var start_day = alive_day(time);
    start_day = alive_day(start_day);
    var status;
    var temp_status = false;
    var temp_status_b = false;
    var bin_size = Math.ceil(alive_duration / 20);
    var current_size = 0;
    var current_size_b = 0;
    var max_val = 0;
    var data_sum = 0.0;
    var data_sum_b = 0.0;
    var capacity_delay_hours = 0.0;
    for (var i = 0; i < alive_duration; i++) {
        status = raw_alivegates[gate_id].status[alive_day(start_day - i)];
        if (status != undefined) {
            current_size++;
            if (value == "offschedule") {
                temp_status += parseFloat(status.offschedule) / parseFloat(status.present);
            }
            else if (value == "present") {
                temp_status += parseFloat(status.present) / parseFloat(raw_alivegates[gate_id].capacity);
                if((parseFloat(status.present) * parseFloat(status.overcapacity)) != 0) {
                    capacity_delay_hours += parseFloat(status.present)/parseFloat(status.overcapacity);
                }
            }
            else if (value == "produced") {
                temp_status += parseFloat(status.produced) / 100;
                temp_status_b += parseFloat(status.delivered_very_late) / 100;
            }
            else if (value == "entered") {
                temp_status += parseFloat(status.entered) / 100;
                temp_status_b += parseFloat(status.left) / 100;
            }
            if (current_size == bin_size) {
                data_sum += parseFloat(temp_status / bin_size);
                graph_data.push(parseFloat(temp_status / bin_size));
                if (value == "produced" || value=="entered") {
                    data_sum_b += parseFloat(temp_status_b / bin_size);
                    graph_data_b.push(parseFloat(temp_status_b / bin_size));
                    if (((parseFloat(temp_status_b / bin_size) > max_val) && value=="entered")) {
                        // This check is because temp_status_b (i.e. vehices leaving)
                        // might be greater than temp_status_a and so it should be allowed
                        // to set the max val
                        max_val = parseFloat(temp_status_b / bin_size);
                    }
                    temp_status_b = 0.0;
                }
                if (parseFloat(temp_status / bin_size) > max_val) {
                    max_val = parseFloat(temp_status / bin_size);
                }
                temp_status = 0.0;
                current_size = 0;
            }
        }
    }
    var remaining;
    if(value=="present" || value=="entered") {
        remaining = parseFloat(raw_alivegates[gate_id].capacity) * graph_data[graph_data.length-1];
    }
    var data_avg = data_sum / graph_data.length;
    var data_avg_b = data_sum_b / graph_data_b.length;
    graph_data.push(graph_data[graph_data.length - 1]);

    var step_width = 10;
    var offset = 320;
    if (max_val < .1) {
        step_width = 1;
        offset = 3200;
    }
    else if (max_val < .2) {
        step_width = 2;
        offset = 1600;
    }
    else if (max_val < .4) {
        step_width = 4;
        offset = 800;
    }
    else if (max_val < .8) {
        step_width = 8;
        offset = 400;
    }
    else if (max_val > 1.5) {
        step_width = 32;
        offset = 100;
    }
    else if (max_val > 1) {
        step_width = 16;
        offset = 200;
    }
    else {
        step_width = 10;
        offset = 320;
    }
    console.log(step_width, offset);
    step_height = 32;
    var pstring = "";
    if (value != "produced" && value!="entered") {
        pstring = "%";
    }

    ctx.font = "10px Fira Sans";
    ctx.fillText(left_val, 20, 330);
    ctx.fillText(right_val, 370, 330);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(106,109,116,.9)";
    ctx.fillStyle = "rgba(155,157,162,.7)";
    var h_step = 380 / (graph_data.length - 1);
    var nx, ny, ix, iy, px, py, fx, cx, cy, nix, niy;
    ctx.moveTo(400, 320 - offset * graph_data[0])
    for (var i = 1; i < graph_data.length - 1; i++) {
        nx = 400 - ((i + 1) * h_step);
        ny = 320 - ((offset * graph_data[i + 1]));
        cx = 400 - ((i) * h_step);
        cy = 320 - ((offset * graph_data[i]));
        ix = (nx + cx) / 2;
        iy = (ny + cy) / 2;
        if (i == graph_data.length - 2) {
            ix = 20;
        }
        ctx.quadraticCurveTo(cx, cy, ix, iy);
        //console.log(350-px,320-py,350-ix,320-iy)
        fx = ix;
    }
    


    if (value == "entered") {
        ctx.strokeStyle = "rgba(63,89,167,.9)";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(400, 320 - offset * graph_data_b[0])
        
        for (var i = 1; i < graph_data_b.length - 1; i++) {
            nx = 400 - ((i + 1) * h_step);
            ny = 320 - ((offset * graph_data_b[i + 1]));
            cx = 400 - ((i) * h_step);
            cy = 320 - ((offset * graph_data_b[i]));
            ix = (nx + cx) / 2;
            iy = (ny + cy) / 2;
            if (i == graph_data_b.length - 2) {
                ix = 20;
            }
            ctx.quadraticCurveTo(cx, cy, ix, iy);
            //console.log(350-px,320-py,350-ix,320-iy)
            fx = ix;
        }
        //ctx.lineTo(fx, 320);
        //ctx.lineTo(400, 320);
        //ctx.lineTo(400, 320 - offset * graph_data_b[0]);
        ctx.strokeStyle = "rgba(6,184,124,.9)";
        ctx.stroke();
    }
    
    else {
        ctx.lineTo(fx, 320);
        ctx.lineTo(400, 320);
        ctx.lineTo(400, 320 - offset * graph_data[0]);
        ctx.stroke();
        ctx.fill();
        if (value == "present") {
            ctx.fillStyle = "rgba(196,28,51,.8)";
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillRect(0, 0, 400, 320 - (.9 * offset));
            ctx.fillStyle = "rgba(250,184,0,.8)";
            ctx.fillRect(0, 320 - (.9 * offset), 400, (.2 * offset));
        }
    
        if (value == "produced") {
            ctx.beginPath();
            if (in_future == false) {
                ctx.strokeStyle = "rgba(196,28,51,1.0)";
                ctx.fillStyle = "rgba(196,28,51,.8)";
            }
            else {
                ctx.strokeStyle = "rgba(250,184,0,1.0)";
                ctx.fillStyle = "rgba(250,184,0,.8)";
            }
            ctx.moveTo(400, 320 - offset * graph_data_b[0])
            for (var i = 1; i < graph_data_b.length - 1; i++) {
                nx = 400 - ((i + 1) * h_step);
                ny = 320 - ((offset * graph_data_b[i + 1]));
                cx = 400 - ((i) * h_step);
                cy = 320 - ((offset * graph_data_b[i]));
                ix = (nx + cx) / 2;
                iy = (ny + cy) / 2;
                if (i == graph_data_b.length - 2) {
                    ix = 20;
                }
                ctx.quadraticCurveTo(cx, cy, ix, iy);
                //console.log(350-px,320-py,350-ix,320-iy)
                fx = ix;
            }
            ctx.lineTo(fx, 320);
            ctx.lineTo(400, 320);
            ctx.lineTo(400, 320 - offset * graph_data_b[0]);
            ctx.stroke();
            ctx.fill();
        }
    }


    ctx.strokeStyle = "rgba(106,109,116,.8)";
    ctx.fillStyle = "rgba(106,109,116,.8)";
    ctx.globalCompositeOperation = "destination-over";
    for (var i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(20, i * step_height);
        ctx.lineTo(400, i * step_height);
        ctx.stroke();
        if (i > 0) {
            ctx.font = "8px Fira Sans";
            ctx.fillText((10 - i) * step_width + pstring, 3, 3 + (i * step_height));
        }
    }
    return {"max":max_val,"data_a":data_avg,"data_b":data_avg_b,"data_sum_a":data_sum*bin_size,"data_sum_b":data_sum_b*bin_size,"overcapacity":capacity_delay_hours,"remaining":remaining};
}

function journey_graph_cost(params) {
    var target = params.target;
    var journey_id = params.journey_id;
    var route_id = params.route_id;
    var bold_windows = params.bold_windows;
    var relative = true;
    var j_data = [];
    var j_days = [];
    var j_keys = [];
    var max_keys = 0;
    var sub_keys = [];
    var temp_j_data;
    var cols = ["entry", "exit", "ship"];
    var colcolors = [[125, 186, 228], [68, 202, 157], [141, 107, 174]];
    var coldata = {}
    for (var i in cols) {
        coldata[cols[i]] = [0.0, 0.0, 1000.0, 0.0, colcolors[i]];
    }
    var route_exceptions = [];
    var total_cost = 0.0;
    var total_all_storage_cost = 0.0;
    var total_all_misstored = 0.0;
    var aggregate_missed_ship = 0;
    alive_chart_counter++;

    var num_journeys = 0;
    if (Array.isArray(journey_id)) {
        // If this is true then we're going to aggregate every possible journey here.
        for (var i = 0; i < journey_id.length; i++) {
            temp_j_data = raw_alivejourneydata[journey_id[i]];
            if (temp_j_data != undefined) {
                for (var j in cols) {
                    coldata[cols[j]][0] = parseFloat(temp_j_data["avg_" + cols[j]]);
                    if (coldata[cols[j]][0] > coldata[cols[j]][1]) {
                        coldata[cols[j]][1] = coldata[cols[j]][0];
                    }
                    if (coldata[cols[j]][2] > coldata[cols[j]][0]) {
                        coldata[cols[j]][2] = coldata[cols[j]][0];
                    }
                    coldata[cols[j]][3] += coldata[cols[j]][0];
                }
                j_data.push(temp_j_data);
                j_days.push(temp_j_data.status);
                sub_keys = Object.keys(temp_j_data.status);
                sub_keys.sort();
                j_keys.push(sub_keys);
                if (sub_keys.length > max_keys) {
                    max_keys = sub_keys.length;
                }
                num_journeys++;
            }
        }
    }
    else {
        temp_j_data = raw_alivejourneydata[journey_id];
        for (var i in cols) {
            var tcdata = temp_j_data["avg_" + cols[i]];
            coldata[cols[i]] = [tcdata, tcdata, tcdata, tcdata];
        }
        j_data = [temp_j_data];
        j_days = [temp_j_data.status];
        sub_keys = Object.keys(temp_j_data.status);
        sub_keys.sort();
        j_keys.push(sub_keys);
        max_keys = sub_keys.length;
        num_journeys = 1;
    }

    for (var i in cols) {
        coldata[cols[i]][3] = coldata[cols[i]][3] / j_data.length;
        for (j = 1; j < 4; j++) {
            coldata[cols[i]][j] = coldata[cols[i]][j] / 24;
        }
    }

    var delay_increment;
    var delayed_in_step;
    var step_occupants;
    var step_delayed;
    var step_moving;
    var step_increment;
    var total_cost_misroute;
    var total_cost_storage;
    var journey_missed_ship = 0;
    var cost_storage = [];
    var cost_misroute = [];
    var normal_yvals = [];
    var normal_nocost_yvals = [];
    var max_cost = 0.0;
    var max_nrm = 1.0;
    var step_cost_storage;
    var step_cost_misroute;
    var rng, tcs, tcm;
    var total_occupants;
    var total_delayed;
    var total_misstored;
    var total_all_misroute_cost = 0.0;
    for (var i = 0; i < max_keys; i++) {
        total_occupants = 0.0;
        total_delayed = 0.0;
        total_cost_storage = 0.0;
        total_cost_misroute = 0.0;
        total_misstored = 0.0;
        total_totaldelay = 0.0;
        total_d_yval = 0.0;
        total_missed_ship = 0.0;
        step_cost = 0.0;
        for (var j = 0; j < j_data.length; j++) {
            s_idx = j_keys[j][i];
            if (s_idx != undefined) {
                // Get the basic values
                step_occupants = parseFloat(j_days[j][s_idx].present);
                step_delayed = parseFloat(j_days[j][s_idx].delayed);
                step_moving = parseFloat(j_days[j][s_idx].moving);
                step_missed_ship = parseFloat(j_days[j][s_idx].missed_ship);
                step_increment = parseFloat(j_days[j][s_idx].delay_incremental);

                // Calculate the incremental costs
                step_cost_storage = (((step_occupants - step_moving)/step_occupants) * step_increment) * parseFloat(alive_variable_values["avar_c_lh"].value);
                if (step_missed_ship > journey_missed_ship) {
                    step_cost_misroute = (step_missed_ship - journey_missed_ship) * parseFloat(alive_variable_values["avar_c_ms"].value);
                    journey_missed_ship = step_missed_ship;
                }
                else {
                    step_cost_misroute = 0.0;
                }
                if(relative==true) {  
                    // Do this next check because if everything is moving, we run into a divide by 0 error????????????
                    if((step_occupants-step_moving)>0) {
                        total_cost_storage += step_cost_storage/(step_occupants-step_moving);
                        total_cost_misroute += step_cost_misroute/(step_occupants-step_moving);
                    }
                    
                }
                else {
                    total_cost_storage += step_cost_storage;
                    total_cost_misroute += step_cost_misroute;
                }
                total_delayed += step_delayed;
                total_occupants += step_occupants;
                if(step_delayed>step_moving) {
                    // Then there are assets that are delayed but not moving, and so are being stored on this cycle.
                    total_misstored += step_delayed-step_moving;
                }
                
                total_missed_ship += step_missed_ship;
                //console.log(step_cost_storage,step_cost_misroute,step_delayed,step_occupants,step_moving,step_missed_ship);
                //console.log(total_delayed,total_occupants,total_misstored,total_missed_ship);
            }
        }
        rng = total_cost_storage + total_cost_misroute;
        //console.log(rng,total_cost_storage,total_cost_misroute);
        total_cost += rng;
        total_all_storage_cost+=total_cost_storage;
        total_all_misroute_cost+=total_cost_misroute;
        total_all_misstored+=total_misstored;
        if(relative==true) {
            adelzero = ( i/max_keys * journey_summary[route_id].total) * (alive_asset_cost[route_id]/max_keys);
        }
        else {
            adelzero = ( i/max_keys * journey_summary[route_id].total) * (alive_asset_cost[route_id]);
        }
        
        //console.log(adelzero, alive_asset_cost[route_id],max_keys,journey_summary[route_id].total);
        normal_yvals.push(adelzero + total_cost);
        normal_nocost_yvals.push(total_cost);
        cost_misroute.push(total_cost_misroute);
        cost_storage.push((total_cost_misroute+total_cost_storage));
        

        /*
         *   
         * 
         */

        if (total_missed_ship > aggregate_missed_ship) {
            aggregate_missed_ship = total_missed_ship;
        }

        if (j == j_data.length - 1) {
            normal_yvals.push(adelzero + total_cost);
            normal_nocost_yvals.push(total_cost);
            cost_misroute.push(total_cost_misroute);
            cost_storage.push((total_cost_misroute+total_cost_storage));
        }

        if (rng > max_cost) {
            max_cost = rng;
        }
        if ( (adelzero+total_cost) > max_nrm) {
            max_nrm = adelzero+total_cost;
        }

        if ((total_cost_misroute + total_cost_storage) > 2000) { off_asset_color = "rgba(196,28,51,1)"; }
        else if ((total_cost_misroute + total_cost_storage) > 1000) { off_asset_color = "rgba(250,184,0,1)"; }
        else { off_asset_color = "rgba(6,184,124,1)"; }

        route_exceptions.push({
            "time": i,
            "delay": total_cost_storage + total_cost_misroute,
            "count": total_occupants,
            "delayed": total_occupants,
            "offschedule": total_occupants,
            "color": off_asset_color,
            "countcolor": off_asset_color
        });
    }
    total_all_misstored = Math.round(total_all_misstored/24);
    var canvas_height = 180;
    if(bold_windows==true) {
        canvas_height = 240;
    }
    var midpoint = canvas_height/2;
    var cv_div = $("<canvas />", { "class": "alive_chart_canvas", "id": "journey_" + alive_chart_counter, "width": parseFloat($(target).width()) });
    cv_div.css({"height":canvas_height});
    $(target).append(cv_div);
    var ctx = document.getElementById("journey_" + alive_chart_counter).getContext("2d");
    ctx.canvas.width = parseFloat($(target).width());
    ctx.canvas.height = canvas_height;

    var h_step = parseFloat($(target).width()) / max_keys;

    for (var i in cols) {
        ctx.strokeStyle = "rgba(" + coldata[cols[i]][4][0] + "," + coldata[cols[i]][4][1] + "," + coldata[cols[i]][4][2] + ",.3)";
        ctx.beginPath();
        ctx.moveTo((coldata[cols[i]][1]) * h_step, -10);
        ctx.lineTo((coldata[cols[i]][1]) * h_step, canvas_height + 10);
        ctx.lineTo((coldata[cols[i]][2]) * h_step, canvas_height + 10);
        ctx.lineTo((coldata[cols[i]][2]) * h_step, -10);
        ctx.fillStyle = "rgba(" + coldata[cols[i]][4][0] + "," + coldata[cols[i]][4][1] + "," + coldata[cols[i]][4][2] + ",.1)";
        ctx.stroke();
        ctx.fill();
    }
    
    if(bold_windows==true) {
        ctx.clearRect(0,0,ctx.canvas.width,20);
        ctx.clearRect(0,canvas_height-20,ctx.canvas.width,20);
        ctx.beginPath();
        ctx.fillStyle = "rgba(155,157,162,1)";
        var sx = 10;
        var sy = (midpoint);
        var arrow = [[0,90],[-4,0],[5.5,10],[5.5,-10],[-4,0],[0,-90]];
        ctx.moveTo(sx,sy);
        for(var i=0;i<arrow.length;i++) {
            sx = sx+arrow[i][0];
            sy = sy-arrow[i][1];
            ctx.lineTo(sx,sy);
        }
        ctx.fill();

        ctx.beginPath();
        sx = 10;
        sy = (midpoint)+40;
        arrow = [[0,50],[-4,0],[5.5,10],[5.5,-10],[-4,0],[0,-50]];
        ctx.moveTo(sx,sy);
        for(var i=0;i<arrow.length;i++) {
            sx = sx+arrow[i][0];
            sy = sy+arrow[i][1];
            ctx.lineTo(sx,sy);
        }
        ctx.fill();

        ctx.font = "10px Fira Sans";
        ctx.fillText("Total costs and added cost over projections (dark grey)",5,15);
        ctx.fillText("Incremental cost per day from unplanned storage (yellow) and transportation (red)",5,canvas_height-10);
    }

    offset = (canvas_height / 4) / max_cost;
    var off_midpoint = midpoint + 20;
    var offset_nrm = (canvas_height / 3) / max_nrm;
    //console.log(max_cost,max_nrm,offset,offset_nrm);
    ctx.beginPath();
    ctx.moveTo(0, (off_midpoint));
    var ix, iy, p1, p2;
    for (var i = 0; i < normal_yvals.length - 1; i++) {
        p1 = [h_step * i, off_midpoint + (offset * cost_storage[i])]
        p2 = [h_step * (i + 1), off_midpoint + (offset * cost_storage[i + 1])]
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*offschedule_yvals[i]));
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    ctx.lineTo(ix,off_midpoint);
    ctx.lineTo(0,off_midpoint);
/*    for (var i = cost_misroute.length - 1; i >= 1; i--) {
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*delayed_yvals[i]));
        p1 = [h_step * i, canvas_height / 2 - (offset * cost_storage[i])];
        p2 = [h_step * (i - 1), canvas_height / 2 - (offset * cost_storage[i - 1])];
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }*/
    ctx.fillStyle = "rgba(250,184,0,1)";
    ctx.fill();


    ctx.beginPath()
    ctx.moveTo(0, (off_midpoint));
    for (var i = 0; i < cost_misroute.length - 1; i++) {
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*delayed_yvals[i]));
        p1 = [h_step * i, off_midpoint + (offset * cost_misroute[i])];
        p2 = [h_step * (i + 1), off_midpoint + (offset * cost_misroute[i + 1])];
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    ctx.lineTo(0,off_midpoint);
    /*
    for (var i = cost_storage.length - 1; i >= 1; i--) {
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*bridge_yvals[i]));
        p1 = [h_step * i, canvas_height / 2 - (offset * cost_misroute[i])];
        p2 = [h_step * (i - 1), canvas_height / 2 - (offset * cost_misroute[i - 1])];
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }*/
    ctx.fillStyle = "rgba(196,28,51,1)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, (off_midpoint));
    var ix, iy, p1, p2;
    for (var i = 0; i < normal_yvals.length - 1; i++) {
        p1 = [h_step * i, off_midpoint - (offset_nrm * normal_yvals[i])]
        p2 = [h_step * (i + 1), off_midpoint - (offset_nrm * normal_yvals[i + 1])]
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*offschedule_yvals[i]));
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    ctx.lineTo((h_step * normal_yvals.length)-(1.5*h_step), off_midpoint);
    ctx.lineTo(0,off_midpoint);
    /*
    for (var i = cost_misroute.length - 1; i >= 1; i--) {
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*delayed_yvals[i]));
        p1 = [h_step * i, canvas_height / 2 - (offset * normal_yvals[i])];
        p2 = [h_step * (i - 1), canvas_height / 2 - (offset * normal_yvals[i - 1])];
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }*/
    ctx.fillStyle = "rgba(205,206,208,1)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, (off_midpoint));
    var ix, iy, p1, p2;
    for (var i = 0; i < normal_yvals.length - 1; i++) {
        p1 = [h_step * i, off_midpoint - (offset_nrm * normal_nocost_yvals[i])]
        p2 = [h_step * (i + 1), off_midpoint - (offset_nrm * normal_nocost_yvals[i + 1])]
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    ctx.lineTo((h_step * normal_yvals.length)-(1.5*h_step), off_midpoint);
    ctx.lineTo(0, (off_midpoint));
    /*
    for (var i = cost_misroute.length - 1; i >= 1; i--) {
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*delayed_yvals[i]));
        p1 = [h_step * i, canvas_height / 2 - (offset * normal_yvals[i])];
        p2 = [h_step * (i - 1), canvas_height / 2 - (offset * normal_yvals[i - 1])];
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }*/
    ctx.fillStyle = "rgba(155,157,162,1)";
    ctx.fill();

    $(cv_div).velocity({ "height": [canvas_height, 0], "margin-bottom": [0, midpoint], "margin-top": [0, midpoint] }, { "duration": 100 });

    return [h_step, route_exceptions, total_cost, total_all_storage_cost, total_all_misstored, aggregate_missed_ship];
}

function journey_graph_delay(params) {
    var target = params.target;
    var journey_id = params.journey_id;
    var route_id = params.route_id;
    var bold_windows = params.bold_windows;
    var j_data = [];
    var j_days = [];
    var j_keys = [];
    var j_max = [];
    var j_min = [];
    var j_range = [];
    var max_keys = 0;
    var sub_keys = [];
    var d_max, d_min, d_range;
    var temp_j_data;
    var cols = ["entry", "exit", "ship"];
    var colcolors = [[125, 186, 228], [68, 202, 157], [141, 107, 174]];
    var coldata = {}
    for (var i in cols) {
        coldata[cols[i]] = [0.0, 0.0, 1000.0, 0.0, colcolors[i]];
    }
    var route_exceptions = [];
    alive_chart_counter++;

    var avg_delay = 0.0;
    var num_journeys = 0;
    if (Array.isArray(journey_id)) {
        // If this is true then we're going to aggregate every possible journey here.
        for (var i = 0; i < journey_id.length; i++) {
            temp_j_data = raw_alivejourneydata[journey_id[i]];
            if (temp_j_data != undefined) {
                for (var j in cols) {
                    coldata[cols[j]][0] = parseFloat(temp_j_data["avg_" + cols[j]]);
                    if (coldata[cols[j]][0] > coldata[cols[j]][1]) {
                        coldata[cols[j]][1] = coldata[cols[j]][0];
                    }
                    if (coldata[cols[j]][2] > coldata[cols[j]][0]) {
                        coldata[cols[j]][2] = coldata[cols[j]][0];
                    }
                    coldata[cols[j]][3] += coldata[cols[j]][0];
                }
                j_data.push(temp_j_data);
                j_days.push(temp_j_data.status);
                sub_keys = Object.keys(temp_j_data.status);
                sub_keys.sort();
                j_keys.push(sub_keys);
                d_min = temp_j_data.min_delay;
                d_max = temp_j_data.max_delay;
                d_range = d_max - d_min;
                j_max.push(d_max);
                j_min.push(d_min);
                j_range.push(d_range);
                if (sub_keys.length > max_keys) {
                    max_keys = sub_keys.length;
                }
                avg_delay += parseInt(temp_j_data.totaldelay);
                num_journeys++;
            }
        }
    }
    else {
        temp_j_data = raw_alivejourneydata[journey_id]
        for (var i in cols) {
            var tcdata = temp_j_data["avg_" + cols[i]];
            coldata[cols[i]] = [tcdata, tcdata, tcdata, tcdata];
        }
        avg_entry += parseFloat(temp_j_data.avg_entry);
        avg_exit += parseFloat(temp_j_data.avg_exit);
        avg_ship += parseFloat(temp_j_data.avg_ship);
        j_data = [temp_j_data];
        j_days = [temp_j_data.status];
        sub_keys = Object.keys(temp_j_data.status);
        sub_keys.sort();
        j_keys.push(sub_keys);
        max_keys = sub_keys.length;
        d_min = temp_j_data.min_delay;
        d_max = temp_j_data.max_delay;
        d_range = d_max - d_min;
        j_max.push(d_max);
        j_min.push(d_min);
        j_range.push(d_range);
        avg_delay = parseInt(temp_j_data.totaldelay);
        num_journeys = 1;
    }
    avg_delay = avg_delay / num_journeys;
    for (var i in cols) {
        coldata[cols[i]][3] = coldata[cols[i]][3] / j_data.length;
        for (j = 1; j < 4; j++) {
            coldata[cols[i]][j] = coldata[cols[i]][j] / 24;
        }
    }
    var d_yval = 0.0;
    var delayed_yvals = [];
    var bridge_yvals = [];
    var perc_offschedule = [];
    var normal_yvals = [];
    var offschedule_yvals = [];
    var delaytime_yvals = [];
    var delaytime_width = [];
    var step_occupants = 0;
    var step_delayed = 0;
    var step_offschedule = 0;
    var step_totaldelay = 0;
    var step_missed_ship = 0;
    var total_occupants = 0;
    var total_delayed = 0;
    var total_offschedule = 0;
    var total_missed_ship = 0;
    var total_totaldelay = 0;
    var previous_delay = 0.0;
    var total_dyval = 0.0;
    var max_dyval = 0.0;
    var max_nrm = 0.0;
    var min_del = 0.0;
    var max_del = 0.0;
    var s_idx;
    var aggregate_missed_ship = 0;
    var perc_delayed, perasset_delay, off, del, nrm, adelzero, rng;
    var off_asset_color = "";
    var off_count_color = "";
    for (var i = 0; i < max_keys; i++) {
        total_occupants = 0.0;
        total_delayed = 0.0;
        total_offschedule = 0.0;
        total_totaldelay = 0.0;
        total_d_yval = 0.0;
        total_missed_ship = 0.0;
        for (var j = 0; j < j_data.length; j++) {
            s_idx = j_keys[j][i];
            if (s_idx != undefined) {
                step_occupants = parseFloat(j_days[j][s_idx].present);
                step_delayed = parseFloat(j_days[j][s_idx].delayed);
                step_offschedule = parseFloat(j_days[j][s_idx].offschedule);
                step_totaldelay = parseFloat(j_days[j][s_idx].delay_total);
                step_missed_ship = parseFloat(j_days[j][s_idx].missed_ship);
                total_occupants += step_occupants;
                total_delayed += step_delayed;
                total_totaldelay += step_totaldelay;
                total_offschedule += step_offschedule;
                total_missed_ship += step_missed_ship;
                d_yval = parseFloat((step_totaldelay / step_occupants)) / parseFloat(j_range[j] / step_occupants);
                total_dyval += d_yval;

            }
        }
        if (total_missed_ship > aggregate_missed_ship) {
            aggregate_missed_ship = total_missed_ship;
        }

        /*
        total_dyval = total_dyval/j_data.length;
        normal_bridge = (total_dyval);
        var perc_delayed = total_offschedule/total_occupants;
        normal_delayed = (total_dyval * perc_delayed);
        normal_normal = (total_dyval);
        bridge_yvals.push(normal_bridge-(.3*perc_delayed));
        delayed_yvals.push(normal_delayed+(.4*normal_bridge));
        normal_yvals.push(normal_bridge+(.2*perc_delayed)-normal_normal);

        perc_offschedule.push(total_delayed/total_occupants);

        */
        perc_delayed = total_offschedule / total_occupants;
        normal_delayed = total_delayed * perc_delayed;
        perasset_delay = (total_totaldelay / total_occupants);

        if ((total_totaldelay / total_occupants) > 24) { off_asset_color = "rgba(196,28,51,1)"; }
        else if ((total_totaldelay / total_occupants) > 12) { off_asset_color = "rgba(250,184,0,1)"; }
        else if ((total_totaldelay / total_occupants) < 0) { off_asset_color = "rgba(6,184,124,1)"; }
        else { off_asset_color = "rgba(82,163,219,1)"; }

        if (perc_delayed >= .25) { off_count_color = "rgba(196,28,51,1)"; }
        else if (perc_delayed > .1) { off_count_color = "rgba(250,184,0,1)"; }
        else { off_count_color = "rgba(6,184,124,1)"; }
        route_exceptions.push({
            "time": i,
            "delay": total_totaldelay / total_occupants,
            "count": total_occupants,
            "delayed": total_delayed,
            "offschedule": total_offschedule,
            "color": off_asset_color,
            "countcolor": off_count_color
        });

        /*
        rng = total_occupants * (.3 + (perasset_delay / 60));
        off = rng * (total_offschedule / total_occupants);
        del = rng * (total_delayed / total_occupants) * .75;
        nrm = (1 - perc_delayed) * (rng - (off + del));
        adelzero = (off + del + nrm) / 2;

        offschedule_yvals.push((off + del + nrm) - adelzero);
        delayed_yvals.push(del + nrm - adelzero);
        bridge_yvals.push(nrm - adelzero);
        normal_yvals.push(0 - adelzero);
        */

        rng = total_occupants;
        del = total_delayed;
        off = total_offschedule;

        nrm = (total_totaldelay - previous_delay) * (total_delayed/journey_summary[route_id].total);
        previous_delay = parseFloat(total_totaldelay);

        normal_yvals.push(rng);
        delayed_yvals.push(del);
        offschedule_yvals.push(off);
        delaytime_yvals.push(nrm);
        delaytime_width.push(5*(total_occupants/journey_summary[route_id].total));

        if (j == j_data.length - 1) {
            normal_yvals.push(rng);
            delayed_yvals.push(del);
            offschedule_yvals.push(off);
            delaytime_yvals.push(nrm);
        }

        if (Math.abs(nrm) > max_del) {
            max_del = Math.abs(nrm);
        }
        if (rng > max_nrm) {
            max_nrm = rng;
        }

    } 

    
    var canvas_height = 180;
    if(bold_windows==true) {
        canvas_height = 280;   
    }
    var midpoint = canvas_height/2;
    var cv_div = $("<canvas />", { "class": "alive_chart_canvas", "id": "journey_" + alive_chart_counter, "width": parseFloat($(target).width()) });
    cv_div.css({"height":canvas_height});
    $(target).append(cv_div);
    var ctx = document.getElementById("journey_" + alive_chart_counter).getContext("2d");
    ctx.canvas.width = parseFloat($(target).width());
    ctx.canvas.height = canvas_height;

    var h_step = parseFloat($(target).width()) / max_keys;

    if (bold_windows == false) {

        for (var i in cols) {
            ctx.strokeStyle = "rgba(" + coldata[cols[i]][4][0] + "," + coldata[cols[i]][4][1] + "," + coldata[cols[i]][4][2] + ",.3)";
            ctx.beginPath();
            ctx.moveTo((coldata[cols[i]][1]) * h_step, -10);
            ctx.lineTo((coldata[cols[i]][1]) * h_step, canvas_height + 10);
            ctx.lineTo((coldata[cols[i]][2]) * h_step, canvas_height + 10);
            ctx.lineTo((coldata[cols[i]][2]) * h_step, -10);
            ctx.fillStyle = "rgba(" + coldata[cols[i]][4][0] + "," + coldata[cols[i]][4][1] + "," + coldata[cols[i]][4][2] + ",.1)";
            ctx.stroke();
            ctx.fill();
        }
    }

    else {

        ctx.clearRect(0, 0, ctx.canvas.width, 20);
        ctx.clearRect(0, canvas_height - 20, ctx.canvas.width, 20);
        ctx.beginPath();
        ctx.fillStyle = "rgba(155,157,162,1)";

        ctx.font = "10px Fira Sans";
        ctx.fillText("Total "+msmap["gen_plural"]+" on journey (grey)", 5, 15);
        ctx.fillText(msmap["gen_plural"]+" severely (red) or moderately (yellow) delayed", 5, canvas_height - 10);
    }

    offset = (canvas_height/4) / max_nrm;

    ctx.beginPath();
    ctx.moveTo(0, midpoint);
    var ix, iy, p1, p2;
    for (var i = 0; i < normal_yvals.length - 1; i++) {
        p1 = [h_step * i, midpoint - (offset * normal_yvals[i])]
        p2 = [h_step * (i + 1), midpoint - (offset * normal_yvals[i + 1])]
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*offschedule_yvals[i]));
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    ctx.lineTo((h_step * normal_yvals.length)-(1.5*h_step), midpoint);
    ctx.lineTo(0,midpoint);
    ctx.fillStyle = "rgba(205,206,208,1)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, midpoint);
    var ix, iy, p1, p2;
    for (var i = 0; i < delayed_yvals.length - 1; i++) {
        p1 = [h_step * i, midpoint - (offset * delayed_yvals[i])]
        p2 = [h_step * (i + 1), midpoint - (offset * delayed_yvals[i + 1])]
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*offschedule_yvals[i]));
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    ctx.lineTo((h_step * delayed_yvals.length)-(1.5*h_step), midpoint);
    ctx.lineTo(0,midpoint);
    ctx.fillStyle = "rgba(250,184,0,1)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, midpoint);
    var ix, iy, p1, p2;
    for (var i = 0; i < offschedule_yvals.length - 1; i++) {
        p1 = [h_step * i, midpoint - (offset * offschedule_yvals[i])]
        p2 = [h_step * (i + 1), midpoint - (offset * offschedule_yvals[i + 1])]
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*offschedule_yvals[i]));
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    ctx.lineTo((h_step * offschedule_yvals.length)-(1.5*h_step), midpoint);
    ctx.lineTo(0,midpoint);
    ctx.fillStyle = "rgba(196,28,51,1)";
    ctx.fill();

    if(bold_windows==true) {
        offset = (canvas_height/6) / max_del;
        var off_midpoint = midpoint+50;
    
        ctx.beginPath();
        ctx.moveTo(0, off_midpoint);
        var ix, iy, p1, p2;
        for (var i = 0; i < delaytime_yvals.length - 1; i++) {
            p1 = [h_step * i, off_midpoint + delaytime_width[i] + (offset * delaytime_yvals[i])]
            p2 = [h_step * (i + 1), off_midpoint + delaytime_width[i+1] + (offset * delaytime_yvals[i + 1])]
            ix = (p1[0] + p2[0]) / 2;
            iy = (p1[1] + p2[1]) / 2;
            //ctx.lineTo(h_step*i,canvas_height/2+(offset*offschedule_yvals[i]));
            ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
        }
        for (var i = delaytime_yvals.length - 1; i >= 1; i--) {
            p1 = [h_step * i, off_midpoint - delaytime_width[i] + (offset * delaytime_yvals[i])]
            p2 = [h_step * (i - 1), off_midpoint - delaytime_width[i-1] + (offset * delaytime_yvals[i - 1])]
            ix = (p1[0] + p2[0]) / 2;
            iy = (p1[1] + p2[1]) / 2;
            //ctx.lineTo(h_step*i,canvas_height/2+(offset*offschedule_yvals[i]));
            ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
        }
    
        //ctx.lineTo((h_step * delaytime_yvals.length)-(1.5*h_step), midpoint);
        //ctx.lineTo(0,midpoint);
        ctx.fillStyle = "rgba(205,206,208,1)";
        ctx.fill();
    }

    
    /*

    ctx.beginPath()
    ctx.moveTo(0, midpoint);
    for (var i = 0; i < delayed_yvals.length - 1; i++) {
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*delayed_yvals[i]));
        p1 = [h_step * i, midpoint + (offset * delayed_yvals[i])];
        p2 = [h_step * (i + 1), midpoint + (offset * delayed_yvals[i + 1])];
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    for (var i = delayed_yvals.length - 1; i >= 1; i--) {
        //ctx.lineTo(h_step*i,canvas_height/2+(offset*bridge_yvals[i]));
        p1 = [h_step * i, midpoint + (offset * bridge_yvals[i])];
        p2 = [h_step * (i - 1), midpoint + (offset * bridge_yvals[i - 1])];
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    ctx.fillStyle = "rgba(250,184,0,1)";
    ctx.fill();



    ctx.beginPath()
    ctx.moveTo(0, midpoint);
    for (var i = 0; i < delayed_yvals.length - 1; i++) {
        //ctx.lineTo(h_step*i,(canvas_height/2)+(offset*bridge_yvals[i]));

        p1 = [h_step * i, midpoint + (offset * bridge_yvals[i])];
        p2 = [h_step * (i + 1), midpoint + (offset * bridge_yvals[i + 1])];
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    for (var i = delayed_yvals.length - 1; i >= 1; i--) {
        //ctx.lineTo(h_step*i,(canvas_height/2)+(offset*normal_yvals[i]));
        p1 = [h_step * i, midpoint + (offset * normal_yvals[i])];
        p2 = [h_step * (i - 1), midpoint + (offset * normal_yvals[i - 1])];
        ix = (p1[0] + p2[0]) / 2;
        iy = (p1[1] + p2[1]) / 2;
        ctx.quadraticCurveTo(p1[0], p1[1], ix, iy);
    }
    ctx.fillStyle = "rgba(205,206,208,1)";
    ctx.fill();

    */ 

    var filtered_exceptions = [];
    var except_delays = {};
    for (var i in route_exceptions) {
        if (route_exceptions[i].delay > 12) {
            except_delays[parseInt(100 * route_exceptions[i].delay)] = i;
        }
    }
    var except_delay_vals = Object.keys(except_delays);
    except_delay_vals.sort();
    var exception_time = [999];
    var exception_delay = 0;
    var working_time;
    var blocked = false;
    for (var i = except_delay_vals.length - 1; i >= 0; i--) {
        working_time = route_exceptions[except_delays[except_delay_vals[i]]].time;
        blocked = false;
        for (var j in exception_time) {
            if (Math.abs(exception_time[j] - working_time) < 10) {
                blocked = true;
            }
        }
        if (blocked == false) {
            exception_time.push(working_time);

            filtered_exceptions.push(route_exceptions[except_delays[except_delay_vals[i]]]);
        }

    }
    /*
    for(var i in filtered_exceptions) {
        ctx.strokeStyle = "rgba(106,109,116,.8)";
        ctx.globalCompositeOperation = "xor";
        ctx.beginPath();
        ctx.setLineDash([2,1]);
        ctx.moveTo((filtered_exceptions[i].time)*h_step,-10);
        ctx.lineTo((filtered_exceptions[i].time)*h_step,canvas_height+10);
        ctx.stroke();
    }
    */
    $(cv_div).velocity({ "height": [canvas_height, 0], "margin-bottom": [0, midpoint], "margin-top": [0, midpoint] }, { "duration": 100 });
    return [h_step, route_exceptions, coldata, aggregate_missed_ship];
}

function journey_graph(params) {
    var results;
    var bold_windows = params.bold_windows;
    if (bold_windows == undefined) {
        bold_windows = false;
    }
    var mode = params.mode;
    if (mode == undefined) {
        mode = "delay";
    }
    if (mode == "delay") {
        results = journey_graph_delay(params);
    }
    else if (mode == "cost") {
        results = journey_graph_cost(params);
    }
    return results;
}


function chart_builder(type) {
    /*
    label format is [label text],[label-key mapping],[label width],default
    
    This produces a sortable table with the keys and labels predefined
    */
    $("#alive_container").empty();
    var type_labels = {
        "asset_at_gate": [[msmap["uid"], msmap["class"], "Age", "Eta/Delay"], ["uid", "name", "age", "eta"], [20, 20, 30, 30], 3],
        "gates_summary": [["name", "type", msmap["type_plural"]+" on time/delayed", "capacity/fill level"], ["name", "type", "ontime", "fill"], [20, 20, 30, 30], 3],
        "routes_summary": [["origin", "destination", msmap["type_plural"]+" on time/delayed", "avg. lead time/delay"], ["origin", "destination", "total", "lead"], [20, 20, 30, 30], 3],
        "journey_summary": [[msmap["uid"], msmap["class"], "checkpoint", "eta/delay"], ["uid", "name", "current_checkpoint", "eta"], [20, 20, 30, 30], 3]
    }
    var chartclass = type_labels[type];
    var data = {};
    var d_keys;
    var labels = chartclass[0];
    var propmap = chartclass[1];
    var width = chartclass[2];
    var active = chartclass[3];
    var mode_div = alive_header_builder();
    $("#alive_container").append(mode_div);
    var datacontainer = $("<div />", { "class": "alive_data_container", "id": "alive_data_container" });
    var table = $("<table />", { "class": "alive_chart", "id": "alive_chart" });
    var header_row = $("<tr />", { "class": "alive_chart_header" });
    var ascend = true;
    // Reset the objects assigned to every filter
    var filter_keys = Object.keys(alive_metadata);
    for (var i = 0; i < filter_keys.length; i++) {
        alive_metadata[filter_keys[i]].vals = {};
    }
    // End reset
    if (chart_properties != undefined) {
        if (chart_properties.type == type) {
            active = chart_properties.selected;
            ascend = chart_properties.ascend;
        }
    }
    if (type == "asset_at_gate") {
        data = gate_asset_list.assets;
    }
    else if (type == "gates_summary") {
        data = gates_summary;
    }
    else if (type == "routes_summary") {
        data = journey_summary;
    }
    else if (type == "journey_summary") {
        data = assets_summary;
    }
    d_keys = Object.keys(data);
    var d_sort = {};
    var n_key = "";
    var append = "000";
    for (var i in d_keys) {
        n_key = data[d_keys[i]][propmap[active]];
        p_key = n_key;
        if (propmap[active] == "age" || propmap[active] == "ontime") {
            n_key = ("0000" + n_key).slice(-5);
            p_key = n_key + "000";
        }
        if (d_sort[p_key] != undefined) {
            var sub = 0;
            var unique = false;
            while (unique == false) {
                sub = sub + 1;
                p_key = n_key + ("000" + sub).slice(-3);
                if (d_sort[p_key] == undefined) {
                    unique = true;
                }
            }
        }
        d_sort[p_key] = d_keys[i];
    }
    var d_sorted_keys = Object.keys(d_sort);
    d_sorted_keys.sort();

    for (var i = 0; i < labels.length; i++) {
        var label_cell = $("<td />", { "text": labels[i] });
        label_cell.css({ "width": width[i] + "%" });
        if (i == active) {
            label_cell.addClass("alive_chart_header_sub_default");
            if (ascend == true) {
                label_cell.append("<span class=\"alive_caret\"></span>");
            }
            else {
                label_cell.append("<span class=\"alive_caret_invert\"></span>");
            }
        }
        else {
            label_cell.addClass("alive_chart_header_sub");
        }
        label_cell.on("click", { arg1: i }, function (e) { chart_update(e.data.arg1); });
        header_row.append(label_cell);
    }
    table.append(header_row);
    var next_row, next_data, r_sub, sort_idx;
    for (var i = 0; i < d_sorted_keys.length; i++) {
        next_row = $("<tr />", { "class": "alive_chart_row", "id": "chart_row_" + i });
        //if(i%2==0) {
        //    next_row.css({"background-color":"#fafafa"});
        //}
        if (ascend == true) {
            sort_idx = d_sort[d_sorted_keys[i]];
        }
        else {
            sort_idx = d_sort[d_sorted_keys[(d_sorted_keys.length - 1) - i]];
        }
        next_data = data[sort_idx];
        alive_build_filter_from_type(type, next_data, i);
        if (type == "routes_summary") {
            next_row.on("click", { arg1: sort_idx }, function (e) { alive_active_route = e.data.arg1; alive_data_needs_refresh = true; alive_panes("journeys", "list"); });
        }
        else if (type == "gates_summary") {
            next_row.on("click", { arg1: sort_idx }, function (e) { alive_active_gate = e.data.arg1; alive_data_needs_refresh = true; alive_panes("gate", "list"); });
        }
        else if (type == "journey_summary") {
            next_row.on("click", { arg1: sort_idx }, function (e) { 
                var aopos = raw_alivegates[raw_aliveroutedata[raw_assetdata[e.data.arg1]["template"]]["origin_gate"]]["position"]
                var aapos = raw_alivegates[raw_aliveroutedata[raw_assetdata[e.data.arg1]["template"]]["arrival_gate"]]["position"]
                alive_active_asset_center = [((aopos[0]+aapos[0])/2),((aopos[1]+aapos[1])/2)]
                center[0] = center[0] * .999; 
                alive_active_asset = e.data.arg1; 
                alive_data_needs_refresh = true; 
                alive_panes("asset", "list"); });
        }
        else if (type == "asset_at_gate") {
            next_row.on("click", { arg1: sort_idx }, function (e) { 
                center[0] = center[0] * .999;
                var aopos = raw_alivegates[raw_aliveroutedata[raw_assetdata[e.data.arg1]["template"]]["origin_gate"]]["position"]
                var aapos = raw_alivegates[raw_aliveroutedata[raw_assetdata[e.data.arg1]["template"]]["arrival_gate"]]["position"]
                alive_active_asset_center = [((aopos[0]+aapos[0])/2),((aopos[1]+aapos[1])/2)]
                alive_active_asset = e.data.arg1; 
                alive_data_needs_refresh = true; 
                alive_panes("asset", "list"); });
        }
        for (var j = 0; j < labels.length; j++) {
            r_sub = $("<td />", { "class": "alive_chart_cell" });
            r_sub.css({ "width": width[j] + "%" })
            if (type == "asset_at_gate") {
                if (propmap[j] == "age") {
                    r_sub.append(alive_prettydate(next_data[propmap[j]]));
                }
                else if (propmap[j] == "eta") {
                    var eta = new Date(next_data[propmap[j]]);
                    var eta_str = eta.getDate() + "/" + (eta.getMonth() + 1) + "/" + (eta.getYear() % 100) + ", " + eta.getHours() + ":" + ("00" + eta.getMinutes()).slice(-2);
                    r_sub.append("<div class=\"alive_chart_cell_div\">" + eta_str + "</div>");
                    var avg_delay = next_data["delay"];
                    var delay_str;
                    var right_div = $("<div />", { "class": "alive_chart_cell_status" });
                    if (avg_delay >= 24) {
                        delay_str = $("<span />", { "class": "alive_note_vbad", "text": "+ " + alive_prettydate(avg_delay) });
                    }
                    else if (avg_delay >= 10) {
                        delay_str = $("<span />", { "class": "alive_note_mbad", "text": "+ " + alive_prettydate(avg_delay) });
                    }
                    else if (avg_delay >= 0) {
                        delay_str = $("<span />", { "class": "alive_note_neutral", "text": "+ " + alive_prettydate(avg_delay) });
                    }
                    else if (avg_delay < 2) {
                        delay_str = $("<span />", { "class": "alive_note_good", "text": "- " + alive_prettydate(avg_delay) });
                    }
                    right_div.append(delay_str);
                    r_sub.append(right_div);
                }
                else {
                    r_sub.append(next_data[propmap[j]]);
                }
            }
            else if (type == "gates_summary") {
                if (propmap[j] == "ontime") {
                    var ontime = parseInt(next_data["ontime"]);
                    var delayed = parseInt(next_data["delayed"]);
                    var perc_delayed = delayed / (ontime + delayed);

                    var ontime_str = "<div class=\"alive_chart_cell_div\">" + ontime + "/" + delayed + "</div>";

                    r_sub.append(ontime_str);

                    var perc_delayed_str;
                    var right_div = $("<div />", { "class": "alive_chart_cell_status" });
                    if (perc_delayed >= .55) {
                        perc_delayed_str = $("<span />", { "class": "alive_note_vbad", "text": (perc_delayed * 100).toFixed(2) + "%" })
                        perc_delayed_str.css({ "float": "right", "margin-right": "30%" });
                        right_div.append(perc_delayed_str);
                    }
                    else if (perc_delayed >= .2) {
                        perc_delayed_str = $("<span />", { "class": "alive_note_mbad", "text": (perc_delayed * 100).toFixed(2) + "%" })
                        perc_delayed_str.css({ "float": "right", "margin-right": "30%" });
                        right_div.append(perc_delayed_str);
                    }
                    r_sub.append(right_div);
                }
                else if (propmap[j] == "fill") {
                    var fill = parseInt(next_data["fill"]);
                    var capacity = parseInt(next_data["capacity"]);
                    var fill_level_str = "<div class=\"alive_chart_cell_div\">" + capacity + "/" + fill + "</div>";
                    var fill_perc = fill / capacity;
                    var right_div = $("<div />", { "class": "alive_chart_cell_status" });
                    var perc_fill_str;
                    r_sub.append(fill_level_str);
                    if (fill_perc >= .8) {
                        perc_fill_str = $("<span />", { "class": "alive_note_vbad", "text": (fill_perc * 100).toFixed(2) + "%" })
                        perc_fill_str.css({ "float": "right", "margin-right": "30%" });
                        right_div.append(perc_fill_str);
                    }
                    else if (fill_perc >= .4) {
                        perc_fill_str = $("<span />", { "class": "alive_note_vbad", "text": (fill_perc * 100).toFixed(2) + "%" })
                        perc_fill_str.css({ "float": "right", "margin-right": "30%" });
                        right_div.append(perc_fill_str);
                    }
                    r_sub.append(right_div);
                }
                else {
                    r_sub.append(next_data[propmap[j]]);
                }
            }
            else if (type == "routes_summary") {
                if (propmap[j] == "total") {
                    var ontime = parseInt(next_data["total"]) - parseInt(next_data["late"]);
                    var delayed = parseInt(next_data["late"]);
                    var perc_delayed = delayed / (ontime + delayed);
                    var ontime_str = "<div class=\"alive_chart_cell_div\">" + ontime + "/" + delayed + "</div>";
                    r_sub.append(ontime_str);
                    var perc_delayed_str;
                    var right_div = $("<div />", { "class": "alive_chart_cell_status" });
                    if (perc_delayed >= .55) {
                        perc_delayed_str = $("<span />", { "class": "alive_note_vbad", "text": (perc_delayed * 100).toFixed(2) + "%" })
                        perc_delayed_str.css({ "float": "right", "margin-right": "30%" });
                        right_div.append(perc_delayed_str);
                    }
                    else if (perc_delayed >= .2) {
                        perc_delayed_str = $("<span />", { "class": "alive_note_mbad", "text": (perc_delayed * 100).toFixed(2) + "%" })
                        perc_delayed_str.css({ "float": "right", "margin-right": "30%" });
                        right_div.append(perc_delayed_str);
                    }
                }
                else if (propmap[j] == "lead") {
                    var lead_str = alive_prettydate(next_data[propmap[j]]);
                    r_sub.append("<div class=\"alive_chart_cell_div\">" + lead_str + "</div>");
                    var avg_delay = next_data["delay"];
                    var delay_str;
                    var right_div = $("<div />", { "class": "alive_chart_cell_status" });
                    if (avg_delay >= 24) {
                        delay_str = $("<span />", { "class": "alive_note_vbad", "text": "+ " + alive_prettydate(avg_delay) });
                    }
                    else if (avg_delay >= 10) {
                        delay_str = $("<span />", { "class": "alive_note_mbad", "text": "+ " + alive_prettydate(avg_delay) });
                    }
                    else if (avg_delay >= 0) {
                        delay_str = $("<span />", { "class": "alive_note_neutral", "text": "+ " + alive_prettydate(avg_delay) });
                    }
                    else if (avg_delay < 2) {
                        delay_str = $("<span />", { "class": "alive_note_good", "text": "- " + alive_prettydate(avg_delay) });
                    }
                    right_div.append(delay_str);
                    r_sub.append(right_div);
                }
                else {
                    r_sub.append(next_data[propmap[j]]);
                }
            }
            else if (type == "journey_summary") {
                if (propmap[j] == "current_checkpoint") {
                    if (next_data["current_checkpoint"] == "end") {
                        r_sub.append("Delivered");
                    }
                    else {
                        r_sub.append(raw_alivegates[next_data[propmap[j]]].shortname);
                    }
                }
                else if (propmap[j] == "eta") {
                    var eta = new Date(1000 * next_data[propmap[j]]);
                    var eta_str = eta.getDate() + "/" + (eta.getMonth() + 1) + "/" + (eta.getYear() % 100) + ", " + eta.getHours() + ":" + ("00" + eta.getMinutes()).slice(-2);
                    r_sub.append("<div class=\"alive_chart_cell_div\">" + eta_str + "</div>");

                    var delay = next_data["delay"] / 3600;
                    var delay_str;
                    if (delay >= 96) {
                        delay_str = $("<span />", { "class": "alive_note_vbad", "text": "+ " + alive_prettydate(delay) });
                    }
                    else if (delay >= 12) {
                        delay_str = $("<span />", { "class": "alive_note_mbad", "text": "+ " + alive_prettydate(delay) });
                    }
                    else if (delay < 0) {
                        delay_str = $("<span />", { "class": "alive_note_good", "text": "- " + alive_prettydate(delay) });
                    }
                    var right_div = $("<div />", { "class": "alive_chart_cell_status" });
                    right_div.append(delay_str);
                    r_sub.append(right_div);
                }
                else {
                    r_sub.append(next_data[propmap[j]]);
                }
            }
            else {
                r_sub.append(next_data[propmap[j]]);
            }

            next_row.append(r_sub);
        }
        table.append(next_row);
    }
    chart_properties = {
        "type": type,
        "selected": active,
        "ascend": ascend
    }
    datacontainer.append(table);
    $("#alive_container").append(datacontainer);
}

function data_builder(mode) {
    $("#alive_container").empty()
    var mode_div = alive_header_builder();
    $("#alive_container").append(mode_div);
    $("#alive_container").append("<div class=\"alive_data_container\" id=\"alive_data_container\"></div>");
    if (mode == "routes_summary") {
        var d = new Date(time * 1000);
        var sd = new Date(d.getFullYear(), 0, 0);
        var diff = d - sd;
        var num_days = Math.floor(diff / 86400000);
        d.setHours(1, 0, 0, 0);
        var d_string = (d.getFullYear() % 100) + "." + ("00" + num_days).slice(-3);
        var end_day = alive_day(d_string);
        var start_day = end_day - alive_duration;

        var route_starts = {};
        var route_idx = Object.keys(raw_aliveroutedata);
        var route;
        var e_list, e_d_div, e_o_div, e_summary;
        for (var i = 0; i < route_idx.length; i++) {
            route = raw_aliveroutedata[route_idx[i]];
            
            if (route_starts[route.origin] == undefined) {
                route_starts[route.origin] = [];
            }
            /*
            var all_route_journeys = route.journeys;
            var valid_route_journeys = [];
            for (var j = 0; j < all_route_journeys.length; j++) {
                var temp_journey = raw_alivejourneydata[all_route_journeys[j]];
                if (temp_journey != undefined) {
                    var temp_start = alive_day(temp_journey.started);
                    var temp_end = alive_day(temp_journey.ended);
                    if ((temp_start >= start_day && temp_start <= end_day) || (temp_end >= start_day && temp_end <= end_day)) {
                        valid_route_journeys.push(all_route_journeys[j]);
                    }
                }
            }*/
            route_starts[route.origin].push([route.destination, journey_summary[route_idx[i]].components , route_idx[i]]);
        }
        var route_idx = Object.keys(route_starts);
        for (var i = 0; i < route_idx.length; i++) {
            route = route_starts[route_idx[i]];
            var r_id = route_idx[i].replace(" ","_").toLowerCase();
            var r_div = $("<div />", { "class": "alive_route_div", "id": r_id });
            var r_origin = $("<div />", { "class": "alive_route_origin", text: route_idx[i] });
            r_origin.append("<div />");
            var r_switch_delay, r_switch_cost, r_summary;
            if (alive_chart_mode == "delay") {
                r_switch_delay = $("<div />", { "class": "alive_graph_switch_active", "text": "Delay" });
                r_switch_cost = $("<div />", { "class": "alive_graph_switch", "text": "Cost" });
            }
            else {
                r_switch_delay = $("<div />", { "class": "alive_graph_switch", "text": "Delay" });
                r_switch_cost = $("<div />", { "class": "alive_graph_switch_active", "text": "Cost" });
            }
            r_switch_delay.on("click", function () { alive_chart_mode_switch("delay"); });
            r_switch_cost.on("click", function () { alive_chart_mode_switch("cost"); });
            r_origin.append(r_switch_delay);
            r_origin.append(r_switch_cost);
            r_div.append(r_origin);
            $("#alive_data_container").append(r_div);

            for (var j = 0; j < route.length; j++) {
                var r_route_div = $("<div />", { "class": "alive_route_journey", "id": r_id + "_" + j });
                r_route_div.on("click", { arg1: route[j][2] }, function (e) { alive_active_route = e.data.arg1; alive_data_needs_refresh = true; alive_panes("journeys", "data"); });
                r_route_div.on("mousemove", { arg1: r_id + "_" + j }, function (e) { alive_chart_highlight(e.originalEvent, e.data.arg1, false); });
                r_route_div.on("mouseout", { arg1: r_id + "_" + j }, function (e) { alive_chart_highlight(false, e.data.arg1, true); });

                $("#" + r_id).append(r_route_div);
                if (alive_chart_mode == "delay") {
                    e_list = journey_graph({ route_id: route[j][2], journey_id: route[j][1], target: "#" + r_id + "_" + j, bold_windows: false, mode: "delay" });
                    alive_chart_legends[r_id + "_" + j] = { step: e_list[0], data: e_list[1] };
                    e_o_div = $("<span />", { "class": "alive_note_vbad", "id": "e_o_" + r_id + "_" + j });
                    e_d_div = $("<span />", { "class": "alive_note_vbad", "id": "e_d_" + r_id + "_" + j });
                    e_o_div.css({ "text-transform": "none", "display": "none", "position": "absolute", "top": 150 });
                    e_d_div.css({ "text-transform": "none", "display": "none", "position": "absolute", "top": 180 });
                    $("#" + r_id + "_" + j).append(e_o_div);
                    $("#" + r_id + "_" + j).append(e_d_div);
                    r_summary = alive_route_summary(route[j][2], route[j][1]);
                }
                else if (alive_chart_mode == "cost") {
                    e_list = journey_graph({ route_id: route[j][2], journey_id: route[j][1], target: "#" + r_id + "_" + j, bold_windows: false, mode: "cost" });
                    r_summary = alive_route_summary(route[j][2], route[j][1], e_list[2]);
                }


                $(r_summary).css({ "top": 20 + (j * 248) });
                r_div.append(r_summary);
            }
        }
    }
    else if (mode == "journey_summary") {
        var route;
        var r_div = $("<div />", { "class": "alive_route_div", "id": "journey_summary" });
        var r_origin = $("<div />", { "class": "alive_route_origin", text: raw_aliveroutedata[alive_active_route].origin });
        r_origin.append("<div />");
        var r_switch_delay, r_switch_cost, r_summary;
        if (alive_chart_mode == "delay") {
            r_switch_delay = $("<div />", { "class": "alive_graph_switch_active", "text": "Delay" });
            r_switch_cost = $("<div />", { "class": "alive_graph_switch", "text": "Cost" });
        }
        else {
            r_switch_delay = $("<div />", { "class": "alive_graph_switch", "text": "Delay" });
            r_switch_cost = $("<div />", { "class": "alive_graph_switch_active", "text": "Cost" });
        }
        r_switch_delay.on("click", function () { alive_chart_mode_switch("delay"); });
        r_switch_cost.on("click", function () { alive_chart_mode_switch("cost"); });
        r_origin.append(r_switch_delay);
        r_origin.append(r_switch_cost);
        r_div.append(r_origin);
        r_div.append(r_summary);
        $("#alive_data_container").append(r_div);
        var r_route_div = $("<div />", { "class": "alive_route_journey", "id": "journey_summary_graph" });
        r_route_div.on("mousemove", { arg1: "journey_summary_graph" }, function (e) { alive_chart_highlight(e.originalEvent, e.data.arg1, false); });
        r_route_div.on("mouseout", { arg1: "journey_summary_graph" }, function (e) { alive_chart_highlight(false, e.data.arg1, true); });
        $("#journey_summary").append(r_route_div);

        if (alive_chart_mode == "delay") {
            e_list = journey_graph({ route_id:alive_active_route, journey_id: alive_active_journeys, target: "#journey_summary_graph", bold_windows: true, mode: "delay" });
            alive_chart_legends["journey_summary_graph"] = { step: e_list[0], data: e_list[1] };
            e_o_div = $("<span />", { "class": "alive_note_vbad", "id": "e_o_journey_summary_graph" });
            e_d_div = $("<span />", { "class": "alive_note_vbad", "id": "e_d_journey_summary_graph" });
            e_o_div.css({ "text-transform": "none", "display": "none", "position": "absolute", "top": 150 });
            e_d_div.css({ "text-transform": "none", "display": "none", "position": "absolute", "top": 180 });
            $("#journey_summary_graph").append(e_o_div);
            $("#journey_summary_graph").append(e_d_div);
            r_summary = alive_route_summary(alive_active_route, alive_active_journeys);
            e_summary = alive_route_summary_expanded({"sub_route":alive_active_route, "sub_journeys":alive_active_journeys, "gateavgdata":e_list[2], "missed_ship":e_list[3]});
        }
        else if (alive_chart_mode == "cost") {
            e_list = journey_graph({ route_id:alive_active_route, journey_id: alive_active_journeys, target: "#journey_summary_graph", bold_windows: true, mode: "cost" });
            console.log(e_list);
            r_summary = alive_route_summary(alive_active_route, alive_active_journeys, e_list[2]);
            e_summary = alive_route_summary_expanded({"sub_route":alive_active_route, "sub_journeys":alive_active_journeys, "delay_cost":e_list[2],"storage_cost":e_list[3],"storage_count":e_list[4],"missed_ship":e_list[5]});
        }
        $(r_summary).css({ "top": 20 });
        r_div.append(r_summary);

        $("#alive_data_container").append(e_summary);
        if (alive_chart_mode == "delay") {
            var block_names = Object.keys(e_list[2]);
            var b_color, bg_color;
            for (var i = 0; i < block_names.length; i++) {
                var block_data = e_list[2][block_names[i]];
                b_css = "2px solid rgba(" + block_data[4][0] + "," + block_data[4][1] + "," + block_data[4][2] + ",.7)";
                bg_color = "rgba(" + block_data[4][0] + "," + block_data[4][1] + "," + block_data[4][2] + ",.4)";
                var block_div = $("<div />", { "class": "alive_block_summary", "id": "summary_block_" + block_names[i] });
                var block_div
                $(block_div).css({ "left": 140 + (block_data[2] * e_list[0]), "width": ((block_data[1] - block_data[2]) * e_list[0] - 2) });
                $(block_div).css({ "border-left": b_css, "border-right": b_css, "background-color": bg_color });
                $("#journey_summary").append(block_div);
                $("#summary_" + block_names[i]).on("mouseover", { arg1: block_names[i] }, function (e) {
                    $("#summary_block_" + e.data.arg1).css({ "opacity": "1.0" });
                });
                $("#summary_" + block_names[i]).on("mouseout", { arg1: block_names[i] }, function (e) {
                    $("#summary_block_" + e.data.arg1).css({ "opacity": "0.3" });
                });
            }
        }

    }
}

function alive_chart_highlight(event, route_id, suppress) {
    /*
    Given an alive value blob graph, displays the current values when moused over for any part of the blob 
     */
    var datablock;
    if (suppress == true) {
        $("#e_o_" + route_id).hide();
        $("#e_d_" + route_id).hide();
    }
    else {
        datablock = alive_chart_legends[route_id].data[Math.round(event.offsetX / alive_chart_legends[route_id].step)];
        $("#e_o_" + route_id + ",#e_d_" + route_id).show();
        $("#e_o_" + route_id).css({ "background-color": datablock.color, "left": (datablock.time * alive_chart_legends[route_id].step) - 62 });
        $("#e_d_" + route_id).css({ "background-color": datablock.countcolor, "left": (datablock.time * alive_chart_legends[route_id].step) - 62 });
        if (datablock.delay <= 0) {
            $("#e_o_" + route_id).text("-" + alive_prettydate(datablock.delay));
            $("#e_d_" + route_id).hide();
        }
        else {
            $("#e_o_" + route_id).text("+" + alive_prettydate(datablock.delay));
            $("#e_d_" + route_id).text(datablock.offschedule + "/" + datablock.count + " offschedule");
        }
    }
}

function alive_chart_mode_switch(mode) {
    if (mode == "delay") {
        if (alive_chart_mode == "delay") {
            return;
        }
        else {
            alive_chart_mode = "delay";
        }
    }
    else if (mode == "cost") {
        if (alive_chart_mode == "cost") {
            return;
        }
        else {
            alive_chart_mode = "cost";
        }
    }
    $(".alive_chart_canvas").velocity({ "height": [0, 180], "margin-top": [90, 0], "margin-bottom": [90, 0] }, { duration: 150, complete: function () { alive_panes(alive_data_mode, alive_display_mode) } });

    //    velocity({"transform":["scale(2)","scale(1)"]},{duration:150,queue:false,complete:map_zoom_complete}); 
    //    alive_panes(alive_data_mode,alive_display_mode);
}