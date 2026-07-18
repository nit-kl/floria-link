# Floria: Awakening Garden

Godot 4.7 project for the Floria prototype.

Blender source and backup files live under `blender/`. The `.gdignore` file in
that directory prevents Godot from trying to import editable source files.

## Open the project

1. Start Godot 4.7.1.
2. Choose **Import** and select this folder's `project.godot`.
3. Press **F6** to run the current scene or **F5** to run the project.

The starting scene is `scenes/main.tscn`. It loads the Blender garden export from
`assets/models/awakening_garden.glb` and starts the prototype player at the
`SPAWN_Player` location authored in Blender.

## Prototype controls

- **WASD / Arrow keys**: Move
- **Shift**: Run

The prototype creates terrain collision for the meadow, mounds, paths, bridge
planks, and ruin floor. A low safety floor catches the player if they leave the
authored walkable area.

## Current player model

The playable `CharacterBody3D` now instantiates
`assets/characters/hero_fire_red.tscn`. This is the Hyper3D-generated red
character exported from the integrated Blender scene. The previous
`assets/models/floria_player.glb` remains in the project as a fallback/reference.

The current character asset is a static mesh. Rigging and authored animation
remain future work; the prototype movement script provides a small procedural
bob while moving.
