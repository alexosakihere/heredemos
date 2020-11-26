/**
 * 
 * Contains a set of debug functions for the application
 */

function debug(clear,text) {
    if(ufo_debug==true) {
        if(clear==true) {
            $("#ufo_debug_panel").empty();
        }
        $("#ufo_debug_panel").prepend(text+"<br />");
    }
}

function ufo_liststops() {
    var stops = Object.keys(stoplist);
    console.log(stops);

}

function ufo_map_all_adjacencies() {
    /*
     * 
     * 
     */
    console.log("mapping adjacencies");
    tcx.strokeStyle = "#000000";
    for (var i = 0; i < ufo_stops.length; i++) {
        ufo_stops[i].map_connections();
    }
}

function ufo_map_all_interlinks() {
    /***
     * 
     * Debug function
     * 
     */
    console.log("mapping interlinks");

    var colors = ["#ff4000", "#003d87", "#8f3b8c", "#217019"]
    tcx.clearRect(0, 0, tcv.width, tcv.height);
    ufo_map_all_adjacencies();
    var amap = Object.keys(adjmap);
    for (var a = 0; a < amap.length; a++) {
        var l_ids = adjmap[amap[a]];
        for (var i = 0; i < l_ids.length; i++) {
            var link = ufo_draw_path({ id: l_ids[i], complex: false, width: 1, color: colors[i % 4] });
            tcx.fillStyle = colors[i % 4];
            tcx.font = "12px Arial";
            for (var j = 0; j < link.verts.length; j++) {
                //tcx.fillText(l_ids[i],link.verts[j][0],link.verts[j][1]);
            }
        }
    }

    /**
     * 
     * for(var a=0;a<amap.length;a++) {
        var l_ids = Object.keys(lastmile_paths);
        for(var i=0;i<l_ids.length;i++) {
            var link = ufo_draw_path({id:l_ids[i],complex:false,width:1,color:colors[i%4]});
            tcx.fillStyle = colors[i%4];
            tcx.font = "12px Arial";
            for(var j=0;j<link.verts.length;j++) {
                tcx.fillText(l_ids[i],link.verts[j][0],link.verts[j][1]);
            }
        }
    }
     */


}

function ufo_debug_pathbuild(nid) {
    if(temp_link_map.length==0) {
        temp_link_map.push("d0");
    }
    if(ufo_stops[nid].active==false) {
        ufo_stops[nid].active = true;
        ufo_stops[nid].position();
        temp_link_map.push(nid);
    }
    else {
        if(temp_link_map[temp_link_map.length-1]==nid) {
            ufo_stops[nid].active = false;
            ufo_stops[nid].position();
            temp_link_map.pop();
        }
       
    }
    tcx.clearRect(0, 0, tcv.width, tcv.height);
    tcx.strokeStyle = "#000";
    tcx.lineWidth = 1;
    ufo_stops[temp_link_map[temp_link_map.length-1]].map_connections();
    var tdist = 0.0;
    for(var i=0;i<temp_link_map.length-1;i++) {
        var nlink = adjmap[temp_link_map[i]+"-"+temp_link_map[i+1]];
        for(var j=0;j<nlink.length;j++) {
            tdist += lastmile_distances[nlink[j]];
        }
        ufo_draw_link({path_list:[temp_link_map[i]+"-"+temp_link_map[i+1]]});
    }
    var nlink = adjmap[temp_link_map[temp_link_map.length-1]+"-d0"];
    console.log(nlink);
    for(var j=0;j<nlink.length;j++) {
        tdist += lastmile_distances[nlink[j]];
    }
    ufo_draw_link({path_list:[temp_link_map[temp_link_map.length-1]+"-d0"]});
    var ostring = temp_link_map.length + " " + Math.round(tdist *dfactor) + " " + Math.round((temp_link_map.length*300) + (tdist*dfactor/4.0)); 
    debug(false,ostring);
}

function ufo_debug_pathcommit() {
    var plist = temp_link_map.toString();
    console.log(plist);
    temp_link_map = [];
    map_finish();
}

function invert_stopnodes() {
    var sn = Object.keys(stopnodes);
    var siv = {};
    console.log("inverting stopnodes");

    for(var i=0;i<sn.length;i++) {
        siv[stopnodes[sn[i]]] = sn[i];
    }
    console.log(siv);
}

