extends Node3D


func _ready() -> void:
	_create_walkable_collisions.call_deferred()
	if "--capture-preview" in OS.get_cmdline_user_args():
		capture_preview()


func _create_walkable_collisions() -> void:
	var garden := get_node("AwakeningGarden")
	var collision_count := 0
	for child in garden.find_children("*", "MeshInstance3D", true, false):
		var mesh_instance := child as MeshInstance3D
		if _is_walkable_mesh(mesh_instance.name):
			mesh_instance.create_trimesh_collision()
			collision_count += 1
	print("Created walkable collision for %d garden meshes." % collision_count)


func _is_walkable_mesh(mesh_name: String) -> bool:
	var prefixes := PackedStringArray([
		"Meadow_Surface",
		"Terrain_Mound",
		"Main_Path",
		"Base_Path",
		"Ruin_Path",
		"Bridge_Plank",
		"Ruin_Floor_Tile",
	])
	for prefix in prefixes:
		if mesh_name.begins_with(prefix):
			return true
	return false


func capture_preview() -> void:
	await get_tree().create_timer(0.75).timeout
	await RenderingServer.frame_post_draw
	DirAccess.make_dir_absolute("res://artifacts")
	var image := get_viewport().get_texture().get_image()
	var error := image.save_png("res://artifacts/godot-preview.png")
	if error != OK:
		push_error("Could not save preview image: %s" % error_string(error))
	get_tree().quit()
