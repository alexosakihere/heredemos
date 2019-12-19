#!/usr/bin/env python

from xml.dom import minidom
#import utm
import pyproj
import math

loc = "lastmile"
limit = 1
ydisp = .00001
xdisp = .00001


xmldoc = minidom.parse("{}.kml".format(loc))

total_links = 0
all_nodes = []
all_links = []
all_dist = []
all_oneway = []
all_styles = {}
epsg = pyproj.Proj("+init=EPSG:4326")

output=open("./scripts/{}_paths.js".format(loc),"w")
output_bb=open("./{}_bb.js".format(loc),"w")

def normutm(x,y):
	# Returns a UTM coordinate normalized against one global map
	# That is, without concern for latitude band and sector
	global ydisp
	global xdisp
	global epsg
	
	ageo = epsg(float(x),float(y))
	#adjy = ydisp * ageo[1]
	#if(ord(ageo[3])<78):
	#	adjy = ydisp*(0-(10000000-ageo[1]))
	#else:
	#	adjy = ydisp * ageo[1]
	#adjx = xdisp * (((ageo[2]-1)*660000)+ageo[0])
	adjx = (ageo[0]+math.pi)*100
	adjy = (ageo[1]+(.5*math.pi))*100
	return [adjx,adjy]

class node:
	def __init__ (self,x,y,m):
		global total_links
		self.lat=float(y)
		self.lon=float(x)
		self.links=[]
		self.m=m
		self.id = total_links
		self.name=""
		total_links = total_links+1
		ageo = normutm(self.lat,self.lon)
		self.y = ageo[1]
		self.x = ageo[0]
	def add_link(self,l):
		new_link = True
		for existing in self.links:
			if existing==l:
				new_link = False
		if new_link==True:
			self.links.append(l)
	def close_enough(self,x,y):
		is_closeenough = False
		ageo = utm.from_latlon(float(y),float(x))
		ny = ydisp * ageo[1]
		nx = xdisp * (((ageo[2]-1)*1000000)+ageo[0])
		ox = float(self.x)
		oy = float(self.y)
		d = math.sqrt(((nx-ox)**2)+((ny-oy)**2))
		if d<self.m:
			is_closeenough = True
		#print(nx,ny,ox,oy,d)
		return is_closeenough

class link:
	def __init__ (self):
		self.start=0
		self.end=0
		self.points=[]
		self.length=0
		self.fc=0
		

def cdist(a,b):
	# returns the distance between two point pairs a=[x,y] b=[x,y]
	x1=float(a[0])
	x2=float(b[0])
	y1=float(a[1])
	y2=float(b[1])
	return math.sqrt(((y2-y1)**2)+((x2-x1)**2))

def offlat(utm):
# Returns a universalised coordinate for UTM by adding in a correction factor for letter zones
	adjust_factor = ord(utm)-68
	return 10000000*adjust_factor

def nodeid(x,y):
# Returns the id of the node in all_nodes
	mdist = 10000000
	n_id = -1
	for n in all_nodes:
		n_dist = cdist([x,y],[n.x,n.y])
		#print(x,y)
		#n_dist = cdist([x,y],[n.lon,n.lat])
		if n_dist<mdist:
			mdist = n_dist
			n_id = n.id
	if mdist < limit:
		return n_id
	else:
		return False

def isnum(s):
	try:
		float(s)
		return True
	except ValueError:
		return False

stylewidthmap = {} # this will contain a list of widths for every style
stylemaplist = xmldoc.getElementsByTagName("StyleMap")
stylelist = xmldoc.getElementsByTagName("Style")
for s in stylemaplist:
	#print(s.getAttribute("id"))
	surl = s.getElementsByTagName("styleUrl")[0].childNodes[0].nodeValue[1:]
	for u in stylelist:
		if u.getAttribute("id") == surl:
			sidw = u.getElementsByTagName("width")
			if(len(sidw)>0):
				stylewidthmap[s.getAttribute("id")] = sidw[0].childNodes[0].nodeValue
			else:
				stylewidthmap[s.getAttribute("id")] = 1
	#style = xmldoc.getElementById(surl)
	#print(surl,style)
	#print(sid)
	#sidw = sid.getElementsByTagName("width")
	#if(len(sidw)>0):
	#	print(sidw)

widthtwo = [] # stores the list of all things that have a width = 2