function check_weak_nodes() {
    for(var i=0;i<ufo_stops.length;i++) {
        var aml = Object.keys(ufo_stops[i].adjacencies);
        if(aml.length<4) {
            console.log(i);
        }
    }
}


function ufo_scrublink(link) {
    var aml = Object.keys(adjmap);
    for(var i=0;i<aml.length;i++) {
        if(i%20==0) {
            console.log(i/aml.length);
        }
        var delkey = false;
        for(var j=0;j<adjmap[aml[i]].length;j++) {
            if(adjmap[aml[i]][j]==link) {
                delkey = true;
            }
        }
        if(delkey==true) {
            delete adjmap[aml[i]];
        }
    }
}

function check_duplicate_nodes() {
    var nkeys = Object.keys(lastmile_nodes);
    var nkeymap = {};
    var kidsum = 0;
    var ksum = 0;
    for(var i=0;i<nkeys.length;i++) {
        ksum+=i;
        kidsum+=parseInt(nkeys[i]);
        if(nkeymap[nkeys[i]]==undefined) {
            nkeymap[nkeys[i]]=true;
        }
        else {
            console.log(nkeys[i]);
        }
    }
    console.log(nkeys.length,ksum,kidsum);
}

function test_nodes() {
    for(var i=1;i<900;i++) {
        var nid = "00"+i;
        var nidm = nid.substr(-3);
        if(lastmile_nodes[nidm]==undefined) {
            console.log(nidm);
        }
    }
}

function reportout() {
    var usd = [];
    for(var i=0;i<ufo_stops.length;i++) {
        usd.push([i,ufo_stops[i].eta,ufo_stops[i].tourid]);
    }
    console.log(usd);
}

function list_selected() {
    var sn = [];
    for(var i=0;i<ufo_stops.length;i++) {
        if(ufo_stops[i].active==true) {
            sn.push(i);
        }
    }
    console.log(sn);
}

function check_link_coverage() {
    var aml = Object.keys(adjmap);
    var mlused = {};
    for(var i=0;i<aml.length;i++) {
        var asub = adjmap[aml[i]];
        for(var j=0;j<asub.length;j++) {
            mlused[asub[j]]=true;
        }
    }
    console.log(Object.keys(mlused).length);
    var ml = Object.keys(lastmile_paths);
    var mlunused = {};
    for(var i=0;i<ml.length;i++) {
        if(mlused[ml[i]]==undefined) {
            mlunused[ml[i]]=true;
            delete lastmile_paths[ml[i]];
            delete lastmile_distances[ml[i]];
        }
    }
    console.log(Object.keys(mlunused).length);
}

function check_route_link_coverage() {
    var mlused = {};
    var seqs = [5,6,7,8];
    for(var i=0;i<seqs.length;i++) {
        var subs = ufo_sequences[seqs[i]];
        for(j=0;j<subs.length;j++) {
            var subr = subs[j];
            mlused["d0-"+subr[0]] = true;
            for(var k=0;k<subr.length-1;k++) {
                mlused[subr[k]+"-"+subr[k+1]]=true;
            }
            mlused[subr[subr.length-1]+"-d0"] = true;
        }
        var subs = ufo_appended_sequences[seqs[i]];
        for(j=0;j<subs.length;j++) {
            var subr = subs[j][1];
            mlused["d0-"+subr[0]] = true;
            for(var k=0;k<subr.length-1;k++) {
                mlused[subr[k]+"-"+subr[k+1]]=true;
            }
            mlused[subr[subr.length-1]+"-d0"] = true;
        }
    }
    console.log(mlused);
    console.log(Object.keys(mlused).length);
    var mlkeys = Object.keys(adjmap);
    for(var i=0;i<mlkeys.length;i++) {
        if(mlused[mlkeys[i]]==undefined) {
            delete adjmap[mlkeys[i]];
        }
    }
}

function depot_to_all_stops() {
    var snids = Object.keys(stopnodes);
    for(var i=0;i<snids.length;i++) {
        var r = ufo_router({start:819,finish:snids[i],ignore:true});
        if (r != false) {
            // If this returned an "array" instead of false, then we have a valid adjacency
            var adjmap_paths = [];
            for (var s = 0; s < r.length - 1; s++) {
                if (lastmile_paths[r[s] + "-" + r[s + 1]] != undefined) {
                    adjmap_paths.push(r[s] + "-" + r[s + 1]);
                }
                else {
                    console.log("error in adjacency router");
                }
            }
            adjmap["d0-" + stopnodes[snids[i]]] = adjmap_paths;
        }
    }
}

