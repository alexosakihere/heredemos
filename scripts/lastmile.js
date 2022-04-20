var lmdemo = "0.5.34 // 2022.01.15 2100 // 897.365";
var ufo_stops = [];
var ufo_tours = [];
var ufo_vehicles = [];
var ufo_later_stops = [];
var ufo_depots = [];
var ufo_phone;
var ufo_autoplay = false;
var ufo_autoplay_counter = 0;
var ufo_smooths = {};
var res = .1;
var ufo_force_stops_update = false;
var ufo_draw_call = -1; //index to a tour ID to have its route drawn and shaded.
var late_seconds = 3600; //time in seconds where a delivery will be considered "very late" (60 minutes);
var offschedule_seconds = 1800; //time at which a driver will be considered off schedule (30 minutes);

/*

    DOM CONSTRUCTOR CLASSES

    Used to build visual elements of the UI

*/

class smartphone {
    constructor(args) {
        this.tourid = -1;
        this.displaymode = "splash";
        this.parent = args.parent; // The ID of the div to which this is attached.
        this.visible = false;
        this.toasts = [];
        this.rcx;
        this.rcv;
        this.stop_expanded = false;
        this.current_stop = -1;
        this.bar_offset = 0;
        this.signinprogress = false; // Set to true if the mouse is down
        this.signature = [];
        this.activesignature = [];
        this.create();
    }

    create() {
        // Initializes the general phone UI
        var pdom = $(this.parent);
        $(pdom).append("<div class='ufo_phone_speaker'></div>");
        $(pdom).append("<div class='ufo_phone_innerframe'></div>");
        $(pdom).append("<div class='ufo_phone_display' id='ufo_phone_display'></div>");
    }

    draw(caller) {
        if(this.displaymode=="splash") {
            $("#ufo_phone_display").empty();
            $("#ufo_phone_display").append("<img src='./images/lm_splash.jpg' style='width:100%;'></img>");
        }
        if(this.displaymode=="map") {
            if(fleet_solutions_calculated==false) {
                this.displaymode = "splash";
                this.switchmode();
                return;
            }
            if(this.stop_expanded==true) {
                this.minimize_stop();
            }
            this.tilemap();
            var sched_time = new Date((time)*1000.0);
            var sched_time_string = sched_time.getHours() + ":" + ("0"+sched_time.getMinutes()).substr(-2);
            $("#ufo_phone_status_time").html(sched_time_string);
            $(".ufo_phone_stop_next").remove();
            $(".ufo_phone_stop").remove();
            this.rcv = document.getElementById("ufo_phone_route_canvas");
	        this.rcx = this.rcv.getContext("2d");
            this.rcv.width = $("#ufo_phone_display").width();
            this.rcv.height = $("#ufo_phone_display").height();
            this.rcx.clearRect(0,0,this.rcv.width,this.rcv.height);
            this.drawroute();
            if(ufo_tours[this.tourid].current_stop==this.current_stop) {
                return;
            }
            
            var nstop = ufo_stops[ufo_tours[this.tourid].stops[ufo_tours[this.tourid].current_stop]];
            $("#ufo_phone_next_stop_bar").empty();
            var nsblock = $("<div />",{"class":"ufo_phone_bar_left"});
            var nsblockicon = $("<span />",{"id":"phone_bar_icon"});
            nsblockicon.append(ufo_icons["whitevan"]);
            if(ufo_tours[this.tourid].current_stop<1) {
                $(nsblock).append("<span id='phone_bar_label'>1</span>");
            }
            else {
                $(nsblock).append("<span id='phone_bar_label'>"+(ufo_tours[this.tourid].current_stop+1)+"</span>");
            }
            var nstop_time = new Date(ufo_stops[ufo_tours[this.tourid].stops[ufo_tours[this.tourid].current_stop]].eta_low*1000.0);
            var nstop_string = nstop_time.getHours() + ":" + ("0"+nstop_time.getMinutes()).substr(-2);
            nstop_time.setTime(nstop_time.getTime()+3600000);
            var nfin_string = nstop_time.getHours() + ":" + ("0"+nstop_time.getMinutes()).substr(-2);
            var nrange = $("<span />",{"class":"ufo_phone_bar_range","text":nstop_string + "-" + nfin_string});
            $(nsblock).append(nrange);

            $("#ufo_phone_next_stop").empty();
            var nsaddr = $("<div />",{"class":"phone_drawer_addr"});
            var addrstring = nstop.addr + "<br />" + nstop.city +", " + nstop.state + " " + nstop.zip;
            $(nsaddr).append(addrstring);
            
            $(nsblock).append(nsblockicon);
            $("#ufo_phone_next_stop_bar").append(nsblock);
            $("#ufo_phone_next_stop").append(nsaddr);
            var not_expanded = $("<div />",{"class":"phone_drawer_noexpand","id":"ufo_phone_drawer_noexpand"});
            $(not_expanded).append("<div class='phone_drawer_recip'>"+nstop.recipient+"</div>");

            var expanded = $("<div />",{"class":"phone_drawer_expand","id":"ufo_phone_drawer_expand"});
            $(expanded).css({"display":"none"});
            $(expanded).append("<div style=\"display: block; position: absolute; left: .8em; right: .8em; top:5em; height: .15em; background-color: var(--hereufogrey)\" />");

            var stopdetails = $("<div />", {"class":"phone_job_details"});
            var recipient = $("<div />",{"class":"phone_job_details_recipient","text":nstop.recipient});
            $(recipient).append("<span>Planned: "+nstop_string + "-" + nfin_string+"</span>");

            var actual_time = new Date((nstop.actual-300)*1000.0);
            var actual_string = actual_time.getHours() + ":" + ("0"+actual_time.getMinutes()).substr(-2);
            $(recipient).append("<span>ETA: "+actual_string+"</span>");
            if(nstop.notes!="") {
                $(recipient).append("<span><em>Notes: "+nstop.notes+"</em></span>");
            }
            var complete = $("<div />",{"class":"phone_job_complete"});
            var csvgwrap = $("<div />",{"class":"phone_button_wrapper"});
            $(csvgwrap).append(ufo_icons["check"]);
            $(complete).append(csvgwrap);
            $(complete).on("click",function() {
                $("#ufo_phone_drawer_expand").velocity({left:["-20em","0em"]},{duration:100,complete:function() {
                    $("#ufo_phone_drawer_complete").show();
                    ufo_phone.sign({"type":"mouseup"});
                    ufo_phone.sign({"type":"mouseup"});
                }})
            });
            var reject = $("<div />",{"class":"phone_job_reject"});
            var rsvgwrap = $("<div />",{"class":"phone_button_wrapper"});
            $(rsvgwrap).append(ufo_icons["cross"]);
            $(reject).append(rsvgwrap);
            $(reject).on("click",{arg1:nstop},function(e) {
                ufo_force_stops_update = true;
                e.data.arg1.endstate="rejected";
                time = (e.data.arg1.actual-588);
                time_change({delta:1});
            });
            $(stopdetails).append(recipient);
            $(stopdetails).append(complete);
            $(stopdetails).append(reject);
            $(expanded).append(stopdetails);

            /*
            
            Build panel for stop completion.
            
            */

            var finish = $("<div />",{"class":"phone_drawer_complete","id":"ufo_phone_drawer_complete"});
            $(finish).css({"display":"none"});
            var bbutton = $("<div >",{"class":"phone_complete_back"});
            $(bbutton).on("click",function() {
                $("#ufo_phone_drawer_complete").hide();
                $("#ufo_phone_drawer_expand").velocity({left:["0em","-20em"]},{duration:100});

            });

            $(bbutton).append(ufo_icons["backarrow"]);
            var cname = $("<div />",{"class":"phone_complete_name"});
            $(cname).attr("contenteditable","true");
            $(finish).append(cname);
            $(finish).append(bbutton);
            $(finish).append("<span class='phone_complete_caption'>Recipient's name</span>");
            $(finish).append("<span class='phone_complete_signorder'>Sign Here</span>");
            var signpanel = $("<div />",{"class":"phone_complete_signature"});
            var signcanvas = $("<canvas />",{"id":"phone_signature_canvas"});
            $(signcanvas).css({"width":"100%","height":"100%"});
            $(signpanel).append(signcanvas);
            $(signpanel).on("mousedown",function(e) { ufo_phone.sign(e); });
            $(signpanel).on("mousemove",function(e) { ufo_phone.sign(e); });
            $(signpanel).on("mouseup",function(e) { ufo_phone.sign(e); });
            $(signpanel).on("touchstart",function(e) { ufo_phone.sign(e); });
            $(signpanel).on("touchend",function(e) { ufo_phone.sign(e); });
            $(signpanel).on("touchmove",function(e) { ufo_phone.sign(e); });
            var complete_action = $("<div />",{"class":"phone_complete_action","text":"Done"});
            $(complete_action).on("click",{arg1:nstop},function(e) {
                e.data.arg1.endstate="delivered";
                ufo_force_stops_update = true;
                time = (e.data.arg1.actual-588);
                time_change({delta:1});

            });
            $(finish).append(signpanel);
            $(finish).append(complete_action);

            $("#ufo_phone_next_stop").append(not_expanded);
            $("#ufo_phone_next_stop").append(expanded);
            $("#ufo_phone_next_stop").append(finish);
            this.current_stop = ufo_tours[this.tourid].current_stop;
        }

        // Moved to bottom so canvas is sized properly.
        this.signinprogress = false;
        this.activesignature = [];
        if(this.current_stop!=-1) {
            this.signature = ufo_stops[this.current_stop].signature; // Reset the signature process if we have to redraw.
        }
        else {
            this.signature = [];
        }
    }

    sign(e) {
        if(e.type=="touchmove") {
            var offset = e.target.getBoundingClientRect();
            var tevt = {type:"mousemove","originalEvent":{"layerX":(e.originalEvent.changedTouches[0].clientX-offset.x),"layerY":(e.originalEvent.changedTouches[0].clientY-offset.y)}};
            ufo_phone.sign(tevt);
            return;
        }
        else if(e.type=="touchstart") {
            ufo_phone.sign({type:"mousedown"});
            return;
        }
        else if(e.type=="touchend") {
            ufo_phone.sign({type:"mouseup"});
            return;
        }
        if(e.type=="mousedown") {
            this.signinprogress = true;
        }
        else if(e.type=="mouseup") {
            this.signinprogress = false;
            if(this.activesignature.length>0) {
                this.signature.push(this.activesignature);
            }
            this.activesignature = [];
        }
        else if(e.type=="mousemove") {
            if(this.signinprogress==true) {
                this.activesignature.push([e.originalEvent.layerX,e.originalEvent.layerY]);
            }
        }
        if(e.type=="mouseup" || (e.type=="mousemove" && this.signinprogress==true)) {
            var scv = document.getElementById("phone_signature_canvas");
            var scx = scv.getContext("2d");
            var sc;
            scx.width = $("#phone_signature_canvas").width();
            scx.height = $("#phone_signature_canvas").height();
            $("#phone_signature_canvas").attr("width",scx.width);
            $("#phone_signature_canvas").attr("height",scx.height);
            scx.clearRect(0,0,1000,1000);
            scx.strokeStyle = "#000000";
            scx.lineWidth = 2;
            for(var i=0;i<this.signature.length;i++) {
                sc = this.signature[i];
                scx.beginPath();
                scx.moveTo(sc[0][0],sc[0][1]);
                for(var s=1;s<sc.length;s++) {
                    scx.lineTo(sc[s][0],sc[s][1]);
                }
                scx.stroke();
            }
            if(this.activesignature.length>0) {
                scx.beginPath();
                sc = this.activesignature[0];
                scx.moveTo(sc[0],sc[1]);
                for(var i=1;i<this.activesignature.length;i++) {
                    sc = this.activesignature[i];
                    if(sc!=undefined) {
                        scx.lineTo(sc[0],sc[1]);
                    }
                }
                scx.stroke();
            }
            
        }
        
    }

    play_video() {
        //$("#ufo_phone_display").append("<video id='v' style='width:60; height:90' loop><source src='./images/tbt_1.mp4'></video>");
        $(".ufo_phone_tbt").remove();
        for(var i=0;i<ufo_tours.length;i++) {
            ufo_tours[i].active=false;
        }
        ufo_tours[2].active=true;
        this.tourid=2;
        ufo_activate_stops({caller:"ufo_phone"});
        map_finish({"caller":"ufo_phone"});
        time = ufo_midnight+35604;
        ufo_stop_at = ufo_midnight+ 36360;
        ufo_autoplay = true;
        var next_stop_bar = $("#ufo_phone_next_stop_bar");
        var next_stop_div = $("#ufo_phone_next_stop");
        var tbtdiv = $("<div />",{"class":"ufo_phone_tbt"});
        $(tbtdiv).append("<img src='./images/tbt_1.gif?a="+Math.random()+"' style='width:100%;'></img>");
        $(next_stop_bar).velocity({"border-radius":[0,12],"left":["0%","4%"],"right":["0%","4%"],"top":[this.bar_offset+60,this.bar_offset]},{duration:100});
        $(next_stop_div).velocity({"border-radius":[0,12],"left":["0%","4%"],"right":["0%","4%"],"top":[this.bar_offset+97,this.bar_offset+50.0]},{duration:100});
        $("#ufo_phone_display").append(tbtdiv);
        setTimeout(function() {
            $(".ufo_phone_tbt").remove();
            ufo_activate_stops({caller:"ufo_phone"});
            map_finish({"caller":"ufo_phone"});
            $(next_stop_bar).velocity({"border-radius":[12,0],"left":["4%","0%"],"right":["4%","0%"],"top":[ufo_phone.bar_offset,ufo_phone.bar_offset+60]},{duration:100});
            $(next_stop_div).velocity({"border-radius":[12,0],"left":["4%","0%"],"right":["4%","0%"],"top":[ufo_phone.bar_offset+50.0,ufo_phone.bar_offset+97]},{duration:100,complete:function() { $(".ufo_phone_pos_marker").show(); }});
        },12000);
    }
    show() {
        this.visible = true;
        if(fleet_solutions_dispatched==true) {
            for(var i=0;i<ufo_tours.length;i++) {
                if(ufo_tours[i].active==true) {
                    this.tourid = ufo_tours[i].uid;
                    this.displaymode = "map";
                    this.switchmode();
                }
            }
        }
        $(this.parent).show();
        this.draw();
    }
    hide() {
        this.visible = false;
        $(this.parent).hide();
    }

    switchmode() {
        $("#ufo_phone_display").empty();
        if(this.displaymode=="map") {
            var phonecanvas = $("<div />",{"class":"ufo_phone_map_canvas","id":"ufo_phone_map_canvas"});
            $(phonecanvas).css({"transform":"translate3d(0px, 0px, 0px)"});
            for(var i=-2;i<3;i++) {
                for(var j=-1;j<2;j++) {
                    var mtd = $("<div />",{"class":"map_tile","id":"pm-"+i+"-"+j});
                    $(mtd).css({"transform":"translate("+j*512+"px, "+i*512+"px)"});
                    $(phonecanvas).append(mtd);
                }
            }
            var navicon = $("<div />",{"class":"phone_nav_icon","id":"phone_nav_icon"});
            $(navicon).on("click",{arg1:this},function(e){
                if(e.data.arg1.tourid!=-1) {
                    e.data.arg1.play_video();
                }
            });
            $(navicon).append(ufo_icons["nav_icon"]);
            $("#ufo_phone_display").append(navicon);
            var phone_status = $("<div />",{"class":"ufo_phone_status"});
            var batt = $("<div />",{"class":"ufo_phone_status_batt"});
            $(batt).append(ufo_icons["phone_batt"]);
            var timediv = $("<div />",{"class":"ufo_phone_status_time","id":"ufo_phone_status_time","text":"12:00"});
            $(phone_status).append(batt);
            $(phone_status).append(timediv);
            $("#ufo_phone_display").append(phone_status);
            var pos_marker = $("<div />",{"class":"ufo_phone_pos_marker"});
            $(pos_marker).append("<div class=\"ufo_phone_pos_core\">");
            var next_stop_bar = $("<div />", {"class":"ufo_phone_next_stop_bar","id":"ufo_phone_next_stop_bar"});
            $(next_stop_bar).on("click",{arg1:this},function(e) {
                /*
                 * Two cases. First we need to figure out if this is at the vehicle's next stop or not. 
                 * 
                 */
                var tdata = ufo_tours[e.data.arg1.tourid];
                var nstop = ufo_stops[tdata.stops[tdata.current_stop]];
                if(time<(nstop.actual-300)) {
                    ufo_stop_at = (nstop.actual-300);
                    ufo_autoplay = true;
                }
                else {
                    if(e.data.arg1.stop_expanded==true) { e.data.arg1.minimize_stop(); }
                    else { e.data.arg1.expand_stop(); }
                }
                
            });
            var next_stop = $("<div />", {"class":"ufo_phone_next_stop","id":"ufo_phone_next_stop"});
            var phone_rcanvas = $("<canvas />",{"class":"ufo_phone_route_canvas","id":"ufo_phone_route_canvas"});
            $(phone_rcanvas).width = $("#ufo_phone_display").width();
            $(phone_rcanvas).height = $("#ufo_phone_display").height();
            $("#ufo_phone_display").append(pos_marker);
            $("#ufo_phone_display").append(phonecanvas);
            $("#ufo_phone_display").append(next_stop_bar);
            $("#ufo_phone_display").append(next_stop);
            $("#ufo_phone_display").append(phone_rcanvas);
            this.bar_offset = parseFloat($(next_stop_bar).css("top"));
        }

        this.draw();
    }

    expand_stop() {
        var next_stop_bar = $("#ufo_phone_next_stop_bar");
        var next_stop_div = $("#ufo_phone_next_stop");
        this.bar_offset = parseFloat($(next_stop_bar).css("top"));
        this.stop_expanded = true;
        $(".ufo_phone_pos_marker").hide();
        $(".phone_nav_icon").hide();
        $("#ufo_phone_drawer_noexpand").hide();
        $("#ufo_phone_drawer_expand").show();
        $(next_stop_bar).velocity({"border-radius":[0,12],"left":["0%","4%"],"right":["0%","4%"],"top":[0,this.bar_offset]},{duration:100});
        $(next_stop_div).velocity({"border-radius":[0,12],"left":["0%","4%"],"right":["0%","4%"],"top":[40,this.bar_offset+50.0]},{duration:100});
    }
    
    minimize_stop() {
        var next_stop_bar = $("#ufo_phone_next_stop_bar");
        var next_stop_div = $("#ufo_phone_next_stop");
        this.stop_expanded = false;
        //$(".ufo_phone_pos_marker").show();
        $("#ufo_phone_drawer_noexpand").show();
        $("#ufo_phone_drawer_expand").css({"left":"0em"});
        $("#ufo_phone_drawer_expand").hide();
        $("#ufo_phone_drawer_complete").hide();
        $(next_stop_bar).velocity({"border-radius":[12,0],"left":["4%","0%"],"right":["4%","0%"],"top":[this.bar_offset,0]},{duration:100});
        $(next_stop_div).velocity({"border-radius":[12,0],"left":["4%","0%"],"right":["4%","0%"],"top":[this.bar_offset+50.0,40]},{duration:100,complete:function() { $(".ufo_phone_pos_marker").show(); $(".phone_nav_icon").show(); }});
    }

    drawroute() {
        var tour_path = ufo_tours[this.tourid].ipath;
        var s_idx = parseInt((time-ufo_tours[this.tourid].start_time)/(60*res));
        if(s_idx<0) {
            s_idx = 0;
        }
        if(s_idx>tour_path.length) {
            s_idx = tour_path.length-1;
        }
        var npos = tour_path[s_idx];

        var relpos = get_normalized_coord([npos[0],npos[1],14]);
        var drx = relpos[1];
        var dry = relpos[0];
        var rx = Math.floor(relpos[1]);
        var ry = Math.floor(relpos[0]);
        var tdx = relpos[1]-rx; // Should be fraction of 512px by which these needs to be displaced left/right
        var tdy = relpos[0]-ry; // Should be fraction of 512px by which this needs to be displaced up/down
        var ladj = (.5*$("#ufo_phone_display").width())-12.0;
        var hadj = (.5*$("#ufo_phone_display").height())-12.0;
        var ddx = ladj - (tdx * 0.0);
        var ddy = hadj - (tdy * 0.0);

        this.rcx.beginPath();
        this.rcx.strokeStyle = "rgba(0,0,0,.25)";
        this.rcx.lineWidth = 4;
        for(var i=0;i<s_idx;i++) {
            relpos = get_normalized_coord([tour_path[i][0],tour_path[i][1],14]);
            rx = (drx-relpos[1])*512.0;
            ry = (dry-relpos[0])*512.0;
            tdx = ddx - rx;
            tdy = ddy - ry;
            this.rcx.lineTo(tdx,tdy);
            
        }
        this.rcx.stroke();

        this.rcx.beginPath();
        this.rcx.strokeStyle = "rgba(0,0,0,1.0)";
        this.rcx.lineWidth = 4;
        for(var i=s_idx;i<tour_path.length;i++) {
            relpos = get_normalized_coord([tour_path[i][0],tour_path[i][1],14]);
            rx = (drx-relpos[1])*512.0;
            ry = (dry-relpos[0])*512.0;
            tdx = ddx - rx;
            tdy = ddy - ry;
            this.rcx.lineTo(tdx,tdy);
            
        }
        this.rcx.stroke();

        for(var i=0;i<ufo_tours[this.tourid].stops.length;i++) {
            var next_stop = ufo_stops[ufo_tours[this.tourid].stops[i]];
            var relpos = get_normalized_coord([next_stop.lat,next_stop.lon,14]);
            if(i==ufo_tours[this.tourid].current_stop) {
                var nsdiv = $("<div />",{"class":"ufo_phone_stop_next"});
                $(nsdiv).append(ufo_icons["phone_stop_active"]);
                rx = (drx-relpos[1])*512.0;
                ry = (dry-relpos[0])*512.0;
                tdx = ddx - rx - 30.0;
                tdy = ddy - ry - 60.0;
                $(nsdiv).css({"left":tdx,"top":tdy});
                $(nsdiv).append("<span>"+ (i+1) +"</span>")
                $("#ufo_phone_display").append(nsdiv);
            }
            else {
                var nsdiv = $("<div />",{"class":"ufo_phone_stop"});
                $(nsdiv).append(ufo_icons["phone_stop_inactive"]);
                rx = (drx-relpos[1])*512.0;
                ry = (dry-relpos[0])*512.0;
                tdx = ddx - rx - 20.0;
                tdy = ddy - ry - 40.0;
                $(nsdiv).css({"left":tdx,"top":tdy});
                $(nsdiv).append("<span>"+ (i+1) +"</span>")
                $("#ufo_phone_display").append(nsdiv);
            }
            
        }

        // Add icons for depot and warehouse (depot first)
        var next_stop = ufo_depots[0];
        var relpos = get_normalized_coord([next_stop.lat,next_stop.lon,14]);
        var nsdiv = $("<div />",{"class":"ufo_phone_stop"});
        $(nsdiv).append(ufo_icons["warehouse"]);
        rx = (drx-relpos[1])*512.0;
        ry = (dry-relpos[0])*512.0;
        tdx = ddx - rx - 23.0;
        tdy = ddy - ry - 23.0;
        $(nsdiv).css({"padding":"3px","border-radius":"50%","background-color": ufo_colors["onschedule_bg"],"border":"1px solid #6f83bd","width":40,"height":40,"left":tdx,"top":tdy});
        $("#ufo_phone_display").append(nsdiv);

        // Add icons for depot and warehouse (depot first)
        next_stop = ufo_depots[1];
        relpos = get_normalized_coord([next_stop.lat,next_stop.lon,14]);
        nsdiv = $("<div />",{"class":"ufo_phone_stop"});
        $(nsdiv).append(ufo_icons["depot"]);
        rx = (drx-relpos[1])*512.0;
        ry = (dry-relpos[0])*512.0;
        tdx = ddx - rx - 23.0;
        tdy = ddy - ry - 23.0;
        $(nsdiv).css({"padding":"3px","border-radius":"50%","background-color": "var(--heremidgrey)","border":"1px solid #6f83bd","width":40,"height":40,"left":tdx,"top":tdy});
        $("#ufo_phone_display").append(nsdiv);
    }

    tilemap() {
        /*
         * This loads the right map tiles for the 3x6 grid used for the map.
         */
        try {
            var tour_path = ufo_tours[this.tourid].ipath;
            var s_idx = parseInt((time-ufo_tours[this.tourid].start_time)/(60*res));
            if(s_idx<0) {
                s_idx = 0;
            }
            if(s_idx>tour_path.length) {
                s_idx = tour_path.length-1;
            }
            var npos = tour_path[s_idx];

            var relpos = get_normalized_coord([npos[0],npos[1],14]);
            var rx = Math.floor(relpos[1]);
            var ry = Math.floor(relpos[0]);
            var tdx = relpos[1]-rx; // Should be fraction of 512px by which these needs to be displaced left/right
            var tdy = relpos[0]-ry; // Should be fraction of 512px by which this needs to be displaced up/down
            var ladj = (.5*$("#ufo_phone_display").width())-12.0;
            var hadj = (.5*$("#ufo_phone_display").height())-12.0;
            tdx = ladj-(tdx * 512);
            tdy = hadj - (tdy * 512);
            $("#ufo_phone_map_canvas").css({"transform":"translate3d("+(tdx)+"px,"+(tdy)+"px,0px)"});
            for(var i=-2;i<3;i++) {
                for(var j=-1;j<2;j++) {
                    $("#pm-"+i+"-"+j).css({"background-image":"url(\"./screens/14-"+(ry+i)+"-"+(rx+j)+"-reduced.png\")"});
                }
            }
        }
        catch(e) {
            console.log(e);
            this.displaymode = "splash";
            this.switchmode();
        }
        
    }

    toast(msg) {
        /**
         * 
         * Adds a toast to the phone display. 
         * 
         */
        this.toasts.push([msg.text,msg.color,msg.delay]);
    }

    toast_do() {
        if(this.toasts.length>0) {
            var tdata = this.toasts.pop();
            var notification = $("<div >",{"class":"ufo_phone_toast"});
            $(notification).append(tdata[0]);
            $(notification).css({"background-color":tdata[1]});
            $("#ufo_phone_display").append(notification);
            $(notification).velocity({"top":[10,-35]},{duration: 60}).velocity({"opacity":[0,1]},{duration:400,delay:tdata[2],complete:function() {$(this).remove(); ufo_phone.toast_do();}});
        }
    }
}

class ufo_radio {
    constructor(args) {
        this.id = args.id;
        this.value = args.value;
        this.opt_parent = args.opt_parent;
        this.text = args.text;
        this.domel;
        this.parent = args.parent;
        this.create();
    }

    create() {
        var button = $("<div />",{"class":"ufo_radio_button","id":this.parent+"_"+this.id});
        var label = $("<div />",{"class":"ufo_radio_label","id":"label_"+this.parent+"_"+this.id,"text":this.text});
        var radiocontainer = $("<div />",{"class":"ufo_radio","id":"parent_"+this.id});
        $(button).on("click",{arg1:this},function(e) { e.data.arg1.switcher() });
        if(ufo_opts[this.parent].current==this.id) {
            $(button).css({"width":8,"height":8,"border":"4px solid var(--herebluegreen)"});
        }
        $(radiocontainer).append(button);
        $(radiocontainer).append(label);
        this.domel = $(radiocontainer);
        //console.log(this.parent);
        //$(this.parent).append(radiocontainer);
    }

    get_el() {
        return this.domel;
    }

    switcher() {
        ufo_opts[this.parent].current = this.id;
        for(var i=0;i<ufo_opts[this.parent].opts.length;i++) {
            var button = $("#"+this.parent+"_"+i);
            if(ufo_opts[this.parent].current==i) {
                $(button).css({"width":8,"height":8,"border":"4px solid var(--herebluegreen)"});
            }
            else {
                $(button).css({"width":14,"height":14,"border":"1px solid var(--herelightergrey)"});
            }
        }
    }
}

class ufo_report {
/*
Builds a report for a given day.
*/
    constructor(args) {
        this.offset_day = parseInt(args.offset);
        this.tour_count = 0;
        this.stop_count = 0;
        this.delay_count = 0;
        this.tour_planned = 0;
        this.tour_actual = 0;
        this.tour_cost = 0;
        this.tour_distance = 0;
        this.not_delivered_count = 0;
        this.tours = [];
        this.delay_reason = {};
        this.create();
    }

    create() {
        var r_seed = parseInt((parseFloat(get_random(this.offset_day,4))/10000.0)*5);
        var r_offset = parseInt(get_random(this.offset_day,2));
        var driver_assoc = {};
        var driver_keys = Object.keys(ufo_driver_defs);
        for(var i=0;i<driver_keys.length;i++) {
            var key = parseInt(get_random(r_offset+(i*3),3));
            driver_assoc[key] = driver_keys[i];
        }
        this.tour_count = 6+r_seed;
        var driver_assoc_keys = Object.keys(driver_assoc).sort();
        var base_delay = parseInt((parseFloat(get_random(this.offset_day+4,4))/10000.0)*40)-12; // Base traffic delay for all tours on this day 
        console.log(driver_assoc_keys);
        var total_distance = 0;
        var total_time = 0;
        var total_actual = 0;
        var total_stops = 0;
        var total_delays = 0;
        var total_not_delivered = 0;
        for(var i=0;i<6;i++) {
            // There are 6 reasons something can be delayed, so initialize those reasons here.
            this.delay_reason[i] = 0;
        }
        for(var i=0;i<this.tour_count;i++) {
            var tour = {};
            var d = new Date();
            d.setHours(8);
            var start_delay = parseInt((parseFloat(get_random(this.offset_day+i+17,2))/100.0)*15)-11;
            d.setMinutes(start_delay);
            time = d.getTime()/1000|0;
            var tour_stops_a = parseInt((parseFloat(get_random(this.offset_day+i,2))/100.0)*9);
            var tour_stops_b = parseInt((parseFloat(get_random(this.offset_day+i+5,2))/100.0)*14);
            var tour_stops = 35+tour_stops_a+tour_stops_b;
            var tour_planned_time = parseFloat(tour_stops) * 12.7; // Basic time in minutes for each stop
            var tour_delay = parseInt((parseFloat(get_random(this.offset_day+4+i,4))/10000.0)*75)-32;
            var tour_actual_time = start_delay + tour_planned_time + base_delay + tour_delay;
            var num_incomplete_a = parseInt((parseFloat(get_random(this.offset_day+(2*i),2))/100.0)*7);
            var num_incomplete_b = parseInt((parseFloat(get_random(this.offset_day+(3*i),2))/100.0)*5);
            var num_incomplete = num_incomplete_a-num_incomplete_b;
            var incompletes = [];
            var delayed = 0;
            var distance_offset = parseFloat((parseFloat(get_random(this.offset_day+(7*i),3))/1000.0)*12)-6.0;
            var tour_distance = (tour_stops * 2.07)+distance_offset;
            if(tour_actual_time-tour_planned_time>0) {
                var delayed = parseInt((tour_actual_time-tour_planned_time)/12.7);
            }
            if(num_incomplete<0) { num_incomplete = 0; }
            for(var j=0;j<num_incomplete;j++) {
                var reason = parseInt((parseFloat(get_random(this.offset_day+(3*i)+(j*2),2))/100.0)*10);
                if(reason==0 || reason==1) {
                    incompletes.push(0)
                    this.delay_reason[0]+=1;
                }
                else if(reason==2||reason==3) {
                    incompletes.push(1);
                    this.delay_reason[1]+=1;
                }
                else if(reason==4||reason==7) {
                    incompletes.push(2);
                    this.delay_reason[2]+=1;
                }
                else if(reason==5) {
                    incompletes.push(3);
                    this.delay_reason[3]+=1;
                }
                else if(reason==6) {
                    incompletes.push(4);
                    this.delay_reason[4]+=1;
                }
                else {
                    incompletes.push(5);
                    this.delay_reason[5]+=1;
                }
            }
            var end_date = new Date(d.getTime() + tour_actual_time*60000);
            tour["driver"] = driver_assoc[driver_assoc_keys[i]];
            tour["stops"] = tour_stops + 3;
            tour["tasks"] = tour_stops;
            tour["planned"] = tour_planned_time;
            tour["actual"] = tour_actual_time;
            tour["incompletes"] = incompletes;
            tour["delayed"] = delayed;
            tour["distance"] = tour_distance;
            tour["start"] = d;
            tour["end"] = end_date;
            total_distance += tour_distance;
            total_time += tour_planned_time;
            total_actual += tour_actual_time;
            total_stops += tour_stops+3;
            total_delays += delayed;
            total_not_delivered += num_incomplete;
            this.tours.push(tour);
        }
        this.tour_actual = total_actual;
        this.tour_planned = total_time;
        this.tour_distance = total_distance;
        this.stop_count = total_stops;
        this.delay_count = total_delays;
        this.not_delivered_count = total_not_delivered;
    }
}

class ufo_action_button {
    constructor(args) {
        this.start_hidden = args.start_hidden;
        this.action = args.action;
        this.text = args.text;
        this.position = args.position;
        this.pid = args.parent;
        this.id = args.id;
        this.eid = "ufo_action_" + this.pid.pid + "_" + args.id;
        this.create();
        this.icon;
        this.domel;
    }

