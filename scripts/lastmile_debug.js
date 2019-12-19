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