function all_stops_to_depot() {
    var snids = Object.keys(stopnodes);
    for(var i=0;i<snids.length;i++) {
        var r = ufo_router({finish:819,start:snids[i],ignore:true});
        if (r != false) {
            // If this returned an "array" instead of false, then we have a valid adjacency
            var adjmap_paths = [];
            for (var s = 0; s < r.length - 1; s++) {
                if (lastmile_paths[r[s] + "-" + r[s + 1]] != undefined) {
                    adjmap_paths.push(r[s] + "-" + r[s + 1]);
                }
                else {
                    console.log("error in adjacency router");
                }
            }
            adjmap[stopnodes[snids[i]]+"-d0"] = adjmap_paths;
        }
    }
}

function map_single_stop(s_id) {
    var snids = Object.keys(stopnodes);
    var r;
    for(var i=0;i<snids.length;i++) {
        r = ufo_router({start:s_id,finish:snids[i]});
        if(r!=false) {
            var adjmap_paths = [];
            for (var s = 0; s < r.length - 1; s++) {
                if (lastmile_paths[r[s] + "-" + r[s + 1]] != undefined) {
                    adjmap_paths.push(r[s] + "-" + r[s + 1]);
                }
                else {
                    console.log("error in adjacency router");
                }
            }
            adjmap[s_id + "-" + stopnodes[snids[i]]] = adjmap_paths;
        }
        r = ufo_router({start:snids[i],finish:s_id});
        if(r!=false) {
            var adjmap_paths = [];
            for (var s = 0; s < r.length - 1; s++) {
                if (lastmile_paths[r[s] + "-" + r[s + 1]] != undefined) {
                    adjmap_paths.push(r[s] + "-" + r[s + 1]);
                }
                else {
                    console.log("error in adjacency router");
                }
            }
            adjmap[stopnodes[snids[i]] + "-" + s_id] = adjmap_paths;
        }
    }
    r = ufo_router({finish:819,start:s_id,ignore:true});
    if (r != false) {
        // If this returned an "array" instead of false, then we have a valid adjacency
        var adjmap_paths = [];
        for (var s = 0; s < r.length - 1; s++) {
            if (lastmile_paths[r[s] + "-" + r[s + 1]] != undefined) {
                adjmap_paths.push(r[s] + "-" + r[s + 1]);
            }
            else {
                console.log("error in adjacency router");
            }
        }
        adjmap[s_id+"-d0"] = adjmap_paths;
    }
    r = ufo_router({finish:s_id,start:819,ignore:true});
    if (r != false) {
        // If this returned an "array" instead of false, then we have a valid adjacency
        var adjmap_paths = [];
        for (var s = 0; s < r.length - 1; s++) {
            if (lastmile_paths[r[s] + "-" + r[s + 1]] != undefined) {
                adjmap_paths.push(r[s] + "-" + r[s + 1]);
            }
            else {
                console.log("error in adjacency router");
            }
        }
        adjmap["d0-"+s_id] = adjmap_paths;
    }
}