    create() {
        var button_el = $("<div />",{"class":"ufo_action_button","id":this.eid,"text":this.text});
        if(this.position=="bottom-right") {
            $(button_el).css({"position":"absolute","right":20,"bottom":10});
            if(this.id=="action_cancel" || this.id=="reset_optimize") {
                // Special hack to change the shape and position of the "cancel" button
                $(button_el).css({"background":"none","background-color":"var(--herewhite)","width":"118","height":"28px","line-height":"28px","border":"1px solid var(--herebluegreen)","position":"absolute","right":150,"bottom":10});
            }
        }
        if(this.start_hidden==true) {
            $(button_el).css({"display":"none"});
        }
        $(button_el).on("click",{arg1:this},function(e) { e.data.arg1.doaction(); });
        if( $("#ufo_parent_"+this.pid.pid).length!=0) {
            // If it comes back as zero, this hasn't been assigned to a vertical panel
            $("#ufo_parent_"+this.pid.pid).append(button_el);
        }
        else {
            $(this.pid).append(button_el);
        }
        this.domel = button_el;
    }

    update() {
        if(this.id=="optimize") {
            if(fleet_solutions_calculated==false) {
                if(assignments_panel.selected_count>0 && order_panel.selected_count>0) {
                    $(this.domel).show();
                }
                else {
                    $(this.domel).hide();
                }
            }
            else {
                var okay_to_show = false;
                for(var i=0;i<ufo_later_stops.length;i++) {
                    if(ufo_stops[ufo_later_stops[i]].active==true && ufo_stops[ufo_later_stops[i]].status==0) {
                        okay_to_show = true;
                    }
                }
                if(fleet_solutions_dispatched==true && assignments_panel.selected_count>0 || okay_to_show==true) {
                    if(okay_to_show==true) {
                        this.action="launch_optimize"; 
                        $(this.domel).show(); 
                    }
                    else { $(this.domel).hide(); }
                }
                else if(fleet_solutions_calculated==true) {
                    // Search the tour list and identify if there are any drivers left to be assigned
                    var unassigned=false;
                    for(var i=0;i<ufo_tours.length;i++) {
                        if(ufo_tours[i].stops.length>0 && ufo_tours[i].driver=="") {
                            unassigned = true;
                        }
                    }
                    if(unassigned==true) {
                        this.action = "assign_drivers";
                        $(this.domel).text("Assign drivers");
                        $(this.domel).show();
                    }
                    else {
                        this.action = "dispatch";
                        $(this.domel).text("Dispatch");
                        if(assignments_panel.selected_count>0 && fleet_solutions_dispatched == false) {
                            $(this.domel).show();
                        }
                        else {
                            $(this.domel).hide();
                        }
                    }
                }
                
            }
        }
        if(this.id=="assign") {
            if(fleet_solutions_calculated==false) {
                if(order_panel.selected_count>0 && assignments_panel.selected_count==0) {
                    $(this.domel).show();
                }
                else {
                    $(this.domel).hide();
                }
            }
            else {
                var okay_to_show = false;
                for(var i=0;i<ufo_later_stops.length;i++) {
                    if(ufo_stops[ufo_later_stops[i]].active==true && ufo_stops[ufo_later_stops[1]].status==0) {
                        okay_to_show = true;
                    }
                }
                if(okay_to_show==true) { $(this.domel).show(); }
                else { $(this.domel).hide(); }
                
            }
        }
        if(this.id=="reset_optimize") {
            if(fleet_solutions_calculated==true && fleet_solutions_dispatched==false) {
                $(this.domel).show();
            }
            else {
                $(this.domel).hide();
            }
        }
        if(this.id=="import_jobs") {
            if(fleet_jobs_imported==true) {
                $(this.domel).hide();
            }
            else {
                $(this.domel).show();
            }
        }
    }

    doaction() {
        switch(this.action) {
            case "launch_optimize":
                if(fleet_solutions_dispatched==true) {
                    // Case for when we're updating routes already in motion.
                    $(this.domel).hide();
                    $("#ufo_icon_newjobs").hide();
                    ufo_update_tours({"ignore_redraw":false});
                }
                else {
                    $("#ufo_option_panel").show();
                    $("#shade").show();
                    $("#shade").velocity({"opacity":[.9,.0]},{duration:100});
                    ufo_option_panel_mode = "optimization";
                    ufo_build_option_panel();
                }
                break;
            case "optimize":                
                assignments_panel.actions[0].action = "assign_drivers";
                order_panel.selected_count = 0;
                ufo_create_tours({from_timechange:false,caller:"assign_drivers"});
                break;
            case "assign_drivers":
                assignments_panel.actions[0].action = "dispatch";
                ufo_assign_drivers();
                break;
            case "reset_optimize":
                fleet_solutions_calculated = false;
                var new_active_stops = 0;
                for(var i=0;i<ufo_stops.length;i++) {
                    if(ufo_stops[i].late!=true) {
                        ufo_stops[i].active = true;
                        ufo_stops[i].status = 0;
                        ufo_stops[i].tourid = -1;
                        ufo_stops[i].update_status(true);
                        new_active_stops++;
                    }
                }
                for(var i=0;i<ufo_tours.length;i++) {
                    ufo_tours[i].status=0;
                    ufo_tours[i].active=true;
                    ufo_tours[i].driver="";
                    ufo_tours[i].stops = [];
                    ufo_tours[i].travel_dist = 0.0;
                    ufo_tours[i].complete_time = 0.0;
                }
                fleetpaths = [];
                canon_paths = [];
                fleet_needs_redraw = true;
                ufo_draw_fleet_paths({"caller":"action button"});
                order_panel.selected_count = new_active_stops;
                assignments_panel.selected_count = ufo_tours.length;
                assignments_panel.actions[0].action = "launch_optimize";
                $(assignments_panel.actions[0].domel).text("Optimize");
                assignments_panel.draw();
                order_panel.draw();
                break;
            case "launch_assignments":
                for(var i=0;i<ufo_tours.length;i++) {
                    if(fleet_solutions_dispatched==true) {
                        if(ufo_tours[i].status!=0) {
                            ufo_tours[i].active = true;
                        }
                        else {
                            ufo_tours[i].active = false;
                        }
                    }
                    else {
                        ufo_tours[i].active = true;
                    }
                    
                }
                if(fleet_solutions_dispatched==true) {
                    // Delete the old "Optimize" button and add a new one
                    assignments_panel.actions = [];
                    assignments_panel.add_action_button({start_hidden:true,text:"Update",position:"bottom-right",action:"launch_optimize","id":"optimize",panels:[order_panel]});

                }
                $(this.domel).hide();
                assignments_panel.draw();
                order_panel.draw();
                break;
            case "import_jobs":
                for(var i=0;i<ufo_stops.length;i++) {
                    ufo_stops[i].status = 0;
                    ufo_stops[i].tourid = -1;
                    ufo_stops[i].update_status(false);
                }
                debug(true,valid_orders() + " orders imported from stoplist");
                fleet_jobs_imported = true;
                $(this.domel).hide();
                map_finish();
                assignments_panel.draw();
                order_panel.draw();
                break;
            case "dispatch":
                for(var i=0;i<ufo_tours.length;i++) {
                    if(ufo_tours[i].status==2) {
                        ufo_tours[i].status=3;
                        ufo_vehicles[ufo_tours[i].vehicle].driver = ufo_tours[i].driver;
                        ufo_vehicles[ufo_tours[i].vehicle].tour = ufo_tours[i].uid;
                        ufo_tours[i].active = false;
                        for(var s=0;s<ufo_tours[i].stops.length;s++) {
                            ufo_stops[ufo_tours[i].stops[s]].status = 2;
                        }
                        ufo_tours[i].update_position();
                    }
                }
                ufo_dispatch_drivers({reset:false});
                canon_paths = [];
                fleet_needs_redraw = true;
                fleet_solutions_dispatched = true;
                ufo_activate_stops({caller:"action_"+this.action});
                order_panel.draw();
                assignments_panel.draw();
                queuelist.push({"type":"map_move_to","params":{"dcoord":[36.07131,-115.22173]}});
                $("#ufo_icon_newjobs").show();
                break;
            case "cancel":
                $("#shade").velocity({"opacity":[.0,.9]},{duration:100,complete:function(){
                    $("#shade").hide(); $("#ufo_option_panel").hide();
                }});
                break;
            default:
                console.log(this.action);
        }
    }
}

class ufo_driver_dropdown {
    constructor(args) {
        this.tour_id = args.tour_id;
        this.domel;
        this.list_open = false;
        this.create();
    }

    create() {
        var parent_div = $("<div />");
        var container_div = $("<div />",{"class":"ufo_driver_dropdown_container"});
        $(container_div).on("click",function(e) { e.stopPropagation(); });
        $(container_div).hide();
        var search_div = $("<div />",{"class":"ufo_driver_dropdown_search","id":"driver_search_"+this.tour_id});
        $(search_div).on("input",{args1:this},function(e) { e.data.args1.restrict(); });
        $(search_div).attr("contenteditable","true");
        $(container_div).append(search_div);
        if(ufo_tours[this.tour_id].driver!="") {
            var cdiv = $("<div />",{"class":"ufo_driver_dropdown_header","text":ufo_tours[this.tour_id].driver});
        }
        else {
            var cdiv = $("<div />",{"class":"ufo_driver_dropdown_header","text":"Select driver"});
        }
        var dcaret = $("<div />",{"class":"ufo_driver_dropdown_caret","id":"driver_dropdown_icon_"+this.tour_id});
        $(dcaret).html(ufo_icons["chevron"]);
        $(cdiv).append(dcaret);
        $(cdiv).on("click",{arg1:this},function(e) { e.stopPropagation(); e.data.arg1.show_driverlist(); });
        parent_div.append(cdiv);
        $(container_div).append("<div class='ufo_driver_dropdown_block'><span>Available</span></div>");
        for(var i=0;i<Object.keys(ufo_driver_defs).length;i++) {
            if(ufo_driver_defs[i].available==true && ufo_driver_defs[i].shift_time==0) {
                var cdiv = $("<div />",{"class":"ufo_driver_dropdown_el","text":ufo_driver_defs[i].name});
                if(ufo_driver_defs[i].certification!="Refrigeration" && ufo_tours[this.tour_id].refrigerated==true) {
                    $(cdiv).css({"font-style":"italic"});
                }
                else {
                    $(cdiv).on("click",{arg1:this,arg2:i},function(e) { e.data.arg1.assign_driver(e.data.arg2)});
                }
                $(container_div).append(cdiv);
            }
            else {
                if(ufo_driver_defs[i].provisional_tour==this.tour_id) {
                    var cdiv = $("<div />",{"class":"ufo_driver_dropdown_el","text":ufo_driver_defs[i].name});
                    $(container_div).append(cdiv);
                }
            }
        }
        $(container_div).append("<div class='ufo_driver_dropdown_block'><span>Unavailable</span></div>");
        for(var i=0;i<Object.keys(ufo_driver_defs).length;i++) {
            if(ufo_driver_defs[i].available==true && ufo_driver_defs[i].shift_time!=0) {
                var cdiv = $("<div />",{"class":"ufo_driver_dropdown_el","text":ufo_driver_defs[i].name});
                $(cdiv).css({"font-style":"italic"});
                $(container_div).append(cdiv);
            }
        }

        $(container_div).append("<div class='ufo_driver_dropdown_block'><span>Assigned</span></div>");
        for(var i=0;i<Object.keys(ufo_driver_defs).length;i++) {
            if(ufo_driver_defs[i].available==false) {
                var cdiv = $("<div />",{"class":"ufo_driver_dropdown_el","text":ufo_driver_defs[i].name});
                if(ufo_tours[this.tour_id].driver==ufo_driver_defs[i].name) {
                    // If this is true then this driver matches the assigned driver to the given tour
                    // So clicking on it should unset the driver
                    $(cdiv).on("click",{arg1:this,arg2:i},function(e) { e.data.arg1.unassign_driver(e.data.arg2)});
                }
                $(container_div).append(cdiv);
            }
        }
        $(parent_div).append(container_div);
        this.domel = parent_div;
    }

    restrict() {
        var rtext = $("#driver_search_"+this.tour_id).text().toLowerCase();
        
        $(this.domel).children(".ufo_driver_dropdown_container").children(".ufo_driver_dropdown_el").each(
            function() {
                var ctext = $(this).text().toLowerCase();
                if(ctext.search(rtext)==-1) {
                    $(this).hide();
                }
                else {
                    $(this).show();
                }
            }
        );
    }
    
    show_driverlist() {
        var parent = this.domel;
        var icon = $("#driver_dropdown_icon_"+this.tour_id);
        var header = $(parent).children(".ufo_driver_dropdown_header")[0];
        var container = $(parent).children(".ufo_driver_dropdown_container")[0];
        if(this.list_open==false) {
            $(container).show();
            $(icon).velocity({ "transform": ["rotate(180deg)", "rotate(0deg)"] }, { duration: 100 });
            this.list_open = true;
        }
        else {
            $(container).hide();
            $(icon).velocity({ "transform": ["rotate(0deg)", "rotate(180deg)"] }, { duration: 100 });
            this.list_open = false;
        }
        
    }

    assign_driver(driver_id) {
        if(ufo_tours[this.tour_id].driver!="") {
            //In this case we've already assigned a driver so we're now assigning a different one.
            for(var i=0;i<Object.keys(ufo_driver_defs).length;i++) {
                if(ufo_tours[this.tour_id].driver==ufo_driver_defs[i].name) {
                    ufo_driver_defs[i].available = true;
                }
            }
        }
        ufo_tours[this.tour_id].driver = ufo_driver_defs[driver_id].name;
        ufo_tours[this.tour_id].status = 2;
        ufo_driver_defs[driver_id].provisional_tour = this.tour_id;
        ufo_driver_defs[driver_id].available = false;
        assignments_panel.draw();
//        console.log(driver_id);
    }
    unassign_driver(driver_id) {
        ufo_tours[this.tour_id].driver = "";
        ufo_tours[this.tour_id].status = 1;
        ufo_driver_defs[driver_id].provisional_tour = -1;
        ufo_driver_defs[driver_id].available = true;
        assignments_panel.draw();
//        console.log(driver_id);
    }
}

class ufo_dropdown {
    /*
       When constructed, creates an element and the event handlers for a dropdown
    */
    constructor(args) {
        this.show_first = args.show_first;
        this.els = args.elements;
        this.actions = args.clickactions;
        this.midbar = args.midbar; // If "true", will show in the midbar
        this.header = args.header; // If "true", will be a circular icon appearing in the header
        this.vars = args.vars;
        this.pid = args.parent;
        this.eid = "ufo_dropdown_" + this.pid.pid + "_" + args.id;
        this.id = args.id;
        this.idx = 1;
        this.open = false;
        if(args.smallcard!=undefined) {
            this.smallcard = args.smallcard;
        }
        else {
            this.smallcard = false;
        }
        this.create();
        this.icon;
        this.domel;
    }

    create() {
        if(this.header==true) {
            var dparent = $("<div />", { "class": "ufo_circle_dropdown", "id": this.eid });
            var dparentcontainer = $("<div />", { "class": "ufo_circle_dropdown_container" });
            var right_marker = $("<div />", { "class": "ufo_circle_dropdown_icon" });
        }
        else {
            var dparent = $("<div />", { "class": "ufo_dropdown", "id": this.eid });
            var dparentcontainer = $("<div />", { "class": "ufo_dropdown_container" });
            var right_marker = $("<div />", { "class": "ufo_dropdown_icon" });
        }
        if(this.eid=="ufo_dropdown_orders_show") {
            var d_el = $("<div />", { "class": "ufo_dropdown_el_header", "id": this.eid + "_0", "text": "Show: "+this.els[this.idx] });
        }
        else {
            var d_el = $("<div />", { "class": "ufo_dropdown_el_header", "id": this.eid + "_0", "text": this.els[this.idx] });
        }

        if (this.midbar == true) {
            // Forcing slight adjustment because midbar doesn't have a relative-positioned container
            $(dparent).css({ "width": "calc(100% - 40px)", "margin-top": "5px"});
            $(dparentcontainer).css({"background-color":"var(--hereufomidgrey)"});
            $(right_marker).css({ "top": "5px", "transform-origin": "50% 60%" });
        }
        //$(d_el).css({ "font-weight": "bold" });
        if (this.smallcard==true) {
            $(dparentcontainer).css({"position":"absolute","width":"120","border-color":"var(--herewhite)","background-color":"var(--herewhite)"});
            $(d_el).css({"font-size":"8pt","padding-left":"3px"});
            $(right_marker).css({"top":"6px","transform-origin":"50% 50%"});
        }
        if(this.header==true) {
            right_marker.append(ufo_icons["ellipsis"]);
            $(right_marker).on("click", { arg1: this }, function (e) { e.stopPropagation(); e.data.arg1.showhide(); });
        }
        else {
            right_marker.append(ufo_icons["chevron"]);
            $(d_el).on("click", { arg1: this }, function (e) { e.stopPropagation(); e.data.arg1.showhide(); });
            $(dparent).append(d_el);
        }
        this.icon = right_marker;
        
        
        $(dparent).append(right_marker);

        // The preceding section is because we will always show the selected element as the top element.
        for (var i = 0; i < this.els.length; i++) {
            d_el = $("<div />", { "class": "ufo_dropdown_el", "id": this.eid + "_" + (i + 1), "text": this.els[i] });
            if(this.smallcard==true) { 
                $(d_el).css({"font-size":"8pt","padding-left":"3px"});
            };
            $(d_el).css({ "top": i * 25 });
            if (i == this.idx) {
                $(d_el).css({ "font-weight": "bold" });
            }
            $(d_el).on("click", { arg1: this, arg2: i }, function (e) { e.stopPropagation();; e.data.arg1.action(e.data.arg2); });
            $(dparentcontainer).append(d_el);
        }
        $(dparent).append(dparentcontainer);
        if (this.midbar == true) {
            $(this.pid.midbar_sect).append(dparent);
        }
        else {
            $(this.pid.header_sect).append(dparent);
        }
        this.domel = dparent;
        this.update_strings();
    }

    showhide() {
        

        if (this.header==true) {
            var container = $("#" + this.eid).children(".ufo_circle_dropdown_container")[0];
            if (this.open == false) {
                this.open = true;
                $(container).css({ "background-color": "#ffffff", "z-index": 150, "height": ((this.els.length+1) * 25) - 27, "border": "0px solid var(--herelightergrey)", "box-shadow": "rgba(149, 151, 156, 0.2) -1px -.5px 1.5px 1px, rgba(149, 151, 156, 0.2) 1px .5px 1.5px 1px" });
            }
            else {
                this.open = false;
                this.update_strings();
                $(container).css({ "background-color": tgtcolor, "z-index": 25, "height": 0, "border": "none", "box-shadow": "none" });
            }
        }
        else {
            var container = $("#" + this.eid).children(".ufo_dropdown_container")[0];
            if (this.open == false) {
                this.open = true;
                $("#" + this.eid).css({ "border": "none" });
                $(this.icon).velocity({ "transform": ["rotate(0deg)", "rotate(-90deg)"] }, { duration: 200 });
                $(container).css({ "background-color": "#ffffff", "z-index": 150, "height": ((this.els.length+1) * 25) - 27, "border": "0px solid var(--herelightergrey)", "box-shadow": "rgba(149, 151, 156, 0.2) -1px -.5px 1.5px 1px, rgba(149, 151, 156, 0.2) 1px .5px 1.5px 1px" });
            }
            else {
                this.open = false;
                this.update_strings();
                $(this.icon).velocity({ "transform": ["rotate(-90deg)", "rotate(0deg)"] }, { duration: 200 });
                $("#" + this.eid).css({ "border": "0px solid var(--herelightergrey)" });
                var tgtcolor = "var(--herewhite)";
                if(this.midbar==true) { tgtcolor = "var(--hereufomidgrey)"}
                $(container).css({ "background-color": tgtcolor, "z-index": 25, "height": 0, "border": "none", "box-shadow": "none" });
            }
        }
    }

    update_strings() {
        /*
        If necessary, update text within the dropdown containers
        */

        for (var i = 1; i <= this.els.length; i++) {
            var subel = $("#" + this.eid + "_" + i);
            var d_el_string = this.els[i - 1];
            for (var k = 0; k < this.vars.length; k++) {
                var replace_string = "";
                if (this.vars[k] == "order_count") {
                    // This is used to update the order count on the ORDER panel
                    //var active = active_orders();
                    var active = active_orders();
                    var valid = valid_orders();
                    if (active == 0) {
                        replace_string = "Orders: " + valid;
                    }
                    else {
                        replace_string = active + "/"+valid +" orders selected";
                    }
                    $(this.pid.summary_sect).empty();
                    if(fleet_jobs_imported==true) {
                        var summary_string = "Orders: " + valid + " | Selected: " + active;
                        var selector = $("<div />",{"class":"ufo_summary_icon"});
                        if(active > 0) {
                            $(selector).css({"background-color":"var(--herebluegreen)","border-radius":"2px","border":"1px solid var(--herebluegreen)"});
                            if(active==valid) {
                                $(selector).on("click",{arg1:this},function(e) { e.data.arg1.action("unselect_all_orders")});
                                $(selector).append(ufo_icons["check"]);
                            }
                            else {
                                $(selector).on("click",{arg1:this},function(e) { e.data.arg1.action("select_all_orders")});
                                $(selector).append(ufo_icons["minus"]);
                            }
                        }
                        else {
                            $(selector).on("click",{arg1:this},function(e) { e.data.arg1.action("select_all_orders")});
                        }
    
                        $(this.pid.summary_sect).append(selector);
                        $(this.pid.summary_sect).append(summary_string);
                    }

                }
                else if (this.vars[k] == "ufo_status") {
                    var valid = valid_orders();
                    if(valid==0) {
                        // So the tour plan has not yet started calculating.
                        if(i==1 || i==this.els.length) {
                            $(subel).removeClass("ufo_dropdown_el_invalid");
                            $(subel).addClass("ufo_dropdown_el");
                        }
                        else {
                            $(subel).removeClass("ufo_dropdown_el");
                            $(subel).addClass("ufo_dropdown_el_invalid");
                        }
                    }
                    else {
                        $(subel).removeClass("ufo_dropdown_el_invalid");
                        $(subel).addClass("ufo_dropdown_el");
                    }
                }
                else if (this.vars[k] == "tour_count") {
                    var active = assignments_panel.selected_count;
                    if(active == 0) {
                        replace_string = "Vehicles: " + ufo_tours.length;
                    }
                    else {
                        replace_string = active + "/" + ufo_tours.length + " vehicles selected";
                    }
                }
                d_el_string = d_el_string.replace("[" + k + "]", replace_string);
            }
            if (i == this.idx) {
                if(this.eid=="ufo_dropdown_orders_show") {
                    $("#" + this.eid + "_0").text("Show: "+d_el_string);
                }
                else {
                    $("#" + this.eid + "_0").text(d_el_string);
                }
                $(subel).css({ "font-weight": "bold" });
            }
            else {
                $(subel).css({ "font-weight": "normal" });
            }
            $(subel).text(d_el_string);
        }
    }

    action(val) {

        
        this.open = true;
        this.showhide();
        if(parseInt(val)===val) {
            var avar = this.actions[val]; // Action variable (stored in the header)
        }
        else {
            var avar = val;
        }
        debug(false,"called action: "+avar);
        switch(avar){
            case "import_jobs":
                if(fleet_jobs_imported==false) {
                    for(var i=0;i<ufo_stops.length;i++) {
                        ufo_stops[i].status = 0;
                        ufo_stops[i].tourid = -1;
                        ufo_stops[i].update_status(false);
                    }
                    debug(true,valid_orders() + " orders imported from stoplist");
                    fleet_jobs_imported = true;
                    map_finish();
                    assignments_panel.draw();
                    order_panel.draw();
                }

                break;
            case "select_all_orders":
                if(fleet_jobs_imported==true) {
                    for(var i=0;i<ufo_stops.length;i++) {
                        if(ufo_stops[i].availablefrom < time) {
                            if(order_panel.showmode=="unassigned" && ufo_stops[i].status==0) {
                                ufo_stops[i].active = true;
                                ufo_stops[i].selectedfrom = ""; 
                            }
                            else if(order_panel.showmode=="assigned" && (ufo_stops[i].status==1 || ufo_stops[i].status==2)) {
                                ufo_stops[i].active = true;
                                ufo_stops[i].selectedfrom = ""; 
                            }
                            else if(order_panel.showmode=="all") {
                                ufo_stops[i].active = true;
                                ufo_stops[i].selectedfrom = ""; 
                            }
                            else {
                                ufo_stops[i].active = false;
                                ufo_stops[i].selectedfrom = ""; 
                            }
                        }
                        else {
                            ufo_stops[i].active = false;
                            ufo_stops[i].selectedfrom = ""; 
                        }
                        ufo_stops[i].position();
                        $(".ufo_stop_infopanel").remove();
                    }
                    this.idx = 1;
                }
                
                this.pid.draw();
                break;
            case "unselect_all_orders":
                for(var i=0;i<ufo_stops.length;i++) {
                    ufo_stops[i].active = false;
                    ufo_stops[i].selectedfrom = ""; 
                    ufo_stops[i].position();
                }
                this.idx = 1;
                this.pid.draw();
                break;
            case "select_all_vehicles":
                for(var i=0;i<ufo_tours.length;i++) {
                    ufo_tours[i].active = false;
                    ufo_tours[i].small_card_selector(assignments_panel,true);
                }
                this.idx = 1;
                this.pid.draw();
                order_panel.draw();
                map_finish();
                break;
            case "unselect_all_vehicles":
                for(var i=0;i<ufo_tours.length;i++) {
                    ufo_tours[i].active = true;
                    ufo_tours[i].small_card_selector(assignments_panel,true);
                }
                this.idx = 1;
                this.pid.draw();
                order_panel.draw();
                map_finish();
                break;
            case "show_all":
                this.idx = 4;
                this.pid.showmode = "all";
                this.pid.draw();
                break;
            case "show_unassigned":
                this.idx = 1;
                this.pid.showmode = "unassigned";
                this.pid.draw();
                break;
            case "show_assigned":
                this.idx = 2;
                this.pid.showmode = "assigned";
                this.pid.draw();
                break;
            case "show_delayed":
                this.idx = 3;
                this.pid.showmode = "delayed";
                this.pid.draw();
                break;
            case "delay_normal":
                // Late is 60 minutes, Offschedule driver is 30 minutes
                this.idx = 1;
                late_seconds = 3600;
                offschedule_seconds = 1800;
                this.pid.draw();
                map_finish({caller:"dropdown"});
                break;
            case "delay_relaxed":
                // Late is 90 minutes, offschedule driver is 30 minutes
                this.idx = 2;
                late_seconds = 5400;
                offschedule_seconds = 1800;
                this.pid.draw();
                map_finish({caller:"dropdown"});
                break;
            case "delay_aggressive":
                // Late is 15 minutes, offschedule driver is 10 minutes
                this.idx = 3;
                late_seconds = 900;
                offschedule_seconds = 600;
                this.pid.draw();
                map_finish({caller:"dropdown"});
                break;
            case "delay_very_aggressive":
                // Late is 10 minutes, offschedule driver is 5 minutes
                this.idx = 4;
                late_seconds = 600;
                offschedule_seconds = 300;
                this.pid.draw();
                map_finish({caller:"dropdown"});
                break;
            default:
                this.idx = (val+1);
                break;

        }

    }
}

class pda_panel {
    /*
        Route summary, attached to a stop when 
    */
    constructor(args) {
        this.stopid = args.stopid;
        //this.tourid = args.tourid;
        this.pdomel = "#marker_ufostop_"+args.stopid;
        this.offset = args.offset;
        this.create();
    }

    create() {
        var spda_cont = $("<div />",{"class":"ufo_pda_stop"});
        var ps = ufo_stops[this.stopid]; // Object containing the stop data.
        $(spda_cont).css({"left":((this.offset*2)+15),"top":this.offset});
        var ps_name = $("<div />",{"class":"ufo_pda_stop_name"});
        ps_name.append(ps.recipient);
        $(spda_cont).append(ps_name);

        var ps_addr = $("<div />",{"class":"ufo_pda_stop_addr"});
        ps_addr.append(ps.addr);
        $(spda_cont).append(ps_addr);

        var nstop_time = new Date(ps.eta_low*1000.0);
        var nstop_string = nstop_time.getHours() + ":" + ("0"+nstop_time.getMinutes()).substr(-2);
        nstop_time.setTime(nstop_time.getTime()+3600000);
        var nfin_string = nstop_time.getHours() + ":" + ("0"+nstop_time.getMinutes()).substr(-2);
        var nrange = $("<div />",{"class":"ufo_pda_stop_range","text":"Scheduled time: "});
        nrange.append("<span>"+nstop_string + "-" + nfin_string+"</span>");
        $(spda_cont).append(nrange);

        var nactual = $("<div />",{"class":"ufo_pda_stop_actual","text":"Actual: "});
        if(ps.endstate=="delivered") {
            var nact_time = new Date(ps.actual*1000.0);
            var nact_string = nact_time.getHours() + ":" + ("0"+nact_time.getMinutes()).substr(-2);
            $(nactual).append("<span>"+nact_string+"</span>");
            $(spda_cont).append(nactual);
            var nsigner = $("<div />",{"class":"ufo_pda_stop_actual","text":"Signed by: "});
            $(nsigner).append("<span>"+ps.signedby+"</span>");
            $(spda_cont).append(nsigner);
        }
        else {
            $(nactual).append("<span style='color: var(--herered)'>Not delivered</span>");
            $(spda_cont).append(nactual);
            var nsigner = $("<div />",{"class":"ufo_pda_stop_actual","text":"Reason: "});
            $(nsigner).append("<span>Recipient unavailable</span>");
            $(spda_cont).append(nsigner);
        }

        var nsplan = $("<div />",{"class":"ufo_pda_stop_range","text":"Projected job time: "});
        $(nsplan).append("<span>5 minutes</span>");
        var nscasc = $("<div />",{"class":"ufo_pda_stop_actual","text":"Actual job time: "});
        $(nscasc).append("<span>"+(ps.process/60).toFixed(1)+" minutes</span>");

        $(spda_cont).append(nsplan);
        $(spda_cont).append(nscasc);

        $(this.pdomel).append(spda_cont);
    }
}

class vertical_panel {

    constructor(args) {
        this.left = args.left; // Left shift if necessary
        this.pid = args.id; // Parent div ID
        this.name = args.name; // Headline for content
        this.icon = args.icon; // Icon to show
        this.header_sect;
        this.midbar_sect;
        this.summary_sect;
        this.list_sect;
        this.dropdowns = []; // Stores the index for the dropdown
        this.actions = [];
        this.selected_count = 0;
        this.showmode = "all";
        this.sortmode;
        this.visible = false;
        this.create();
    }

    create() {
        var parent_div = $("<div />", { "class": "ufo_orders", "id": "ufo_parent_" + this.pid });
        $(parent_div).css({ "left": this.left,"width":"0px"});
        var header_div = $("<div />", { "class": "ufo_pane_header", "id": "ufo_header_" + this.pid });
        var list_div = $("<div />", { "class": "ufo_stop_list", "id": "ufo_list_" + this.pid });
        var panetitle = $("<div />", { "class": "ufo_pane_title" });
        var paneicon = $("<div />", { "class": "ufo_smallpane_icon","id":"top_icon_"+this.name});
        var midbar = $("<div />", { "class": "ufo_pane_midbar" });
        var summary = $("<div />", { "class": "ufo_pane_summarybar" });
        var button_shield = $("<div />",{"class":"ufo_pane_buttonframe"});
        //$(parent_div).append(button_shield);
        //$(paneicon).append(ufo_icons[this.icon]);
        $(panetitle).append(paneicon);
        $(panetitle).append($("<span />", { "text": this.name,"id":this.pid+"_verticaltitle" }));
        $(header_div).append(panetitle);
        $(parent_div).append(header_div);
        $(parent_div).append(midbar);
        $(parent_div).append(summary);
        $(parent_div).append(list_div);
        this.list_sect = list_div;
        this.header_sect = header_div;
        this.midbar_sect = midbar;
        this.summary_sect = summary;
        $("#main_container").prepend(parent_div);
    }

    draw(params) {
        if(params==undefined) { params = {}; }
        blocking_queue=true;
        var caller = params.caller;
        if(caller==undefined) {
            console.log("Draw call made to: "+this.pid);
        }
        else {
            console.log("Draw call made to: "+this.pid+" from function "+caller);
        }
        
        $("#ufo_panel_breadcrumb_"+this.pid).remove();
        var class_selected = 0;
        if(this.pid=="orders") {
            for(var i=0;i<ufo_stops.length;i++) {
                if(ufo_stops[i].active==true && ufo_stops[i].availablefrom < time) { class_selected ++; }
            }
        }
        else if(this.pid=="assignments") {
            for(var i=0;i<ufo_tours.length;i++) {
                if(ufo_tours[i].active==true) { class_selected ++; }
            }
            this.add_midbar_data();
        }
        this.selected_count = class_selected;

        $("#ufo_parent_" + this.pid).show();
        if($("#ufo_parent_"+this.pid).css("width")=="0px") {
            this.visible = true;
            var ladj = 720+(($("#map_container").width()-720)/2);
            $("#map_container").css({"transform-origin":""+ladj+"px 50%"});
            if(params.move_to_params!=undefined) {
                map_zlevel = 13;
                var mc = get_normalized_coord([36.1373,-115.1888]);
            }
            else {
                var mc = get_normalized_coord(center); // map center
            }
            var ac = get_projected_coord([mc[0],mc[1]-.75]); // ADjusted center shifted by 256 pixels left
            if(this.pid=="assignments") { 
                if(params.move_to_params!=undefined) {
                    queuelist.push({"type":"map_move_to","params":{"dcoord":ac,"zdir":params.move_to_params.zdir,"after":get_projected_coord(mc)}});
                }
                else {
                    queuelist.push({"type":"map_move_to","params":{"dcoord":ac,"after":get_projected_coord(mc)}});
                }
                
            }
            $("#ufo_parent_"+this.pid).velocity({width:[320,0],left:[this.left,64]},{duration:160,easing:"easeOutQuart"});
        }

        for (var i = 0; i < this.dropdowns.length; i++) {
            this.dropdowns[i].update_strings();
            if(this.dropdowns[i].open==true) {
                this.dropdowns[i].showhide();
            }
        }
        for (var i = 0; i < this.actions.length; i++) {
            this.actions[i].update();
        }
        $(this.list_sect).empty();
        this.add_card_list();

        // 23.11.2021 disabling resizing of the time control
        //if($("#ufo_time_control").css("left")=="60px") { $("#ufo_time_control").css({"left":735})}
        blocking_queue=false;
    }

