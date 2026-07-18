extends CharacterBody3D

@export var walk_speed := 4.5
@export var run_speed := 7.5
@export var acceleration := 18.0
@export var turn_speed := 10.0

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var spawn_position := Vector3.ZERO
var move_time := 0.0

@onready var model: Node3D = $Model


func _ready() -> void:
	spawn_position = global_position


func _physics_process(delta: float) -> void:
	var input_vector := Vector2(
		float(Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT))
			- float(Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT)),
		float(Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN))
			- float(Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP))
	).normalized()

	var move_direction := Vector3(input_vector.x, 0.0, input_vector.y)
	var speed := run_speed if Input.is_key_pressed(KEY_SHIFT) else walk_speed
	var target_velocity := move_direction * speed

	velocity.x = move_toward(velocity.x, target_velocity.x, acceleration * delta)
	velocity.z = move_toward(velocity.z, target_velocity.z, acceleration * delta)
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = -0.1

	if move_direction.length_squared() > 0.0:
		var target_angle := atan2(move_direction.x, move_direction.z)
		rotation.y = lerp_angle(rotation.y, target_angle, turn_speed * delta)
		move_time += delta * (11.0 if speed == run_speed else 8.0)
		model.position.y = sin(move_time) * 0.035
	else:
		model.position.y = move_toward(model.position.y, 0.0, delta * 0.3)

	move_and_slide()
	if global_position.y < -5.0:
		global_position = spawn_position
		velocity = Vector3.ZERO
