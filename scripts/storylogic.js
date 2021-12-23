function asset_tracking_demo() {
    console.log(asset_tracking_demo_stage);
    $("#alive_container").empty();
    var at_data = {
        0:{
            "image":"asset_tracking_0.png",
            "targets":[[[480,684,448,44],1]],
            "bg":"var(--herewhite)"
        },
        1:{
            "image":"asset_tracking_1.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[40,670,640,30],12]],
            "bg":"rgb(249, 250, 252)"
        },
        2:{
            "image":"asset_tracking_2.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[28,180,60,30],7],[[1360,80,50,50],8],[[33,265,580,60],12]],
            "bg":"rgb(249, 250, 252)"
        },
        3:{
            "image":"asset_tracking_3.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[35,476,620,60],24]],
            "bg":"rgb(249, 250, 252)"
        },
        4:{
            "image":"asset_tracking_4.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6]],
            "bg":"rgb(249, 250, 252)"
        },
        5:{
            "image":"asset_tracking_5.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6]],
            "bg":"rgb(249, 250, 252)"
        },
        6:{
            "image":"asset_tracking_27.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[35,130,200,30],28],[[250,130,200,30],27]],
            "bg":"rgb(249, 250, 252)"
        },
        7:{
            "image":"asset_tracking_7.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[100,180,60,30],2],[[1360,80,50,50],8],[[33,265,980,60],12]],
            "bg":"rgb(249, 250, 252)"
        },
        8:{
            "image":"asset_tracking_8.png",
            "targets":[[[586,195,140,30],9],[[680,937,162,46],2],[[865,937,162,46],2]],
            "bg":"rgb(249, 250, 252)"
        },
        9:{
            "image":"asset_tracking_9.png",
            "targets":[[[413,195,140,30],8],[[680,980,162,46],2],[[865,980,162,46],2],[[860,410,162,46],10]],
            "bg":"rgb(249, 250, 252)"
        },
        10:{
            "image":"asset_tracking_10.png",
            "targets":[[[413,195,140,30],8],[[680,980,162,46],2],[[865,980,162,46],2],[[410,390,600,146],11]],
            "bg":"rgb(249, 250, 252)"
        },
        11:{
            "image":"asset_tracking_11.png",
            "targets":[[[413,195,140,30],8],[[680,960,162,46],2],[[865,960,162,46],2]],
            "bg":"rgb(249, 250, 252)"
        },
        12:{
            "image":"asset_tracking_12.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[30,164,90,30],12],[[130,164,90,30],13],[[240,164,90,30],14],[[330,164,90,30],15],[[430,164,90,30],16],[[1312,80,50,50],17]],
            "bg":"rgb(249, 250, 252)"
        },
        13:{
            "image":"asset_tracking_13.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[30,164,90,30],12],[[130,164,90,30],13],[[240,164,90,30],14],[[330,164,90,30],15],[[430,164,90,30],16],[[1312,80,50,50],17]],
            "bg":"rgb(249, 250, 252)"
        },
        14:{
            "image":"asset_tracking_14.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[30,164,90,30],12],[[130,164,90,30],13],[[240,164,90,30],14],[[330,164,90,30],15],[[430,164,90,30],16],[[1312,80,50,50],17],[[202,724,130,30],20]],
            "bg":"rgb(249, 250, 252)"
        },
        15:{
            "image":"asset_tracking_15.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[30,164,90,30],12],[[130,164,90,30],13],[[240,164,90,30],14],[[330,164,90,30],15],[[430,164,90,30],16],[[1312,80,50,50],17]],
            "bg":"rgb(249, 250, 252)"
        },
        16:{
            "image":"asset_tracking_16.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[30,164,90,30],12],[[130,164,90,30],13],[[240,164,90,30],14],[[330,164,90,30],15],[[430,164,90,30],16],[[40,207,160,30],23]],
            "bg":"rgb(249, 250, 252)"
        },
        17:{
            "image":"asset_tracking_17.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[550,240,200,30],18],[[770,240,150,30],19],[[690,860,360,30],12]],
            "bg":"rgb(249, 250, 252)"
        },
        18:{
            "image":"asset_tracking_18.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[400,240,130,30],17],[[770,240,150,30],19],[[690,803,360,30],12]],
            "bg":"rgb(249, 250, 252)"
        },
        19:{
            "image":"asset_tracking_19.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[400,172,130,30],17],[[550,172,150,30],18],[[690,980,360,30],12]],
            "bg":"rgb(249, 250, 252)"
        },
        20:{
            "image":"asset_tracking_20.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[30,164,90,30],12],[[130,164,90,30],13],[[240,164,90,30],14],[[330,164,90,30],15],[[430,164,90,30],16],[[208,464,270,270],21]],
            "bg":"rgb(249, 250, 252)"
        },
        21:{
            "image":"asset_tracking_21.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[30,164,90,30],12],[[130,164,90,30],13],[[240,164,90,30],14],[[330,164,90,30],15],[[430,164,90,30],16],[[348,464,270,270],22]],
            "bg":"rgb(249, 250, 252)"
        },
        22:{
            "image":"asset_tracking_22.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[30,164,90,30],12],[[130,164,90,30],13],[[240,164,90,30],14],[[330,164,90,30],15],[[430,164,90,30],16]],
            "bg":"rgb(249, 250, 252)"
        },
        23:{
            "image":"asset_tracking_23.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[30,164,90,30],12],[[130,164,90,30],13],[[240,164,90,30],14],[[330,164,90,30],15],[[430,164,90,30],16],[[40,207,160,30],16]],
            "bg":"rgb(249, 250, 252)"
        },
        24:{
            "image":"asset_tracking_24.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[35,156,100,40],24],[[135,156,100,40],25],[[1360,77,50,50],26]],
            "bg":"rgb(249, 250, 252)"
        },
        25:{
            "image":"asset_tracking_25.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[35,156,100,40],24],[[135,156,100,40],25],[[1360,77,50,50],26]],
            "bg":"rgb(249, 250, 252)"
        },
        26:{
            "image":"asset_tracking_26.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[35,795,390,40],24]],
            "bg":"rgb(249, 250, 252)"
        },
        27:{
            "image":"asset_tracking_6.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[35,130,200,30],6]],
            "bg":"rgb(249, 250, 252)"
        },
        28:{
            "image":"asset_tracking_28.png",
            "targets":[[[80,10,120,30],1],[[233,10,80,30],2],[[330,10,80,30],3],[[422,10,80,30],4],[[516,10,56,30],5],[[595,10,65,30],6],[[35,130,200,30],6]],
            "bg":"rgb(249, 250, 252)"
        },
        
    }
    $("#alive_container").css({"background-color":at_data[asset_tracking_demo_stage].bg})
    var at_frame = $("<div />",{"class":"asset_tracking_demo_frame"});
    $(at_frame).css({"background-color":at_data[asset_tracking_demo_stage].bg,"background-image":"url('./images/"+at_data[asset_tracking_demo_stage].image+"')"});
    var at_targets = at_data[asset_tracking_demo_stage].targets;
    for(var i=0;i<at_targets.length;i++) {
        var at_action = $("<div />",{"class":"asset_tracking_demo_action"});
        $(at_action).css({"left":at_targets[i][0][0],"top":at_targets[i][0][1],"width":at_targets[i][0][2],"height":at_targets[i][0][3]});
        $(at_action).on("click",{arg1:at_targets[i][1]},function(e) {
            asset_tracking_demo_stage = e.data.arg1;
            asset_tracking_demo();
        });
        $(at_frame).append(at_action);
    }
    $("#alive_container").append(at_frame);
}

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