    add_midbar_data() {
        /*
        
        Section to add data blocks reflecting the current state of the tour.
        
        */
        if(this.pid=="assignments") {
            if(fleet_solutions_calculated) {
                $(this.midbar_sect).children(".ufo_dropdown").hide();
                $(this.header_sect).children(".ufo_dropdown").show();
                $(this.midbar_sect).children(".ufo_midbar_data_block").remove();
                $(this.midbar_sect).children(".ufo_midbar_data_block_caption").remove();
                /*
                
                Data we want to get:

                active_tours: Number of tours that have been calculated.
                tour_cost: Estimated cost for those tours
                tour_distance: Estimated distance for those tours.
                tour_time: Estimated time to complete all tours

                */
               var active_tours = 0;
               var in_pda = false;
               var tour_cost = 0.0;
               var tour_time = 0.0;
               var tour_distance = 0.0;
               var delta_cost = 0.0; // Delta plan to actual cost
               var delta_time = 0.0; // Delta plan to actual time
               var delta_distance = 0.0; // Delta plan to actual km
               for(var i=0;i<ufo_tours.length;i++) {
                   if(ufo_tours[i].status>0) {
                       if(this.selected_count==0 || ufo_tours[i].active==true) {
                        active_tours++;
                        if(ufo_tours[i].status==4) {
                            in_pda = true;
                            delta_distance += (ufo_tours[i].travel_dist_actual-ufo_tours[i].travel_dist);
                            delta_time += (ufo_tours[i].complete_time_actual-ufo_tours[i].complete_time);
                            tour_distance+=ufo_tours[i].travel_dist_actual;
                            tour_time+=ufo_tours[i].complete_time_actual;
                        }
                        else {
                            tour_distance+=ufo_tours[i].travel_dist;
                            tour_time+=ufo_tours[i].complete_time;
                        }
                       }
                       
                   }
               }
               console.log(active_tours);
               tour_distance = Math.round(tour_distance*dfactor/1000);
               var active_tours_data = $("<div />",{"class":"ufo_midbar_data_block","text":tour_distance+" KM","css":{"flex":"0 1 20%"}});
               if(active_tours==1 && in_pda==true) {
                //ar active_tours_caption = $("<div />",{"class":"ufo_midbar_data_block_caption","text":"Km"});
                if(delta_distance!=0) {
                    var delta_tours_data = $("<div />",{"class":"ufo_midbar_data_block","text":"+"+(delta_distance*dfactor/1000).toFixed(2)});
                    $(delta_tours_data).css({"left": 120,"top":55});
                    $(this.midbar_sect).append(delta_tours_data);
                }
               }
               else {
                var active_tours_caption = $("<div />",{"class":"ufo_midbar_data_block_caption","text":"Est. km"});
               }
               
               $(active_tours_caption).css({"left": 120,"top":35});

               tour_cost = "$"+Math.round((tour_time/3600)*dcphr + (tour_distance*dcpkm));

               var cost_data = $("<div />",{"class":"ufo_midbar_data_block","text":tour_cost});
               if(active_tours==1 && in_pda==true) {
                var cost_caption = $("<div />",{"class":"ufo_midbar_data_block_caption","text":"Cost"});
                if(delta_time!=0 || delta_distance!=0) {
                    var delta_cost = ((Math.round(((tour_time+delta_time)/3600)*dcphr + ((tour_distance+(delta_distance*dfactor/1000))*dcpkm))) - (Math.round((tour_time/3600)*dcphr + (tour_distance*dcpkm))));
                    if(delta_cost>0) {
                        delta_cost = "+$"+delta_cost;
                    }
                    else {
                        delta_cost = "-$"+Math.abs(delta_cost);
                    }
                    var delta_cost_data = $("<div />",{"class":"ufo_midbar_data_block","text":delta_cost});
                    $(delta_cost_data).css({"left": 20,"top":55});
                    $(this.midbar_sect).append(delta_cost_data);
                }
               }
               else {
                var cost_caption = $("<div />",{"class":"ufo_midbar_data_block_caption","text":"Est. cost"});
               }
               $(cost_caption).css({"left": 20,"top":35});

               var hours = Math.floor(tour_time/3600);
               var mins = (tour_time/3600) - parseFloat(hours);
               var mins = Math.round(mins*60);

               var tstring = hours+" h "+mins+" min"

               var hours_data = $("<div />",{"class":"ufo_midbar_data_block","text":tstring});
               if(active_tours==1 && in_pda==true) {
                var hours_caption = $("<div />",{"class":"ufo_midbar_data_block_caption","text":"Time"});
                if(delta_time!=0) {
                    var dhours = Math.floor(delta_time/3600);
                    var dmins = (delta_time/3600) - parseFloat(dhours);
                    var dmins = Math.round(dmins*60);
     
                    var dtstring = dhours+"h "+dmins+"m";
                    if(delta_time>0) {
                        dtstring = "+"+dtstring;
                    }
                    else {
                        dtstring = dtstring;
                    }
                    var delta_time_data = $("<div />",{"class":"ufo_midbar_data_block","text":dtstring});
                    $(delta_time_data).css({"left": 220,"top":55});
                    $(this.midbar_sect).append(delta_time_data);
                }
                
               }
               else {
                var hours_caption = $("<div />",{"class":"ufo_midbar_data_block_caption","text":"Est. time"});
               }
               
               $(hours_caption).css({"left": 220,"top":35});

               $(this.midbar_sect).append(cost_data);
               $(this.midbar_sect).append(active_tours_data);
               //$(this.midbar_sect).append(active_tours_caption);
               //$(this.midbar_sect).append(cost_caption);
               $(this.midbar_sect).append(hours_data);
               //$(this.midbar_sect).append(hours_caption);
            }
            else {
                if(fleet_solutions_dispatched==true) {
                    $(this.midbar_sect).children(".ufo_dropdown").hide();
                    $(this.header_sect).children(".ufo_dropdown").show();
                    $(this.midbar_sect).children(".ufo_midbar_data_block").remove();
                    $(this.midbar_sect).children(".ufo_midbar_data_block_caption").remove();
                    var active_tours_data = $("<div />",{"class":"ufo_midbar_data_block","text":"0 KM","css":{"flex":"0 1 20%"}});
                    var cost_data = $("<div />",{"class":"ufo_midbar_data_block","text":"$0"});
                    var hours_data = $("<div />",{"class":"ufo_midbar_data_block","text":"0 min"});
                    $(this.midbar_sect).append(cost_data);
                    $(this.midbar_sect).append(active_tours_data);
                    //$(this.midbar_sect).append(active_tours_caption);
                    //$(this.midbar_sect).append(cost_caption);
                    $(this.midbar_sect).append(hours_data);
                }
               else {
                    $(this.midbar_sect).children(".ufo_dropdown").show();
                    $(this.header_sect).children(".ufo_dropdown").show();
                    $(this.midbar_sect).children(".ufo_midbar_data_block").remove();
                    $(this.midbar_sect).children(".ufo_midbar_data_block_caption").remove();
               }
            }
        }
    }

    hide() {
        this.visible = false;
        $("#map_container").css({"transform-origin":"50% 50%"});
        var mc = get_normalized_coord(center); // map center
        var ac = get_projected_coord([mc[0],mc[1]+.75]); // ADjusted center shifted by 256 pixels left
        if(this.pid=="assignments") { 
                queuelist.push({"type":"map_move_to","params":{"dcoord":ac,"after":get_projected_coord(mc)}});
        }
        $("#ufo_parent_"+this.pid).velocity({width:[0,320],left:[64,this.left]},{duration:260,easing:"easeOutQuart",complete:function() { 
                $(this).hide();
            }});
        
    }

    add_dropdown(params) {
        var show_first = params.show_first;
        var els = params.elements;
        var id = params.id;
        var midbar = params.midbar; // Should this appear in the midbar?
        var header = params.header; // Should this appear in the header?
        var vars = params.vars;
        var clickactions = params.clickactions;
        if (params.show_first == undefined) {
            show_first = false;
        }
        if (params.midbar == undefined) {
            midbar = false;
        }
        if (params.vars == undefined) {
            vars = [];
        }
        var dropdown = new ufo_dropdown({ show_first: show_first, midbar: midbar, header:header, id: id, elements: els, parent: this, vars: vars, clickactions: clickactions });
        this.dropdowns.push(dropdown);

    }

    add_action_button(params) {
        var abutton = new ufo_action_button({id:params.id,text:params.text,position:params.position,start_hidden:params.start_hidden,action:params.action,parent:this});
        this.actions.push(abutton);
        if(params.panels!=undefined) {
            for(var i=0;i<params.panels.length;i++) {
                params.panels[i].actions.push(abutton);
            }
        }
    }

    add_filter(params) {
        var id = params.id;
        var text = params.text;
        //var sbar = $("<lui-search />",{"id":"ufo_filter_"+this.pid+"_"+this.id});
        // $(sbar).attr({"placeholder":text,"class":"lui-small"})
        //  $(this.header_sect).append(sbar);
        //  $(this.header_sect).append("<div class='ufo_pane_spacer'></div>")
    }


    add_card_list() {
        if (this.pid == "orders") {
            for (var i = 0; i < ufo_stops.length; i++) {
                switch(this.showmode) {
                    case "all":
                        if(ufo_stops[i].status!=-1) {
                            ufo_stops[i].add_small_card(this);
                        }
                        break;
                    case "unassigned":
                        if(ufo_stops[i].status==0) {
                            ufo_stops[i].add_small_card(this);
                        }
                        break;
                    case "assigned":
                        if(ufo_stops[i].status==1) {
                            ufo_stops[i].add_small_card(this);
                        }
                        break;
                    case "delayed":
                        if(ufo_stops[i].status==3) {
                            ufo_stops[i].add_small_card(this);
                        }
                        break;
                }
            }
        }
        else if (this.pid == "assignments") {
            var show_single_tour = -1;
            if(fleet_solutions_dispatched==true) {
                for(var i=0;i<ufo_tours.length;i++) {
                    if(ufo_tours[i].active==true) {
                        show_single_tour = i;
                    }
                }

            }
            for(var i=0;i<ufo_later_stops.length;i++) {
                if(ufo_stops[ufo_later_stops[i]].active==true && ufo_stops[ufo_later_stops[i]].status==0) {
                    show_single_tour = -1;
                }
            }
            if(show_single_tour==-1) {
                $("#"+this.pid+"_verticaltitle").text(this.name);
                $("#"+this.pid+"_verticaltitle").css({"margin-left":"0px"});
                //$("#top_icon_"+this.name).empty();
                //$("#top_icon_"+this.name).append(ufo_icons[this.icon]);
                $(".ufo_panel_driver_summary").remove();
                for (var i = 0; i < ufo_tours.length; i++) {
                    ufo_tours[i].add_small_card(this);
                }



                if(fleet_jobs_imported==true) {
                    $(this.summary_sect).empty();
                    var active = assignments_panel.selected_count;
                    if(fleet_solutions_dispatched==false) {
                        var summary_string = "Available: " + active;
                        var selector = $("<div />",{"class":"ufo_summary_icon"});
                        if(active > 0) {
                            $(selector).css({"background-color":"var(--herebluegreen)","border-radius":"2px","border":"1px solid var(--herebluegreen)"});
                            if(active==ufo_tours.length) {
                                $(selector).on("click",{arg1:this},function(e) { assignments_panel.dropdowns[0].action("unselect_all_vehicles")});
                                $(selector).append(ufo_icons["check"]);
                            }
                            else {
                                $(selector).on("click",{arg1:this},function(e) { assignments_panel.dropdowns[0].action("select_all_vehicles")});
                                $(selector).append(ufo_icons["minus"]);
                            }
                        }
                        else {
                            $(selector).on("click",{arg1:this},function(e) { assignments_panel.dropdowns[0].action("select_all_vehicles")});
                        }
    
                        $(this.summary_sect).append(selector);
                        $(this.summary_sect).append(summary_string);
                    }
                }
            }
            else {
                //$("#top_icon_"+this.name).empty();
                //$("#top_icon_"+this.name).append(ufo_icons["tour_inprogress"]);
                $("#"+this.pid+"_verticaltitle").text(ufo_tours[show_single_tour].driver);
                $("#"+this.pid+"_verticaltitle").css({"margin-left":"30px"});
                $(".ufo_panel_driver_summary").remove();
                var driver_summary = $("<div />",{"class":"ufo_panel_driver_summary"});
                var breadcrumb = $("<div />",{"class":"ufo_panel_breadcrumb","id":"ufo_panel_breadcrumb_"+this.pid});
                $(this.header_sect).children(".ufo_dropdown").hide();
                $(breadcrumb).on("click",function() {
                    for(var i=0;i<ufo_tours.length;i++) {
                        ufo_tours[i].active = false;
                    }
                    for(var i=0;i<ufo_stops.length;i++) {
                        ufo_stops[i].active = false;
                        ufo_stops[i].selectedfrom = ""; 
                    }
                    fleet_needs_redraw = true;
                    fleetpaths = [];
                    order_panel.draw("add_card_list()");
                    assignments_panel.draw("add_card_list()");
                    map_finish();
                })
                var green_chevron = ufo_icons["chevron"];
                green_chevron = green_chevron.replace("class=\"st1\"","\" style=\"fill:var(--hereaqua)\"");
                $(breadcrumb).append(green_chevron);
                $("#ufo_parent_"+this.pid).append(breadcrumb);
                $("#ufo_header_"+this.pid).append(driver_summary);
                $(this.summary_sect).empty();
                var summary_string = "Stops: " + ufo_tours[show_single_tour].stops.length;
                $(this.summary_sect).append(summary_string);
                ufo_depots[0].add_small_card(this);
                for(var i=0;i<ufo_tours[show_single_tour].stops.length;i++) {
                    ufo_stops[ufo_tours[show_single_tour].stops[i]].add_small_card(this);
                }
            }
        }
    }
}

/*
    UFO OBJECT CLASSES
    Classes to handle events and state for:
    * A stop (one single job)
    * A tour (a sequence of stops)
    * A vehicle (used to complete a route)
*/

class ufo_route {
/**
 * 
 * Contains a set of functions for drawing a route
 */
    constructor(args) {
        this.id = "car9";
        this.plan = args.plan;
        this.actual = args.actual;
        this.trace = args.trace;
        this.trace_adjusted = args.adjusted;
        this.adjusted = false;
        this.points = [];
        this.create_points();
    }

    create_points() {
        var init = rm_paths[this.trace];
        for(var i=0;i<init.length;i++) {
            var p = init[i];
            var marker = $("<div />",{"class":"marker_container","id":"rm_p_"+this.id+"_"+i});
            var icon = $("<div />",{"class":"marker_icon"});
            $(marker).css({"left":-500,"top":-500});
            $(icon).css({ "background-image": "none", "color": "#ffffff", "background-color":"rgba(63,89,167,.5)","text-align": "center", "border-color": "rgba(63,89,167,1)", "border-width": "1", "font-size": "8pt", "line-height": "24pt" });
            $(marker).append(icon);
            this.points.push(marker);
            $("#tracker_layer").append(marker);
        }
    }

    plot() {
        if(this.adjusted==true) {
            var init = rm_paths[this.trace_adjusted];
        }
        else{
            var init = rm_paths[this.trace];
        }
        
        var iwidths = [2,4,4,8,8];
        for(var i=0;i<this.points.length;i++) {
            var p = this.points[i];
            var geo_p = init[i];
            var icon = $(p).children(".marker_icon")[0];
            $(icon).show();
            if(this.adjusted==false) {
                //var pos_offset = iwidths[(i * parseInt(geo_p[0])) % 5];
                var pos_offset = trackers["car9"].updates[i+1].source[1]/8.0;
            }
            else {
                var pos_offset = 2;
            }
            var origin = get_normalized_coord([geo_p[0], geo_p[1]]);
            var delta_y = origin[0] - normalized_origin[0];
            var delta_x = origin[1] - normalized_origin[1];
            $(icon).css({ width: pos_offset * 2, height: pos_offset * 2, backgroundSize: pos_offset * 2, borderRadius: pos_offset * 8, zIndex: pos_offset * 3 });
            $(p).css({ zIndex: pos_offset * 3 });
            var pleft = map_tile_offset_x + (delta_x * 512);
            var ptop = map_tile_offset_y + (delta_y * 512);
            $(p).css({ "left": pleft - pos_offset, "top": ptop - pos_offset });
        }
    }

    adjust_incremental(pidx) {
        if(pidx==undefined) { var pidx = 0; }
        if(pidx<this.points.length) {
            var source = rm_paths[this.trace];
            var adjust = rm_paths[this.trace_adjusted];
            var iwidths = [2,4,4,8,8];
            var p = this.points[pidx];
            var icon = $(p).children(".marker_icon")[0];
            var geo_s = source[pidx];
            var geo_a = adjust[pidx];
            var org_s = get_normalized_coord([geo_s[0], geo_s[1]]);
            var org_a = get_normalized_coord([geo_a[0], geo_a[1]]);
            //var pos_offset = iwidths[(pidx * parseInt(geo_s[0])) % 5];
            var pos_offset = pos_offset = trackers["car9"].updates[i+1].source[1]/8.0;
            var pos_offset_adj = 2;
            var dy_s = (map_tile_offset_y + (org_s[0] - normalized_origin[0]) * 512)-pos_offset;
            var dx_s = (map_tile_offset_x + (org_s[1] - normalized_origin[1]) * 512)-pos_offset;
            var dy_a = (map_tile_offset_y + (org_a[0] - normalized_origin[0]) * 512)-pos_offset_adj;
            var dx_a = (map_tile_offset_x + (org_a[1] - normalized_origin[1]) * 512)-pos_offset_adj;
            $(icon).velocity({"width":[pos_offset_adj*2,pos_offset*2],"height":[pos_offset_adj*2,pos_offset*2]});
            var pda_local = this;
            $(p).velocity({"left":[dx_a,dx_s],"top":[dy_a,dy_s]},{queue:true,duration:40,complete:function() { pda_local.adjust(pidx+1); $(this).hide()}});
        }
        else {
            tracker_draw_trace({id:active_tracker,caller:"none",redraw:true});
            map_zoom({"level":map_zlevel,"caller":"routemap_adjust"});
        }
    }

    adjust() {
        var source = rm_paths[this.trace];
        var adjust = rm_paths[this.trace_adjusted];
        var iwidths = [2,4,4,8,8];
        for(var i=0;i<this.points.length;i++) {
            var p = this.points[i];
            var icon = $(p).children(".marker_icon")[0];
            if(this.adjusted==false) {
                var geo_s = source[i];
                var geo_a = adjust[i];
                var org_s = get_normalized_coord([geo_s[0], geo_s[1]]);
                var org_a = get_normalized_coord([geo_a[0], geo_a[1]]);
                var pos_offset = pos_offset = trackers["car9"].updates[i+1].source[1]/8.0;
                //var pos_offset = iwidths[(i * parseInt(geo_s[0])) % 5];
                var pos_offset_adj = 2;
            }
            else {
                var geo_a = source[i];
                var geo_s = adjust[i];
                var org_s = get_normalized_coord([geo_s[0], geo_s[1]]);
                var org_a = get_normalized_coord([geo_a[0], geo_a[1]]);
                var pos_offset_adj = pos_offset = trackers["car9"].updates[i+1].source[1]/8.0;
                //var pos_offset = iwidths[(i * parseInt(geo_s[0])) % 5];
                var pos_offset = 2;
            }
            var dy_s = (map_tile_offset_y + (org_s[0] - normalized_origin[0]) * 512)-pos_offset;
            var dx_s = (map_tile_offset_x + (org_s[1] - normalized_origin[1]) * 512)-pos_offset;
            var dy_a = (map_tile_offset_y + (org_a[0] - normalized_origin[0]) * 512)-pos_offset_adj;
            var dx_a = (map_tile_offset_x + (org_a[1] - normalized_origin[1]) * 512)-pos_offset_adj;
            $(icon).velocity({"width":[pos_offset_adj*2,pos_offset*2],"height":[pos_offset_adj*2,pos_offset*2]});
            
            if(this.adjusted==false) {
                if(i==this.points.length-1) {
                    $(p).velocity({"left":[dx_a,dx_s],"top":[dy_a,dy_s]},{complete:function() { 
                        $(this).hide();
                        tracker_draw_trace({id:active_tracker,caller:"none",redraw:true});
                        map_zoom({"level":map_zlevel,"caller":"routemap_adjust"});
                    }});
                }
                else {
                    $(p).velocity({"left":[dx_a,dx_s],"top":[dy_a,dy_s]},{complete:function() { $(this).hide()}});
                }
            }
            else {
                if(i==0) {
                    $(p).show();
                    $(p).velocity({"left":[dx_a,dx_s],"top":[dy_a,dy_s]},{complete:function() { 
                        tracker_draw_trace({id:active_tracker,caller:"none",redraw:true});
                        map_zoom({"level":map_zlevel,"caller":"routemap_adjust"});
                    }});
                }
                else {
                    $(p).show();
                    $(p).velocity({"left":[dx_a,dx_s],"top":[dy_a,dy_s]});
                }
            }
            
        }
        if(this.adjusted==true) {
            this.adjusted=false;
        }
        else{
            this.adjusted = true;
        }
    }
    
    unplot() {
        for(var i=0;i<this.points.length;i++) {
            var p = this.points[i];
            var icon = $(p).children(".marker_icon")[0];
            $(icon).hide();
        }
    }

    unset() {
        for(var i=0;i<this.points.length;i++) {
            var p = this.points[i];
            $(p).remove();
        }
    }

}

class ufo_solution_anim {
    constructor(args) {
        this.pathlist = [];
        this.step = 0;
        this.num = args.num;
        this.delay = args.delay;
        this.tourcount = args.count;
        this.use_updates = args.updates;
        this.timer = 0;
        this.pathassoc = {};
        this.nodeids = new Set(Object.keys(ufo_stops));
        this.used = [];
        this.create();
    }

    create() {
        this.nodeids.delete("122");
        this.nodeids.delete("121");
        for(var i=0;i<this.tourcount;i++) {
            this.pathassoc[parseInt( ((i+1)/this.tourcount) * this.num)-2] = i;
        }
        fleet_needs_redraw = true;
        fleetpaths = [];
        var f = 0; // counter to handle adding the ACTUAL paths to the animation
        var nodeids = Array.from(this.nodeids);
        for (var i = 0; i < this.num; i++) {
            if(this.pathassoc[i]!=undefined) {
                for(var j=0;j<ufo_sequences[this.tourcount][f].length;j++) {
                    this.used.push(ufo_sequences[this.tourcount][f][j]);
                    this.nodeids.delete(""+ufo_sequences[this.tourcount][f][j]);
                }
                f++;
                nodeids = Array.from(this.nodeids);
            }
            if(nodeids.length==0) {
                nodeids = Object.keys(ufo_stops);
            }
            var snode = nodeids[parseInt(Math.random() * nodeids.length)];
            var lpath = ufo_random_path({ start_node: snode, path_limit: 20, blocked:this.used });
            this.pathlist.push(lpath);
        }
        anim_queue.add(this);
        //console.log(this.pathassoc);
        this.start_draw();
    }

    start_draw() {
        tcx.clearRect(0, 0, tcv.width, tcv.height); // Clear the trace canvas
    }

    next() {
        if (this.step < this.pathlist.length + 9 && this.num>0) {
            fleet_needs_redraw = true;
            ufo_draw_fleet_paths({ color: "#7DBAE4", fade: true });
            if (fleetpaths.length >= 10) { fleetpaths.shift(); } // So we never have more than 10 paths to draw.
            if (this.step < this.pathlist.length - 1) {
                fleetpaths.push(this.pathlist[this.step]);
                if(this.pathassoc[this.step]!=undefined) {
                    var tpath = []; // Will store the path list from the stops in the array.
                    for(var i=0;i<ufo_sequences[this.tourcount][this.pathassoc[this.step]].length;i++) {
                        ufo_stops[ufo_sequences[this.tourcount][this.pathassoc[this.step]][i]].active = true;
                        ufo_stops[ufo_sequences[this.tourcount][this.pathassoc[this.step]][i]].update_status(false);
                        if(i<ufo_sequences[this.tourcount][this.pathassoc[this.step]].length-1) {
                            tpath.push(ufo_sequences[this.tourcount][this.pathassoc[this.step]][i]+"-"+ufo_sequences[this.tourcount][this.pathassoc[this.step]][i+1]);
                        }
                    }
                    canon_paths.push(tpath);
                }
                ufo_draw_link({ path_list: this.pathlist[this.step], color: "#7DBAE4" });
            }
            else {
                fleetpaths.push([]);
            }
            this.step++;
            this.timer = 0;
        }
        else {
            fleetpaths = [];
            anim_queue.delete(this);
            for(var i=0;i<ufo_tours.length;i++) {
                ufo_tours[i].create();
                if(this.num==0 && ufo_tours[i].stops.length>0) { 
                    ufo_tours[i].status = 3;
                    // Now also assign all of its stops
                    for(var s=0;s<ufo_tours[i].stops.length;s++) {
                        ufo_stops[ufo_tours[i].stops[s]].status=2;
                    }
                }
            }
            fleet_needs_redraw = true;
            if(this.num>0) {
                map_finish();
                order_panel.draw("ufo_solution_anim");
                assignments_panel.draw("ufo_solution_anim");
            }
            
        }
    }
}

class ufo_stop {
    constructor(args) {
        this.uid = args.uid,
        this.nid = args.nid,
        this.eid = "ufostop_" + args.uid,
        this.lat = args.lat;
        this.lon = args.lon;
        this.addr = args.addr;
        this.zip = args.zip;
        this.city = args.city;
        this.state = args.state;
        this.recipient = args.recipient;
        this.u_uid = ""; // Job UID, will be automatically created.
        this.signedby = args.signer; // This might not always be the recipient
        this.time = args.time;
        this.notes = args.notes;
        this.process = args.process_time; // How long does it take to complete this stop?
        this.endstate = args.endstate; // "delivered", otherwise "rejected"?
        this.status = -1; // -1 = unloaded, 0 = uninitialized, 1 = assigned, 2 = on-schedule, 3 = off-schedule, 4 = finished
        this.limits = args.limits;
        this.hasrestrictions = false;
        this.status_string = "",
        this.assigned_vehicle;
        this.active = false;
        this.selectedfrom;
        this.adjacencies = {};
        this.tourid = -1; // ID of the ufo_tour that addresses this stop
        this.toursequence; // Which stop this is in the sequence of the tour
        this.hoverstate = false;
        this.availablefrom = args.availablefrom; // If this is set, the stop will only show up after a particular time of day
        this.late = false; // If this is "true", the stop border will be a little different to show that it's a new addition.
        this.eta; // Stores the time (unixtime) that it should arrive.
        this.eta_low; // This is the earliest that the job can be completed.
        this.actual; // Stores the time (unixtime) that it actually arrives (based on traffic forcing)
        this.timestring = "";
        this.tstopidx; // Should store the path index of the stop.
        this.o_pos_offset = 0.0;
        this.signature = []; // Array of points for drawing a signature.
        this.create();
        this.position();
        this.update_status();
        this.build_adjacencies();
        this.generate_job_id();
    }

    create() {
        var marker = $("<div />", { "class": "marker_container", "id": "marker_" + this.eid });
        var icon = $("<div />", { "class": "marker_icon" });
        marker.css({ left: -500 });
        marker.css({ top: -500 });
        icon.css({ "background-image": "none", "color": "#ffffff", "text-align": "center", "border-color": "#fff", "border-width": "2", "font-size": "8pt", "line-height": "24pt" });
        //$(icon).on("click", { arg1: this }, function (e) { if(e.data.arg1.active==true) { e.data.arg1.active = false; } else { e.data.arg1.active = true; } console.log(e.data.arg1.uid); e.data.arg1.map_connections(true); });
        //icon.css({backgroundImage:"none",textAlign:"center"});
        //icon.append(this.uid);
        if(this.limits.refrigerated==true) { this.hasrestrictions = true; }
        if(this.limits.heavy==true) { this.hasrestrictions = true; }
        if(this.limits.timecritical==true) { this.hasrestrictions = true; }
        if(this.time!=0) { 
            this.hasrestrictions = true;
            var tstring = (this.time[0]+1)+":00-";
            for(var i=1;i<this.time.length;i++) {
                if(this.time[i]!=this.time[i-1]-1) {
                    tstring = tstring+(this.time[i]+2)+":00"
                    if(i<this.time.length-2) {
                        tstring = tstring+"/"+(this.time[i+1]+1)+":00-";
                        i++;
                    }
                }
            }
            this.timestring = tstring;
        }
        else {
            this.timestring = "9:00-16:00";
        }


        if(ufo_debug==true) {
            $(icon).on("click",{arg1:this.uid},function(e) { ufo_debug_pathbuild(e.data.arg1)});
        }
        else if(this.uid!="d0" && this.uid!="w0") {

            //$(icon).on("click",{arg1:this},function(e) { e.data.arg1.active=true; console.log(e.data.arg1.uid); });
            $(icon).on("mousedown",function(e) { e.stopPropagation; e.preventDefault; });
            $(icon).on("click",{arg1:this},function(e) {
                e.stopPropagation();
                e.preventDefault();
                if(e.data.arg1.tourid!=-1) {
                    if(ufo_tours[e.data.arg1.tourid].status==4) {
                        if(ufo_tours[e.data.arg1.tourid].stop_for_pda == e.data.arg1.uid) {
                            ufo_tours[e.data.arg1.tourid].stop_for_pda = -1;
                        }
                        else {
                            ufo_tours[e.data.arg1.tourid].stop_for_pda = e.data.arg1.uid;
                        }
                        queuelist.push({"type":"map_move_to","params":{dcoord:[e.data.arg1.lat,e.data.arg1.lon]}});
                        //queuelist.push({"type":"map_finish",params:{caller:"ufo_stop"}});
                    }
                    else {
                        e.data.arg1.active = false;
                        for(var i=0;i<ufo_tours.length;i++) {
                            ufo_tours[i].active = false;
                        }
                        ufo_tours[e.data.arg1.tourid].active = true;
                        ufo_activate_stops({caller:"ufo_stop_"+e.data.arg1.uid});
                        if(assignments_panel.visible==false) {
                            fleetmode = "plan";
                            ufo_sidebar_icons();
                            // 23.11.2021 disabling resizing of the time control
                            //("#ufo_time_control").velocity({left:[735,60]},{duration:160});
                            assignments_panel.visible = true;
                            order_panel.visible = true;
                        }
                        e.data.arg1.position();
                        queuelist.push({"type":"map_finish",params:{caller:"ufo_stop"}});
                    }
                    
                    
                }
                else {
                    if(e.data.arg1.active==false) {
                        e.data.arg1.selectedfrom = "mouse";
                        e.data.arg1.active=true;
                        if(e.data.arg1.late==true) {
                            for(var i=0;i<ufo_stops.length;i++) {
                                if(ufo_stops[i].late==false) { ufo_stops[i].active = false; ufo_stops[i].selectedfrom=""; ufo_stops[i].position(); }
                            }
                            for(var i=0;i<ufo_tours.length;i++) {
                                ufo_tours[i].active=false;
                            }
                            fleetpaths = [];
                            fleet_needs_redraw=true;
                        }
                    }
                    else {
                        e.data.arg1.active=false;
                    }
                    queuelist.push({"type":"draw_panels",params:{caller:"ufo_stop"}});
                    e.data.arg1.position();
                    queuelist.push({"type":"map_finish",params:{caller:"ufo_stop"}});
                }
                
            }

            );
        }
        else if(this.uid=="d0") {
            // Bind a special onclick action to the depot to load tours if they have not yet been loaded.
            $(icon).on("click",function() {
                if(fleet_jobs_imported==false) {
                    fleet_jobs_imported = true;
                    for(var i=0;i<ufo_stops.length;i++) {
                        ufo_stops[i].status = 0;
                        ufo_stops[i].tourid = -1;
                        ufo_stops[i].update_status(false);
                    }
                    fleetmode = "plan";
                    ufo_sidebar_icons();
                    if(assignments_panel.visible!=undefined) {
                        if(assignments_panel.visible==true) {
                            map_zlevel = 13;
                            queuelist.push({"type":"draw_panels","params":{}});
                            queuelist.push({"type":"map_move_to","params":{"dcoord":[36.1373,-115.1888],"zdir":-1}});

                        }
                        else {
                            queuelist.push({"type":"draw_panels","params":{move_to_params:{dcoord:[36.1373,-115.1888],zdir:-1}}});
                        }
                    }
                    else {
                        queuelist.push({"type":"draw_panels","params":{move_to_params:{dcoord:[36.1373,-115.1888],zdir:-1}}});
                    }
                    //queuelist.push({"type":"map_move_to","params":{});
                    //order_panel.draw();
                    //assignments_panel.draw();
                }
            })
        }
        else if(this.uid=="w0") {
            // Bind a special onclick action to the depot to load tours if they have not yet been loaded.
            $(icon).on("click",function() {
                ufo_mode_switch("vehicles");
            })
        }
        if(this.availablefrom>time) {
            this.late=true;
            ufo_later_stops.push(this.uid);
        }
        $(marker).append(icon);
        $("#tracker_layer").append(marker);
    }