pathslist = xmldoc.getElementsByTagName("Placemark")
for p in pathslist:
	
	path = p.getElementsByTagName("coordinates")[0].childNodes[0].nodeValue.strip().split(" ")
	sname = p.getElementsByTagName("name")[0].childNodes[0].nodeValue
	# For this, we're looking for link nodes
	if sname[:1] == "t" and sname[1:].isdigit() == True:
		pstyle = p.getElementsByTagName("styleUrl")[0].childNodes[0].nodeValue[1:]
	#print(stylewidthmap[pstyle])
		if int(stylewidthmap[pstyle]) == 2:
			widthtwo.append(sname)
	if sname[:1] != "s":
		# Special restriction for lastmile to cull "stop"
		points = []
		rlen = 0.0
		for i in range(0,len(path)):
			v = path[i]
			geo = v.split(",")
			if(i>0):
				ov = path[i-1]
				ogeo = ov.split(",")
				interdist = math.sqrt( (float(geo[1])-float(ogeo[1]))**2 + (float(geo[0])-float(ogeo[0]))**2)
				rlen = rlen + interdist 
			points.append([geo[1],geo[0]])
		if len(sname) == 3:
			all_nodes.append([sname,points])
		else:
			if sname[:1] == "!":
				sname = sname[1:]
				all_links.append([sname,points])
				all_dist.append([sname,rlen])
				all_oneway.append([sname])
				sn = sname.split("-")
				snametwo = "{}-{}".format(sn[1],sn[0])
				all_dist.append([snametwo,rlen])
			else:
				sn = sname.split("-")
				snametwo = "{}-{}".format(sn[1],sn[0])
				all_links.append([sname,points])
				all_dist.append([sname,rlen])
				pointstwo = []
				for i in range(1,len(points)+1):
					pointstwo.append(points[len(points)-i])
				all_links.append([snametwo,pointstwo])
				all_dist.append([snametwo,rlen])

#print(widthtwo)

output.write("lastmile_nodes = {\n")
for j in range(0,len(all_nodes)):
	l = all_nodes[j]
	output.write("\"{}\":[".format(l[0]))
	for i in range(0,len(l[1])):
		s = l[1][i]
		output.write("{},{}".format(s[0],s[1]))
		if(i<len(l[1])-1):
			output.write(",")
		else:
			output.write("]")
	if(j<len(all_nodes)-1):
		output.write(",\n")
	else:
		output.write("\n};\n")

output.write("lastmile_distances = {\n")
for j in range(0,len(all_dist)):
	l = all_dist[j]
	output.write("\"{}\":{}".format(l[0],l[1]))
	if(j<len(all_dist)-1):
		output.write(",\n")
	else:
		output.write("\n};\n")

output.write("lastmile_paths = {\n")
output_bb.write("map_bbs = {\n")
for j in range(0,len(all_links)):
	l = all_links[j]
	output.write("\"{}\":[".format(l[0]))
	latmin = 1000.0
	latmax = 0.0
	lonmin = 1000.0
	lonmax = -1000.0
	for i in range(0,len(l[1])):
		s = l[1][i]
		lat = float(s[0])
		lon = float(s[1])
		if(lat<latmin):
			latmin = lat
		if(lat>latmax):
			latmax = lat
		if(lon<lonmin):
			lonmin = lon
		if(lon>lonmax):
			lonmax = lon
		output.write("[{},{}]".format(s[0],s[1]))
		if(i<len(l[1])-1):
			output.write(",")
		else:
			output.write("]")
	output_bb.write("\"{}\":[{},{},{},{}]".format(l[0],latmin,latmax,lonmin,lonmax))
	if(j<len(all_links)-1):
		output.write(",\n")
		output_bb.write(",\n")
	else:
		output.write("\n};\n")
		output_bb.write("\n};\n")

output.write("const lastmile_oneways = new Set([")
for j in range(0,len(all_oneway)):
	l = all_oneway[j]
	output.write("\"{}\"".format(l[0]))
	if(j<len(all_oneway)-1):
		output.write(",")
	else:
		output.write("]);\n")

output.close()
output_bb.close()

for i in range(827,839):
	print("    \"{}\":\"{}\",".format(i,i-718))

for i in range(825,837):
	l = all_nodes[i]
	print("    {}:{{lat: {},lon: {},recipient:\"NNNNN\",addr: \"{} {}\",time: 0,availablefrom:\"7:30\",meta: [\"0kg\"],limits: {{ timecritical:false, refrigerated:false, heavy:false, fragile:false }}}},".format(int(l[0])-718,l[1][0][0],l[1][0][1],l[1][0][0],l[1][0][1]))