import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
BASE = str(ROOT / "floria_awakening_garden.blend")
OUT = str(ROOT / "floria_awakening_garden_gameplay.blend")
PREVIEW = str(ROOT / "floria_awakening_garden_gameplay_preview.png")
COMBAT_PREVIEW = str(ROOT / "floria_awakening_garden_combat_preview.png")

bpy.ops.wm.open_mainfile(filepath=BASE)
scene = bpy.context.scene
cam = scene.camera


def mat(name, color, rough=.75, emission=None, metallic=0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    n = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    n.inputs['Base Color'].default_value = (*color, 1)
    n.inputs['Roughness'].default_value = rough
    n.inputs['Metallic'].default_value = metallic
    if emission:
        n.inputs['Emission Color'].default_value = (*emission, 1)
        n.inputs['Emission Strength'].default_value = 2.0
    return m


def assign(o, m):
    o.data.materials.append(m)
    return o


def cube(name, loc, scale, material, bevel=.12, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o=bpy.context.view_layer.objects.active; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b=o.modifiers.new('Hand_Painted_Edges','BEVEL'); b.width=bevel; b.segments=2
    assign(o, material)
    return o


def cyl(name, loc, radius, depth, material, vertices=12, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    o=bpy.context.view_layer.objects.active; o.name=name; assign(o,material); return o


def sphere(name, loc, scale, material):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=loc)
    o=bpy.context.view_layer.objects.active; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(o,material)
    for p in o.data.polygons: p.use_smooth=True
    return o


def cone(name, loc, r1, r2, depth, material, vertices=10, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o=bpy.context.view_layer.objects.active; o.name=name; assign(o,material); return o


def cutout_material(name, image_path):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    nodes=m.node_tree.nodes; links=m.node_tree.links
    nodes.clear()
    out=nodes.new('ShaderNodeOutputMaterial')
    bsdf=nodes.new('ShaderNodeBsdfPrincipled')
    tex=nodes.new('ShaderNodeTexImage')
    tex.image=bpy.data.images.load(image_path, check_existing=True)
    tex.interpolation='Linear'
    dist=nodes.new('ShaderNodeVectorMath'); dist.operation='DISTANCE'
    dist.inputs[1].default_value=(1,1,1)
    ramp=nodes.new('ShaderNodeValToRGB')
    # Enemy sheets contain a stronger gray vignette than the heroine sheets, so
    # they use a wider white/gray key. Colored silhouettes remain well separated.
    enemy_sheet='\\enemy\\' in image_path.lower()
    ramp.color_ramp.elements[0].position=.29 if enemy_sheet else .12
    ramp.color_ramp.elements[0].color=(0,0,0,1)
    ramp.color_ramp.elements[1].position=.37 if enemy_sheet else .20
    ramp.color_ramp.elements[1].color=(1,1,1,1)
    links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(tex.outputs['Color'], dist.inputs[0])
    links.new(dist.outputs['Value'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bsdf.inputs['Alpha'])
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Roughness'].default_value=.68
    bsdf.inputs['Emission Strength'].default_value=.12
    links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
    try: m.blend_method='BLEND'
    except: pass
    try: m.shadow_method='HASHED'
    except: pass
    m.use_screen_refraction=True
    return m


def billboard(name, image_path, loc, width=1.55, height=2.25, crop=(.035,.40,.54,.96), gameplay_type='character'):
    u0,u1,v0,v1=crop
    verts=[(-width/2,-height/2,0),(width/2,-height/2,0),(width/2,height/2,0),(-width/2,height/2,0)]
    mesh=bpy.data.meshes.new(name+'_Mesh')
    mesh.from_pydata(verts,[],[(0,1,2,3)]); mesh.update()
    uv=mesh.uv_layers.new(name='CropUV')
    for loop,co in zip(mesh.loops,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):
        uv.data[loop.index].uv=co
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o)
    o.location=(loc[0],loc[1],loc[2]+height*.53)
    toward=cam.location-o.location
    o.rotation_euler=toward.to_track_quat('Z','Y').to_euler()
    assign(o,cutout_material(name+'_Art',image_path))
    o['gameplay_type']=gameplay_type
    o['source_image']=image_path
    return o


wood=mat('Asset_Warm_Wood',(.42,.20,.065),.9)
wood_light=mat('Asset_Cut_Wood',(.67,.40,.16),.85)
rope=mat('Asset_Rope',(.39,.25,.10),1)
stone=mat('Asset_Ruin_Stone',(.48,.50,.43),.95)
moss=mat('Asset_Moss',(.18,.46,.12),.95)
reed=mat('Asset_Reed',(.23,.42,.08),.9)
mush=mat('Asset_Glow_Mushroom',(.30,.18,.75),.3,emission=(.20,.08,.8))
life=mat('Asset_Life_Seed',(.35,1.0,.35),.22,emission=(.15,.8,.2))
gold=mat('Asset_Objective_Gold',(1.0,.55,.05),.35,emission=(.7,.2,.01))

# Field-sheet inspired set dressing: repaired fence, log tunnel, stump and wetland flora.
for i in range(5):
    x=-20+i*1.35
    cyl('Field_Fence_Post',(x,-1.4,1.15),.15,1.6,wood,10)
    for z in (.8,1.35): cube('Field_Fence_Rail',(x+.62,-1.4,z),(.7,.09,.10),wood_light,.06)
for a in range(11):
    ang=a*math.tau/11
    cyl('Log_Tunnel_Segment',(11.7+math.cos(ang)*1.1,10.2,1.35+math.sin(ang)*1.1),.18,3.1,wood,9,rot=(math.pi/2,0,0))
cyl('Flowering_Stump',(-6,11.2,.95),1.25,1.9,wood_light,18)
for i in range(6):
    ang=i*math.tau/6
    sphere('Stump_Moss',(-6+math.cos(ang)*.75,11.2+math.sin(ang)*.75,1.95),(.42,.3,.16),moss)
for x,y,s in [(1,-9,.9),(3,-10,.65),(5,-9.3,.72),(4,-11,.55)]:
    cyl('Water_Reed',(x,y,.9*s),.06,1.7*s,reed,8)
    sphere('Lily_Pad',(x-.35,y+.2,.55),(.55,.42,.055),reed)
for x,y in [(8,-12),(9,-11.5),(10,-12.3),(-5,12),(-4.4,11.6)]:
    cyl('Glow_Mushroom_Stem',(x,y,.75),.09,.8,stone,8)
    sphere('Glow_Mushroom_Cap',(x,y,1.18),(.42,.42,.18),mush)

# Broken ruins expanded to match the supplied field concept sheet.
for x,y,h in [(10,-6.5,2.2),(11.3,-6.5,3.0),(18,-8,2.5)]:
    cube('Broken_Ruin_Block',(x,y,.65),(0.6,.7,.45),stone,.16,rot=(0,0,(x%2-.5)*.2))
    if h>2.5: cube('Broken_Ruin_Block',(x,y,1.55),(.55,.62,.42),stone,.14)
    sphere('Ruin_Moss_Patch',(x,y,h*.55),(.5,.45,.12),moss)

# Character cutouts: the upper-left idle pose from each supplied action sheet.
P=str(ROOT / "images" / "pikmin")+r"\ChatGPT Image 2026年7月18日 "
heroes=[
 ('Hero_Earth_Purple',P+'18_14_45.png',(-16.8,-9.5,.55),'earth'),
 ('Hero_Water_Blue',P+'18_14_53.png',(-15.0,-10.0,.55),'water'),
 ('Hero_Light_White',P+'18_15_04.png',(-13.2,-9.5,.55),'light'),
 ('Hero_Wind_Green',P+'18_15_09.png',(-16.0,-7.8,.55),'wind'),
 ('Hero_Lightning_Yellow',P+'18_15_15.png',(-14.2,-7.7,.55),'lightning'),
 ('Hero_Fire_Red',P+'18_15_20.png',(-12.4,-8.0,.55),'fire'),
]
for name,path,loc,attr in heroes:
    o=billboard(name,path,loc,1.55,2.25,(.035,.40,.54,.96),'party_member')
    o['attribute']=attr; o['state']='idle'; o['squad']='alpha'

# Enemy cutouts: three regular foes, a flying enemy, heavy enemy, and distant boss.
E=str(ROOT / "images" / "enemy")+r"\ChatGPT Image 2026年7月18日 "
enemies=[
 ('Enemy_LeafEater_A',E+'18_14_27.png',(-4,3,.55),1.7,2.05,'leaf_eater','normal'),
 ('Enemy_LeafEater_B',E+'18_14_27.png',(-1,5,.55),1.6,1.95,'leaf_eater','normal'),
 ('Enemy_SporeSlime',E+'18_14_22.png',(9,-2,.55),1.9,2.0,'spore_slime','poison'),
 ('Enemy_SpikedBeetle',E+'18_14_32.png',(13,-8,.55),2.2,2.15,'spiked_beetle','armored'),
 ('Enemy_PollenBat',E+'18_13_55.png',(8,8,3.0),2.2,2.15,'pollen_bat','flying'),
 ('Enemy_MossGolem',E+'18_14_01.png',(18,-10,.55),2.5,2.8,'moss_golem','elite'),
 ('Boss_RotBloom',E+'18_13_50.png',(14,11,.55),3.2,3.2,'rot_bloom','boss'),
]
for name,path,loc,w,h,etype,tier in enemies:
    o=billboard(name,path,loc,w,h,(.025,.48,.56,.97),'enemy')
    o['enemy_type']=etype; o['tier']=tier; o['state']='idle'

# Collectibles and objective readability.
for i,(x,y) in enumerate([(-8,-3),(-2,1),(5,4),(10,6),(14,-4)]):
    cone('Life_Seed_%02d'%i,(x,y,1.15),.28,0,1.2,life,6)
    bpy.context.view_layer.objects.active['gameplay_type']='collectible_life_seed'
for i in range(8):
    a=i*math.tau/8
    cone('Boss_Gate_Petal',(14+math.cos(a)*3.2,11+math.sin(a)*2.6,.85),.25,0,.85,gold,6)

# Route markers communicate the tutorial loop in a still image.
for i,(x,y) in enumerate([(-10,-4),(-6,-2),(0,0),(5,2),(9,5)]):
    sphere('Route_Glow_%02d'%i,(x,y,.68),(.22,.22,.12),gold)

scene['asset_integration']='field/enemy/pikmin concept sheets integrated as 3D set dressing and camera-facing cutouts'
scene['party_attributes']='fire, water, wind, lightning, earth, light'
scene['enemy_roster']='leaf eater, spore slime, spiked beetle, pollen bat, moss golem, rot bloom boss'
if hasattr(scene, 'eevee'):
    scene.eevee.taa_render_samples=32
scene.render.filepath=PREVIEW
bpy.ops.wm.save_as_mainfile(filepath=OUT)
bpy.ops.render.render(write_still=True)

# A closer tactical camera demonstrates the intended crowd-action scale around
# the opening meadow and bridge, while Game_Camera remains the default overview.
bpy.ops.object.camera_add(location=(19,-27,27))
combat_cam=bpy.context.view_layer.objects.active
combat_cam.name='Combat_Camera'
combat_cam.data.type='ORTHO'; combat_cam.data.ortho_scale=31
combat_target=Vector((-5,-1,1.5))
combat_cam.rotation_euler=(combat_target-combat_cam.location).to_track_quat('-Z','Y').to_euler()
scene.camera=combat_cam
scene.render.filepath=COMBAT_PREVIEW
bpy.ops.render.render(write_still=True)
scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('ENHANCED',OUT,'objects',len(scene.objects))
