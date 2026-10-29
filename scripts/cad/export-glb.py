"""Blender 백그라운드 프로세스에서 메시를 웹용 GLB로 내보냅니다."""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def convert(source, target, metadata):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.wm.stl_import(filepath=str(source), use_mesh_validate=True)
    objects = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
    if not objects:
        raise ValueError("변환할 메시가 없습니다.")
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    # 중심과 크기를 통일하므로 프론트에서 카메라 밖으로 벗어나지 않습니다.
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector([min(point[index] for point in points) for index in range(3)])
    maximum = Vector([max(point[index] for point in points) for index in range(3)])
    center = (minimum + maximum) / 2
    scale = 2.6 / max(maximum - minimum)
    for vertex in obj.data.vertices:
        vertex.co = (vertex.co - center) * scale
    if len(obj.data.polygons) > 300_000:
        modifier = obj.modifiers.new("Web preview", "DECIMATE")
        modifier.ratio = 300_000 / len(obj.data.polygons)
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    material = bpy.data.materials.new("CAD satin white")
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (0.78, 0.8, 0.84, 1)
    shader.inputs["Metallic"].default_value = 0.12
    shader.inputs["Roughness"].default_value = 0.48
    obj.data.materials.clear()
    obj.data.materials.append(material)
    bpy.ops.export_scene.gltf(filepath=str(target), export_format="GLB", use_selection=True, export_yup=True, export_animations=False)
    data = json.loads(metadata.read_text(encoding="utf-8"))
    obj.data.calc_loop_triangles()
    data.update({"triangles": len(obj.data.loop_triangles), "blenderVersion": bpy.app.version_string})
    metadata.write_text(json.dumps(data), encoding="utf-8")


if __name__ == "__main__":
    try:
        arguments = sys.argv[sys.argv.index("--") + 1:]
        convert(*(Path(argument) for argument in arguments))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