    generate_job_id() {
        var anum = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
        var bnum = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
        var cnum = ["0","1","2","3","4","5","6","7","8","9"];
        var uid = "";
        
        for(var i=0;i<1;i++) {
            var idx = Math.floor(Math.random() * anum.length);
            uid = uid + anum[idx];
        }
        uid = uid +"-";
        for(var i=0;i<6;i++) {
            var idx = Math.floor(Math.random() * cnum.length);
            uid = uid + cnum[idx];
        }
        uid = uid +"-";
        for(var i=0;i<2;i++) {
            var idx = Math.floor(Math.random() * bnum.length);
            uid = uid + bnum[idx];
        }

        this.u_uid = uid;
    }

    position() {
        /*
            Adjusts the marker div icon based on the current map zoom and position.
        */
        var pos_offset = 9;
        // This is set to half the width of the marker icon; marker icon is larger if the stop is active
        var marker = $("#marker_" + this.eid);
        var icon = $(marker).children(".marker_icon");
        if(this.status==-1 || this.availablefrom > time || this.cluster == true) {
            icon.hide();
            return; // Don't show the icon if the job hasn't been loaded and we therefore don't know about it yet.
        }
        if(this.active==false && (this.uid!="d0" && this.uid!="w0" && this.status!=0 && this.status!=1)) { $(icon).hide(); return; }
        icon.show();
        var pos_vadjust = 0.0; // Set when we need to adjust the vertical position because we're using the planchette
        var special_anim_handling = false;
        if (this.active == true || (this.hoverstate == true && this.status==0)) {
            if(this.tourid!=-1) {
                if(ufo_tours[this.tourid].status=="4") {
                    special_anim_handling = true;
                    // This means that the specified tour is COMPLETE
                    // So we're going to use a special icon representing the stop time.
                    $(icon).empty();
                    
                    var dmod = this.process / 300.0; // Ratio of stop process time to actual
                    
                    $(icon).css({"border-width":"3","background-color":"rgba(106,109,116,.6)","border-color":"var(--herewhite)"});
                    $(marker).children(".ufo_pda_stop").remove();
                    if(ufo_tours[this.tourid].stop_for_pda==this.uid) {
                        pos_offset = 14.0**dmod;
                        $(marker).css({ "z-index": 1500 });
                        var spda = new pda_panel({"stopid":this.uid,"offset":pos_offset}); // Add the infobubble for the stop if the stop is active.
                    }
                    else {
                        pos_offset = 7.0**dmod;
                        $(marker).css({ "z-index": 33 });
                    }
                    if((this.actual-this.eta)>late_seconds) {
                        $(icon).css({"border-color":"var(--herered)"});
                    }
                    pos_vadjust = 0.0;
                    var origin = get_normalized_coord([this.lat, this.lon]);
                    var delta_y = origin[0] - normalized_origin[0];
                    var delta_x = origin[1] - normalized_origin[1];
                    icon.css({ width: 0.0, height: 0.0, backgroundSize: pos_offset * 2, borderRadius: pos_offset * 2, zIndex: pos_offset * 3 });
                    
                    var pleft = map_tile_offset_x + (delta_x * 512);
                    var ptop = map_tile_offset_y - pos_vadjust + (delta_y * 512);
                    //marker.css({ "left": pleft - pos_offset, "top": ptop - pos_offset });
                    if(this.o_pos_offset!=pos_offset) {
                        $(marker).velocity({left:[(pleft-pos_offset),(pleft-this.o_pos_offset)],top:[(ptop-pos_offset),(ptop-this.o_pos_offset)]},{duration:160});
                        $(icon).velocity({width:[pos_offset*2,this.o_pos_offset*2],height:[(pos_offset*2.0),this.o_pos_offset*2]},{duration:160});
                    }
                    else {
                        $(marker).css({"left":pleft-pos_offset,"top":ptop-pos_offset});
                        $(icon).css({"width":pos_offset*2,"height":pos_offset*2});
                    }
                    this.o_pos_offset = parseFloat(pos_offset);
                    
                }
                else {
                    // This means the specified tour is in progress (probably) but not complete
                    // So we need to communicate delay factors, etc.
                    icon.empty();
                    pos_offset = 12;
                    $(icon).addClass("marker_icon_stop");
                    $(icon).css({"border-width":".5px"});
                    $(icon).css({"border-color":"var(--heremidgrey)"});
                    $(icon).css({ "background-color": "var(--hereufostopblue)" });
                    if(this.status==4) {
                        if(this.endstate=="delivered") {
                            //icon.html(ufo_icons["destination_finished"]);
                            //var flagdiv = $("<div />",{"class":"ufo_flag_d","text":""});
                            //$(flagdiv).append(ufo_icons["check"]);
                            $(icon).css({ "background-color": "var(--hereufodarkblue)" });
                        }
                        else {
                            //icon.html(ufo_icons["destination_finished"]);
                            //var flagdiv = $("<div />",{"class":"ufo_flag_e","text":""});
                            //$(flagdiv).append(ufo_icons["cross"]);
                            $(icon).css({ "background-color": "var(--heregraphred)" });
                        }
                        $(icon).append(flagdiv);
                    }
                    else if(this.status==3) {
                        icon.html(ufo_icons["destination_delayed"]);
                    }
                    else {
                        if(this.late==true) {
                            $(icon).css({ "background-color": "var(--hereyellow)" });
                            //icon.html(ufo_icons["destination_late"]);
                        }
                        else {
                            $(icon).css({ "background-color": "var(--hereufostopblue)" });
                            //icon.html(ufo_icons["destination"]);
                        }
                    }
                    
                    var seqdiv = $("<div />",{"class":"ufo_sequence_label","text":this.toursequence});
                    pos_vadjust = 6.0;
                    icon.append(seqdiv);
                }
                
            }
            else {
                // Situation. The stop is activated (so should be highlighted) but isn't part of a tour.
                pos_offset = 12;
                if(fleet_solutions_dispatched==true && this.late==false) { $(icon).hide(); return; }
                $(icon).css({"border-width":"1"});
                $(icon).css({"border-color":"var(--herewhite)"});
                $(icon).css({ "background-color": ufo_colors["unassigned_bg"] });
                icon.html("<span class='ufo_bullet'></span>");
                if(this.late==true || this.hasrestrictions==true) {
                    if(this.late==true) {
                        var flagdiv = $("<div />",{"class":"ufo_flag","text":"!"});
                    }
                    else {
                        var flagdiv = $("<div />",{"class":"ufo_flag_r","text":""});
                    }
                    $(flagdiv).css({"left":9,"top":-8});
                    $(icon).append(flagdiv);
                }
                if(this.active==true && this.selectedfrom=="mouse") {
                    // Check for mouse selection because we don't want to show the infocard if it was selected from the stop list
                    var datadiv = $("<div />",{"class":"ufo_stop_infopanel"});
                    $(datadiv).append($("<div />",{"id":"name","text":this.recipient}));
                    $(datadiv).append($("<div />",{"id":"addr1","text":this.addr}));
                    $(datadiv).append($("<div />",{"id":"addr2","text":this.city+", NV "+this.zip}));
                    if(this.hasrestrictions==true) {
                        /**
                         * We're going to add a separate panel noting the restrictions for the delivery
                         */
                        $(datadiv).append($("<div />",{"id":"notes","text":"Notes:"}));
                        var ndiv = $("<div />",{"class":"ufo_stop_infopanel_notes"});
                        if(this.time!=0) { $(ndiv).append("<div>Job has time-window constraints.</div>"); }
                        if(this.limits.timecritical==true) { $(ndiv).append("<div>Job is high-priority.</div>"); }
                        if(this.limits.refrigerated==true) { $(ndiv).append("<div>Job requires refrigerated vehicle.</div>"); }
                        $(datadiv).append(ndiv);
                    }
                    $(datadiv).append($("<div />",{"id":"times","text":"Delivery windows:"}));
                    for(var i=0;i<24;i++) {
                        /**
                         * Build a strip of hour availabilities, based on a hardcoded shift schedule
                         * and an array contained (possibly) in the "time" argument of the stop object.
                         */
                        if(i<8 || i>18) {
                            $(datadiv).append($("<div />",{"class":"hour_unavailable"}));
                        }
                        else {
                            if(this.time!=0) {
                                if(in_array(i,this.time)==true) {
                                    $(datadiv).append($("<div />",{"class":"hour_available"}));
                                }
                                else {
                                    $(datadiv).append($("<div />",{"class":"hour_blocked"}));
                                }
                            }
                            else {
                                if(i>16) {
                                    $(datadiv).append($("<div />",{"class":"hour_blocked"}));
                                }
                                else {
                                    $(datadiv).append($("<div />",{"class":"hour_available"}));
                                }
                                
                            }
                        }
                    }
                    $(icon).append(datadiv);
                }
            }
            
        }

        else if(this.uid=="d0" || this.uid=="w0") {
            //console.log("trying to position depot");
            icon.empty();
            pos_offset = 16;
            $(icon).css({"border-width":"1","z-index":200});
            
            if(this.uid=="d0") {
                icon.html(ufo_icons["warehouse"]);
                $(icon).css({ "background-color": ufo_colors["onschedule_bg"],"border-color":"#6f83bd" });
                if(fleet_jobs_imported==false) {
                    // Badge the warehouse icon if there are things that need to be picked up there.
                    var flagdiv = $("<div />",{"class":"ufo_flag","text":"!"});
                    $(flagdiv).css({"left":20,"top":-8});
                    $(icon).append(flagdiv);
                }
            }
            else {
                icon.html(ufo_icons["depot"]);
                $(icon).css({ "background-color": "var(--heremidgrey)","border-color":"#6f83bd" });
            }
        }
        else {
            icon.empty();
            $(icon).append(ufo_icons["backarrow"].replace("0F1621","FFFFFF"));
            $(icon).addClass("marker_icon_stop");
            if(fleet_solutions_dispatched==true && (this.late==false || (this.late==true && this.tourid!=-1))) { $(icon).hide(); return; }
            $(icon).css({"border-width":"1"});
            if(this.status==0) { $(icon).css({ "background-color": ufo_colors["unassigned_bg"],"border-color":"var(--herelightgrey)" }); }
            else if(this.status==1) {
                if(this.tourid!=-1) {
                    $(icon).css({ "background-color": canon_colors[this.tourid],"border-color":"#3f59a7" }); 
                } 
                else {
                    $(icon).css({ "background-color": ufo_colors["assigned_bg"],"border-color":"#3f59a7" }); 
                }
                
            }
            else if(this.status==2) { $(icon).css({ "background-color": ufo_colors["onschedule_bg"],"border-color":"#6f83bd" }); }
            else if(this.status==3) { $(icon).css({ "background-color": ufo_colors["offschedule_bg"] }); }
            else if(this.status==4) { $(icon).css({ "background-color": ufo_colors["delivered_bg"] }); }
            if((this.late==true || this.hasrestrictions==true) && this.status==0) {
                $(icon).css({ "background-color": ufo_colors["unassigned_bg"],"border-color":"var(--herelightgrey)" });
                if(this.late==true) {
                    var flagdiv = $("<div />",{"class":"ufo_flag","text":"!"});
                }
                else {
                    var flagdiv = $("<div />",{"class":"ufo_flag_r","text":""});
                }
                $(icon).append(flagdiv);
            }
        }
        if(special_anim_handling==false) {
            // This will be "true" if we're animating the icon's expansion as part of a report.
            var origin = get_normalized_coord([this.lat, this.lon]);
            var delta_y = origin[0] - normalized_origin[0];
            var delta_x = origin[1] - normalized_origin[1];
            icon.css({ width: pos_offset * 2, height: pos_offset * 2, backgroundSize: pos_offset * 2, borderRadius: pos_offset * 2, zIndex: pos_offset * 3 });
            if(this.hasrestrictions==true || this.active==true) {
                marker.css({ zIndex: pos_offset * 15 });
            }
            else {
                if(this.uid=="d0") {
                    marker.css({ zIndex: pos_offset * 7 });
                }
                else {
                    marker.css({ zIndex: pos_offset * 3 });
                }
            
            }
            var pleft = map_tile_offset_x + (delta_x * 512) - (mcx-(gmh*512));
            var ptop = map_tile_offset_y - pos_vadjust + (delta_y * 512);
            marker.css({ "left": pleft - pos_offset, "top": ptop - pos_offset });
        }
        
    }

    update_status(reposition) {
        if (this.status>=1) {
            // So the stop is in progress or delayed.
            var t_off = 0.0;
            if(time > this.actual) {
                this.status = 4;
            }
            else {
                if(this.tourid==-1) {
                    this.status = 1;
                }
                else {
                    if(ufo_tours[this.tourid].status>2) {
                        if(ufo_tours[this.tourid].delay>late_seconds) {
                            this.status = 3;
                        }
                        else {
                            this.status = 2;
                        }
                    }
                    else {
                        this.status = 1;
                    }
                }
                
            }
        }
        if (this.status == 0) {
            this.status_string = "Unassigned";
        }
        else if (this.status == 1) {
            this.status_string = "Assigned";
        }
        else if (this.status == 2) {
            this.status_string = "In Progress";
        }
        else if (this.status == 3) {
            this.status_string = "Delayed";
        }
        else if (this.status == 4) {
            if(this.endstate=="delivered") {
                this.status_string = "Delivered";
            }
            else {
                this.status_string = "Not delivered";
            }
            
        }
        if(reposition==true) {
            this.position();
        }
    }

    build_adjacencies() {
        /*
        This loops through the map paths in lastmile_paths
        and determines, for each node, what its adjacencies are.

        So if we're working on node 1, and there's a 1-0, 2-1 path
        we know that node 1 is connected both to node 0 and to node 2
        */
        var nlinkids = Object.keys(adjmap);
        for (var i = 0; i < nlinkids.length; i++) {
            var link_id = nlinkids[i].split("-");

            if (link_id.length == 2 && (link_id[0]!="d0" && link_id[1]!="d0")) {
                // If this is true, the map was of the format int-int, meaning it's an interlink path
                if (link_id[0] == this.uid) {
                    this.adjacencies[link_id[1]] = nlinkids[i];
                }
            }
        }
    }

    valid_adjacencies(invalid) {
        /*
        Returns a list of this node's valid adjacencies, or "false".
        "invalid" is an array of adjacencies that are considered invalid
        because they have already been walked (probably)
        */
        var valid = [];
        if (invalid == undefined) { invalid = []; }
        var default_adjacencies = Object.keys(this.adjacencies);
        for (var i = 0; i < default_adjacencies.length; i++) {
            if (in_array(default_adjacencies[i], invalid) == false) {
                valid.push(default_adjacencies[i]);
            }
        }
        if (valid.length > 0) {
            return valid;
        }
        else {
            return false;
        }
    }

    map_connections(clear) {
        /*
         * Given the list of valid adjacencies, draws a line between each. 
         */
        if(clear==undefined) { clear = false; };
        if(clear==true) {
            tcx.clearRect(0, 0, tcv.width, tcv.height);
            if(temp_last_node!=-1) {
                temp_link_map.push(ufo_stops[temp_last_node].adjacencies[this.uid]);
            }
            temp_last_node = this.uid;
            ufo_draw_link({path_list:temp_link_map});
            tcx.lineWidth = 1;
            tcx.strokeStyle = "#000";
        }
        var v_nodes = Object.keys(this.adjacencies);
        var a_pos = get_normalized_coord([this.lat, this.lon]);
        var x1, x2, y1, y2;
        x1 = (mcx) + ((a_pos[1] - normalized_origin[1]) * 512);
        y1 = (1024) + ((a_pos[0] - normalized_origin[0]) * 512);
        for (var i = 0; i < v_nodes.length; i++) {
            a_pos = get_normalized_coord([ufo_stops[v_nodes[i]].lat, ufo_stops[v_nodes[i]].lon]);
            x2 = (mcx) + ((a_pos[1] - normalized_origin[1]) * 512);
            y2 = (1024) + ((a_pos[0] - normalized_origin[0]) * 512);
            tcx.beginPath();
            tcx.moveTo(x1, y1);
            tcx.lineTo(x2, y2);
            tcx.stroke();
        }

    }

    add_small_card(panel) {
        /**
         * Adds a small infobox.
         * Panel is the reference for this.
         * 
         */
        if(this.availablefrom > time) { return; }
        var small_card = $("<div />", { "class": "ufo_small_card_div", "id": "ufo_small_card" + this.uid });
        var uid_div = $("<div />", { "class": "ufo_small_uid", "text": "ID: "+this.u_uid });
        var address_div = $("<div />", { "class": "ufo_small_address"});
        var type_div = $("<div />", { "class": "ufo_small_card_type"});
        var trunc_addr = this.addr;
        if(trunc_addr.length>12) {
            trunc_addr = trunc_addr.substr(0,12) + "...";
        }
        $(address_div).html("<strong>"+this.zip+"</strong><span class=\"ufo_small_address_divider\">|</span><strong>"+trunc_addr+"</strong>");
        var title_div = $("<div />", { "class": "ufo_small_title", "text": this.recipient });
        var time_div = $("<div />", { "class": "ufo_small_details" });
        if (this.limits.timecritical == true) {
            $(time_div).append("!!!");
        }
        else {
            $(time_div).append(this.timestring);
        }
        var status_div = $("<div />", { "class": "ufo_small_status" });
        $(status_div).append(this.status_string);
        $(type_div).append(ufo_icons["backarrow"]);
        if(panel.pid!="assignments") {
            var small_card_icon = $("<div />",{"class":"ufo_small_card_icon"});
            /*
             * Even if this stop is active, if it's being appended to the ASSIGNMENTS panel then we don't shade it 
             */
            if (this.active == true) {
                $(small_card).css({ "background-color": "var(--hereufolightblue)" });
                $(small_card_icon).append(ufo_icons["check"]);
                $(small_card_icon).css({"background-color":"var(--herebluegreen)","border-radius":"2px","border":"1px solid var(--herebluegreen)"});
            }
            else {
                $(small_card_icon).css({"background-color":"var(--herewhite)","border-radius":"2px","border":"1px solid var(--herelightgrey)"});
                //$(small_card_icon).append(ufo_icons["square"]);
            }
            $(small_card).append(small_card_icon);
            $(small_card).append(status_div);
            $(small_card).append(uid_div);
            $(small_card).append(address_div);
            $(small_card).append(title_div);
            $(small_card).append(time_div);
            $(small_card).append(type_div);
        }
        else {
            $(small_card).removeClass("ufo_small_card_div");
            $(small_card).addClass("ufo_small_card_stop_div");
            $(title_div).removeClass("ufo_small_title");
            $(title_div).addClass("ufo_small_stop_title");
            $(uid_div).removeClass("ufo_small_uid");
            $(uid_div).addClass("ufo_small_stop_uid");
            $(address_div).removeClass("ufo_small_address");
            $(address_div).addClass("ufo_small_stop_address");
            $(address_div).text(this.recipient);
            var subtitle_div = $("<div />",{"class":"ufo_small_stop_subtitle"});
            $(subtitle_div).append(this.zip+" "+this.city);
            var small_card_icon = $("<div />",{"class":"ufo_small_card_stop_icon"});
            //$(small_card_icon).css({"font-size":"9pt","font-weight":"bold","top":"16","width":"24px","height":"24px","border-radius":"50%","background-color":"var(--hereufoblue","color":"var(--herewhite)","text-align":"center","line-height":"24px"});
            $(small_card_icon).css({"font-size":"9pt","font-weight":"bold","top":"16","color":"var(--hereufodarkblue)","line-height":"24px"});
            if(this.uid=="d0") {
                $(title_div).text("Leave depot");
                $(title_div).css({"margin-top":"6px","margin-bottom":"12px"});
                $(small_card_icon).append(ufo_icons["destination"]);
                var depotspan = $("<span />");
                $(depotspan).css({"position":"relative","left":"4px","top":"3px","width":"22px","height":"19px","z-index":"4"});
                $(depotspan).append(ufo_icons["depot"]);
                $(small_card_icon).append(depotspan);
            }
            else {
                $(title_div).text(this.addr);
                $(small_card_icon).append(ufo_icons["destination_invert"]);
            }
            var toursequence_id = $("<span />");
            $(toursequence_id).append(this.toursequence);
            $(small_card_icon).append(toursequence_id);
            if(this.tourid!=-1) {
                var eta_delay = parseFloat(ufo_tours[this.tourid].delay);
            }
            else {
                var eta_delay = 0.0;
                for(var i=0;i<ufo_tours.length;i++) {
                    if(ufo_tours[i].active==true) {
                        eta_delay = parseFloat(ufo_tours[i].delay);
                    }
                }
            }
            var sched_time = new Date((this.eta)*1000.0);
            var sched_time_string = sched_time.getHours() + ":" + ("0"+sched_time.getMinutes()).substr(-2);
            var sched_time_string_with_delay = $("<span />");
            if(eta_delay > late_seconds && this.status!=4 ) {
                var sched_time_with_delay = new Date((this.eta + eta_delay)*1000);
                $(sched_time_string_with_delay).css({"margin-left":10,"font-style":"italic"});
                $(sched_time_string_with_delay).append("(new ETA: "+sched_time_with_delay.getHours() + ":" + ("0"+sched_time_with_delay.getMinutes()).substr(-2)+")");
            }
            $(time_div).text(sched_time_string);
            $(time_div).append(sched_time_string_with_delay);
            if(this.uid=="d0" || this.uid=="w0") {
                // Don't put all elements on page if this is just the depot card
                $(small_card).append(small_card_icon);
                $(small_card).append(title_div);
                $(small_card).append(time_div);
                $(small_card).append(type_div);
            }
            else {
                $(small_card).append(small_card_icon);
                $(small_card).append(status_div);
                $(small_card).append(title_div);
                $(small_card).append(subtitle_div);
                $(small_card).append(address_div);
                $(small_card).append(uid_div);
                $(small_card).append(time_div);
                $(small_card).append(type_div);
            }

        }

        



        // Binding an action to "select" or "deselect" this card...
        if(panel.pid!="assignments" || this.status==4) {
            // Disable the selector if this card has been appended to the Assignments panel, so that we can't switch stops on and off from here.
            $(small_card_icon).on("click", { arg1: this, arg2: panel }, function (e) { e.data.arg1.small_card_selector(e.data.arg2); });
        }
        if(this.active==false) {
            $(small_card).on("mouseover", { arg1: this, arg2: small_card }, function (e) { 
                e.data.arg1.hoverstate = true;
                e.data.arg1.position();
                $(e.data.arg2).css({ "background-color": "var(--hereufogrey)" });
            });
            $(small_card).on("mouseout", { arg1: this, arg2: small_card }, function (e) { 
                e.data.arg1.hoverstate = false;
                e.data.arg1.position(); 
                $(e.data.arg2).css({ "background-color": "var(--herewhite)" });
            });
        }
        

        $(panel.list_sect).append(small_card);
    }

    small_card_selector(panel) {
        if (this.active == false) {
            this.active = true;
            this.selectedfrom = "";
            if(this.late==true) {
                for(var i=0;i<ufo_stops.length;i++) {
                    if(ufo_stops[i].late==false) { ufo_stops[i].active = false; ufo_stops[i].selectedfrom = ""; ufo_stops[i].position(); }
                }
                for(var i=0;i<ufo_tours.length;i++) {
                    ufo_tours[i].active=false;
                }
                fleetpaths = [];
                fleet_needs_redraw=true;
                queuelist.push({"type":"map_finish",params:{caller:"map_add_image"}});
            }
            this.position();
            //$("#ufo_small_card"+this.uid).css({"background-color":"var(--hereufogrey)"})
        }
        else {
            if(this.status==4) {
                if(this.status==4) {
                    if(ufo_tours[this.tourid].stop_for_pda == this.uid) {
                        ufo_tours[this.tourid].stop_for_pda = -1;
                    }
                    else {
                        ufo_tours[this.tourid].stop_for_pda = this.uid;
                    }
                    queuelist.push({"type":"map_finish",params:{caller:"ufo_stop"}});
                }
            }
            else {
                this.active = false;
                this.selectedfrom = "";
                this.position();
            }
            
            //$("#ufo_small_card"+this.uid).css({"background-color":"var(--herewhite)"})
        }
        panel.draw();
    }
}

class ufo_stop_cluster {
    constructor(args) {
        this.lat = args.lat;
        this.lon = args.lon;
        this.count = args.count;
        this.lead = args.id;
        this.affected_stops = args.affected_stops;
        this.create();
    }
    create() {
        var marker = $("<div />", { "class": "cluster_container", "id": "marker_" + this.eid });
        var icon = $("<div />", { "class": "marker_icon" });
        marker.css({ left: -500 });
        marker.css({ top: -500 });
        icon.css({ "background-image": "none", "color": "#ffffff", "text-align": "center", "border-color": "var(--hereufoblue)", "border-width": "1", "font-size": "10pt", "line-height": "28px" });
        var pos_offset = 14;
        var pos_vadjust = 0.0;
        var origin = get_normalized_coord([this.lat, this.lon]);
        var delta_y = origin[0] - normalized_origin[0];
        var delta_x = origin[1] - normalized_origin[1];
        icon.css({ width: pos_offset * 2, height: pos_offset * 2, backgroundSize: pos_offset * 2, borderRadius: pos_offset * 2, zIndex: pos_offset * 3 });
        icon.css({"background-color":"var(--hereufodarkblue)"});
        icon.append(this.count);
        var pleft = map_tile_offset_x + (delta_x * 512) - (mcx-(gmh*512));
        var ptop = map_tile_offset_y - pos_vadjust + (delta_y * 512);
        marker.css({ "left": pleft - pos_offset, "top": ptop - pos_offset });
        $(marker).append(icon);
        $(icon).on("click",{arg1:this},function(e) {
            for(var i=0;i<e.data.arg1.affected_stops.length;i++) {
                ufo_stops[e.data.arg1.affected_stops[i]].active=true;
                ufo_stops[e.data.arg1.affected_stops[i]].selectedfrom="";
            }
            map_move_to({dcoord:[e.data.arg1.lat,e.data.arg1.lon],zdir:1}) 
        });
        $("#tracker_layer").append(marker);
    }
}

class ufo_tour {
    /**
     * 
     * Contains details about a given tour and functions to animate that tour.
     * 
     */
    constructor(args) {
        this.uid = ufo_tours.length;
        this.stops = [];
        this.ipath = []; // This is a time-indexed list of route geocoordinates.
        this.tidx = []; // Time indices containing delay factors
        this.path_idx = [0];
        this.has_deviations = false; // Used for route-matching and creating artificial conditions.
        this.route = []; // This contains the list of route paths
        this.traffic = {}; // This contains an ETA increment to be adjusted based on traffic
        this.driver = "";
        this.planned_driver = "";
        this.vehicle = args.vehicle;
        this.status = ""; // 1 = planned, 2 = driver assigned, 3 = dispatched, 4 = complete
        this.active = false;
        this.small_card_id = "ufo_small_card_tour_"+ufo_tours.length;
        this.start_time;
        this.complete_time;
        this.complete_time_actual; // Stores actual complete time with traffic forcing.
        this.travel_dist = 0.0;
        this.travel_dist_actual = 0.0; // Update travel distances based on route deltas.
        this.mdomel;
        this.current_stop = 0;
        this.stop_for_pda = -1;
        this.delay = 0.0;
        this.refrigerated = false;
        this.last_p_idx = 0;
        this.next_p_idx = 0;
    }

    create() {
        if(this.stops.length==0) { return; }

        this.ipath = [];
        this.tidx = [];
        this.route = [];

        ufo_vehicles[this.vehicle].driver = this.driver;
        ufo_vehicles[this.vehicle].tour = this.uid;
        ufo_vehicles[this.vehicle].driver = this.driver;

        var substops = ["w0","d0"];
        substops = substops.concat(this.stops);
        substops.push("d0");
        substops.push("w0");

        //console.log(substops);
        var trftime = 0.0;
        var locdist = 0.0; // This is the distance given for a particular path.
        var loctime = 0.0; // This is the time it takes to complete a given path.
        var tconst = 0.0;

        for(var p=0;p<substops.length-1;p++) {
            var n_adj = substops[p]+"-"+substops[p+1];
            this.route.push(n_adj);
            var p_c;
            var first_point;
            var last_point;
            var sublocdist = 0.0;
            var subloctime = 0.0;
            var traffictime = 0.0;
            var subpath = [];
            for(var i=0;i<adjmap[n_adj].length;i++) {
                sublocdist+=parseFloat(lastmile_distances[adjmap[n_adj][i]]);
                p_c = adjmap[n_adj][i].split("-"); // 0 is the start node, 1 is the end node
                first_point = lastmile_paths[adjmap[n_adj][i]][0];
                last_point = lastmile_paths[adjmap[n_adj][i]][lastmile_paths[adjmap[n_adj][i]].length-1];
                sublocdist+=pdist(first_point,lastmile_nodes[p_c[0]]);
                sublocdist+=pdist(last_point,lastmile_nodes[p_c[1]]);
                
                // Append the lastmile_path to the subpath.
                subpath = subpath.concat(lastmile_paths[adjmap[n_adj][i]]);
                if(i<adjmap[n_adj].length-1) {
                    if(interlinks[adjmap[n_adj][i]+"-"+adjmap[n_adj][i+1]]!=undefined) {
                        subpath = subpath.concat(interlinks[adjmap[n_adj][i]+"-"+adjmap[n_adj][i+1]][0]);
                    }
                }
            }
            // At this stage in the loop, we have the distance (sublocdist) from node A to the path, the path, and the end of the path to node B
            // Now we need to get the time needed to complete this section of the journey.
            subloctime = sublocdist * (dfactor/4.0);
            if(this.traffic[p]!=undefined) {
                traffictime = subloctime * (1.0 + this.traffic[p]);
                // Modify the traffic time by the stop complete time.
            }
            else {
                traffictime = subloctime;
            }
            var substeps = (traffictime/60.0)/res; // This is the number of steps this path should be made up of.
            var tinvsteps = (subloctime/60.0)/res; // This is the number of traffic-invariant steps this path should be made up of.
            var substeplength = sublocdist / substeps;
           
            var ildist = 0.0;
            this.ipath.push(subpath[0]);
            this.tidx.push(tconst);
            var aip = 0;
            for(var i=1;i<subpath.length-1;i++) {
                ildist += pdist(subpath[i],subpath[i+1]);
                if(ildist>=substeplength) {
                    this.ipath.push(subpath[i]);
                    ildist = 0.0;
                    aip++;
                }
            }
            this.ipath.push(subpath[subpath.length-1]);
            for(var i=0;i<aip+1;i++) {
                tconst+=((1/aip)*(traffictime-subloctime));
                this.tidx.push(tconst);
            }
            //console.log(substeps,substeplength,subpath.length,aip);
            /*
            
            AT THIS JUNCTURE ipath should consist of where the vehicle is in (if res = .5) 30-second intervals
            We now need to add time to complete the stop.

            It takes 20 minutes to load the vehicle at the warehouse
            It takes 5 minutes to complete a stop.
            
            */
            var stime = 0.0; // Stop time
            var astime = 0.0; // Actual stop time (might be different);
            if(p==0) {
                // If p is 0, then we end the path at the depot. So we need to add 20 minutes of delay.
                subloctime+=3300;
                traffictime+=3300;
                stime = 3300.0;
                for(var k=0;k<55/res;k++) {
                    this.ipath.push(lastmile_nodes[819]); // Hardcoded because 819 is the depot.
                    this.tidx.push(tconst);
                }
            }
            else {
                if(p<substops.length-2) {
                    // So we should be computing the delay time for an actual stop.
                    if(substops[p+1]!="d0" && substops[p+1]!="w0") {
                        astime = ufo_stops[substops[p+1]].process;
                    }
                    else {
                        astime = 300.0;
                    }
                    subloctime+=300; // i.e. 5 minutes.
                    traffictime+=astime;
                    stime = 300.0;
                    var tdelta_over_stop = (astime-300.0)/(astime/(60*res));
                    
                    /* ADJUST STOP DELAY TIME BY res/stop.finish() */
                    for(var k=0;k<(astime/(60*res));k++) {
                        this.ipath.push(lastmile_nodes[nodestops[substops[p+1]]]);
                        tconst+=tdelta_over_stop;
                        this.tidx.push(tconst);
                        // This adds some path geocoords for the DESTINATION stop.
                    }
                }
            }
            /*
             Now the last value in ipath should be the geocoord of the next stop.
                - Adding sublocdist to locdist updates the total length of the route.
                - Adding subloctime to loctime updates the PLANNED complete time of the route
                - Adding traffictime to trftime updates the ACTUAL complete time of the route
             * 
             */
            tinvsteps = tinvsteps - (substeps-aip); // if the actual path was shorter than the substeps, reduce traffic invariant steps by that delta.
            locdist+=sublocdist;
            loctime+=(tinvsteps * (60.0*res)+stime);
            trftime+=(aip * (60.0*res)+astime);
            if(substops[p+1]!="d0" && substops[p+1]!="w0") {
                ufo_stops[substops[p+1]].status = 1;
                ufo_stops[substops[p+1]].tourid = this.uid;
                ufo_stops[substops[p+1]].toursequence = p;
                var locstoptime = this.start_time+parseFloat(loctime);
                var locstoptimeobject = new Date(locstoptime*1000.0);
                locstoptimeobject.setMilliseconds(0);
                locstoptimeobject.setSeconds(0);
                var lstomins = Math.floor(locstoptimeobject.getMinutes()/15);
                locstoptimeobject.setMinutes(lstomins*15);
                if(ufo_stops[substops[p+1]].limits.refrigerated==true) { this.refrigerated = true; /* Set tour to require refrigeration if ANY stop on it does*/ }
                ufo_stops[substops[p+1]].eta = locstoptime;
                ufo_stops[substops[p+1]].tstopidx = parseInt(this.ipath.length);
                ufo_stops[substops[p+1]].eta_low = (locstoptimeobject.getTime()/1000.0)-900.0;
                ufo_stops[substops[p+1]].actual = this.start_time+(this.ipath.length * (60.0*res)); //this.start_time+parseFloat(trftime);
                ufo_stops[substops[p+1]].active = false;
            }  
        }


        if(this.has_deviations==false) {
            this.complete_time = loctime;
            this.travel_dist = locdist;
        }
        this.travel_dist_actual = locdist;
        this.complete_time_actual = trftime+300.0; // Correction added for final depot stop
        this.status = 2;

        if(this.active==true) {
            fleet_needs_redraw = true;
        }

        if(this.mdomel!=undefined) {
            return;
        }

        var marker = $("<div />", { "class": "marker_container", "id": "marker_tour_" + this.uid });
        var icon = $("<div />", { "class": "marker_icon" });
        marker.css({ left: -500 });
        marker.css({ top: -500 });
        icon.css({ "background-image": "url(./images/van.png)", "color": "#ffffff", "background-color":"var(--hereufoblue)", "text-align": "center", "border-color": "var(--herewhite)", "border-width": "2", "font-size": "8pt", "line-height": "24pt" });
        $(icon).on("click",{arg1:this},function(e) {
            ufo_force_stops_update = true;
            if(assignments_panel.visible==false && ufo_phone.visible==false) {
                // 23.11.2021 disabling resizing of the time control
                // $("#ufo_time_control").velocity({left:[735,60]},{duration:160});
                assignments_panel.visible = true;
                order_panel.visible = true;
                //assignments_panel.draw("ufo_tour click");
                //order_panel.draw("ufo_tour click");
            }

            for(var i=0;i<ufo_tours.length;i++) {
                if(e.data.arg1.uid!=ufo_tours[i].uid) {
                    ufo_tours[i].active = false;
                }
            }
            if(e.data.arg1.active==true) {
                fleet_needs_redraw = true;
                e.data.arg1.active=false;
                if(ufo_phone.visible==true) {
                    ufo_phone.tourid = -1;
                    ufo_phone.current_stop = -1;
                    ufo_phone.displaymode = "splash";
                    ufo_phone.switchmode();
                }
                queuelist.push({"type":"map_finish",params:{caller:"ufo_tour"}});
                queuelist.push({"type":"ufo_activate_stops",params:{caller:"ufo_tour"}});
            }
            else {
                fleetmode="plan";
                ufo_sidebar_icons();

                var t_delta = time - e.data.arg1.start_time;
                var npos;
                if(e.data.arg1.ipath.length==0) { return; }
                if(t_delta<0) {
                    npos = e.data.arg1.ipath[0];
                }
                else {
                    t_delta = parseInt(t_delta/(60*res));
                    if(t_delta>=e.data.arg1.ipath.length) {
                        npos = e.data.arg1.ipath[e.data.arg1.ipath.length-1];                        
                    }
                    else {
                        npos = e.data.arg1.ipath[t_delta];
                    }
                }


                queuelist.push({"type":"draw_panels","params":{}});
                queuelist.push({"type":"map_move_to","params":{dcoord:npos}});
                queuelist.push({"type":"ufo_activate_stops",params:{caller:"ufo_tour"}});
                e.data.arg1.active=true;
                if(ufo_phone.visible==undefined) {
                    ufo_phone = new smartphone({parent:"#ufo_smartphone"});
                }
                else {
                    if(ufo_phone.visible==true) {
                        ufo_phone.tourid = e.data.arg1.uid;
                        ufo_phone.current_stop = -1;
                        ufo_phone.displaymode = "map";
                        ufo_phone.switchmode();
                    }
                }
                
            }
        });
        $(marker).append(icon);
        this.mdomel = marker;
        fleet_needs_redraw = true;
        $("#tracker_layer").append(marker);
    }

