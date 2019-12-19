#!/usr/bin/env python

vcomp = -20000
hcomp = 15000
zlevel = 20
hmid = -300000.0
vmid = -400000.0
divisor = 3.788
loc = "lastmile"

# cks = {
#     "tn_high":{
#         "width":2,
#         "style":"D83524",
#         "paths":["t1","t2","t7","t8","t13","t16","t22","t41","t46","t49","t59","t60","t62","t64","t67","t79","t94","t97","t106","t111","t115","t133","t149","t154","t171","t177","t187","t189","t194","t200","t207","t216","t219","t223","t229","t236","t246","t247","t250","t254"]
#     },
#     "tn_lo":{
#         "width":1,
#         "style":"D83524",
#         "paths":["t0","t3","t4","t5","t6","t9","t10","t11","t12","t14","t15","t17","t18","t19","t20","t21","t23","t24","t25","t26","t27","t28","t29","t30","t31","t32","t33","t34","t35","t36","t37","t38","t39","t40","t42","t43","t44","t45","t47","t48","t50","t51","t52","t53","t54","t55","t56","t57","t58","t61","t63","t65","t66","t68","t69","t70","t71","t72","t73","t74","t75","t76","t77","t78","t80","t81","t82","t83","t84","t85","t86","t87","t88","t89","t90","t91","t92","t93","t95","t96","t98","t99","t100","t101","t102","t103","t104","t105","t107","t108","t109","t110","t112","t113","t114","t116","t117","t118","t119","t120","t121","t122","t123","t124","t125","t126","t127","t128","t129","t130","t131","t132","t134","t135","t136","t137","t138","t139","t140","t141","t142","t143","t144","t145","t146","t147","t148","t150","t151","t152","t153","t155","t156","t157","t158","t159","t160","t161","t162","t163","t164","t165","t166","t167","t168","t169","t170","t172","t173","t174","t175","t176","t178","t179","t180","t181","t182","t183","t184","t185","t186","t188","t190","t191","t192","t193","t195","t196","t197","t198","t199","t201","t202","t203","t204","t205","t206","t208","t209","t210","t211","t212","t213","t214","t215","t217","t218","t220","t221","t222","t224","t225","t226","t227","t228","t230","t231","t232","t233","t234","t235","t237","t238","t239","t240","t241","t242","t243","t244","t245","t248","t249","t251","t252","t253","t255","t256","t257"]
#     }
# }

cks = {
    "LinksA":{
        "width":3,
        "style":"FF5E00",
        "paths":[]
    },
    "LinksB":{
        "width":3,
        "style":"FF5E00",
        "paths":[]
    },
    "LinksC":{
        "width":3,
        "style":"FF5E00",
        "paths":[]
    }
}

# cks = {
#     "routes":{
#         "width":3,
#         "style":"EFE700",
#         "paths":[]
#     },
#     "pois":{
#         "width":1,
#         "style":"08c5a6",
#         "paths":["annies_1","annies_2","kerry_out_1","stachs_1","threesheets_1","threesheets_2","beachcomb_lot","beachcomb_1","cochinillo_1","cochinillo_2","cochinillo_3","greatwall_1","dock","bdg1","bdg1_lot","bdg2","bdg3","bdg3_0","bdg3_lot"]
#     },
#     "Minor":{
#         "width":5.0,
#         "style":"FF5E00",
#         "paths":["kydonia_blvd","monroe_st","kalapuya_st","jackson_st","adams_st","mckinley_st","fillmore_st","grant_st","roosevelt_st","lincoln_st","taylor_st","1st_ave","1st_ave_0","2nd_ave","3rd_ave","4th_ave","5th_ave","park_blvd","new_school_st","5th_ave_0","6th_ave","7th_ave","7th_ave_0","old_lincoln","old_lincoln_0","lincoln_st_0","bay_st_0","washington_st_0"]
#     },
#     "Major":{
#         "width":7.0,
#         "style":"EFE700",
#         "paths":["bay_st","state_st","washington_st","jefferson_st","wilson_st"]
#     },
#     "Highway":{
#         "width":9.0,
#         "style":"B34C29",
#         "paths":["us101","us520"]
#     },
#     "geos":{
#         "width":2,
#         "style":"18AD69",
#         "paths":["us101","us520"]
#     },
#     "vehicles":{
#         "width":.1,
#         "style":"08c5a6",
#         "paths":["annies_1","annies_2","kerry_out_1","stachs_1","threesheets_1","threesheets_2","beachcomb_lot","beachcomb_1","cochinillo_1","cochinillo_2","cochinillo_3","greatwall_1","dock","bdg1","bdg1_lot","bdg2","bdg3","bdg3_0","bdg3_lot"]
#     },
#     "terrain":{
#         "width":.5,
#         "style":"CD3C1F",
#         "paths":["annies_1","annies_2","kerry_out_1","stachs_1","threesheets_1","threesheets_2","beachcomb_lot","beachcomb_1","cochinillo_1","cochinillo_2","cochinillo_3","greatwall_1","dock","bdg1","bdg1_lot","bdg2","bdg3","bdg3_0","bdg3_lot"]
#     },
# }

