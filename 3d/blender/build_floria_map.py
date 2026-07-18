import bpy
import math
import random
from pathlib import Path
from mathutils import Vector

random.seed(17)

ROOT = Path(__file__).resolve().parent
OUT = str(ROOT / "floria_awakening_garden.blend")


def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.curves, bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
        pass


def material(name, color, metallic=0.0, roughness=0.7, emission=None):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None:
        bsdf = m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1)
        bsdf.inputs['Emission Strength'].default_value = 2.5
    return m


def assign(obj, mat):
    if obj.data and hasattr(obj.data, 'materials'):
        obj.data.materials.append(mat)
    return obj


def smooth(obj):
    if obj.type == 'MESH':
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj


def cube(name, loc, scale, mat, bevel=0.25, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new('Soft_Edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    assign(o, mat)
    return o


def cyl(name, loc, radius, depth, mat, vertices=16, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    assign(o, mat)
    return o


def sphere(name, loc, scale, mat):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(o, mat)
    smooth(o)
    return o


def cone(name, loc, r1, r2, depth, mat, vertices=12, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    assign(o, mat)
    return o


def curve_path(name, points, bevel, mat, z=0.12):
    c = bpy.data.curves.new(name, 'CURVE')
    c.dimensions = '3D'
    c.bevel_depth = bevel
    c.bevel_resolution = 3
    spline = c.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for bp, (x, y) in zip(spline.bezier_points, points):
        bp.co = (x, y, 0)
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, c)
    bpy.context.collection.objects.link(o)
    o.location.z = z
    o.scale.z = .12
    assign(o, mat)
    return o


def flower(x, y, z, petal_mat, scale=1.0):
    stem = cyl('Flower_Stem', (x, y, z + .24 * scale), .035 * scale, .48 * scale, leaf, 8)
    for i in range(5):
        a = i * math.tau / 5
        sphere('Flower_Petal', (x + math.cos(a) * .14 * scale, y + math.sin(a) * .14 * scale, z + .52 * scale), (.13 * scale, .08 * scale, .055 * scale), petal_mat)
    sphere('Flower_Core', (x, y, z + .54 * scale), (.09 * scale,) * 3, yellow)


def rock(x, y, s=1.0):
    o = sphere('Garden_Rock', (x, y, .18 * s), (.65 * s, .5 * s, .45 * s), stone)
    o.rotation_euler = (random.uniform(-.3, .3), random.uniform(-.3, .3), random.random() * math.tau)
    return o


def tree(x, y, s=1.0):
    cyl('Tree_Trunk', (x, y, 1.3 * s), .35 * s, 2.6 * s, bark, 10)
    for dx, dy, dz, sc in [(-.45, 0, 2.8, .9), (.4, .15, 3.0, 1), (0, -.35, 3.35, .85)]:
        sphere('Tree_Crown', (x + dx*s, y + dy*s, dz*s), (1.15*sc*s, 1.0*sc*s, .9*sc*s), foliage)


def label_empty(name, loc, kind):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.empty_display_type = 'CIRCLE'
    o.empty_display_size = .8
    o['gameplay_type'] = kind
    return o


reset()

# Palette
grass = material('Grass_Meadow', (0.31, 0.62, 0.24), roughness=.9)
grass_dark = material('Grass_Shadow', (0.18, 0.42, 0.16), roughness=.95)
earth = material('Warm_Earth', (0.34, 0.18, 0.10), roughness=1)
pathmat = material('Garden_Path', (0.72, 0.53, 0.30), roughness=.95)
water = material('Clear_Water', (0.08, 0.48, 0.72), roughness=.18, metallic=.08)
water_light = material('Water_Highlight', (0.25, 0.82, 0.94), roughness=.1, emission=(0.08, .35, .5))
stone = material('Old_Stone', (.38, .42, .38), roughness=.95)
stone_light = material('Cut_Stone', (.58, .61, .52), roughness=.9)
moss = material('Moss', (.19, .45, .17), roughness=1)
bark = material('Tree_Bark', (.25, .12, .055), roughness=1)
foliage = material('Fresh_Leaves', (.16, .55, .20), roughness=.9)
leaf = material('Flower_Leaves', (.12, .42, .13), roughness=.9)
pink = material('Petal_Pink', (.95, .32, .53), roughness=.7)
purple = material('Petal_Purple', (.55, .25, .85), roughness=.7)
white = material('Petal_White', (.96, .92, .78), roughness=.7)
yellow = material('Golden_Pollen', (1.0, .65, .08), roughness=.55, emission=(.5, .18, .01))
wood = material('Bridge_Wood', (.48, .25, .09), roughness=.9)
glass = material('Greenhouse_Glass', (.35, .85, .75), roughness=.18, metallic=.05)
rust = material('Old_Rust_Metal', (.42, .16, .07), metallic=.65, roughness=.72)
metal = material('Ancient_Metal', (.34, .39, .42), metallic=.8, roughness=.38)
crystal = material('Life_Crystal', (.35, 1.0, .58), roughness=.2, emission=(.1, .65, .25))

# Island terrain and softer top mounds
cube('Island_Earth', (0, 0, -1.25), (23, 17, 1.6), earth, bevel=3.0)
cube('Meadow_Surface', (0, 0, -.02), (22.5, 16.5, .42), grass, bevel=2.7)
for x, y, sx, sy in [(-15, 9, 7, 4), (13, 10, 8, 4), (-16, -10, 6, 4), (14, -11, 7, 4)]:
    sphere('Terrain_Mound', (x, y, .05), (sx, sy, .75), grass_dark)

# Main traversable garden path
curve_path('Main_Path', [(-19,-10),(-13,-6),(-8,-3),(-2,-1),(4,2),(10,5),(17,10)], 1.45, pathmat, .38)
curve_path('Base_Path', [(-9,-3),(-13,1),(-16,6)], .85, pathmat, .4)
curve_path('Ruin_Path', [(5,2),(10,-1),(14,-5)], .9, pathmat, .4)

# Pond and stream; stream separates the ruins and teaches bridge traversal
sphere('Garden_Pond', (2, -10, .25), (5.2, 3.6, .24), water)
curve_path('Winding_Stream', [(2,-8),(1,-4),(3,0),(6,4),(5,9),(7,15)], 1.35, water, .30)
curve_path('Stream_Glint', [(2,-8),(1,-4),(3,0),(6,4),(5,9),(7,15)], .18, water_light, .48)
for x, y in [(0,-9),(3,-11),(5,-9),(-1,-11),(1,-7)]:
    rock(x, y, random.uniform(.45,.8))

# Wooden bridge across the central stream
for i in range(-4, 5):
    cube('Bridge_Plank', (3.0 + i*.58, .35, .9), (.26, 1.7, .14), wood, .08, rot=(0,0,.06*math.sin(i)))
for y in (-1.25, 1.95):
    cube('Bridge_Rail', (3.0, y, 1.38), (2.6,.08,.08), wood, .05)

# Starting base: greenhouse, workbench, beacon
cube('Base_Platform', (-15, 6, .55), (4.5, 3.8, .45), stone_light, .55)
for x in (-17.5, -15.5, -13.5):
    cyl('Greenhouse_Rib', (x, 6.8, 2.2), .09, 3.6, metal, 10, rot=(math.pi/2,0,0))
cube('Greenhouse_Bed', (-15.5, 6.8, 1.05), (2.8,1.3,.35), earth, .25)
cube('Greenhouse_Roof', (-15.5, 6.8, 2.55), (3.1,1.55,.12), glass, .35, rot=(0,.18,0))
cube('Workshop', (-15.0, 2.8, 1.45), (2.2,1.4,1.45), wood, .3)
cube('Workshop_Roof', (-15.0, 2.8, 3.0), (2.5,1.7,.18), rust, .22, rot=(0,.12,0))
cyl('Return_Beacon', (-11.7, 7.2, 1.7), .55, 2.8, metal, 12)
sphere('Beacon_Light', (-11.7, 7.2, 3.2), (.5,.5,.65), crystal)

# Ancient garden ruins and mossy arch
for x, y, h in [(13,-6,3.4),(17,-6,4.6),(13,-11,4.2),(17,-11,3.2)]:
    cube('Ruin_Pillar', (x,y,h/2+.45), (.65,.65,h/2), stone_light, .18)
    cube('Ruin_Moss', (x,y,h+.52), (.72,.72,.14), moss, .12)
cube('Ruin_Arch_Top', (15,-6,4.25), (2.6,.72,.55), stone_light, .2)
for i in range(6):
    x = 12 + (i%3)*2.2
    y = -8.3 - (i//3)*2.0
    cube('Ruin_Floor_Tile', (x,y,.55), (.9,.8,.18), stone, .14, rot=(0,0,random.uniform(-.15,.15)))

# Giant remnants of human civilization
cyl('Giant_Tin_Can', (16, 10, 2.2), 2.1, 5.4, rust, 32, rot=(0, math.pi/2, .25))
cyl('Can_Rim', (13.38, 9.33, 2.2), 2.22, .18, metal, 32, rot=(0, math.pi/2, .25))
cube('Giant_Spoon_Handle', (-9,-10,1.0), (5.0,.55,.18), metal, .45, rot=(0,.05,-.35))
sphere('Giant_Spoon_Bowl', (-13.8,-8.15,1.1), (2.2,1.5,.32), metal)

# World-tree landmark
cyl('World_Tree_Trunk', (0, 12, 4.3), 1.5, 8.6, bark, 14)
for a in range(8):
    ang = a * math.tau / 8
    sphere('World_Tree_Crown', (math.cos(ang)*2.5, 12+math.sin(ang)*2.0, 8.3+random.uniform(-.5,.7)), (2.8,2.4,2.2), foliage)
for a in range(6):
    ang=a*math.tau/6
    cone('Tree_Life_Crystal', (math.cos(ang)*1.8,12+math.sin(ang)*1.4,7.2), .28, 0, 1.4, crystal, 6)

# Secondary trees, rocks, flowers
for x,y,s in [(-20,12,1.0),(-9,13,.9),(11,13,.85),(20,3,.8),(-20,-4,.8),(9,-13,.75)]:
    tree(x,y,s)
for x,y in [(-6,5),(-4,-7),(9,7),(11,-3),(-18,-11),(19,-12),(-7,10),(20,7)]:
    rock(x,y,random.uniform(.7,1.3))
for i in range(42):
    x=random.uniform(-20,20); y=random.uniform(-14,14)
    if abs(x-3)<3 and -8<y<14: continue
    if (x+15)**2+(y-6)**2<25: continue
    flower(x,y,.52,random.choice([pink,purple,white]),random.uniform(.65,1.15))

# Gameplay anchors for engine export
label_empty('SPAWN_Player', (-18,-10,.7), 'player_spawn')
label_empty('GOAL_WorldTree', (0,10,.7), 'main_objective')
label_empty('GIMMICK_BridgeRepair', (3,.3,1.4), 'bridge_gimmick')
label_empty('GIMMICK_WaterCrossing', (2,-5,.7), 'water_gimmick')
label_empty('ENCOUNTER_Meadow', (-5,3,.7), 'enemy_zone')
label_empty('ENCOUNTER_Ruins', (15,-8,.7), 'enemy_zone')
label_empty('RETURN_Base', (-12,7,.7), 'return_point')

# Lighting, atmosphere and game camera
bpy.context.scene.world.color = (0.055, 0.09, 0.12)
bpy.ops.object.light_add(type='SUN', location=(0,0,20))
sun=bpy.context.object; sun.name='Sun_Warm'; sun.data.energy=2.2; sun.rotation_euler=(math.radians(28),math.radians(-18),math.radians(-28))
sun.data.color=(1.0,.78,.58)
bpy.ops.object.light_add(type='AREA', location=(-8,-5,18))
fill=bpy.context.object; fill.name='Sky_Fill'; fill.data.energy=1600; fill.data.shape='DISK'; fill.data.size=18; fill.data.color=(.45,.68,1.0)

bpy.ops.object.camera_add(location=(35,-42,42))
cam=bpy.context.object; cam.name='Game_Camera'; cam.data.type='ORTHO'; cam.data.ortho_scale=56
direction=Vector((0,0,1.8))-cam.location
cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
bpy.context.scene.camera=cam

scene=bpy.context.scene
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1280; scene.render.resolution_y=720; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(ROOT / "floria_awakening_garden_preview.png")
scene.render.film_transparent=False
try:
    scene.view_settings.look='AgX - Medium High Contrast'
except TypeError:
    scene.view_settings.look='Medium High Contrast'
scene['map_name']='Awakening Garden'
scene['game_title']='Floria Link'
scene['design_scale']='miniature garden; 1 Blender unit = 1 meter'
scene['map_flow']='spawn -> meadow -> bridge -> ruins/world tree -> return base'

bpy.ops.wm.save_as_mainfile(filepath=OUT)
bpy.ops.render.render(write_still=True)
print(f'CREATED {OUT} with {len(bpy.context.scene.objects)} objects')