    add_small_card(panel) {
        /**
         * Adds a small infobox.
         * Panel is the reference for this.
         * 
         */
        var small_card = $("<div />", { "class": "ufo_small_card_div", "id": this.small_card_id });
        var small_card_icon = $("<div />",{"class":"ufo_small_card_vehicle_icon"}); // This icon can be a person, a van, or a tour
        if (this.active == true) {
            $(small_card).css({ "background-color": "var(--hereufolightblue)" });
        }

        if(this.status>2) {
            // status 2 = driver assigned, so at that point we have a valid driver to use.
            $(small_card_icon).append(ufo_icons["tour_inprogress"]);
            //$(small_card_icon).append("<span>"+(this.uid+1)+"</span>");
            var title_div = $("<div />", { "class": "ufo_small_driver_title", "text": this.driver });
        }
        else {
            var title_div = $("<div />", { "class": "ufo_small_driver_title", "text": "NO DRIVER" });
            var driver_dropdown = new ufo_driver_dropdown({tour_id:this.uid});
            if(this.active==true) {
                $(small_card_icon).css({"background-color":"var(--herebluegreen)","border-radius":"2px","border":"1px solid var(--herebluegreen)"});
                $(small_card_icon).append(ufo_icons["check"]);
            }
            else {
                if(this.status==2) {
                    $(small_card_icon).append(ufo_icons["tour_planned"]);
                }
                else if(this.status==1){
                    $(small_card_icon).append(ufo_icons["person"]);
                }
                else {
                    var vehicle_type = ufo_vehicle_defs[ufo_vehicles[this.vehicle]["type"]]["profile"];
                    if(vehicle_type=="Van profile") {
                        $(small_card_icon).append($("<div />",{"class":"ufo_small_card_vehicle_icon_large","html":ufo_icons["icon_van"]}));
                    }
                    else {
                        $(small_card_icon).append($("<div />",{"class":"ufo_small_card_vehicle_icon_large","html":ufo_icons["icon_car"]}));
                    }
                }
            }
            $(title_div).html(driver_dropdown.domel);
        }
/*        else {
            if(this.active==true) {
                $(small_card_icon).css({"background-color":"var(--herebluegreen)","border-radius":"2px","border":"1px solid var(--herebluegreen)"});
                $(small_card_icon).append(ufo_icons["check"]);
            }
            else {
                $(small_card_icon).append(ufo_icons["van"]);
            }
            var title_div = $("<div />", { "class": "ufo_small_title", "text": ufo_vehicles[this.vehicle].name });
        }*/

        var license_div;

        if(this.status>2) {
            // If status is 3, then the job is dispatched, so we need to show the job status details
            var driver_div = $("<div />", { "class": "ufo_small_status" });
            license_div = $("<div />", { "class": "ufo_small_title" });
            $(license_div).html(ufo_vehicles[this.vehicle].license);
            var status_div = $("<div />", { "class": "ufo_small_details" });
            /**
             * "driver_div" is a formality--in this case we'll use it to show ETA
             */
            if(this.delay<offschedule_seconds) {
                $(driver_div).append("On time");
            }
            else {
                $(driver_div).append(Math.round(this.delay/60)+"min delay");
            }
        }
        else if(this.status==1 || this.status==2) {
            // If status is 1, then the job is planned but no driver is assigned. So...
            var driver_div = $("<div />", { "class": "ufo_small_details" });
            $(driver_div).html(ufo_vehicles[this.vehicle].license+" | "+ufo_vehicles[this.vehicle].name);
        }
        else {
            var driver_div = $("<div />", { "class": "ufo_small_title" });
            var status_div = $("<div />", { "class": "ufo_small_status" });
            if (this.driver == "") {
                //var driversel = new ufo_dropdown({ show_first: true, midbar: false, smallcard: true, id: "driversel_"+this.uid, elements: ["driver1","driver2","driver3"], parent: assignments_panel, vars: [], clickactions: [0,1,2] });
                //$(driver_div).css({"width":"120"});
                //$(driver_div).append(driversel.domel);
                $(driver_div).append(ufo_vehicles[this.vehicle].license +" | No driver");
            }
            else {
                $(driver_div).append(this.driver);
            }
        }
        
        if (this.status == 1) {
            $(status_div).append("Awaiting driver");
        }
        if (this.status == 2) {
            $(status_div).append("Assigned");
        }
        else if (this.status == 3) {
            $(status_div).append("Underway");
        }
        else if (this.status == 4) {
            $(status_div).append("Completed");
        }




        var route_complete = $("<div />", { "class": "ufo_small_status" });
        $(route_complete).css({"position":"absolute","top":"12px"})
        if (this.status == 1) {
            $(route_complete).append(this.current_stop+"/"+this.stops.length);
        }
        else if (this.status == 2 || this.status == 3) {
            var showstop = this.current_stop-1;
            if(showstop<0) { showstop = 0; }
            if(showstop>this.stops.length) { showstop = this.stops.length; }
            $(route_complete).append(showstop+"/"+this.stops.length);
        }
        else if (this.status == 4) {
            $(route_complete).append(this.stops.length+"/"+this.stops.length);
        }

        var route_info = $("<div />",{"class":"ufo_infobubble"});
        $(route_info).append(ufo_icons["info"]);

        $(small_card).append(small_card_icon);
        $(small_card).append(route_complete);
        $(small_card).append(status_div);
        $(small_card).append(title_div);
        $(small_card).append(driver_div);
        $(small_card).append(license_div);
        //$(small_card).append(route_info);
       

        // Binding an action to "select" or "deselect" this card...
        $(small_card_icon).on("click", { arg1: this, arg2: panel }, function (e) { e.data.arg1.small_card_selector(e.data.arg2); });

        $(panel.list_sect).append(small_card);
    }

    small_card_selector(panel,defer_redraw) {
        ufo_force_stops_update = true;
        if(defer_redraw==undefined) { defer_redraw = false; }
        if (this.active == false) {
            if(fleet_solutions_calculated==false || this.stops.length>0) {
                this.active = true;
                if(ufo_phone.visible==true) {
                    ufo_phone.tourid = this.uid;
                    ufo_phone.current_stop = -1;
                    ufo_phone.displaymode = "map";
                    ufo_phone.switchmode();
                }
            }
            
        }
        else {
            this.active = false;
            if(ufo_phone.visible==true) {
                ufo_phone.tourid = -1;
                ufo_phone.current_stop = -1;
                ufo_phone.displaymode = "splash";
                ufo_phone.switchmode();
            }
        }
        if(fleet_solutions_calculated==true) {
            // Add the appropriate fleet paths to the draw queue
            if(this.stops.length>0) {
                ufo_activate_stops({caller:"ufo_tour_"+this.uid});
                fleet_needs_redraw = true;
                order_panel.draw();
                if(defer_redraw==false) {
                    map_finish();
                }
            }
            
        }
        if(defer_redraw==false) {
            panel.draw();
        }
    }

    update_position() {
        var marker = this.mdomel;
        var icon = $(marker).children(".marker_icon");
        if(this.status<2) { 
            icon.hide();
            return; 
        }
        var t_delta = time - this.start_time;
        var npos;
        if(this.ipath.length==0) { return; }
        if(t_delta<0) {
            npos = this.ipath[0];
            this.delay = this.tidx[0];
        }
        else {
            t_delta = parseInt(t_delta/(60*res));
            if(t_delta>=this.ipath.length) {
                npos = this.ipath[this.ipath.length-1];
                this.delay = this.tidx[this.tidx.length-1];
                this.status = 4;
                if(this.active==true && ufo_autoplay==true) { 
                    if(ufo_phone.visible==true) {
                        ufo_phone.displaymode="splash";
                        ufo_phone.switchmode();
                    }
                    for(var i=0;i<this.stops.length;i++) {
                        ufo_stops[this.stops[i]].active=false;
                    }
                    this.active=false; 
                }
                
            }
            else {
                this.status = 3;
                npos = this.ipath[t_delta];
                this.delay = this.tidx[t_delta];
            }
        }
        var pos_offset = 18;
        
        
        var pos_vadjust = 0.0;
        $(icon).show();
        try {
        var origin = get_normalized_coord([npos[0], npos[1]]);
        }
        catch(e) { console.log(t_delta); }
        var delta_y = origin[0] - normalized_origin[0];
        var delta_x = origin[1] - normalized_origin[1];
        if(this.active==true) {
            pos_offset = 20;
            $(icon).css({"background-color":"var(--herebluegreen)"});
        }
        else {
            $(icon).css({"background-color":"var(--hereufoblue)"});
        }
        icon.css({ width: pos_offset * 2, height: pos_offset * 2, backgroundSize: pos_offset * 2, borderRadius: pos_offset * 2, zIndex: pos_offset * 6 });
        $(marker).css({ zIndex: pos_offset * 6 });
        var pleft = map_tile_offset_x + (delta_x * 512) - (mcx-(gmh*512));
        var ptop = map_tile_offset_y - pos_vadjust + (delta_y * 512);
        $(marker).css({ "left": pleft - pos_offset, "top": ptop - pos_offset });

        // Determine the current stop...
        if(t_delta%10==0 || ufo_force_stops_update == true) {
            // Run this loop only once a minute, not every anim frame update.
            for(var i=this.stops.length-1;i>=0;i--) {
                if(this.active==true) {
                    ufo_stops[this.stops[i]].update_status(ufo_autoplay);
                }
                if(ufo_stops[this.stops[i]].actual>time) {
                    this.current_stop = i;
                }
            }
        }
        return t_delta;
    }
}

class ufo_vehicle {
    /**
     * 
     * A UFO vehicle. Vehicles can have a capacity, a driver, a tour, and other parameters.
     * 
     */
    constructor(args) {
        this.id = "";
        this.license = "";
        this.name = ufo_vehicle_defs[args.type].name;
        this.driver = "";
        this.tour = "";
        this.type = args.type;
        this.build_license();
    }

    build_license() {
        var vlformat = ufo_vehicle_defs[this.type].license;
        var license_temp_string = "";
        for(var i=0;i<vlformat.length;i++) {
            if(vlformat[i]=="#") {
                license_temp_string = license_temp_string + Math.floor(Math.random()*10);
            }
            else if(vlformat[i]=="@") {
                license_temp_string = license_temp_string + String.fromCharCode(65+ Math.floor(Math.random()*26));
            }
            else {
                license_temp_string = license_temp_string + vlformat[i];
            }
        }
        this.license = license_temp_string;
    }
}

/*
    END UFO OBJECT CLASSES
*/

/*
    BEGIN INITIALIZATION FUNCTIONS
    These functiuns are used at or immediately after setup to ensure that everything is properly initialized
    They are called once, probably.
*/

function ufo_add_all_stops() {
    /*
     
    This function takes the list of stops in lastmiledata.js and creates a new div for each of them
    It is the equivalent of the tracker list function for trackers
      
     */
    var stops = Object.keys(stoplist);
    for (var i = 0; i < stops.length; i++) {
        var stop = stoplist[stops[i]];
        var stoptime = stoplist[stops[i]].availablefrom.split(":");
        var inittime = new Date();
        inittime.setHours(stoptime[0]);
        inittime.setMinutes(stoptime[1]);
        if(stop.signer=="") {
            var signer = stop.recipient;
        }
        else {
            var signer = stop.signer;
        }
        ufo_stops[i] = new ufo_stop({ uid: i, availablefrom:inittime.getTime()/1000|0, signer:signer, notes:stop.notes, process_time:stop.finish_time, endstate:stop.endstate, time:stop.time, lat: stop.lat, lon: stop.lon, addr: stop.addr, city:stop.city, zip:stop.zip, state:stop.state, limits: stop.limits, recipient: stop.recipient });
    }
    var stop = {"lat": 36.11179520406925,"lon": -115.2069771831083,"recipient": "Bobby Womack","addr": "3270 S Valley View Blvd","time":0,"availablefrom": "0:00","meta": [ "0kg"],"limits": { "timecritical": false, "refrigerated": false, "heavy": false, "fragile": false},"zip": "89102","city": "Las Vegas","state": "NV","country": "USA"}
    var stoptime = stop.availablefrom.split(":");
    var inittime = new Date();
    inittime.setHours(stoptime[0]);
    inittime.setMinutes(stoptime[1]);
    ufo_depots[0] = new ufo_stop({ uid: "d0", availablefrom:inittime.getTime()/1000|0, signer: "",notes:"",endstate:stop.endstate, process_time:0.0, time:stop.time, lat: stop.lat, lon: stop.lon, addr: stop.addr, city:stop.city, zip:stop.zip, state:stop.state, limits: stop.limits, recipient: stop.recipient });
    ufo_depots[0].status = 1;
    ufo_depots[1] = new ufo_stop({ uid: "w0", availablefrom:inittime.getTime()/1000|0, signer:"",notes:"",endstate:stop.endstate, process_time:0.0, time:stop.time, lat: 36.07131485325218, lon: -115.2217393474679, addr: stop.addr, city:stop.city, zip:stop.zip, state:stop.state, limits: stop.limits, recipient: stop.recipient });
    ufo_depots[1].status = 1;
}

function ufo_calculate_adjacency_map(rebuild) {
    /*
     * Returns a valid adjacency map. 
     * The adjacency map is of the form (stop-stop):[path,path,path...]
     */
    // This is a map of nodes that must be either start or endpoints.
    if(rebuild==undefined) {
        var rebuild = false;
    }
    if (Object.keys(adjmap_n).length > 0 && rebuild==false) {
        return;
    }

    var lmpids = Object.keys(lastmile_nodes);
    for (var i = 0; i < lmpids.length; i++) {
        if (adjmap_n[lmpids[i]] == undefined) {
            adjmap_n[lmpids[i]] = [];
        }
    }
    // Hack to make sure the node map is populated.

    var lmpids = Object.keys(lastmile_paths);
    var lnids = Object.keys(adjmap_n);
    for (var i = 0; i < lnids.length; i++) {
        var l = lnids[i];
        for (var j = 0; j < lmpids.length; j++) {
            var lc = lmpids[j].split("-");
            if (lc.length == 2) {
                if (lc[0] == l) { adjmap_n[l].push(lc[1]); }
            }
        }
    }
    // adjmap_n now contains a list of node adjacencies for every node.

    if (Object.keys(adjmap).length > 0 && rebuild==false) {
        return;
    }

    var snids = Object.keys(stopnodes);
    var pnodes = new Set(); // i.e. the node has already been built
    for (var i = 0; i < snids.length; i++) {
        // For each stop node, we're going to start building out an adjacency map
        for (var j = 0; j < snids.length; j++) {
            if (j != i && pnodes.has(snids[j]) == false) {
                // So we don't calculate start-to-finish for each node.
                if(adjmap[stopnodes[snids[i]] + "-" + stopnodes[snids[j]]]!=undefined) {
                    var smap = false;
                }
                else {
                    var smap = ufo_router({start:snids[i], finish:snids[j]});
                }
                
                if (smap != false) {
                    // If this returned an "array" instead of false, then we have a valid adjacency
                    var adjmap_paths = [];
                    for (var s = 0; s < smap.length - 1; s++) {
                        if (lastmile_paths[smap[s] + "-" + smap[s + 1]] != undefined) {
                            adjmap_paths.push(smap[s] + "-" + smap[s + 1]);
                        }
                    }
                    adjmap[stopnodes[snids[i]] + "-" + stopnodes[snids[j]]] = adjmap_paths;
                }
            }
        }
        pnodes.add(snids[i]);
    }

    ufo_calculate_inverse_adjacencies();
    all_stops_to_depot();
    depot_to_all_stops();
}

function ufo_calculate_inverse_adjacencies() {
    var noninverted = Object.keys(adjmap);
    for(var i=0;i<noninverted.length;i++) {
        var rm = noninverted[i].split("-");
        var smap = ufo_router({start:nodestops[rm[1]],finish:nodestops[rm[0]]});
        if(smap!=false) {
            var adjmap_paths = [];
            for (var s = 0; s < smap.length - 1; s++) {
                if (lastmile_paths[smap[s] + "-" + smap[s + 1]] != undefined) {
                    adjmap_paths.push(smap[s] + "-" + smap[s + 1]);
                }
            }
            adjmap[rm[1] + "-" + rm[0]] = adjmap_paths;
        }
    }
}

/*
    END INITIALIZATION FUNCTIONS
*/

/*
    BEGIN DRAW FUNCTIONS
    These functions are used to reposition or otherwise change elements of the UI
*/

function ufo_activate_stops(params) {
    var fname = "ufo_activate_stops";
    var caller = params.caller;
    if (caller != undefined) {
        call_log(fname,caller);
    }
    blocking_queue=true;
    fleetpaths = [];
    for(var i=0;i<ufo_stops.length;i++) {
        ufo_stops[i].active = false;
        ufo_stops[i].selectedfrom = "";
        ufo_stops[i].update_status(false);
    }
    for(var i=0;i<ufo_tours.length;i++) {
        if(ufo_tours[i].active==true) {
            fleet_needs_redraw = true;
            fleetpaths.push(ufo_tours[i].route);
            for(var j=0;j<ufo_tours[i].stops.length;j++) {
                ufo_stops[ufo_tours[i].stops[j]].active=true;
                ufo_stops[ufo_tours[i].stops[j]].cluster=false;
            }
        }
        if(i==ufo_tours.length-1) { blocking_queue=false; }
    }
    
}

function ufo_draw_fleet_paths(params) {
    /*
     * Takes the fleetpaths[] array and redraws it (in case the map is zoomed) 
     * 
     */
    var fname = "ufo_draw_fleet_paths";
    if(fleet_needs_redraw==false) {
        return;
    }
    if(ufo_draw_call!=-1) {
        ufo_draw_route({tour:ufo_draw_call});
        if(ufo_phone.visible==true) {
            ufo_phone.hide();
        }
        return;
    }
    tcx.clearRect(0, 0, tcv.width, tcv.height);
    if (params == undefined) { params = {}; }
    var caller = params.caller;
	if(caller!=undefined) {
		call_log(fname,caller);
	}
    if (params.color == undefined) {
        var color = "#1d417c"; // This is the normal color for paths drawn on the map?
    }
    else {
        var color = params.color;
    }
    if (params.fade == true) {
        //If true, then we'll show the lines as dimmer the older they are
        var fade = true;
    }
    else {
        var fade = false;
    }
    for (var i = 0; i < fleetpaths.length; i++) {
        if (fade == true) {
            color = "rgba(169,209,237," + parseFloat(i / fleetpaths.length) + ")";
        }
        ufo_draw_link({ path_list: fleetpaths[i], color: color });
    }
    for (var i = 0; i < temp_link_map.length-1; i++ ) {
        ufo_draw_link({ path_list: [temp_link_map[i]], color: color });
    }
    for ( var i = 0; i<canon_paths.length;i++) {
        color = canon_colors[i];
        ufo_draw_link({ path_list: canon_paths[i], color: color });
    }
    fleet_needs_redraw = false;
}

function ufo_draw_link(params) {
    var fname = "ufo_draw_link";
    var path_list = params.path_list;
    var caller = params.caller;
    var color = params.color;
    if (caller != undefined) {
        //call_log(fname,caller);
    }

    for (var i = 0; i < path_list.length; i++) {
        ufo_draw_path({ caller: fname, id: path_list[i], complex: true, color: color });
    }
}

function ufo_draw_path(params) {
    /*
        Draws a single map path on the trace canvas.
        Does not assume the canvas to be cleared.
    
        Returns an object consisting of the start, end, and midpoints of the path
    */
   //console.log(params);
    var fname = "ufo_draw_path";
    var p_id = params.id;
    var paths = params.paths;
    if(paths==undefined) { paths = false; }
    var complex = params.complex;
    var caller = params.caller;
    var linewidth = params.width;
    var linecolor = params.color;
    if (linewidth == undefined) { linewidth = 3; }
    if (linecolor == undefined) { linecolor = "#3f59a7"; }
    if (caller != undefined) {
        //call_log(fname,caller);
    }
    if (complex == undefined) {
        // If "complex" is true, then the path ID is not a single path but an array of paths
        // that must all be joined into one path first
        complex = false;
    }
    var path_data = {};
    tcx.beginPath();
    tcx.lineWidth = linewidth;
    tcx.lineJoin = "round";
    tcx.strokeStyle = linecolor;
    var npos; // Used to store a normalized coordinate
    var dx,dy;
    var from_cache = false;
    if (complex == true) {
        if(paths==false) {
            p_id = adjmap[p_id];
        }
        else {
            p_id = paths;
        }
        if(lmpcache[map_zlevel+"z-"+p_id]!=undefined) {
            pdata = lmpcache[map_zlevel+"z-"+p_id];
            from_cache = true;
        }
        else {
            var pdata = [];

            /**
             * Need to check whether the FIRST path should be walked in ordinary or reverse order
             */
            try {
                var p1 = lastmile_paths[p_id[0]];
                var p2 = lastmile_paths[p_id[1]];
                var dist_aa = pdist(p1[0], p2[0]);
                var dist_ab = pdist(p1[0], p2[p2.length - 1]);
                var dist_ba = pdist(p1[p1.length - 1], p2[0]);
                var dist_bb = pdist(p1[p1.length - 1], p2[p2.length - 1]);
            }
            catch(e) {
                console.log(p_id);
            }
               
    
            
    
            if (((dist_ba <= dist_aa) && (dist_ba <= dist_ab)) || ((dist_bb <= dist_aa) && (dist_bb <= dist_ab))) {
                // If these are true, then the last distance in path 1 is closer to either the start or end of path 2
                // Accordingly the first subpath should be built in logical order
                for (var j = 0; j < p1.length; j++) {
                    pdata.push(p1[j]);
                }
            }
            else {
                for (var j = p1.length - 1; j >= 0; j--) {
                    pdata.push(p1[j]);
                }
            }
    
            var lp = p1[p1.length-1];
            var up = p1[p1.length-2];
            var np = p2[0];
            var vp = p2[1];
            var ips;
            if(interlinks[p_id[i]+"-"+p_id[i+1]]!=undefined) {
                if(p_id[i]!=undefined) {
                    ips = interlinks[p_id[i]+"-"+p_id[i+1]];
                }
                else {
                    ips = [[],""];
                    //console.log(p1);
                }
            }
            else {
                ips = smooth_interlink(lp,np,up,vp);
                interlinks[p_id[i]+"-"+p_id[i+1]] = ips;
            }
            var capts = [];
            //var checktype = ["C_17","C_26","C_16","C_27"];
            //var checktype = ["C_27","C_17","C_28"]
            var checktype = [];
            var ils = [];
            if(in_array(ips[1],checktype)==true) {
                ils.push(ips);
                //console.log(p_id[i],p_id[i+1]);
                
            }
            for(var j=0;j<ips[0].length;j++) {
                pdata.push(ips[0][j]);
            }
    
            for (var i = 1; i < p_id.length; i++) {
                // Check to see whether the first or last point of the next path is closest
                var sub_p = lastmile_paths[p_id[i]];
                if (sub_p == undefined) { console.log(p_id[i]); }
                var distf = Math.sqrt(Math.pow((pdata[pdata.length - 1][0] - sub_p[0][0]), 2) + Math.pow((pdata[pdata.length - 1][1] - sub_p[0][1]), 2));
                var distl = Math.sqrt(Math.pow((pdata[pdata.length - 1][0] - sub_p[sub_p.length - 1][0]), 2) + Math.pow((pdata[pdata.length - 1][1] - sub_p[sub_p.length - 1][1]), 2));
                if (distf <= distl) {
                    /**
                     * The distance between the FIRST point of the new subpath and the LAST point of the old path is smaller
                     * than the distance between the LAST point of the new subpath (ordinary case)
                     */
                    for (var j = 0; j < sub_p.length; j++) {
                        pdata.push(sub_p[j]);
                    }
                }
                else {
                    for (var j = sub_p.length - 1; j >= 0; j--) {
                        pdata.push(sub_p[j]);
                    }
                }
                // attempt to interpolate link points...
    
                if(i<p_id.length-1) {
                    lp = lastmile_paths[p_id[i]][lastmile_paths[p_id[i]].length-1];
                    up = lastmile_paths[p_id[i]][lastmile_paths[p_id[i]].length-2];
                    try {
                        np = lastmile_paths[p_id[i+1]][0];
                        vp = lastmile_paths[p_id[i+1]][1];
                    }
                    catch(e) {
                        console.log(p_id,i);
                    }
                    if(interlinks[p_id[i]+"-"+p_id[i+1]]!=undefined) {
                        if(p_id[i]!=undefined) {
                            ips = interlinks[p_id[i]+"-"+p_id[i+1]];
                        }
                        else {
                            ips = [[],""];
                            //console.log(p1);
                        }
                    }
                    else {
                        ips = smooth_interlink(lp,np,up,vp);
                        interlinks[p_id[i]+"-"+p_id[i+1]] = ips;
                    }
                    //ips = smooth_interlink(lp,np,up,vp);
                    capts.push([ips[1],ips[0][0]]);
    
                    if(in_array(ips[1],checktype)==true) {
                        ils.push(ips);
                        //console.log(ips[1],p_id[i],p_id[i+1]);
                        
                    }
                    for(var j=0;j<ips[0].length;j++) {
                        pdata.push(ips[0][j]);
                    }
                }
            }
        }
        
    }
    else {
        var pdata = lastmile_paths[p_id];
    }

    var normp = [];
    if(from_cache==false) {
        npos = get_normalized_coord(pdata[0]);
        normp.push(npos);
    }
    else {
        npos = pdata[0];
    }
    dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
    dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
    tcx.moveTo(dx, dy)

    /*
    for(var i=0;i<capts.length;i++) {
        npos = get_normalized_coord(capts[i][1]);
        dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
        dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
        //tcx.fillText(capts[i][0],dx,dy);
    }*/

    var pnorm = [];
    for (var i = 1; i < pdata.length; i++) {
        if(from_cache==false) {
            npos = get_normalized_coord(pdata[i]);
            normp.push(npos);
        }
        else {
            npos = pdata[i];
        }
        dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
        dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
        pnorm.push([dx, dy]);
        tcx.lineTo(dx, dy);
    }
    tcx.stroke();

    /*
    for(var i=0;i<ils.length;i++) {
        tcx.beginPath();
        tcx.strokeStyle = "#f00";
        var avgx = 0;
        var avgy = 0;
        var cpts = 0;
        for(var j=0;j<ils[i][0].length;j++) {
            npos = get_normalized_coord(ils[i][0][j]);
            dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
            dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
            pnorm.push([dx, dy]);
            avgx += dx;
            avgy += dy;
            tcx.lineTo(dx, dy);
            cpts++;
        }
        avgx = avgx/cpts;
        avgy = avgy/cpts;
        tcx.fillText(ils[i][1],avgx,avgy);
        tcx.stroke();
    }
    */

    if(from_cache==false) {
        npos = get_normalized_coord(pdata[0]);
    }
    else {
        npos = pdata[0];
    }
    dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
    dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
    path_data.start = [dx, dy];

    if(from_cache==false) {
        npos = get_normalized_coord(pdata[pdata.length - 1]);
    }
    else {
        npos = pdata[pdata.length-1];
    }
    dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
    dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
    path_data.end = [dx, dy];

    if (pdata.length == 2) {
        // Special case if the path data is only 2 points long
        dx = (path_data.start[1] + path_data.end[1]) / 2;
        dy = (path_data.start[0] + path_data.end[0]) / 2;
        path_data.mid = [dx, dy];
    }
    else {
        npos = get_normalized_coord(pdata[parseInt(pdata.length / 2)]);
        dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
        dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
        path_data.mid = [dx, dy];
    }
    path_data.verts = pnorm;
    if(from_cache==false) {
        lmpcache[map_zlevel+"z-"+p_id] = normp;
    }

    return path_data;
}

function ufo_plot_tours(idx) {
    var tourlist = ufo_sequences[idx];
    for(var i=0;i<tourlist.length;i++) {
        var seq = tourlist[i];
        for(var j=0;j<seq.length;j++) {
            ufo_stops[seq[j]].active = true;
        }
        
    }
    map_finish({caller:"ufo_plot_tours"});
    for(var i=0;i<tourlist.length;i++) {
        var seq = tourlist[i];
        tcx.beginPath();
        for(var j=0;j<seq.length;j++) {
            ufo_stops[seq[j]].active = true;
            npos = get_normalized_coord([ufo_stops[seq[j]].lat,ufo_stops[seq[j]].lon]);
            var dx, dy;
            dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
            dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
            tcx.lineTo(dx, dy)
        }
        tcx.strokeStyle = "#000";
        tcx.stroke();
        
    }
}

