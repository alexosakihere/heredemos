
function story_do_next() {
    var fname = "story_do_next";
    if(active_story=="") {
        return;
    }
    var sdata = stories[active_story];
    if(sdata.step>=sdata.sequence.length) {

        /* 
        
        In other words the story is done
        
        Unset the variables.
        Return us to the story selector.
        
        */
        sdata.step = 0;
        timer = 200;
        $("#story_caption").hide();
        //active_tracker = "";
        tracker_select({"id":false,"caller":fname});
        
        indicator_data = [];
        
        story_list_all();
    }
    else {
        $("#story_caption_body").text("");
        var stepdata = sdata.sequence[sdata.step];
        var active_marker,l,t;
        var nzoom = parseInt(stepdata.zoom);
        var recenter = false;
        var zdir = map_zlevel;
        var alertdata = [];
        var start_autoplay;
        time = trackers[active_tracker].updates[stepdata.time].time;
        tracker_get_steps_at_time({"caller":fname});

        
        if(stepdata.center!=undefined) {
            recenter = true;
        }
        
        /*
        if(nzoom!=map_zlevel) {
            if(nzoom>map_zlevel) {
                map_zlevel = nzoom-1;
                zdir = 1;
            }
            else {
                map_zlevel = nzoom+1;
                zdir = -1;
            }
        }
        else {
            console.log("no rezoom");
            //map_zlevel = parseInt(stepdata.zoom);
        }*/
       
        $("#time_current").text(date_normal({"index":time}));
        
        if(stepdata.alert!=false) {
            $("#indicator").show();
            if(stepdata.alert[0]=="tracker") {
                var coord = trackers[active_tracker].updates[stepdata.time].position;
                var pcenter = get_normalized_coord([coord[0],coord[1],nzoom]);
                var delta_y = pcenter[0]-normalized_origin[0];
                var delta_x = pcenter[1]-normalized_origin[1];
                var pos_offset = 10; //(ie half the width of the tracker icon so it can be accurately placed)
                l = map_tile_offset_x-pos_offset+(delta_x*512);
                t = map_tile_offset_y-pos_offset+(delta_y*512);
            }
            else {
                l = stepdata.alert[0][0];
                t = stepdata.alert[0][1];
            }
            alertdata = [l,t,stepdata.alert[1]];
        }
        else {
            indicator_data = [];
            indicator_on = false;
            $("#indicator").hide();
        }
        if(stepdata.autoplay!==undefined) {
            start_autoplay = parseInt(stepdata.autoplay);
        }
        else {
            start_autoplay = 0;
        }

        if(recenter==true) {
            alertdata = [l,t,stepdata.alert[1]];
            if(stepdata.center=="tracker") {
                map_move_to({"dcoord":trackers[active_tracker].updates[stepdata.time].position,"zdir":nzoom,"text":stepdata.text[0],"alertdata":alertdata,"caller":fname,"start_autoplay":start_autoplay});
            }
            else {
                console.log("moving")
                map_move_to({"dcoord":stepdata.center,"zdir":nzoom,"text":stepdata.text[0],"alertdata":alertdata,"caller":fname,"start_autoplay":start_autoplay});
            }
        }
        else {
            autoplay = start_autoplay;
            map_zoom({"level":zdir,"caller":fname});
            story_indicator({"x":l,"y":t,"indicator_type":stepdata.alert[1],"caller":fname});;
            story_text = stepdata.text[0];
        }

        $("#story_caption_title").text(stepdata.title);
        //story_text = stepdata.text[0];

        sdata.step++;
    }
}

function story_indicator(params) {
    var fname = "story_indicator";
    var x = params.x;
    var y = params.y;
    var indicator_type = params.indicator_type;
    var caller = params.caller;
    if(caller!=undefined) {
        //call_log(fname,caller);
    }

    if(x===undefined) { return; }
    $("#indicator").show();
    $("#indicator").velocity("stop",true);
    var color,fading;
    if(indicator_type===undefined) {
        indicator_type = "normal";
    }
    if(indicator_type=="alert") {
        color = "#d35566";
        fading = [250,500];
    }
    else if(indicator_type=="correction") {
        color = "#6f83bd";
        fading = [350,700];
    }
    else {
        color = "#44ca9d";
        fading = [650,950];
    }
    indicator_on = true;
    indicator_data = [x,y,indicator_type];

    var icon = $("#indicator");
    //x = 18+parseInt($("#marker_"+active_tracker).css("left"));
    //y = 18+parseInt($("#marker_"+active_tracker).css("top"));
    //icon.css({"left":18,"top":18,"background-color":color});
    icon.css({"background-color":color});
    icon.velocity({"transform":["scale(10)","scale(.2)"]},{duration:fading[0]}).velocity({"transform":["scale(.2)","scale(10)"]},{duration:fading[1],complete:function() { indicator_on = false; }});
}

function story_launch(sid) {
    /*
    
    This sets up the basic configuration for a story.

    */
    var fname = "story_launch";
    var sdata = stories[sid];
    //lock_movement = true;
    current_map_context = sdata.context;
    tracker_select({"id":sdata.tracker,"caller":fname,"suppress":true});
    active_story = sid;
    if(expanded_summary==false) {
        tracker_summary_cycle({"suppress":true,"caller":fname});
    }
    $("#story_caption_title").empty();
    $("#story_caption_body").empty();
    //var icon = $("<div />",{"class":"highlight","id":"indicator"});
    //$("#map_container").append(icon);
    var indicator = $("<div />",{"class":"highlight","id":"indicator"});
    $("#marker_"+active_tracker).append(indicator);
    $("#map_container").append($("#story_caption"));
    setTimeout(function() {
        $("#story_caption").show();
        story_do_next();
    },500);
}


function story_list_all() {
    fname = "story_list_all";
    $("#sidebar").empty();
    
    if(active_story!="") {
        stories[active_story].step = 0;
    }
    active_story = "";
    $("#story_caption").hide();
    tracker_select({"id":false,"caller":fname});
    $("#indicator").remove();

    var sids = Object.keys(stories);
    var scard,stitle,sdesc;
    for(var i in sids) {
        scard = $("<div />",{"class":"storycard"});
        stitle = $("<div />",{"class":"storycard_title"});
        sdesc = $("<div />",{"class":"storycard_desc"});
        stitle.append(stories[sids[i]].name);
        sdesc.append(stories[sids[i]].desc);
        scard.append(stitle);
        scard.append(sdesc);
        scard.on("click",{arg1:sids[i]},function(e) { story_launch(e.data.arg1); });
        $("#sidebar").append(scard);
    }
}