# cks = {
# 	"tn_neighborhoods":{
#         "width":2,
#         "style":"08C5A6",
#         "paths":["tn_sylvethia_east","tn_bellharbor","tn_butcher","tn_cassalmure","tn_coopersrace","tn_eastern","tn_giltland","tn_gotalvia","tn_kalveth_docks","tn_king_enthar_docks","tn_new","tn_old","tn_ralcarry","tn_silkrow","tn_tallachet","tn_tammanchase","tn_barnardech","tn_danreth"]
#     },
# 	"tn_major":{
#         "width":3,
#         "style":"FC00FA",
#         "paths":["chenwyck_st","north_chenwyck_st","broad_st_0","broad_st_1","tallachet_circle","procession_st_0","procession_st_1","danharral_st","coral_st","kasteri_ave","two_cross_st","duke_st","duke_circle","iron_street","gate_loop","royal_st","duke_st_0","galith_st","coopers_st","temple_st","aemer_st","silver_st","corrow_st","bank_st","darlan_st","broad_st_2","broad_st_3","broad_st_4","broad_st_5","royal_circle","perral_square","pike_circle","coral_place","coral_st_0","coral_st_1","coral_st_2","barcani_st","tamman_st","tamman_circle_0","tamman_circle_1","tn_major_0","tn_major_1","tn_major_2","tn_major_3","tn_major_4","tn_major_5","tn_major_6","tn_major_7","tn_major_8","tn_major_9","tn_major_10","tn_major_11","tn_major_12","tn_major_13","tn_major_14","tn_major_15","tn_major_16","tn_major_17","tn_major_18","tn_major_19","tn_major_20","tn_major_21","tn_major_22","tn_major_23","tn_major_24","tn_major_25","tn_major_26","tn_major_27","tn_major_28","tn_major_29","tn_major_30","tn_major_31","tn_major_32","tn_major_33","marjure_st"]
#     },
# 	"tn_minor":{
#         "width":2,
#         "style":"FC00FA",
#         "paths":["gray_st","oldcanal_st","lisser_ave","moss_rd","church_rd","glenmarran","glenmarran_small","sylveth_st","tallachet_st","garsalla_ave","monger_st","rawlon_st","coopersrace_ave","bloom_st","bloom_st_0","tn_minor_0","tn_minor_1","tn_minor_2","tn_minor_3","tn_minor_4","tn_minor_5","tn_minor_6","tn_minor_7","tn_minor_8","tn_minor_9","tn_minor_10","tn_minor_11","tn_minor_12","tn_minor_13","tn_minor_14","tn_minor_15","tn_minor_16","tn_minor_17","tn_minor_18","tn_minor_19","tn_minor_20","tn_minor_21","tn_minor_22","tn_minor_23","tn_minor_24","tn_minor_25","tn_minor_26","tn_minor_27","tn_minor_28","tn_minor_29","tn_minor_30","tn_minor_31","tn_minor_32","tn_minor_33","tn_minor_34","tn_minor_35","tn_minor_36","tn_minor_37","tn_minor_38","tn_minor_39","tn_minor_40","tn_minor_41","tn_minor_42","tn_minor_43","tn_minor_44","tn_minor_45","tn_minor_46","tn_minor_47","tn_minor_48","tn_minor_49","tn_minor_50","tn_minor_51","tn_minor_52","tn_minor_53","tn_minor_54","tn_minor_55","tn_minor_56","tn_minor_57","tn_minor_58","tn_minor_59","tn_minor_60","tn_minor_61","tn_minor_62","tn_minor_63","tn_minor_64","tn_minor_65","tn_minor_66","tn_minor_67","tn_minor_68","tn_minor_69","tn_minor_70","tn_minor_71","tn_minor_72"]
#     }
# }