function ufo_draw_route(params) {
    var t = params.tour;
    var ipath = ufo_tours[t].ipath;
    var tidx = ufo_tours[t].tidx;
    var npos,dx,dy;
    tcx.clearRect(0,0,tcv.width,tcv.height);
    tcx.lineWidth = 3;
    tcx.beginPath();
    npos = get_normalized_coord(ipath[0]);
    dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
    dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
    tcx.moveTo(dx, dy);
    for(var i=1;i<ipath.length;i++) {
        npos = get_normalized_coord(ipath[i]);
        dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
        dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
        tcx.lineTo(dx, dy);
        
    }
    tcx.beginPath();
    npos = get_normalized_coord(ipath[0]);
    dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
    dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
    tcx.moveTo(dx, dy);
    var max_delay = late_seconds; // Everything later than 10 minutes is red
    for(var i=1;i<ipath.length;i++) {
        npos = get_normalized_coord(ipath[i]);
        dx = (mcx) + ((npos[1] - normalized_origin[1]) * 512);
        dy = (1024) + ((npos[0] - normalized_origin[0]) * 512);
        tcx.lineTo(dx, dy);
        if(i%10==0) {
            var alpha = 1.0;
            if(ufo_tours[t].stop_for_pda!=-1) {
                // Get the tidx of the stop
                var mp = ufo_stops[ufo_tours[t].stop_for_pda].tstopidx;
                if(Math.abs(mp-i)>60) {
                    alpha = 1.0 - ((Math.abs(mp-i)-60)/200.0);
                    if(alpha<0) { alpha = 0.0; }
                }
                alpha = .2 + (alpha*.8);
            }
            
            //tcx.strokeStyle = "rgba(106,109,116,"+alpha+")";
            tcx.strokeStyle = "rgba(70,0,212,"+alpha+")";
            tcx.lineWidth = 4;
            tcx.stroke();
            tcx.lineWidth = 3;

            if(tidx[i]>max_delay) {
                tcx.strokeStyle = "rgba(196,28,51,"+alpha+")";
            }
            else if(tidx[i]>(max_delay*.75)) {
                tcx.strokeStyle = "rgba(236,97,14,"+alpha+")"; // "#ec610e";
            }
            else if(tidx[i]>(max_delay*.5)) {
                tcx.strokeStyle = "rgba(241,137,74,"+alpha+")"; // "#f1894a";
            }
            else if(tidx[i]>(max_delay*.33)) {
                tcx.strokeStyle = "rgba(250,184,0,"+alpha+")"; // "#fab800";
            }
            else if(tidx[i]>(max_delay*.25)) {
                tcx.strokeStyle = "rgba(251,202,64,"+alpha+")"; // "#fbca40";
            }
            else if(tidx[i]>(max_delay*.16)) {
                tcx.strokeStyle = "rgba(130,219,189,"+alpha+")"; // "#82dbbd";
            }
            else if(tidx[i]>(max_delay*.08)) {
                tcx.strokeStyle = "rgba(68,202,157,"+alpha+")"; // "#44ca9d";
            }
            else {
                tcx.strokeStyle = "rgba(6,184,124,"+alpha+")"; // "#06b87c";
            }
            tcx.stroke();
            tcx.beginPath();
            tcx.moveTo(dx,dy);
        }
    }
    tcx.stroke();
}

function ufo_next_step() {
    /*
    if(ufo_remaining_steps >= ufo_minstep-1) {
        ufo_minstep = 0;
        ufo_remaining_steps = 0;
        if(ufo_phone.visible==true && ufo_phone.tour_id!=-1) {
            ufo_phone.draw();
        }
        time_change({delta:1});
        //ufo_autoplay = false;
    }
    else {
        ufo_remaining_steps++;
    }
    */
    time+=12;
    for(var i=0;i<ufo_tours.length;i++) {
        if(ufo_tours[i].status=="3") {
            ufo_tours[i].update_position();
        }
    }
    if(ufo_phone.visible==true && ufo_phone.tour_id!=-1) {
        ufo_phone.draw("from step");
    }
    ufo_timechange({drawOnly:true});
    console.log(ufo_remaining_steps,ufo_minstep);
}

function ufo_position_stops(params) {
    var fname = "ufo_position_stops";
    var caller = params.caller;
    if(fleet_jobs_imported==true) { ufo_cluster_stops(); }
    
	if(caller!=undefined) {
		call_log(fname,caller);
    }
    else { console.log("called position stops");}
    for(var i=0;i<ufo_depots.length;i++) {
        ufo_depots[i].position();
    }
    if(fleet_solutions_dispatched==true && ufo_stops[ufo_later_stops[0]].status<=2) {
        for(var i=0;i<ufo_later_stops.length;i++) {
            ufo_stops[ufo_later_stops[i]].position();
        }
    }
    for (var i = 0; i < ufo_stops.length; i++) {
        if(map_zlevel>12) { ufo_stops[i].cluster = false; }
        ufo_stops[i].update_status(true);
        
    }
    
}

function ufo_set_new() {
    /*
    var ptime = parseInt(time);
    ufo_position_tours({caller:"set_new",ignore_redraw:true});
    var plp = {};
    for(var i=0;i<ufo_tours.length;i++) {
        plp[i] = ufo_tours[i].last_p_idx;
    }
    time = ufo_midnight+38100;
    for(i=0;i<ufo_tours.length;i++) {
        ufo_tours[i].last_p_idx = plp[i];
        
    }
    time = ptime;*/
    if(time<(ufo_midnight+38100)) {
        ufo_stop_at = ufo_midnight + 38400;
    }
    else {
        if(ufo_stops[ufo_later_stops[1]].status>=2) {
            ufo_stop_at= ufo_midnight+57600;
        }
    }
    ufo_autoplay = true;
}

function ufo_position_tours(params) {
    var fname = "ufo_position_tours";
    var caller = params.caller;
    var ignore_redraw = params.ignore_redraw;
    if(ignore_redraw==undefined) { ignore_redraw = false; }
	if(caller!=undefined) {
		call_log(fname,caller);
    }
    ufo_draw_call = -1;
    if(fleet_solutions_calculated==true) {
        ufo_cluster_stops();
        fleetpaths = [];
        for(var i=0;i<ufo_tours.length;i++) {
            if(ufo_tours[i].status=="3" || ufo_tours[i].status=="4") {
                ufo_tours[i].update_position();
                if(ufo_tours[i].active==true) {
                    if(ufo_tours[i].status==4) {
                        console.log("no");
                        ufo_draw_call = ufo_tours[i].uid;
                    }
                    else {
                        ufo_draw_call = -1;
                        fleetpaths.push(ufo_tours[i].route);
                    }
                    if(ufo_phone.visible==true && ufo_autoplay==false) {
                        ufo_phone.draw();
                    }
                }
            }
        }
        if(assignments_panel.visible==true) {
            if(ignore_redraw==false) {
                // Set by "ufo_set_new()" so that we don't show the newly added stops too soon.
                assignments_panel.draw(fname);
                order_panel.draw(fname);
            }
            
        }

    }

}

function ufo_vehicle_panel(tab) {
    if(tab==undefined) {
        var tab = "profiles";
    }
    else {
        var tab = tab;
    }
    $(".map_zoom_in,.map_zoom_out,.map_data_selector").hide();
    $(".ufo_large_panel").remove();
    var vptitle = $("<div />",{"class":"ufo_large_panel_title"});
    $(vptitle).append("Fleet")
    var vpcontainer = $("<div />",{"class":"ufo_large_panel"});

    var vptable = $("<table />",{"class":"ufo_driver_table"});
    var vptabbuffer = $("<tr />",{"class":"ufo_driver_table_header","css":{"background-color":"var(--herewhite)","border":"0px solid black","height":"40px"}});
    var vpheader = $("<tr />",{"class":"ufo_driver_table_header"});

    if(tab=="profiles") {
        var headers = ["Name","Type","Cost per km","Cost per min","Fixed cost","Capacity","Max range (km)","Shift time (hr)"];
        var tab_left = $("<div />",{"class":"ufo_driver_table_tab_bg_active"});
        var tab_right = $("<div />",{"class":"ufo_driver_table_tab_bg_inactive"});
        var tab_buffer_action = $("<td />",{"attr":{"colspan":headers.length}});
        var tab_buffer_action_button = $("<div />",{"class":"ufo_action_button","html":"<span class='action_plus'>+</span> Add vehicle profile","css":{"width":"fit-content","padding-left":"40px","padding-right":"20px","position":"relative","float":"right"}});
        $(tab_buffer_action).append(tab_buffer_action_button);
        $(vptabbuffer).append(tab_buffer_action);
    }
    else {
        var headers = ["Profile","Depot","Number plate","Make","Model","Additional info","Status"];
        var tab_left = $("<div />",{"class":"ufo_driver_table_tab_bg_inactive"});
        var tab_right = $("<div />",{"class":"ufo_driver_table_tab_bg_active"});
        var tab_buffer_action = $("<td />",{"attr":{"colspan":headers.length}});
        var tab_buffer_action_button = $("<div />",{"class":"ufo_action_button","html":"<span class='action_plus'>+</span> Add vehicle","css":{"width":"fit-content","padding-left":"40px","padding-right":"20px","position":"relative","float":"right"}});
        $(tab_buffer_action).append(tab_buffer_action_button);
        $(vptabbuffer).append(tab_buffer_action);
    }
    $(tab_left).append($("<div />",{"text":"Vehicle profiles"}));
    $(tab_left).on("click",function() { ufo_vehicle_panel("profiles")});
    $(tab_right).append($("<div />",{"text":"Vehicles"}));
    $(tab_right).on("click",function() { ufo_vehicle_panel("vehicles")});

    var vptab = $("<div />",{"class":"ufo_driver_table_tabs"});
    $(vptab).append(tab_left);
    $(vptab).append(tab_right);

    for(var i=0;i<headers.length;i++) {
        $(vpheader).append($("<td />",{"text":headers[i]}));
    }

    $(vptable).append(vptabbuffer);
    $(vptable).append(vpheader);

    if(tab=="profiles") {
        var vpids = Object.keys(ufo_vehicle_defs);

        for(var i=0;i<vpids.length;i++) {
            var vrow = $("<tr />",{"class":"ufo_driver_table_row"});
            $(vrow).append($("<td />",{"text":ufo_vehicle_defs[vpids[i]]["name"]}));
            var typecell = $("<td />",{"class":"ufo_driver_table_typecell"});
            if(ufo_vehicle_defs[vpids[i]]["profile"]=="Van profile") {
                $(typecell).append(ufo_icons["icon_van"]);
                $(typecell).append($("<span />",{"text":"Truck profile","css":{"background-color":"var(--herewhite)","font-weight":"100"}}))
            }
            else {
                $(typecell).append(ufo_icons["icon_car"]);
                $(typecell).append($("<span />",{"text":"Car profile","css":{"background-color":"var(--herewhite)","font-weight":"100"}}))
            }
            $(vrow).append(typecell);
            $(vrow).append($("<td />",{"text":ufo_vehicle_defs[vpids[i]]["cpk"]}));
            $(vrow).append($("<td />",{"text":ufo_vehicle_defs[vpids[i]]["cpm"]}));
            $(vrow).append($("<td />",{"text":"-"}));
            $(vrow).append($("<td />",{"text":ufo_vehicle_defs[vpids[i]]["capacity"]}));
            $(vrow).append($("<td />",{"text":ufo_vehicle_defs[vpids[i]]["range"]}));
            $(vrow).append($("<td />",{"text":"8"}));
            $(vptable).append(vrow);
        }
    }
    else {
        for(var i=0;i<ufo_vehicles.length;i++) {
            var vrow = $("<tr />",{"class":"ufo_driver_table_row"});
            $(vrow).append($("<td />",{"text":ufo_vehicles[i]["name"]}));
            $(vrow).append($("<td />",{"text":"Las Vegas - South"}));
            $(vrow).append($("<td />",{"text":ufo_vehicles[i]["license"]}));
            $(vrow).append($("<td />",{"text":"-"}));
            $(vrow).append($("<td />",{"text":"-"}));
            $(vrow).append($("<td />",{"text":"-"}));
            $(vrow).append($("<td />",{"html":"<span class='ufo_driver_table_row_status'>Available</span>"}));
            $(vptable).append(vrow);
        }
    }


    $(vpcontainer).append(vptitle);
    $(vpcontainer).append(vptab);
    $(vpcontainer).append(vptable);

    $("#main_container").append(vpcontainer);
    /*
    for(var i=0;i<ufo_vehicles.length;i++) {
        var vcard = $("<div />",{"class":"ufo_large_panel_card"});
        var vcardicon = $("<div />",{"class":"ufo_large_panel_card_icon"});
        if(ufo_vehicles[i].driver!="") {
            var drdiv = $("<div />",{"class":"ufo_large_panel_card_note","text":"Assigned to "+ufo_vehicles[i].driver});
            $(vcard).append(drdiv);
            $(vcardicon).css({"border":"3px solid var(--heregreen)"});
        }
        $(vcardicon).append(ufo_icons["van"]);
        $(vcard).append(vcardicon);
        var vcardtitle = $("<div />",{"class":"ufo_large_panel_card_subhead","text":ufo_vehicles[i].name + " (" + ufo_vehicles[i].license+")"});
        var vcardbadges = $("<div />",{"class":"ufo_large_panel_card_details"});
        var vpr = ufo_vehicle_defs[ufo_vehicles[i].type]; // JSON object with vehicle definitions.
        var profilebadge = $("<div />",{"class":"ufo_large_panel_card_badge","text":vpr.profile});
        var vstring = "Light vehicle with a carrying capacity of "+vpr.capacity+"kg and a cargo volume of "+vpr.volume+"m³. Operating cost averages "+vpr.cpk+" per kilometer.";
        var vstringdiv = $("<div />",{"class":"ufo_large_panel_card_summary","text":vstring});
        $(profilebadge).css({"background-color":"var(--hereufomidblue)"});
        $(vcardbadges).append(profilebadge);
        if(ufo_vehicles[i].type=="lightev") { 
            var evbadge = $("<div />",{"class":"ufo_large_panel_card_badge","text":"Electric"});
            $(evbadge).css({"background-color":"var(--heregreen)"});
            $(vcardbadges).append(evbadge);
        }
        for(var j=0;j<vpr.special.length;j++) {
            var sbadge = $("<div />",{"class":"ufo_large_panel_card_badge","text":vpr.special[j]});
            $(sbadge).css({"background-color":"var(--herelavender)"});
            $(vcardbadges).append(sbadge);
        }
        $(vcardbadges).append(vstringdiv);
        $(vcard).append(vcardtitle);
        $(vcard).append(vcardbadges);
        $(vpcontainer).append(vcard);
    }
    $(vpcontainer).append(vptitle);
    $("#main_container").append(vpcontainer);
    */
}

function ufo_driver_panel() {
    $(".map_zoom_in,.map_zoom_out,.map_data_selector").hide();
    $(".ufo_large_panel").remove();
    var dptitle = $("<div />",{"class":"ufo_large_panel_title"});
    var dpids = Object.keys(ufo_driver_defs);
    $(dptitle).append("Users ("+dpids.length+")")
    var dpcontainer = $("<div />",{"class":"ufo_large_panel"});

    var dptable = $("<table />",{"class":"ufo_driver_table"});
    var dpheader = $("<tr />",{"class":"ufo_driver_table_header"});
    var headers = ["First name","Last name","Email","Phone number","Roles","Depot","Status"];
    for(var i=0;i<headers.length;i++) {
        $(dpheader).append($("<td />",{"text":headers[i]}));
    }

    $(dptable).append(dpheader);

    for(var i=0;i<dpids.length;i++) {
        var drow = $("<tr />",{"class":"ufo_driver_table_row"});
        $(drow).append($("<td />",{"text":ufo_driver_defs[dpids[i]]["firstname"]}));
        $(drow).append($("<td />",{"text":ufo_driver_defs[dpids[i]]["lastname"]}));
        $(drow).append($("<td />",{"text":ufo_driver_defs[dpids[i]]["email"]}));
        $(drow).append($("<td />",{"text":ufo_driver_defs[dpids[i]]["phone"]}));
        $(drow).append($("<td />",{"text":"Driver"}));
        $(drow).append($("<td />",{"text":"Las Vegas - South"}));
        $(drow).append($("<td />",{"html":"<span class='ufo_driver_table_row_status'>Active</span>"}));
        $(dptable).append(drow);
    }


    /*

    for(var i=0;i<dpids.length;i++) {
        var dcard = $("<div />",{"class":"ufo_large_panel_card"});
        var dcardicon = $("<div />",{"class":"ufo_large_panel_card_icon"});
        $(dcardicon).append(ufo_icons["person"]);
        $(dcard).append(dcardicon);
        if(ufo_driver_defs[dpids[i]].provisional_tour!=-1) {
            var drdiv = $("<div />",{"class":"ufo_large_panel_card_note","text":"Assigned to tour"});
            $(dcard).append(drdiv);
            $(dcardicon).css({"border":".2em solid var(--herecornflower)"});
        }
        else {
            if(ufo_driver_defs[dpids[i]].assigned!=-1) {
                var drdiv = $("<div />",{"class":"ufo_large_panel_card_note","text":"Dispatched"});
                $(dcard).append(drdiv);
                $(dcardicon).css({"border":".2em solid var(--herebluegreen)"});
            }
            else {
                if(ufo_driver_defs[dpids[i]].shift_time==0) {
                    $(dcardicon).css({"border":".2em solid var(--heregreen)"});
                }
                else {
                    $(dcardicon).css({"border":".2em solid var(--herered)"});
                }
            }
        }
        var drname = "<span style='font-weight: 100;'>Mx. </span>"+ufo_driver_defs[dpids[i]].name;

        var dcardtitle = $("<div />",{"class":"ufo_large_panel_card_subhead"});
        $(dcardtitle).html(drname);
        var dcardbadges = $("<div />",{"class":"ufo_large_panel_card_details"});

        for(var j=0;j<ufo_driver_defs[dpids[i]].certification.length;j++) {
            var sbadge = $("<div />",{"class":"ufo_large_panel_card_badge","text":ufo_driver_defs[dpids[i]].certification[j]});
            if(ufo_driver_defs[dpids[i]].certification[j]=="CDL") {
                $(sbadge).css({"background-color":"var(--hereufomidblue)"});
            }
            else if(ufo_driver_defs[dpids[i]].certification[j]=="Hazmat") {
                $(sbadge).css({"background-color":"var(--hereyellow)"});
            }
            else {
                $(sbadge).css({"background-color":"var(--herebluegreen)"});
            }
            
            $(dcardbadges).append(sbadge);
        }

        var dstring = "";
        if(ufo_driver_defs[dpids[i]].shift_time==0) {
            dstring = "Shift: 0800 to 1600";
        }
        else if(ufo_driver_defs[dpids[i]].shift_time==1) {
            dstring = "Shift: 0000 to 0800";
        }
        var dstringdiv = $("<div />",{"class":"ufo_large_panel_card_summary","text":dstring});


        $(dcardbadges).append(dstringdiv);
        $(dcard).append(dcardtitle);
        $(dcard).append(dcardbadges);
        

        $(dpcontainer).append(dcard);
    }

    */

    $(dpcontainer).append(dptitle);
    $(dpcontainer).append(dptable);
    $("#main_container").append(dpcontainer);
}

function ufo_report_panel(offset) {
    $(".map_zoom_in,.map_zoom_out,.map_data_selector").hide();
    var dptitle = $("<div />",{"class":"ufo_large_panel_report_title"});
    $(dptitle).append("Daily reports");
    var dpcontainer = $("<div />",{"class":"ufo_large_panel"});

    var tour_data = new ufo_report({"offset":offset});
    console.log(tour_data)

    $(dpcontainer).append(dptitle);

    var date_report = $("<div />",{"class":"ufo_large_panel_report_date"});
    var report_time = date_normal({"unixtime":(time-(offset*86400)),"absolute":true,"shortmonth":false,"dayonly":true,"year":true});
    var date_left = $("<div />",{"class":"ufo_large_panel_report_date_left"});
    var date_right = $("<div />",{"class":"ufo_large_panel_report_date_right"});
    $(date_left).append(ufo_icons["chevron"]);
    if(offset==0) {
        $(date_right).append(ufo_icons["chevron_grey"]);
    }
    else {
        $(date_right).append(ufo_icons["chevron"]);
        $(date_right).on("click",function() { ufo_report_panel(offset-1)});
    }
    $(date_left).on("click",function() { ufo_report_panel(offset+1)});
    $(date_report).append(report_time);
    $(date_report).append(date_left);
    $(date_report).append(date_right);
    $(dpcontainer).append(date_report);

    var dptitle_sub = $("<div />",{"class":"ufo_large_panel_subtitle","text":"Tours overall"});
    $(dptitle_sub).css({"margin-top":"150px"});
    $(dpcontainer).append(dptitle_sub);

    ufo_report_panel_add(tour_data,dpcontainer);

    var dptitle_sub = $("<div />",{"class":"ufo_large_panel_subtitle","text":"Individual tour report"});
    $(dptitle_sub).css({"margin-top":"30px","margin-bottom":"30px"});
    $(dpcontainer).append(dptitle_sub);

    for(var i=0;i<tour_data["tours"].length;i++) {
        var t = tour_data["tours"][i];
        var s = {};
        s["driver"] = t["driver"];
        s["tour_actual"] = t["actual"];
        s["tour_distance"] = t["distance"];
        s["tour_planned"] = t["planned"];
        s["stop_count"] = t["stops"];
        s["delay_count"] = t["delayed"];
        s["tour_count"] = 1;
        s["delay_reason"] = {};
        s["not_delivered_count"] = 0;
        s["end"] = t["end"];
        s["start"] = t["start"];
        for(var j=0;j<=6;j++) {
            s["delay_reason"][j] = 0;
        }
        for(var j=0;j<t["incompletes"].length;j++) {
            s["delay_reason"][t["incompletes"][j]] += 1;
            s["not_delivered_count"] += 1;
        }
        ufo_report_panel_add(s,dpcontainer,i+1);
    }

    $("#main_container").append(dpcontainer);
}

function ufo_report_panel_add(tour_data,dpcontainer,tour_id) {

    var dp_toursummary = $("<div />",{"class":"ufo_large_panel_big_card"});
    var dp_topsummary = $("<div />",{"class":"ufo_large_panel_big_card_summary_container","css":{"left":"240px"}});

    if(tour_data["driver"]==undefined) {
        var dp_summary_title = $("<div />",{"class":"ufo_large_panel_big_card_title","text":"Tours: "+tour_data.tour_count});
        var dp_summary_b_line_left = $("<div />",{"class":"ufo_large_panel_big_card_left","text":"Averages per tour: "});
    }
    else {
        var dp_summary_b_line_left = $("<div />",{"class":"ufo_large_panel_big_card_left","text":"Tour summary: "});
        var dp_summary_title = $("<div />",{"class":"ufo_large_panel_big_card_title"});
        var driver_circle = $("<div />",{"class":"ufo_large_panel_big_card_circle"});
        var driver_top = $("<div />",{"class":"ufo_large_panel_big_card_name"});
        var driver_bottom = $("<div />",{"class":"ufo_large_panel_big_card_name_summary"});
        var start_date = "Tour " + tour_id + " | " + tour_data["start"].getHours() + ":" + ("0"+tour_data["start"].getMinutes()).substr(-2) + " - " + tour_data["end"].getHours() + ":" + ("0"+tour_data["end"].getMinutes()).substr(-2);
        $(driver_bottom).append(start_date);
        var driver = ufo_driver_defs[tour_data["driver"]];
        $(driver_top).text(driver["firstname"]+" "+driver["lastname"]);
        $(driver_circle).text(driver["firstname"].substr(0,1)+driver["lastname"].substr(0,1))
        $(dp_summary_title).append(driver_circle);
        $(dp_summary_title).append(driver_top);
        $(dp_summary_title).append(driver_bottom);
        $(dp_topsummary).css({"left":"340px"})
    }
    var dp_summary_a_line_left = $("<div />",{"class":"ufo_large_panel_big_card_left","text":"Planned totals: "});
    $(dp_summary_a_line_left).css({"top":"30px"});
    $(dp_summary_b_line_left).css({"top":"56px"});

    var all_tour_cost = parseInt((tour_data.tour_distance * dcpkm) + ((tour_data.tour_actual/60.0)*dcphr)*100.0)/100;


    // Planned totals summary
    var dp_summary_a_line_right = $("<div />",{"class":"ufo_large_panel_big_card_right"});
    $(dp_summary_a_line_right).css({"top":"30px"});
    var cost_span = $("<span />",{"text":"$"+all_tour_cost});
    var dist_span = $("<span />",{"text":parseInt(tour_data.tour_distance)+" KM"});
    var time_span = $("<span />");
    var time_delta = tour_data["tour_actual"] - tour_data["tour_planned"];
    $(time_span).append(time_string(tour_data["tour_actual"]));
    if(time_delta>0) {
        var time_delta_span = $("<span />",{"css":{"color":"var(--heremidgrey)","display":"inline","font-weight":"100"},"text":" ("+time_string(Math.abs(time_delta))+" more than planned)"})
    }
    else {
        var time_delta_span = $("<span />",{"css":{"color":"var(--heremidgrey)","display":"inline","font-weight":"100"},"text":" ("+time_string(Math.abs(time_delta))+" less than planned)"})
    }
    $(time_span).append(time_delta_span);

    $(dp_summary_a_line_right).append(cost_span);
    $(dp_summary_a_line_right).append(dist_span);
    $(dp_summary_a_line_right).append(time_span);

    // Tour summary
    var dp_summary_b_line_right = $("<div />",{"class":"ufo_large_panel_big_card_right"});
    $(dp_summary_b_line_right).css({"top":"56px"});
    var orders_span = $("<span />");
    $(orders_span).append(ufo_icons["icon_orders"]);
    $(orders_span).append("Orders: " + Math.floor(tour_data["stop_count"]/tour_data["tour_count"]));
    var stops_span = $("<span />");
    $(stops_span).append(ufo_icons["icon_stops"]);
    $(stops_span).append("Stops: " + (2+Math.floor(tour_data["stop_count"]/tour_data["tour_count"])));
    var tasks_span = $("<span />");
    $(tasks_span).append(ufo_icons["icon_tasks"]);
    $(tasks_span).append("Tasks: " + Math.floor(tour_data["stop_count"]/tour_data["tour_count"]));

    $(dp_summary_b_line_right).append(orders_span);
    $(dp_summary_b_line_right).append(stops_span);
    $(dp_summary_b_line_right).append(tasks_span);


    $(dp_toursummary).append(dp_summary_title);
    $(dp_topsummary).append(dp_summary_a_line_left);
    $(dp_topsummary).append(dp_summary_a_line_right);
    $(dp_topsummary).append(dp_summary_b_line_left);
    $(dp_topsummary).append(dp_summary_b_line_right);
    $(dp_toursummary).append(dp_topsummary);
    var graphs = $("<div />",{"class":"ufo_large_panel_big_card_column_container"});

    var col_a = $("<div />",{"class":"ufo_large_panel_big_card_column"});
    //$(col_a).css({"margin-left":"-60px"});
    $(col_a).append($("<div />",{"class":"ufo_large_panel_big_card_column_title","text":"ORDER VOLUME"}));
    $(col_a).append($("<div />",{"class":"ufo_large_panel_big_card_column_bigdata","text":"Tasks: "+tour_data.stop_count}))
    var a_graph = $("<div />",{"class":"ufo_large_panel_big_card_graph"});
    $(a_graph).css({"background-color":"var(--heregraphblue)"});

    $(col_a).append(a_graph);

    var a_line_a = $("<div />",{"class":"ufo_large_panel_big_card_line"});
    var a_line_a_a = $("<div />",{"text":"Pickups","css":{"color":"var(--heregraphpurple","width":"50%","justify-content":"left","flex":"1 0 50%"}});
    var a_line_a_b = $("<div />",{"text":"0","css":{"flex":"0 1 20%","font-weight":"bold"}});
    var a_line_a_c = $("<div />",{"text":"(0.0%)","css":{"flex":"0 1 25%"}});
    $(a_line_a).append(a_line_a_a);
    $(a_line_a).append(a_line_a_b);
    $(a_line_a).append(a_line_a_c);
    $(col_a).append(a_line_a);

    var a_line_b = $("<div />",{"class":"ufo_large_panel_big_card_line"});
    var a_line_b_a = $("<div />",{"text":"Deliveries","css":{"color":"var(--heregraphblue","width":"50%","justify-content":"left","flex":"1 0 50%"}});
    var a_line_b_b = $("<div />",{"text":tour_data.stop_count,"css":{"flex":"0 1 20%","font-weight":"bold"}});
    var a_line_b_c = $("<div />",{"text":"(100.0%)","css":{"flex":"0 1 25%"}});
    $(a_line_b).append(a_line_b_a);
    $(a_line_b).append(a_line_b_b);
    $(a_line_b).append(a_line_b_c);
    $(col_a).append(a_line_b);

    // B COLUMN
    
    var col_b = $("<div />",{"class":"ufo_large_panel_big_card_column"});
    $(col_b).append($("<div />",{"class":"ufo_large_panel_big_card_column_title","text":"ON-TIME VS DELAYED"}));
    var on_time = (tour_data.stop_count-tour_data.not_delivered_count)-tour_data.delay_count;
    var on_time_perc = parseInt((parseFloat(on_time)/parseFloat((tour_data.stop_count-tour_data.not_delivered_count)))*10000)/100.0;
    var delay_perc = parseInt((parseFloat(tour_data.delay_count)/parseFloat((tour_data.stop_count-tour_data.not_delivered_count)))*10000)/100.0;
    $(col_b).append($("<div />",{"class":"ufo_large_panel_big_card_column_bigdata","text":on_time_perc+"%"}))
    var b_graph = $("<div />",{"class":"ufo_large_panel_big_card_graph"});
    var b_graph_sub = $("<div />");
    $(b_graph_sub).css({"width":on_time_perc+"%","background-color":"var(--heregraphgreen)"})
    $(b_graph).append(b_graph_sub);
    $(col_b).append(b_graph);

    var b_line_a = $("<div />",{"class":"ufo_large_panel_big_card_line"});
    var b_line_a_a = $("<div />",{"text":"On time","css":{"color":"var(--heregraphgreen","width":"50%","text-align":"left","flex":"1 0 50%","justify-content":"left"}});
    var b_line_a_b = $("<div />",{"text":on_time,"css":{"flex":"0 1 20%","font-weight":"bold"}});
    var b_line_a_c = $("<div />",{"text":"("+on_time_perc+"%)","css":{"flex":"0 1 25%"}});
    $(b_line_a).append(b_line_a_a);
    $(b_line_a).append(b_line_a_b);
    $(b_line_a).append(b_line_a_c);
    $(col_b).append(b_line_a);

    var b_line_b = $("<div />",{"class":"ufo_large_panel_big_card_line"});
    var b_line_b_a = $("<div />",{"text":"Delayed","css":{"color":"var(--heregraphred","width":"50%","text-align":"left","flex":"1 0 50%","justify-content":"left"}});
    var b_line_b_b = $("<div />",{"text":tour_data.delay_count,"css":{"flex":"0 1 20%","font-weight":"bold"}});
    var b_line_b_c = $("<div />",{"text":"("+delay_perc+"%)","css":{"flex":"0 1 25%"}});
    $(b_line_b).append(b_line_b_a);
    $(b_line_b).append(b_line_b_b);
    $(b_line_b).append(b_line_b_c);
    $(col_b).append(b_line_b);

    // C COLUMN

    var col_c = $("<div />",{"class":"ufo_large_panel_big_card_column"});
    $(col_c).append($("<div />",{"class":"ufo_large_panel_big_card_column_title","text":"SUCCESSFUL DELIVERIES"}));
    var delivered = (tour_data.stop_count)-tour_data.not_delivered_count;
    var delivered_perc = parseInt((parseFloat(delivered)/parseFloat((tour_data.stop_count)))*10000)/100.0;
    var not_delivered_perc = parseInt((parseFloat(tour_data.not_delivered_count)/parseFloat((tour_data.stop_count)))*10000)/100.0;
    $(col_c).append($("<div />",{"class":"ufo_large_panel_big_card_column_bigdata","text":delivered_perc+"%"}))
    var c_graph = $("<div />",{"class":"ufo_large_panel_big_card_graph"});
    var c_graph_sub = $("<div />");
    $(c_graph_sub).css({"width":delivered_perc+"%","background-color":"var(--heregraphblue)"})
    $(c_graph).append(c_graph_sub);
    $(col_c).append(c_graph);

    var c_line_a = $("<div />",{"class":"ufo_large_panel_big_card_line"});
    var c_line_a_a = $("<div />",{"text":"To recipient","css":{"flex":"1 0 50%","color":"var(--heregraphblue","justify-content":"left"}});
    var c_line_a_b = $("<div />",{"text":delivered,"css":{"flex":"0 1 20%"}});
    $(c_line_a_b).css({"font-weight":"bold"});
    var c_line_a_c = $("<div />",{"text":"("+delivered_perc+"%)","css":{"flex":"0 1 25%"}});
    $(c_line_a).append(c_line_a_a);
    $(c_line_a).append(c_line_a_b);
    $(c_line_a).append(c_line_a_c);
    $(col_c).append(c_line_a);

    var c_line_b = $("<div />",{"class":"ufo_large_panel_big_card_line"});
    var c_line_b_a = $("<div />",{"text":"To other person","css":{"flex":"1 0 50%","color":"var(--heregraphred","justify-content":"left"}});
    var c_line_b_b = $("<div />",{"text":"0","css":{"flex":"0 1 20%"}});
    $(c_line_b_b).css({"font-weight":"bold"});
    var c_line_b_c = $("<div />",{"text":"(0%)","css":{"flex":"0 1 25%"}});
    $(c_line_b).append(c_line_b_a);
    $(c_line_b).append(c_line_b_b);
    $(c_line_b).append(c_line_b_c);
    $(col_c).append(c_line_b);

    // D COLUMN

    var col_d = $("<div />",{"class":"ufo_large_panel_big_card_column"});
    var not_delivered = $("<div />",{"class":"ufo_large_panel_big_card_right_column"});
    $(not_delivered).append($("<div />",{"id":"big_card_title","text":"NOT DELIVERED"}));
    var not_delivered_title = $("<div />",{"class":"ufo_large_panel_big_card_column_bigdata","html":tour_data.not_delivered_count+" <span style='font-weight:normal'>("+not_delivered_perc+"%)</span>"});
    $(not_delivered_title).css({"margin-left":"10px","margin-top":"30px"});
    $(not_delivered).append(not_delivered_title);

    var delay_reasons = ["Customer not at address","Refused by customer","Customer not in","Couldn't find the place","Ran out of time","Outside business hours"];

    for(var i=0;i<6;i++) {
        var d_line_a = $("<div />",{"class":"ufo_large_panel_big_card_line","css":{"margin-left":"15px"}});
        $(d_line_a).append($("<div />",{"text":delay_reasons[i],"css":{"flex":"1 0 50%","justify-content":"left","color":"var(--heremidgrey)"}}));
        $(d_line_a).append($("<div />",{"text":tour_data.delay_reason[i],"css":{"flex":"0 1 20%","color":"black","font-weight":"bold"}}));
        if(tour_data.delay_reason[i]!=0) {
            $(d_line_a).append($("<div />",{"text":"("+(parseInt((tour_data.delay_reason[i]/tour_data.not_delivered_count)*10000))/100.0+"%)","css":{"flex":"0 1 25%","color":"black"}}));

        }
        else {
            $(d_line_a).append($("<div />",{"text":"(0%)","css":{"flex":"0 1 25%","color":"black"}}));

        }
        $(not_delivered).append(d_line_a);
    }



    /*var d_line_b = $("<div />",{"class":"ufo_large_panel_big_card_right_line"});
    $(d_line_b).append($("<div />",{"text":"Refused by customer","css":{"flex":"1 0 10em"}}));
    $(d_line_b).append($("<div />",{"text":"4","css":{"flex":"1 0 3em","color":"black","font-weight":"bold"}}));
    $(d_line_b).append($("<div />",{"text":"(66.67%)","css":{"flex":"1 0 2em","color":"black"}}));
    $(not_delivered).append(d_line_b);
    */


    $(col_d).append(not_delivered);


    $(graphs).append(col_a);
    $(graphs).append(col_b);
    $(graphs).append(col_c);
    $(graphs).append(col_d);

    $(dp_toursummary).append(graphs);
    $(dpcontainer).append(dp_toursummary);
}