function paintlink() {
    var lar =["w0-d0","d0-2","2-35","35-33","33-31","31-9","9-100","100-10","10-25","25-23","23-96","96-11","11-99","99-91","91-93","93-21","21-22","22-12","12-8","8-32","32-5","5-7","7-4","4-34","34-d0","d0-w0"];
    for(var i=0;i<lar.length;i++) {
        ufo_draw_path({complex:true,paths:adjmap[lar[i]],width:2,color:"rgba(0,0,0,.9)"});
    }
    lar = [
        "w0-d0",
        "d0-92",
        "92-42",
        "42-102",
        "102-74",
        "74-77",
        "77-114",
        "114-115",
        "115-85",
        "85-84",
        "84-90",
        "90-112",
        "112-111",
        "111-89",
        "89-49",
        "49-41",
        "41-88",
        "88-83",
        "83-82",
        "82-87",
        "87-43",
        "43-86",
        "86-79",
        "79-81",
        "81-78",
        "78-75",
        "75-80",
        "80-d0",
        "d0-w0"
      ];
      for(var i=0;i<lar.length;i++) {
        ufo_draw_path({complex:true,paths:adjmap[lar[i]],width:2,color:"rgba(0,0,0,.9)"});
    }
    lar = [
        "w0-d0",
        "d0-46",
        "46-76",
        "76-118",
        "118-116",
        "116-117",
        "117-119",
        "119-120",
        "120-106",
        "106-109",
        "109-3",
        "3-1",
        "1-28",
        "28-27",
        "27-0",
        "0-37",
        "37-52",
        "52-38",
        "38-36",
        "36-108",
        "108-107",
        "107-73",
        "73-72",
        "72-45",
        "45-51",
        "51-39",
        "39-50",
        "50-40",
        "40-d0",
        "d0-w0"
      ];
      for(var i=0;i<lar.length;i++) {
        ufo_draw_path({complex:true,paths:adjmap[lar[i]],width:2,color:"rgba(0,0,0,.9)"});
    }
    lar = [
        "w0-d0",
        "d0-29",
        "29-30",
        "30-26",
        "26-13",
        "13-17",
        "17-70",
        "70-71",
        "71-97",
        "97-105",
        "105-16",
        "16-14",
        "14-103",
        "103-104",
        "104-98",
        "98-15",
        "15-20",
        "20-101",
        "101-19",
        "19-94",
        "94-18",
        "18-24",
        "24-95",
        "95-d0",
        "d0-w0"
      ];
      for(var i=0;i<lar.length;i++) {
        ufo_draw_path({complex:true,paths:adjmap[lar[i]],width:2,color:"rgba(0,0,0,.9)"});
    }
    lar = [
        "w0-d0",
        "d0-47",
        "47-48",
        "48-110",
        "110-113",
        "113-44",
        "44-55",
        "55-54",
        "54-59",
        "59-58",
        "58-60",
        "60-56",
        "56-61",
        "61-64",
        "64-65",
        "65-62",
        "62-63",
        "63-66",
        "66-69",
        "69-67",
        "67-68",
        "68-6",
        "6-57",
        "57-53",
        "53-d0",
        "d0-w0"
      ];
      for(var i=0;i<lar.length;i++) {
        ufo_draw_path({complex:true,paths:adjmap[lar[i]],width:2,color:"rgba(0,0,0,.9)"});
    }
}

function add_truck() {
    ufo_draw_path({"caller":"fname","id":["truckroute"],"complex":false,color:"#467cd4"});
    var start_svg = $("<div />");
    var spos = get_normalized_coord(lastmile_paths["truckroute"][0]);
    var dx = (mcx) + ((spos[1] - normalized_origin[1]) * 512);
    var dy = (1024) + ((spos[0] - normalized_origin[0]) * 512);
    $(start_svg).css({"background-image":"url(./images/start.svg","background-repeat":"no-repeat","background-size":"100%","display":"block","width":"32px","height":"48px","position":"absolute","left":dx-16,"top":dy-38});
    var end_svg = $("<div />");
    var fpos = get_normalized_coord(lastmile_paths["truckroute"][528]);
    var dbx = (mcx) + ((fpos[1] - normalized_origin[1]) * 512);
    var dby = (1024) + ((fpos[0] - normalized_origin[0]) * 512);
    $(end_svg).css({"background-image":"url(./images/finish.svg","background-repeat":"no-repeat","background-size":"100%","display":"block","width":"32px","height":"48px","position":"absolute","left":dbx-16,"top":dby-38});

    var truck_svg = $("<div />");
    var tpos = get_normalized_coord(lastmile_paths["truckroute"][138]);
    var dcx = (mcx) + ((tpos[1] - normalized_origin[1]) * 512);
    var dcy = (1024) + ((tpos[0] - normalized_origin[0]) * 512);
    $(truck_svg).css({"z-index":"500","background-image":"url(./images/truck.png","background-repeat":"no-repeat","background-size":"100%","background-color":"var(--hereufoblue)","display":"block","width":"40px","border-radius":"20px","height":"40px","position":"absolute","left":dcx-20,"top":dcy-20});

    $("#map_canvas").append(start_svg);
    $("#map_canvas").append(end_svg);
    $("#map_canvas").append(truck_svg);
    console.log(spos,dx,dy);
}