function smooth_interlink(a,b,u,v) {
    /*
     *  Given points A and B, assuming a directionality that A ends line A and B begins line B
        Returns an attempt to interpolate a smooth path between the two. 

        var lp = p1[p1.length-1];       A
        var up = p1[p1.length-2];       U
        var np = p2[0];                 B
        var vp = p2[1];                 V
        var ips = smooth_interlink(lp,np,up,vp);
     */
    var ax = a[1];
    var bx = b[1];
    var ay = a[0];
    var by = b[0];
    var dx = bx-ax;
    var dy = by-ay;
    var ux = u[1];
    var uy = u[0];
    var vx = v[1];
    var vy = v[0];
    var nxslope;
    var sclass = "C";
    var type = "noninvert"
    if(bx==vx) { nxslope = 0; }
    else {
        nxslope = (vy-by)/(vx-bx);
    }



    var ys = [];
    var xs = [];

    for(var i=1;i<20;i++) {
        xs.push(Math.cos(Math.PI*(i/40)))
        ys.push(1.0-Math.sin(Math.PI*(i/40)))
    }
    var interpoints = [];
    for(i=0;i<xs.length;i++) {
        
        if(ux<ax) {
            if(by<ay) {
                if(uy>ay) {
                    if(ax>bx) {
                        // case 1: A is to the right of U; B is above A (normal case)
                        interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                        type = "noninvert";
                        sclass = "C_1";
                    }
                    else {
                        // case 1: A is to the right of U; B is above A (normal case)
                        // AX:BX AY:BY UY:AY UX:AX 
                        if(by>vy) {
                            interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                            type = "invert";
                            sclass = "C_14";
                        }
                        else {
                            interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                            type = "noninvert";
                            sclass = "C_25";
                        }
                        
                    }
                    
                }
                else {
                    // case 8: A is to the right of U; B is above A (normal case)
                    interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                    type = "invert";
                    sclass = "C_8";
                }
                
            }
            else {
                if(vy>by) {
                    if(ax>bx) {
                        // case 2: A is to the right of U; B is below A (so Y values should be inverted)
                        interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                        type = "noninvert";
                        sclass = "C_2";
                    }
                    else {
                        if(uy>ay) {
                            // case 6: A is to the right of U; B is below A (so Y values should be inverted)
                            // UY:AY AX:BX BY:AY VY:BY 
                            if(vx>bx) {
                                if(ux>bx) {
                                    interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                                    type = "noninvert";
                                    sclass = "C_6";
                                }
                                else {
                                    interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                                    type = "invert";
                                    sclass = "C_22";
                                }
                            }
                            else {
                                interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                                type = "invert";
                                sclass = "C_20";
                            }
                        }
                        else {
                            // case 6: A is to the right of U; B is below A (so Y values should be inverted)
                            // AX:BX AY:BY VY:BY UX:AX UY:AY
                            if(vx>bx) {
                                interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                                type = "noninvert";
                                sclass = "C_16";
                            }
                            else {
                                interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                                type = "invert";
                                sclass = "C_19";
                            }
                        }
                        
                    }
                }
                else {
                    // case 5: A is to the right of U; B is below A (so Y values should be inverted)
                    interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                    type = "noninvert";
                    sclass = "C_5";
                }
                
            }
        }
        else {
            if(by>ay) {
                if(bx>vx) {
                    if(ax>bx) {
                        // case 3: A is to the LEFT of U; B is above A (so X values should be inverted)
                        // AX:BX AY:BY  BX:VX   UX:AX
                        if(uy>by) {
                            interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                            type = "invert";
                            sclass = "C_3";
                        }
                        else {
                            // AX:BX AY:BY UY:BY BX:VX   UX:AX
                            if(vy>by) {
                                if(uy>ay) {
                                    interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                                    type = "invert";
                                    sclass = "C_21";
                                }
                                else {
                                    interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                                    type = "noninvert";
                                    sclass = "C_24";
                                }
                                
                            }
                            else {
                                interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                                type = "noninvert";
                                sclass = "C_23";
                            }
                            
                        }
                        
                    }
                    else {
                        interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                        type = "invert";
                        sclass = "C_18";
                    }
                }
                else {
                    if(ax>bx) {
                        // case 3: A is to the LEFT of U; B is above A (so X values should be inverted)
                        interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                        type = "invert";
                        sclass = "C_12";
                    }
                    else {
                        // case 3: A is to the LEFT of U; B is above A (so X values should be inverted)
                        interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                        type = "noninvert";
                        sclass = "C_13";
                    }
                }
                
            }
            else {
                if(bx>vx) {
                    if(ax>bx) {
                        // case 4: A is to the LEFT of U; B is below A (so X AND Y values should be inverted)
                        // AX:BX AY:BY BX:VX
                        if(vy > by) {
                            interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                            type = "noninvert";
                            sclass = "C_4";
                        }
                        else {
                            // AX:BX AY:BY BX:VX BY:VY
                            if(vy > ay) {
                                interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                                type = "invert";
                                sclass = "C_15";
                            }
                            else {
                                // AX:BX AY:BY BX:VX BY:VY VY:AY
                                // AY:UY BY:UY AX:UX BX:UX AX:VX
                                // AY AX BX
                                if(ux>ax) {
                                    if(ay>uy) {
                                        interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                                        type = "invert";
                                        sclass = "C_17";
                                    }
                                    else {
                                        if(by>vy) {
                                            interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                                            type = "invert";
                                            sclass = "C_27";
                                        }
                                        else {
                                            interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                                            type = "noninvert";
                                            sclass = "C_28";
                                        }
                                    }
                                    
                                }
                                else {
                                    interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                                    type = "noninvert";
                                    sclass = "C_26";
                                }
                                
                            }
                            
                        }
                    }
                    else {
                        // case 4: A is to the LEFT of U; B is below A (so X AND Y values should be inverted)
                        interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                        type = "invert";
                        sclass = "C_9";
                    }
                }
                else {
                    if(ax>bx) {
                        // case 4: A is to the LEFT of U; B is below A (so X AND Y values should be inverted)
                        interpoints.push([ay+(dy*ys[xs.length-1-i]),ax+(dx*xs[xs.length-1-i])]);
                        type = "invert";
                        sclass = "C_7";
                    }
                    else {
                        // case 4: A is to the LEFT of U; B is below A (so X AND Y values should be inverted)
                        interpoints.push([by-(dy*ys[i]),bx-(dx*xs[i])]);
                        type = "noninvert";
                        sclass = "C_10";
                    }
                }
            }
        }
    }

    /*for(var i=1;i<20;i++) {
        if(Math.abs(nxslope)>1.0) {
            xs.push(Math.cos(Math.PI*(i/40)))
            ys.push(1.0-Math.sin(Math.PI*(i/40)))
        }
        else {
            xs.push(1.0-Math.cos(Math.PI*(i/40)))
            ys.push(Math.sin(Math.PI*(i/40)))
        }
    }

    var interpoints = [];

    for(i=0;i<xs.length;i++) {
        if(Math.abs(nxslope)>1.0) {
            interpoints.push([ay+(dy*ys[xs.length-i]),ax+(dx*xs[xs.length-i])]);
        }
        else {
            interpoints.push([ay+(dy*ys[i]),ax+(dx*xs[i])]);
        }
        
    }*/
    //console.log(sclass);
    /*
    var ax_bx = false;
    var ax_ux = false;
    var ax_vx = false;
    var ay_by = false;
    var ay_uy = false;
    var ay_vy = false;
    var bx_ux = false;
    var bx_vx = false;
    var by_uy = false;
    var by_vy = false;
    var ux_vx = false;
    var uy_vy = false;

    if(ax>bx) { ax_bx = true; }
    if(ax>ux) { ax_ux = true; }
    if(ax>vx) { ax_vx = true; }
    if(ay>by) { ay_by = true; }
    if(ay>uy) { ay_uy = true; }
    if(ay>vy) { ay_by = true; }
    if(bx>ux) { bx_ux = true; }
    if(bx>vx) { bx_vx = true; }
    if(by>uy) { by_uy = true; }
    if(by>vy) { by_vy = true; }
    if(ux>vx) { ux_vx = true; }
    if(uy>vy) { uy_vy = true; }

    ufo_smooths[sclass] = [type,ax_bx,ax_ux,ax_vx,ay_by,ay_uy,ay_vy,bx_ux,bx_vx,by_uy,by_vy,ux_vx,uy_vy];*/
    return [interpoints,sclass];
    //return interpoints;
}

/*
    END DRAW FUNCTIONS
*/

/*
    BEGIN CALCULATION FUNCTIONS
    These are used for routing calculations or generation and should not make changes to the UI.
    They may also not reuglarly be called (for example they may be called only under debug circumstances)
*/



function ufo_cluster_stops() {
    /*
     * 
     Based on map_zlevel, returns a set of clusters that should be shown instead of the 
     * 
     */
    return;
    $(".cluster_container").remove();
    if(map_zlevel>12) { return; }
    var zlevel_cluster = []; // This will be the list of cluster ids.
    var cids = Object.keys(stopclusters.root);
    if(map_zlevel==12) { 
        
        var zlevel_cluster = [];
        for(var i=0;i<cids.length;i++) {
            zlevel_cluster.push([cids[i]]);
        }
    }
    else {
        var used_clusters = [];
        zlevel_cluster = stopclusters[map_zlevel];
        for(var i=0;i<zlevel_cluster.length;i++) {
            used_clusters = used_clusters.concat(zlevel_cluster[i]);
        }
        for(var i=0;i<cids.length;i++) {
            if(in_array(cids[i],used_clusters)==false) {
                zlevel_cluster.push([cids[i]]);
            }
        }
    }
    
    for(var c=0;c<zlevel_cluster.length;c++) {
        cluster_assembly = zlevel_cluster[c];
        var cluster_lat = 0.0;
        var cluster_lon = 0.0;
        var cluster_cnt = 0;
        var affected_stops = [];
        for(var i=0;i<cluster_assembly.length;i++) {
            var sc = stopclusters.root[cluster_assembly[i]];
            
            if(sc.stops.length>1) { 
                for(var j=0;j<sc.stops.length;j++) {
                    if(fleet_solutions_dispatched==false || ufo_stops[sc.stops[j]].active==true) {
                        cluster_lat += ufo_stops[sc.stops[j]].lat;
                        cluster_lon += ufo_stops[sc.stops[j]].lon;
                        affected_stops.push(sc.stops[j]);
                        cluster_cnt+=1;
                    }
                    
                }
            }
            else {
                if(fleet_solutions_dispatched==false || ufo_stops[sc.stops[0]].active==true) {
                    cluster_lat+=ufo_stops[sc.stops[0]].lat;
                    cluster_lon+=ufo_stops[sc.stops[0]].lon;
                    affected_stops.push(sc.stops[0]);
                    cluster_cnt+=1;
                }
                
            }
        }
        cluster_lat = cluster_lat / cluster_cnt;
        cluster_lon = cluster_lon / cluster_cnt;
        if(cluster_cnt==1) {
            if(fleet_solutions_dispatched==false) {
                                    // We only deactivate this if fleet solutions dispatched is false
                    // Because if it's true, then this stop is part of an active, selected route
                ufo_stops[affected_stops[0]].active=false;
            }
            
            ufo_stops[affected_stops[0]].cluster=false;
        }
        else {
            for(var i=0;i<cluster_cnt;i++) {
                ufo_stops[affected_stops[i]].cluster=true;
                if(fleet_solutions_dispatched==false) {
                    // We only deactivate this if fleet solutions dispatched is false
                    // Because if it's true, then this stop is part of an active, selected route
                    ufo_stops[affected_stops[i]].active=false;
                }
            }
            var cl = new ufo_stop_cluster({lat:cluster_lat,lon:cluster_lon,count:cluster_cnt,id:affected_stops[0],affected_stops:affected_stops});
        }
        
    }
}

function ufo_match_ideal(a, b) {
    /*
    Sequentially compares two paths and returns "true" if they are identical
    */
    if (a.length != b.length) {
        return false;
    }
    else {
        for (var i = 0; i < a.length; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
    }
    return true;
}

function ufo_random_path(params) {
    /*
        Given a start node, assembles a path sequence by random walk
        Terminates when there are no valid paths left, or after a path limit length is reached
        Returns an array of map paths
    */
    var start_node = params.start_node;
    var path_limit = params.path_limit;
    var blocked_nodes = params.blocks;
    if (path_limit == undefined) { path_limit = 10; }

    var walked_nodes = [start_node];
    if(blocked_nodes!=undefined) {
        for(var i=0;i<blocked_nodes.length;i++) {
            walked_nodes.push(blocked_nodes[i]);
        }
    }
    var next_valid_nodes = [];
    var path_finished = false;
    var current_node = start_node;
    var next_node_idx = 0;
    var path_list = [];
    var iters = 0;

    while (path_finished == false) {
        next_valid_nodes = ufo_stops[current_node].valid_adjacencies(walked_nodes);
        if (next_valid_nodes == false) {
            // Case: there are no valid nodes that the current node connects to
            path_finished = true;
        }
        else {
            next_node_idx = next_valid_nodes[parseInt(Math.random() * next_valid_nodes.length)];
            path_list.push(ufo_stops[current_node].adjacencies[next_node_idx]);
            walked_nodes.push(next_node_idx);
            current_node = next_node_idx;
        }
        iters++;
        if (iters > path_limit) {
            path_finished = true;
        }

    }
    return path_list;
}

function ufo_router(params) {
    var start = params.start;
    var finish = params.finish;
    var debug = params.debug;
    var ignore_stops = params.ignore;
    if(ignore_stops==undefined) { ignore_stops = false; }
    console.log("running route_calc (start,finish,tracker):", start, finish)
    var map_d_nodes = lastmile_nodes;
    var start_node = start;
    var next_node = start_node;
    var end_node = finish;
    var links = [];
    var adjacencies = [];
    var unchecked_nodes = Object.keys(map_d_nodes);
    var checked_nodes = [];
    var internode_distance = 0.0;
    var total_distance = 0.0;
    var shortest_distance = 10000.0;
    var delay_time = 0.0;
    var delay_init = 0.0;
    var invalid_nodes = new Set(); // The router should stop if it would have to pass by an existing stop
    var snodeids = Object.keys(stopnodes);
    for (var i = 0; i < snodeids.length; i++) {
        var onestopadjacencies = adjmap_n[snodeids[i]];
        if (snodeids[i] != start && snodeids[i] != finish && ignore_stops!=true) {
            for (let o of onestopadjacencies) {
                invalid_nodes.add(o);
            }
        }
    }
    if (debug == true) { console.log(invalid_nodes); }
    for (var i in unchecked_nodes) {
        if (unchecked_nodes[i] == start_node) {
            adjacencies[unchecked_nodes[i]] = { "distance": 0.0, "via": start_node };
        }
        else {
            adjacencies[unchecked_nodes[i]] = { "distance": 20000.0, "via": "" };
        }
    }
    var match = false;
    while (unchecked_nodes.length > 1) {
        links = adjmap_n[next_node];
        for (let l of links) {
            //internode_distance = links[l][1];
            if (invalid_nodes.has(l) == false) {
                if (debug == true) { console.log(l + "-" + next_node + ": " + lastmile_distances[l + "-" + next_node]); }
                internode_distance = lastmile_distances[l + "-" + next_node];
                total_distance = adjacencies[next_node].distance + internode_distance;
                if (total_distance < adjacencies[l].distance) {
                    adjacencies[l].distance = total_distance;
                    adjacencies[l].via = next_node;
                }
                matched = false;
                for (var c in checked_nodes) {
                    if (checked_nodes[c][0] == l) {
                        if (checked_nodes[c][1] > total_distance) {
                            checked_nodes[c][1] = total_distance;
                        }
                        matched = true;
                    }
                }
                if (matched == false) {
                    checked_nodes.push([l, total_distance])
                }
            }
            else {
                checked_nodes.push([l, 20000]);
            }
        }
        checked_nodes.sort(function (a, b) { return parseFloat(a[1], 10) - parseFloat(b[1], 10); });
        if (next_node == end_node) {
            unchecked_nodes = [];
        }
        else {
            for (var i in unchecked_nodes) {
                if (unchecked_nodes[i] == next_node) {
                    unchecked_nodes.splice(i, 1);
                }
            }
            for (var i = 0; i < checked_nodes.length; i++) {
                //console.log("checking node:"+checked_nodes[i]);
                if (in_array(checked_nodes[i][0], unchecked_nodes) == true) {
                    next_node = checked_nodes[i][0];
                    break;
                }
            }
        }
        if (debug == true) {
            console.log(unchecked_nodes);
            console.log(checked_nodes);
        }

    }
    var at_start = false;
    var solution = [end_node];
    var next_node = end_node;
    while (at_start == false) {
        try {
            next_node = adjacencies[next_node].via;
            solution.unshift(next_node);
            if (next_node == start_node) {
                at_start = true;
            }
            if(solution.length>16 && ignore_stops==false) {
                at_start = true;
                solution = false;
            }
        }
        catch (e) {
            at_start = true;
            solution = false;
        }
        //console.log(next_node);

    }
    //console.log(solution);
    //console.log(adjacencies);
    if (solution == false) { console.log("No link found between " + start + " and " + finish); }
    if (solution.length > 16 && ignore_stops==false) { solution = false; }
    return solution;
}

function active_orders() {
    /*
     * Returns the number of orders that are currently selected on the map or in the dropdown
     * 
     */
    var active = 0;
    for (var i = 0; i < ufo_stops.length; i++) {
        if (ufo_stops[i].active == true && ufo_stops[i].availablefrom < time) {
            if(order_panel.showmode=="all") {
                active++;
            }
            else {
                if(order_panel.showmode=="delayed" && ufo_stops[i].status==3) { active++; }
                else if(order_panel.showmode=="assigned" && (ufo_stops[i].status==1 || ufo_stops[i].status==2)) { active++;}
                else if(order_panel.showmode=="unassigned" && ufo_stops[i].status==0) { active++; }
            }
        }
    }
    return active;
}

function valid_orders() {
    var valid = 0;
    for(var i=0;i<ufo_stops.length;i++) {
        if(ufo_stops[i].status!=-1 && ufo_stops[i].availablefrom < time) {
            if(order_panel.showmode=="all") {
                valid++;
            }
            else {
                if(order_panel.showmode=="delayed" && ufo_stops[i].status==3) { valid++; }
                else if(order_panel.showmode=="assigned" && (ufo_stops[i].status==1 || ufo_stops[i].status==2)) { valid++;}
                else if(order_panel.showmode=="unassigned" && ufo_stops[i].status==0) { valid++; }
            }
        }
    }
    return valid;
}

function get_random(offset,digits) {
    var offset = parseInt(offset);
    var digits = parseInt(digits);
    var ufo_rand = "";
    if(offset+digits < ufo_pi.length) {
        ufo_rand = ufo_pi.substr(offset,digits);
    }
    else {
        var modulo = digits-((offset+digits)-ufo_pi.length);
        // 998 + 7 = 1005
        // 7 - (1005-1000) = 2
        // 1000

        var first_part = ufo_pi.substr(offset,modulo);
        var second_part = ufo_pi.substr(0,digits-modulo);
        ufo_rand = first_part + "" + second_part;
    }
    return ufo_rand;
}

/*
    END CALCULATION FUNCTIONS
*/

/*
    BEGIN ROUTING AND ASSIGNMENT FUNCTIONS
    These are used for creating and modifying routes, updating routes, etc.
*/

function ufo_assign_drivers() {
    for(var i=0;i<ufo_tours.length;i++) {
        if(ufo_tours[i].stops.length>0) {
            ufo_tours[i].active = true;
            ufo_tours[i].status = 2;
            if(ufo_tours[i].driver=="") {
                // There is currently no driver assigned. So, we need to assign one.
                var driver_assigned_successfully = false;
                for(var j=0;j<Object.keys(ufo_driver_defs).length;j++) {
                    if(ufo_driver_defs[j].available==true && ufo_driver_defs[j].shift_time==0 && driver_assigned_successfully==false) {
                        // Check to see if they have a certification NOT needed by the tour (so they should be reserved)
                        if(ufo_tours[i].refrigerated==true && in_array("Refrigeration",ufo_driver_defs[j].certification)) {
                            ufo_tours[i].driver = ufo_driver_defs[j].name;
                            ufo_driver_defs[j].available = false;
                            ufo_driver_defs[j].provisional_tour = ufo_tours[i].uid;
                            driver_assigned_successfully = true;
                        }
                        else {
                            if(ufo_tours[i].refrigerated==false && in_array("Refrigeration",ufo_driver_defs[j].certification)==false) {
                                ufo_tours[i].driver = ufo_driver_defs[j].name;
                                ufo_driver_defs[j].available = false;
                                ufo_driver_defs[j].provisional_tour = ufo_tours[i].uid;
                                driver_assigned_successfully = true;
                            }
                        }
                    }
                }
            }
        }
    }
    assignments_panel.draw();
}

function ufo_dispatch_drivers(params) {
    /*
     * Updates the ufo_driver_defs object.
     If "reset" is true, then it just unsets everything. 
     */
    var reset = params.reset;
    if(reset==undefined) { reset = false; }
    var dpids = Object.keys(ufo_driver_defs);
    for(var i=0;i<dpids.length;i++) {
        ufo_driver_defs[dpids[i]].assigned = -1;
        ufo_driver_defs[dpids[i]].available = true;
        ufo_driver_defs[dpids[i]].provisional_tour = -1;
    }
    if(reset==false) {
        for(var i=0;i<dpids.length;i++) {
            for(var j=0;j<ufo_tours.length;j++) {
                if(ufo_tours[j].driver==ufo_driver_defs[dpids[i]].name) {
                    ufo_driver_defs[dpids[i]].assigned = ufo_tours[j].uid;
                    ufo_driver_defs[dpids[i]].available = false;
                }
            }
        }
    }
}

function ufo_create_tours(params) {
    var fname = "ufo_create_tours";
    var from_timechange = params.from_timechange;
    var with_updates = params.with_updates;
    if(from_timechange==undefined) { from_timechange = false; }
    if(with_updates==undefined) { with_updates = false; }
    var caller = params.caller;
    if (caller != undefined) {
        call_log(fname,caller);
    }
    var active_tours = [];
    canon_paths = [];
    if(from_timechange==false) {
        var d = new Date();
        d.setHours(8);
        d.setMinutes(5);
        time = d.getTime()/1000|0;
    }
    for(var i=0;i<ufo_tours.length;i++) {
        if(from_timechange==true || ufo_opts["optimization"].current==2) { ufo_tours[i].active=true; } // Set so that if this is invoked from the timechange widget, all tours are possible
        if(ufo_tours[i].active==true) {
            active_tours.push(ufo_tours[i]);
        }
    }
    var tours_to_use = active_tours.length;
    if(tours_to_use>8 || ufo_opts["optimization"].current==2) { tours_to_use=8; }
    if(ufo_opts["optimization"].current==0) {
        // This means we've set it to use the least number of drivers
        // So we should use only 5 vehicles, even if more were selected.
        tours_to_use = 5;
        debug(false,"using fewest drivers (5) so tour_count less than selected vehicles");
    }
    for(var i=0;i<active_tours.length;i++) {
        if(i<tours_to_use) {
            if(with_updates==true) {
                // So that if we jump straight into post-drive analysis we'll begin building tours with the added stops added in.
                var uas = ufo_appended_sequences[tours_to_use];
                var use_appended = [];
                for(var u=0;u<uas.length;u++) {
                    if(uas[u][0]==i) {
                        use_appended = uas[u]; // This matches if ufo_appended_sequences has a valid tour for this.
                    }
                }
                if(use_appended.length>0) {
                    active_tours[i].stops = use_appended[1];
                    active_tours[i].has_deviations = true;
                    active_tours[i].complete_time = use_appended[2];
                    active_tours[i].travel_dist = use_appended[3];
                }
                else {
                    active_tours[i].stops = ufo_sequences[tours_to_use][i];
                }
            }
            else {
                active_tours[i].stops = ufo_sequences[tours_to_use][i];
            }
            if(ufo_traffic_forcing[tours_to_use][i]!=undefined) {
                debug(false,"tour included traffic forcing");
                active_tours[i].traffic = ufo_traffic_forcing[tours_to_use][i];
            }
            else {
                active_tours[i].traffic = {};
            }        
            
            if(from_timechange==true) {
                active_tours[i].driver = ufo_driver_defs[i].name;
                active_tours[i].start_time = (ufo_midnight+29100);
            }
            else {
                active_tours[i].status = 1;
                active_tours[i].start_time = time;
            }
        }
        active_tours[i].active = false;
    }
    $("#shade").hide();
    $("#ufo_option_panel").hide();
    if(from_timechange==true) {
        fleet_solutions_calculated = true;
        fleet_solutions_dispatched = true;
        var test = new ufo_solution_anim({num:0,delay:0,count:5,updates:with_updates});
        for(var i=0;i<ufo_tours.length;i++) {
            ufo_tours[i].active = false;
        }
        ufo_dispatch_drivers({reset:false});
        order_panel.selected_count = 0;
        assignments_panel.showmode = "all";
        assignments_panel.dropdowns[0].idx = 1;
    }
    else {
        assignments_panel.showmode = "all";
        assignments_panel.dropdowns[0].idx = 1;
        order_panel.selected_count = 0;
        for(var i=0;i<ufo_stops.length;i++) {
            ufo_stops[i].active = false;
            ufo_stops[i].update_status(false);
        }
        var test = new ufo_solution_anim({num:200,delay:0,count:tours_to_use});
        $("#ufo_time_startdate").text(date_normal({"unixtime":time}));
	    var pdelta = (time-ufo_midnight)/864;
        $("#ufo_current_time").css({left:pdelta+"%"});
        fleet_solutions_calculated = true;
    }
    $("#ufo_icon_newjobs").show();
}

function ufo_update_tours(params) {
    /**
     * Functionally identical to "create tours" except that it only serves to update a single existing tour.
     */
    var fname = "ufo_update_tours";
    var ignore_redraw = params.ignore_redraw;
    if(ignore_redraw==undefined) { ignore_redraw = false; }
    var valid_tours = 0;
    for(var i=0;i<ufo_tours.length;i++) {
        ufo_tours[i].active=false;
        console.log(ufo_tours[i].uid+": "+ufo_tours[i].status);
        if(ufo_tours[i].status==3 || ufo_tours[i].status==4) {
            valid_tours++;
        }
    }
    // We now have the index of the tour we need to modify. ufo_appended_sequences has an update for each of the possible tour vehicle counts
    console.log(valid_tours);
    var update_data = ufo_appended_sequences[valid_tours];
    for(var i=0;i<ufo_later_stops.length;i++) {
        ufo_stops[ufo_later_stops[i]].late = true;
    }
    // update_data is a set of arrays [a,b] where a=the ID of the tour to update and b=the update sequence.
    for(var i=0;i<update_data.length;i++) {
        ufo_tours[update_data[i][0]].stops = update_data[i][1];
        ufo_tours[update_data[i][0]].create();
        ufo_tours[update_data[i][0]].complete_time = update_data[i][2];
        ufo_tours[update_data[i][0]].travel_dist = update_data[i][3];
        ufo_tours[update_data[i][0]].status = 3;
        ufo_tours[update_data[i][0]].active=true;
        if(ufo_phone.visible==true) {
            ufo_phone.tourid = ufo_tours[update_data[i][0]].uid;
            ufo_phone.displaymode = "map";
            ufo_phone.switchmode();
            ufo_phone.toast({text:"New job(s) added.",color:"var(--hereufoblue)",delay:2500});
            ufo_phone.toast({text:"Message from dispatch.",color:"var(--hereufoblue)",delay:1500});
            ufo_phone.toast_do();
        }
    }
    
    
    if(ignore_redraw==false) {
        ufo_activate_stops({caller:fname});
        assignments_panel.showmode = "all";
        assignments_panel.dropdowns[0].idx = 1;
        order_panel.selected_count = 0;
        order_panel.draw();
        assignments_panel.draw();
        fleet_needs_redraw = true;
        queue_push({"type":"map_finish","params":{"caller":fname}});
    }
    
    $("#ufo_icon_newjobs").show();
    //console.log(update_data);
}

function ufo_mode_switch(newmode) {
    /*
     * Handles populating elements and switching between different lastmile modes 
     */
    var fname = "ufo_mode_switch";
    if (newmode == "plan") {
        $(".ufo_large_panel").remove();
        $(".map_zoom_in,.map_zoom_out,.map_data_selector").show();
        if(fleetmode=="plan") {
            fleetmode = "";
            order_panel.hide();
            assignments_panel.hide();
            // 23.11.2021 disabling resizing of the time control $("#ufo_time_control").velocity({left:[60,735]},{duration:160});
        }
        else {
            fleetmode = "plan";
            order_panel.draw(fname);
            assignments_panel.draw(fname);
            // 23.11.2021 disabling resizing of the time control $("#ufo_time_control").velocity({left:[735,60]},{duration:160});
        }
        
    }
    if (newmode == "phone" && fleetmode!="vehicles" && fleetmode!="drivers") {
        if((time-ufo_midnight)<59400) {
            if(ufo_phone.visible==undefined) {
                ufo_phone = new smartphone({parent:"#ufo_smartphone"});
                ufo_phone.show();
            }
            else {
                if(ufo_phone.visible==false) {
                    ufo_phone.current_stop = -1; // Fixing redraw bug.
                    ufo_phone.show();
                }
                else {
                    ufo_phone.hide();
                }
            }
        }
        else {
            ufo_phone.hide();
        }
        
    }
    if (newmode == "vehicles") {
        if(fleetmode=="vehicles") {
            $(".ufo_large_panel").remove();
            $(".map_zoom_in,.map_zoom_out,.map_data_selector").show();
            fleetmode = "";
        }
        else {
            if(ufo_phone.visible!=undefined) {
                ufo_phone.hide();
            }
            fleetmode = "vehicles";
            ufo_vehicle_panel();
        }
        
    }
    if (newmode == "drivers") {
        if(fleetmode=="drivers") {
            $(".ufo_large_panel").remove();
            $(".map_zoom_in,.map_zoom_out,.map_data_selector").show();
            fleetmode = "";
        }
        else {
            if(ufo_phone.visible!=undefined) {
                ufo_phone.hide();
            }
            fleetmode = "drivers";
            ufo_driver_panel();
        }
        
    }
    if (newmode == "reports") {
        if(fleetmode=="reports") {
            $(".ufo_large_panel").remove();
            $(".map_zoom_in,.map_zoom_out,.map_data_selector").show();
            fleetmode = "";
        }
        else {
            if(ufo_phone.visible!=undefined) {
                ufo_phone.hide();
            }
            fleetmode = "reports";
            ufo_report_panel(0);
        }
        
    }
    ufo_sidebar_icons();
}

function ufo_sidebar_icons() {
    //$("#icon_calendar_svg").children("path")[0].style.fill = "var(--heremidgrey)";
    $("#ufo_sidebar").show();
    $("#icon_phone_svg").children("path")[0].style.fill = "var(--heremidgrey)";
    //$("#icon_vehicles_svg").children("path")[0].style.fill = "var(--heremidgrey)";
    //$("#icon_drivers_svg").children("path")[0].style.fill = "var(--heremidgrey)";
    $("#icon_calendar_inactive,#icon_reports_inactive,#icon_drivers_inactive,#icon_vehicles_inactive").show();
    $("#icon_calendar_active,#icon_reports_active,#icon_drivers_active,#icon_vehicles_active").hide();
    $("#ufo_icon_plan_border, #ufo_icon_phone_border, #ufo_icon_vehicles_border, #ufo_icon_drivers_border, #ufo_icon_reports_border").removeClass("ufo_sidebar_icon_border_selected");
    $("#ufo_icon_plan_border, #ufo_icon_phone_border, #ufo_icon_vehicles_border, #ufo_icon_drivers_border, #ufo_icon_reports_border").addClass("ufo_sidebar_icon_border_unselected");
    $("#ufo_time_control").show();

    if (fleetmode == "plan") {
        $("#icon_calendar_inactive").hide();
        $("#icon_calendar_active").show();
        //$("#icon_calendar_svg").children("path")[0].style.fill = "#000000";
        $("#ufo_icon_plan_border").removeClass("ufo_sidebar_icon_border_unselected");
        $("#ufo_icon_plan_border").addClass("ufo_sidebar_icon_border_selected");
    }
    if (fleetmode == "reports") {
        $("#icon_reports_inactive").hide();
        $("#icon_reports_active").show();
        //$("#icon_calendar_svg").children("path")[0].style.fill = "#000000";
        $("#ufo_icon_reports_border").removeClass("ufo_sidebar_icon_border_unselected");
        $("#ufo_icon_reports_border").addClass("ufo_sidebar_icon_border_selected");
        $("#ufo_time_control").hide();
    }
    if (ufo_phone.visible!=undefined) {
        if(ufo_phone.visible==true) {
            $("#icon_phone_svg").children("path")[0].style.fill = "#000000";
            $("#ufo_icon_phone_border").removeClass("ufo_sidebar_icon_border_unselected");
            $("#ufo_icon_phone_border").addClass("ufo_sidebar_icon_border_selected");
        }
    }
    if (fleetmode == "vehicles") {
        $("#icon_vehicles_inactive").hide();
        $("#icon_vehicles_active").show();
        //$("#icon_vehicles_svg").children("path")[0].style.fill = "#000000";
        $("#ufo_icon_vehicles_border").removeClass("ufo_sidebar_icon_border_unselected");
        $("#ufo_icon_vehicles_border").addClass("ufo_sidebar_icon_border_selected");
        $("#ufo_time_control").hide();
    }
    if (fleetmode == "drivers") {
        $("#icon_drivers_inactive").hide();
        $("#icon_drivers_active").show();
        //$("#icon_drivers_svg").children("path")[0].style.fill = "#000000";
        $("#ufo_icon_drivers_border").removeClass("ufo_sidebar_icon_border_unselected");
        $("#ufo_icon_drivers_border").addClass("ufo_sidebar_icon_border_selected");
        $("#ufo_time_control").hide();
    }
}

function ufo_option_panel_switch(mode) {
    ufo_option_panel_mode = mode;
    ufo_build_option_panel();
}

function ufo_build_option_panel() {
    var ufo_optheaders = $(".ufo_option_panel_selector_container");
    $("#ufo_option_panel_text").empty();
    for(var i=0;i<ufo_optheaders.length;i++) {
        var subopt = $(ufo_optheaders[i]);
        if($(subopt).attr("id") == "ufo_option_selector_"+ufo_option_panel_mode) {
            $(subopt).children("#text").css({"font-weight":700,"color":"#000"});
            $(subopt).children("#lower").css({"background":"linear-gradient(to left,#48DAd0,#A4C3FF)"});
        }
        else {
            $(subopt).children("#text").css({"font-weight":100,"color":"var(--herelightgrey)"});
            $(subopt).children("#lower").css({"background":"none"});            
        }
    }
    if(ufo_option_panel_mode=="optimization") {
        var optdiv = $("<div />",{"class":"ufo_option_panel_body"});
        $(optdiv).append("<span style='font-weight: 500; font-size: 9pt;'>OPTIMIZE FOR</span>");
        for(var i=0;i<ufo_opts["optimization"].opts.length;i++){
            var rdiv = new ufo_radio({"id":i,value:ufo_opts["optimization"].opts[i],text:ufo_opts["optimization"].strings[i],parent:"optimization"});
            $(optdiv).append(rdiv.domel);
        }
        $("#ufo_option_panel_text").append(optdiv);
    }
    else if(ufo_option_panel_mode=="routesettings") {
        var optdiv = $("<div />",{"class":"ufo_option_panel_body"});
        $(optdiv).append("<span style='font-weight: 500; font-size:9pt;'>INCLUDE</span>");
        var includes = ["Highways","Toll roads","Ferries","Tunnels","Dirt roads","Car trains"];
        for(var i=0;i<includes.length;i++) {
            var listdiv = $("<div />",{"class":"ufo_list_container"});
           
            
            if(i<4) { 
                var licon = $("<div />",{"class":"ufo_list_check_checked"});
            }
            else {
                var licon = $("<div />",{"class":"ufo_list_check_unchecked"});
            }
            $(licon).append(ufo_icons["check"]);
            $(licon).on("click",function() { $(this).toggleClass("ufo_list_check_checked ufo_list_check_unchecked")});
            var lcapt = $("<div />",{"class":"ufo_list_text"});
            $(lcapt).append(includes[i]);
            $(listdiv).append(licon);
            $(listdiv).append(lcapt);
            $(optdiv).append(listdiv);
        }
        $("#ufo_option_panel_text").append(optdiv);
    }
    else if(ufo_option_panel_mode=="timeandcapacity") {
        var hdiv = $("<div />",{"class":"ufo_option_panel_subhead","text":"Time settings"});
        var optdiv = $("<div />",{"class":"ufo_option_panel_body"});
        $(optdiv).css({"top":125});
        var ldiv = $("<div />",{"class":"ufo_option_panel_box"});
        $(ldiv).append("<span style='font-weight: 500; font-size:9pt;'>OVERWRITE SHIFT TIME</span><br /><br />");
        $(ldiv).append("<span class='ufo_option_panel_textbox'>hh:mm</span> <span style='margin-left: 10px; margin-right:10px'>to</span> <span class='ufo_option_panel_textbox'>hh:mm</span>");

        var rdiv = $("<div />",{"class":"ufo_option_panel_box"});
        $(rdiv).css({"margin-left":80});
        $(rdiv).append("<span style='font-weight: 500; font-size:9pt;'>OVERWRITE SERVICE TIME PER STOP</span><br /><br />");
        $(rdiv).append("<span class='ufo_option_panel_textbox' style='width: 160px;'>5 min.</span>");

        $(optdiv).append(ldiv);
        $(optdiv).append(rdiv);
        $("#ufo_option_panel_text").append(hdiv);
        $("#ufo_option_panel_text").append(optdiv);

        hdiv = $("<div />",{"class":"ufo_option_panel_subhead","text":"Capacity settings"});
        $(hdiv).css({"margin-top":120});
        optdiv = $("<div />",{"class":"ufo_option_panel_body"});
        $(optdiv).css({"top":265});

        var adiv = $("<div />",{"class":"ufo_option_panel_box"});
        $(adiv).append("<span style='font-weight: 500; font-size:9pt;'>PARCEL COUNT</span><br /><br />");
        $(adiv).append("<span class='ufo_option_panel_textbox'>20</span>");

        var bdiv = $("<div />",{"class":"ufo_option_panel_box"});
        $(bdiv).css({"margin-left":60});
        $(bdiv).append("<span style='font-weight: 500; font-size:9pt;'>WEIGHT</span><br /><br />");
        $(bdiv).append("<span class='ufo_option_panel_textbox'>500 kg</span>");

        var cdiv = $("<div />",{"class":"ufo_option_panel_box"});
        $(cdiv).css({"margin-left":100});
        $(cdiv).append("<span style='font-weight: 500; font-size:9pt;'>VOLUME</span><br /><br />");
        $(cdiv).append("<span class='ufo_option_panel_textbox'>120 m3</span>");

        $(optdiv).append(adiv);
        $(optdiv).append(bdiv);
        $(optdiv).append(cdiv);
        $("#ufo_option_panel_text").append(hdiv);
        $("#ufo_option_panel_text").append(optdiv);
    }
}

function ufo_timechange(e) {
    //console.log(e);
    var fname = "ufo_timechange";
    if(e.drawOnly!=undefined) {
        $("#ufo_time_startdate").text(date_normal({"unixtime":time}));
        var pdelta = (time-ufo_midnight)/864;
        $("#ufo_current_time").css({left:pdelta+"%"});
        return;
    }
    var from_left = parseFloat(e.layerX);
    var twidth = parseFloat($("#ufo_time_box").width());
    var pleft = parseInt(from_left/twidth * 288);
    time = ufo_midnight + (pleft * 300);
    $("#ufo_time_startdate").text(date_normal({"unixtime":time}));
	var pdelta = (time-ufo_midnight)/864;
    $("#ufo_current_time").css({left:pdelta+"%"});
    ufo_autoplay = false;
    console.log(pleft);
    if(pleft<90) {
        ufo_dispatch_drivers({reset:true});
        $(".ufo_pda_stop").remove();
        ufo_opts["optimization"].current = 0;
        fleet_jobs_imported = false;
        fleet_solutions_calculated = false;
        fleet_solutions_dispatched = false;
        for(var i=0;i<ufo_stops.length;i++) {
            ufo_stops[i].status = -1;
            ufo_stops[i].signature= [];
            ufo_stops[i].active = false;
        }
        for(var i=0;i<ufo_tours.length;i++) {
            ufo_tours[i].status = 0;
            ufo_tours[i].last_p_idx = 0;
            ufo_tours[i].stop_for_pda = -1;
            ufo_tours[i].complete_time = 0.0;
            ufo_tours[i].travel_dist = 0.0;
            ufo_tours[i].stops = [];
            ufo_tours[i].active = false;
            ufo_tours[i].driver = "";
            ufo_tours[i].update_position();
        }
        for(var i=0;i<ufo_vehicles.length;i++) {
            ufo_vehicles[i].driver = "";
            ufo_vehicles[i].tour = "";
        }
        $("#ufo_icon_newjobs").hide();
        fleet_needs_redraw = true;
        fleetpaths = [];
        canon_paths = [];
        if(order_panel.visible==true) {
            order_panel.selected_count=0;
            assignments_panel.selected_count=0;
            order_panel.draw(fname);
            assignments_panel.draw(fname);
        }
        assignments_panel.actions = [];
        assignments_panel.add_action_button({start_hidden:true,text:"optimize",position:"bottom-right",action:"launch_optimize","id":"optimize",panels:[order_panel]});
    }
    else {
        queuelist.push({"type":"draw_panels"});
        if(fleet_jobs_imported==false) {
            for(var i=0;i<ufo_stops.length;i++) {
                ufo_stops[i].status = 0;
                ufo_stops[i].tourid = -1;
            }
            fleet_jobs_imported=true;
            fleetmode="plan";
            ufo_sidebar_icons();
            if(pleft<=198) {
                ufo_create_tours({from_timechange:true,caller:fname});
            }
        }
        else {
            if(fleet_solutions_dispatched==false) {
                fleetmode="plan";
                ufo_sidebar_icons();
                if(pleft<=198) {
                    // If it's over 198, then we should jump straight to post-drive mode
                    ufo_create_tours({from_timechange:true,caller:fname});
                    $("#ufo_icon_newjobs").show();
                }
                
            }
        }
        if(pleft>126) {
            
            var require_updating = false;
            for(var i=0;i<ufo_later_stops.length;i++) {
                if(ufo_stops[ufo_later_stops[i]].status==0) {
                    ufo_stops[ufo_later_stops[i]].update_status(false);
                    require_updating = true;
                }
            }
            if(require_updating == true) {
                
                if(pleft>198) {
                    if(fleet_solutions_dispatched==false) {
                        ufo_create_tours({"with_updates":true,"from_timechange":true});
                    }
                    else {
                        ufo_update_tours({"from_timechange":true});
                    }
                    
                    for(var i=0;i<ufo_tours.length;i++) {
                        ufo_tours[i].active = false;
                        ufo_tours[i].stop_for_pda = -1;
                    }
                    for(var i=0;i<ufo_stops.length;i++) {
                        ufo_stops[i].active = false;
                        ufo_stops[i].status = 4;
                        ufo_stops[i].selectedfrom = ""; 
                    }
                    $("#ufo_icon_newjobs").hide();
                }
                else {
                    pleft = 127;
                    time = ufo_midnight + (pleft * 300);
                    $("#ufo_time_startdate").text(date_normal({"unixtime":time}));
                    var pdelta = (time-ufo_midnight)/864;
                    $("#ufo_current_time").css({left:pdelta+"%"});
                    for(var i=0;i<ufo_tours.length;i++) {
                        ufo_tours[i].active=false;
                    }
                    for(var i=0;i<ufo_stops.length;i++) {
                        ufo_stops[i].active = false;
                        ufo_stops[i].selectedfrom = ""; 
                    }
                    ufo_activate_stops({caller:fname});
                }
            }
            
            fleet_needs_redraw = true;
            fleetpaths = [];
        }
    }
    queuelist.push({type:"map_zoom",params:{"level":map_zlevel,"caller":fname}}); 
}

function ufo_firstrun() {
    if (typeof order_panel == "undefined") {
        // Consider this a "first run" situation. If that's the case, then we need to initialize all tours and drivers.
        for(var i=0;i<ufo_vehicle_init.length;i++) {
            var newvehicle = new ufo_vehicle({type:ufo_vehicle_init[i]});
            ufo_vehicles[i] = newvehicle;
            var newtour = new ufo_tour({vehicle:i});
            ufo_tours.push(newtour);
        }
        order_panel = new vertical_panel({ id: "orders", icon: "list", name: "Orders", left: 64 });
        //order_panel.add_dropdown({ id: "show", elements: ["Show: Unassigned today","Show: Assigned", "Show: Delayed", "Show: All"], clickactions: ["show_unassigned","show_assigned", "show_delayed", "show_all"], show_first: true });
        order_panel.add_dropdown({ id: "show", elements: ["All","Accepted", "Done", "Not Done","In Progress","Open","Processing","Returned","Scheduled"], clickactions: ["show_unassigned","show_all", "show_delayed", "show_all","show_all","show_all","show_all","show_all",""], show_first: true });
        order_panel.add_filter({ id: "filter", text: "Filter: " });
        //order_panel.add_dropdown({ id: "sort", elements: ["Sort by: Priority", "Sort by: Date", "Sort by: Name"], clickactions: ["", "", ""] });
        order_panel.add_dropdown({ id: "action", elements: ["[0]", "Select all", "Unselect all"], clickactions: ["", "select_all_orders", "unselect_all_orders"], midbar: true, vars: ["order_count"] });
        order_panel.add_dropdown({ id: "order_action", elements: ["Add Orders","Assign to Tour","Delete Selected","Edit Selected","Switch View"], clickactions: ["import_jobs","","","",""], header: true, vars:["ufo_status"]});
        order_panel.add_action_button({start_hidden:false,text:"Import jobs",position:"bottom-right",action:"import_jobs","id":"import_jobs"});
        //order_panel.add_action_button({start_hidden:true,text:"Optimize",position:"bottom-right",action:"launch_assignments","id":"assign"});
        order_panel.showmode = "unassigned";
        assignments_panel = new vertical_panel({ id: "assignments", icon: "assignments", name: "Assignments", left: 400 });
        assignments_panel.add_dropdown({ id: "show", elements: ["Show: All tours"], clickactions:[""], show_first: true });
        assignments_panel.add_filter({ id: "filter", text: "Filter: " });
        //assignments_panel.add_dropdown({ id: "sort", elements: ["Delay tolerance: Normal", "Delay tolerance: Relaxed", "Delay tolerance: Aggressive", "Delay tolerance: Very aggressive"],clickactions:["delay_normal","delay_relaxed","delay_aggressive","delay_very_aggressive"] });
        assignments_panel.add_dropdown({ id: "assignment_action", elements: ["[0]", "Select all", "Unselect all"], clickactions: ["", "select_all_vehicles", "unselect_all_vehicles"], midbar: true, vars: ["tour_count"] });
        assignments_panel.add_action_button({start_hidden:true,text:"Optimize",position:"bottom-right",action:"launch_optimize","id":"optimize",panels:[order_panel]});
        assignments_panel.add_action_button({start_hidden:true,text:"Cancel",position:"bottom-right",action:"reset_optimize","id":"reset_optimize",panels:[order_panel]});
        var panel_action = new ufo_action_button({id:"action_optimize",action:"optimize",panels:[],text:"Optimize",position:"bottom-right",parent:"#ufo_option_panel"});
        var panel_cancel = new ufo_action_button({id:"action_cancel",action:"cancel",panels:[],text:"Cancel",position:"bottom-right",parent:"#ufo_option_panel"});
    }
    if(ufo_phone.visible==undefined) {
        ufo_phone = new smartphone({parent:"#ufo_smartphone"});
    }
}

function report_tour_delta(tid) {
    for(var i=0;i<ufo_tours[tid].stops.length;i++) {
        console.log(ufo_tours[tid].stops[i],ufo_stops[ufo_tours[tid].stops[i]].actual-ufo_stops[ufo_tours[tid].stops[i]].eta);
    }

}

function time_string(m,f) {
    /*
    Takes as input a number of minutes;
    returns as output a formatted text string
    */
    var hours = Math.floor(parseFloat(m)/60.0);
    var minutes = Math.floor(m-(hours*60));
    var time_string_return = "";
    if(hours>0) {
        time_string_return = hours + " h"
        if(minutes>0) {
            time_string_return = time_string_return + " "
        }
    }
    if(minutes>0) {
        time_string_return = time_string_return + minutes + " m"
    }
    return(time_string_return);
}

/***
 * 
 * BEGIN STORY LOGIC
 * 
 */

 function control_tower_demo(reset_demo) {
    if(keybinds==false) {
        control_tower_keybind_setup();
    }
    if(reset_demo!=undefined) {
        controltower_demo_stage = -1;
    }
    if(controltower_demo_stage==-1) {
        $(".map_zoom_in,.map_zoom_out,.map_data_selector").hide();
        $("#ufo_time_control,#ufo_sidebar").hide();
        controltower_demo_stage = 0;
        controltower_demo_map = -1;
    }
    console.log(controltower_demo_stage);
    var all_targets = [[[20,10,60,60],-1],[[39,1040,112,40],0],[[150,1040,140,40],100],[[290,1040,216,40],101],[[509,1040,158,40],102],[[665,1040,158,40],103],[[821,1040,201,40],104],[[1021,1040,158,40],105]];
    var ct_maps = {
        0:{
           "topbar":[16,0,1856,72,"insight_topbar.png","insight_frame_noround"],
           "leftbar":[0,0,16,1045,"insight_leftbar.png","insight_frame_noround"],
           "rightbar":[1872,0,48,1045,"insight_rightbar.png","insight_frame_noround"],
           "bottombar":[0,1044,1920,36,"insight_bottombar_0.png","insight_frame_noround"],
           "navbar":[30,83,1827,130,"insight_navbar.png","insight_frame_round"],
           "frame_0":[30,230,751,426,"insight_frame_0.png","insight_frame_round"],
           "frame_1":[800,230,1057,424,"insight_frame_1.png","insight_frame_round"],
           "frame_2":[30,674,751,353,"insight_frame_2.png","insight_frame_round"],
           "frame_3":[800,674,522,352,"insight_frame_3.png","insight_frame_round"],
           "frame_4":[1337,674,522,355,"insight_frame_4.png","insight_frame_round"],
           "frame_cal":[181,169,455,422,-1,"insight_frame_float"],
           "frame_trucks":[335,169,336,300,-1,"insight_frame_float"],
           "frame_types":[720,169,266,300,-1,"insight_frame_float"],
        },
        1:{
            "topbar":[16,0,1856,72,"insight_topbar.png","insight_frame_noround"],
            "leftbar":[0,0,16,1045,"insight_leftbar.png","insight_frame_noround"],
            "rightbar":[1872,0,48,1045,"insight_rightbar.png","insight_frame_noround"],
            "bottombar":[0,1044,1920,36,"insight_bottombar_0.png","insight_frame_noround"],
            "navbar":[30,83,1827,130,"insight_navbar.png","insight_frame_round"],
            "frame_0":[16,213,1856,830,"insight_balance.png","insight_frame_noround"],
         }
    }
    var ct_data = {
        0:{
            "frames":{
                "frame_cal":[-1],
                "frame_trucks":[-1],
                "frame_types":[-1]
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[330,130,344,44],60],[[718,130,273,44],70],[[678,980,79,42],3]],
            "bg":"#d1d1d1"
        },
        1:{
            "frames":{
                "frame_cal":["insight_calendar.png"],
                "frame_trucks":[-1],
                "frame_types":[-1]
            },
            "map":0,
            "targets":[[[180,130,112,44],0],[[262,530,44,44],2],[[678,980,79,42],3]],
            "bg":"#d1d1d1"
        },
        2:{
            "frames":{
                "frame_cal":[-1],
                "frame_trucks":[-1],
                "frame_types":[-1],
                "navbar":["insight_navbar_0.png"],
                "frame_0":["insight_frame_0_0.png"],
                "frame_2":["insight_frame_2.png"]
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[330,130,344,44],61],[[718,130,273,44],71],[[678,980,79,42],3],[[50,450,700,45],40]],
            "bg":"#d1d1d1"
        },
        3:{
            "frames":{
                "frame_cal":[-1],
                "frame_trucks":[-1],
                "frame_types":[-1],
                "navbar":["insight_navbar_0.png"],
                "frame_0":["insight_frame_0_0.png"],
                "frame_2":["insight_frame_2_0.png"]
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[596,980,79,42],2],[[50,450,700,45],40]],
            "bg":"#d1d1d1"
        },
        40:{
            "frames":{
                "frame_0":["insight_frame_0_1.png"],
                "frame_1":["insight_frame_1_1.png"],
                "frame_2":["insight_frame_2_1.png"],
                "frame_3":["insight_frame_3_1.png"],
                "frame_4":["insight_frame_4_1.png"],
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[678,980,79,42],50],[[50,450,700,45],2],[[1528,980,79,42],40],[[1608,980,79,42],41],[[1685,980,79,42],42],[[1762,980,79,42],43]],
            "bg":"#d1d1d1"
        },
        41:{
            "frames":{
                "frame_2":["insight_frame_2_1.png"],
                "frame_4":["insight_frame_4_1_1.png"],
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[678,980,79,42],51],[[50,450,700,45],2],[[1528,980,79,42],40],[[1608,980,79,42],41],[[1685,980,79,42],42],[[1762,980,79,42],43]],
            "bg":"#d1d1d1"
        },
        42:{
            "frames":{
                "frame_2":["insight_frame_2_1.png"],
                "frame_4":["insight_frame_4_1_2.png"],
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[678,980,79,42],52],[[50,450,700,45],2],[[1528,980,79,42],40],[[1608,980,79,42],41],[[1685,980,79,42],42],[[1762,980,79,42],43]],
            "bg":"#d1d1d1"
        },
        43:{
            "frames":{
                "frame_2":["insight_frame_2_1.png"],
                "frame_4":["insight_frame_4_1_3.png"],
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[678,980,79,42],53],[[50,450,700,45],2],[[1528,980,79,42],40],[[1608,980,79,42],41],[[1685,980,79,42],42],[[1762,980,79,42],43]],
            "bg":"#d1d1d1"
        },
        50:{
            "frames":{
                "frame_2":["insight_frame_2_1_0.png"],
                "frame_4":["insight_frame_4_1.png"],
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[596,980,79,42],40],[[50,450,700,45],2],[[1528,980,79,42],50],[[1608,980,79,42],51],[[1685,980,79,42],52],[[1762,980,79,42],53]],
            "bg":"#d1d1d1"
        },
        51:{
            "frames":{
                "frame_2":["insight_frame_2_1_0.png"],
                "frame_4":["insight_frame_4_1_1.png"],
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[596,980,79,42],41],[[50,450,700,45],2],[[1528,980,79,42],50],[[1608,980,79,42],51],[[1685,980,79,42],52],[[1762,980,79,42],53]],
            "bg":"#d1d1d1"
        },
        52:{
            "frames":{
                "frame_2":["insight_frame_2_1_0.png"],
                "frame_4":["insight_frame_4_1_2.png"],
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[596,980,79,42],42],[[50,450,700,45],2],[[1528,980,79,42],50],[[1608,980,79,42],51],[[1685,980,79,42],52],[[1762,980,79,42],53]],
            "bg":"#d1d1d1"
        },
        53:{
            "frames":{
                "frame_2":["insight_frame_2_1_0.png"],
                "frame_4":["insight_frame_4_1_3.png"],
            },
            "map":0,
            "targets":[[[180,130,112,44],1],[[596,980,79,42],43],[[50,450,700,45],2],[[1528,980,79,42],50],[[1608,980,79,42],51],[[1685,980,79,42],52],[[1762,980,79,42],53]],
            "bg":"#d1d1d1"
        },
        60:{
            "frames":{"frame_trucks":["insight_frame_trucks.png"],"frame_types":[-1]},
            "map":0,
            "targets":[[[180,130,112,44],1],[[330,130,344,44],0],[[718,130,273,44],70],[[678,980,79,42],3]],
            "bg":"#d1d1d1"
        },
        61:{
            "frames":{"frame_trucks":["insight_frame_trucks.png"],"frame_types":[-1]},
            "map":0,
            "targets":[[[180,130,112,44],1],[[330,130,344,44],2],[[718,130,273,44],71],[[678,980,79,42],3]],
            "bg":"#d1d1d1"
        },
        70:{
            "frames":{"frame_types":["insight_frame_types.png"],"frame_trucks":[-1]},
            "map":0,
            "targets":[[[180,130,112,44],1],[[330,130,344,44],60],[[718,130,273,44],0],[[718,160,273,300],80],[[678,980,79,42],3]],
            "bg":"#d1d1d1"
        },
        71:{
            "frames":{"frame_types":["insight_frame_types.png"],"frame_trucks":[-1]},
            "map":0,
            "targets":[[[180,130,112,44],1],[[330,130,344,44],61],[[718,130,273,44],2],[[678,980,79,42],3]],
            "bg":"#d1d1d1"
        },
        80:{
            "frames":{"frame_types":["insight_frame_types_0.png"],"frame_trucks":[-1]},
            "map":0,
            "targets":[[[180,130,112,44],1],[[330,130,344,44],60],[[718,130,273,44],0],[[718,160,273,300],70],[[678,980,79,42],3]],
            "bg":"#d1d1d1"
        },
        100:{
            "frames":{
                "bottombar":["insight_bottombar_1.png"],
                "frame_0":["insight_balance.png"]
            },
            "map":1,
            "targets":[],
            "bg":"#E6E6E6"
        },
        101:{
            "frames":{
                "bottombar":["insight_bottombar_2.png"],
                "frame_0":["insight_balancedevelopment.png"]
            },
            "map":1,
            "targets":[],
            "bg":"#E6E6E6"
        },
        102:{
            "frames":{
                "bottombar":["insight_bottombar_3.png"],
                "frame_0":["insight_potentialdin.png"]
            },
            "map":1,
            "targets":[],
            "bg":"#E6E6E6"
        },
        103:{
            "frames":{
                "bottombar":["insight_bottombar_4.png"],
                "frame_0":["insight_potentialiso.png"]
            },
            "map":1,
            "targets":[],
            "bg":"#E6E6E6"
        },
        104:{
            "frames":{
                "bottombar":["insight_bottombar_5.png"],
                "frame_0":["insight_analysis.png"]
            },
            "map":1,
            "targets":[],
            "bg":"#E6E6E6"
        },
        105:{
            "frames":{
                "bottombar":["insight_bottombar_6.png"],
                "frame_0":["insight_analysistime.png"]
            },
            "map":1,
            "targets":[],
            "bg":"#E6E6E6"
        },
        
    }
    if(ct_data[controltower_demo_stage]["map"]!=controltower_demo_map) {
        // Case where the whole frame map needs to be rebuilt.
        $(".ufo_large_panel").remove();
        var scale_factor = $(window).width() / 1920;
        var map_keys = Object.keys(ct_maps[ct_data[controltower_demo_stage]["map"]]);
        var ct_div = $("<div />",{"class":"ufo_large_panel","id":"insight_panel","css":{"left":"0","background-color":ct_data[controltower_demo_stage]["bg"]}});
        var ct_frame = $("<div />",{"class":"insight_demo_frame","id":"insight_demo_frame","css":{"transform":"scale("+scale_factor+")","transform-origin":"0 0"}});
        for(var i=0;i<map_keys.length;i++) {
            if(ct_data[controltower_demo_stage]["frames"][map_keys[i]]!=undefined) {
                if(ct_data[controltower_demo_stage]["frames"][map_keys[i]].length>1) {
                    var mk_obj = ct_data[controltower_demo_stage]["frames"][map_keys[i]];
                }
                else {
                    var mk_obj = ct_maps[ct_data[controltower_demo_stage]["map"]][map_keys[i]];
                    mk_obj[4] = ct_data[controltower_demo_stage]["frames"][map_keys[i]][0];
                }
                
            }
            else {
                var mk_obj = ct_maps[ct_data[controltower_demo_stage]["map"]][map_keys[i]];
            }
            console.log(map_keys[i]);
            var frame_obj = $("<div />",{"class":mk_obj[5],"id":"insight_"+map_keys[i],"css":{"left":mk_obj[0],"top":mk_obj[1],"width":mk_obj[2],"height":mk_obj[3],"background-image":"url('./insight/"+mk_obj[4]+"')"}});
            if(mk_obj[4]!=-1){
                $(frame_obj).css({"display":"block"});
            }
            else {
                $(frame_obj).css({"display":"none"});
            }
            $(ct_frame).append(frame_obj);
        }
        controltower_demo_map = ct_data[controltower_demo_stage]["map"];
        $(ct_div).append(ct_frame);
        $("#main_container").append(ct_div);
        controltower_demo_stage = ct_data[controltower_demo_stage]["map"];
        $(ct_div).append(ct_frame);
        $("#main_container").append(ct_div);
    }
    else {
        var ct_div = $("#insight_panel");
        var ct_frame = $("#insight_demo_frame");
        var map_keys = Object.keys(ct_data[controltower_demo_stage]["frames"]);
        for(var i=0;i<map_keys.length;i++) {
            console.log(map_keys[i]);
            var frame_obj = $("#insight_"+map_keys[i]);
            if(ct_data[controltower_demo_stage]["frames"][map_keys[i]].length>1) {
                // If only 1 argument is provided, it's JUST the background URL
                var mk_obj = ct_data[controltower_demo_stage]["frames"][map_keys[i]];
            }
            else {
                var mk_obj = ct_maps[ct_data[controltower_demo_stage]["map"]][map_keys[i]];
                mk_obj[4] = ct_data[controltower_demo_stage]["frames"][map_keys[i]][0];
            }
            
            $(frame_obj).css({"left":mk_obj[0],"top":mk_obj[1],"width":mk_obj[2],"height":mk_obj[3],"background-image":"url('./insight/"+mk_obj[4]+"')"});
            console.log(mk_obj);
            if(mk_obj[4]!=-1){
                console.log("Showing object");
                $(frame_obj).css({"display":"block"});
            }
            else {
                $(frame_obj).css({"display":"none"});
            }
        }
        $(ct_div).css({"background-color":ct_data[controltower_demo_stage].bg});
    }
    $(".insight_demo_action").remove();

    
    //$(ct_frame).css({"background-color":ct_data[controltower_demo_stage].bg,"background-image":"url('./insight/"+ct_data[controltower_demo_stage].image+"')"});
    var ct_targets = ct_data[controltower_demo_stage].targets;
    for(var i=0;i<all_targets.length;i++) {
        var ct_action = $("<div />",{"class":"insight_demo_action"});
        $(ct_action).css({"left":all_targets[i][0][0],"top":all_targets[i][0][1],"width":all_targets[i][0][2],"height":all_targets[i][0][3]});
        $(ct_action).on("click",{arg1:all_targets[i][1]},function(e) {
            if(e.data.arg1==-1) {
                // Reset command is triggered. If we're already stage 0, close the entire demo.
                if(controltower_demo_stage==0) {
                    try {
                        fleetmode = "plan";
                        ufo_mode_switch("plan");
                    }
                    catch(err) {
                        console.log(err);
                        /*
                        We catch this, but this should happen if we run the controltower demo from limited scope, i.e.
                        from controltower.html, where there is no other logic to support the full LM demo.
                        */
                    }
                    controltower_demo_stage = 0;
                    controltower_demo_map = -1;
                }
                else {
                    controltower_demo_stage = e.data.arg1;
                    control_tower_demo();
                }
            }
            else {
                controltower_demo_stage = e.data.arg1;
                control_tower_demo();
            }
            
        });
        $(ct_frame).append(ct_action);
    }
    for(var i=0;i<ct_targets.length;i++) {
        var ct_action = $("<div />",{"class":"insight_demo_action"});
        $(ct_action).css({"left":ct_targets[i][0][0],"top":ct_targets[i][0][1],"width":ct_targets[i][0][2],"height":ct_targets[i][0][3]});
        $(ct_action).on("click",{arg1:ct_targets[i][1]},function(e) {
            controltower_demo_stage = e.data.arg1;
            control_tower_demo();
        });
        $(ct_frame).append(ct_action);
    }
}

function control_tower_keybind_setup() {
    document.onkeydown = function(e) {
        control_tower_keyhandler(e,"down");
    }
    document.onkeyup = function(e) {
        control_tower_keyhandler(e,"up");
    }
}

function control_tower_keyhandler(e,dir) {
    var ecode = 0;
    var ekey = "";
    try {
        ekey = e.key;
        if(ekey=="Shift") {
            ecode = 16;
        }
    }
    catch(err) {
        ecode = e.keyCode();
    }
    if(ecode==16) {
        if(dir=="down") {
            $(".insight_demo_action").css({"border-width":"0.1em"});

        }
        else {
            $(".insight_demo_action").css({"border-width":"0.0em"});
        }
    }
}