function add_final_route() {
    var fins = ["m01","m02","m03","m04","m05","m06","m07","m08","m09","m10","m11","m12","m13","m14","m15","m16","m17","m18","m19","m20","m21"];
    var fwdth = [0,0,25,25,25,25,30,24,35,64,25,32,52,40,50,45,40,65,50]
    for(var i=0;i<fins.length;i++){
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#333333","width":4});
    }
    for(var i=0;i<3;i++) {
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#06b87c","width":3});
    }
    for(var i=3;i<6;i++) {
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#44ca9d","width":3});
    }
    for(var i=6;i<9;i++) {
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#82dbbd","width":3});
    }
    for(var i=9;i<11;i++) {
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#fbca40","width":3});
    }
    for(var i=11;i<14;i++) {
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#fab800","width":3});
    }
    for(var i=14;i<16;i++) {
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#f1894a","width":3});
    }
    for(var i=16;i<18;i++) {
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#ec610e","width":3});
    }
    for(var i=18;i<20;i++) {
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#c41c33","width":3});
    }
    for(var i=20;i<fins.length;i++) {
        ufo_draw_path({"caller":"fname","id":[fins[i]],"complex":false,color:"#ec610e","width":3});
    }
    for(var i=2;i<fins.length-1;i++) {
        var micon = $("<div />",{"class":"marker_icon"});
        var tpos = get_normalized_coord(lastmile_paths[fins[i]][0]);
        var dcx = (mcx) + ((tpos[1] - normalized_origin[1]) * 512);
        var dcy = (1024) + ((tpos[0] - normalized_origin[0]) * 512);
        $(micon).css({"z-index":"500","background-image":"none","border-color":"var(--herewhite)","border-width":"3px","background-color":"rgba(106,109,116,.6)","position":"absolute","width":fwdth[i],"height":fwdth[i],"left":dcx-6-(fwdth[i]/2),"top":dcy-6-(fwdth[i]/2)});
        if(i==15) {
            $(micon).append("<div class=\"ufo_pda_stop\" style=\"left: 56.966px; top: 20.983px;\"><div class=\"ufo_pda_stop_name\">Giuliana Galarza Quintanilla</div><div class=\"ufo_pda_stop_addr\">Calle Corregidor José Viciana, 10</div><div class=\"ufo_pda_stop_range\">Scheduled time: <span>9:30-10:30</span></div><div class=\"ufo_pda_stop_actual\">Actual: <span>9:56</span></div><div class=\"ufo_pda_stop_actual\">Signed by: <span>Giuliana Galarza</span></div><div class=\"ufo_pda_stop_range\">Projected job time: <span>5 minutes</span></div><div class=\"ufo_pda_stop_actual\">Actual job time: <span>5.8 minutes</span></div></div>");
        }
        $("#map_canvas").append(micon);
    }

    var tpos = get_normalized_coord(lastmile_paths[fins[1]][0]);
    var dcx = (mcx) + ((tpos[1] - normalized_origin[1]) * 512);
    var dcy = (1024) + ((tpos[0] - normalized_origin[0]) * 512);
    $("#marker_ufostop_d0").css({"left":dcx-17,"top":dcy-18});
    $("#map_canvas").append($("#marker_ufostop_d0"));

    var tpos = get_normalized_coord(lastmile_paths[fins[0]][0]);
    var dcx = (mcx) + ((tpos[1] - normalized_origin[1]) * 512);
    var dcy = (1024) + ((tpos[0] - normalized_origin[0]) * 512);
    $("#marker_ufostop_w0").css({"left":dcx-17,"top":dcy-17,"z-index":"500"});
    $("#map_canvas").append($("#marker_ufostop_w0"));
    //ec610e

    /*
                tcx.strokeStyle = "rgba(236,97,14,"+alpha+")"; // "#ec610e";
            }
            else if(tidx[i]>(max_delay*.5)) {
                tcx.strokeStyle = "rgba(241,137,74,"+alpha+")"; // "#f1894a";
            }
            else if(tidx[i]>(max_delay*.33)) {
                tcx.strokeStyle = "rgba(250,184,0,"+alpha+")"; // "#";
            }
            else if(tidx[i]>(max_delay*.25)) {
                tcx.strokeStyle = "rgba(251,202,64,"+alpha+")"; // "#fbca40";
            }
            else if(tidx[i]>(max_delay*.16)) {
                tcx.strokeStyle = "rgba(130,219,189,"+alpha+")"; // "#";
            }
            else if(tidx[i]>(max_delay*.08)) {
                tcx.strokeStyle = "rgba(68,202,157,"+alpha+")"; // "#44ca9d";
            }
            else {
                tcx.strokeStyle = "rgba(6,184,124,"+alpha+")"; // "#06b87c";
    */
}