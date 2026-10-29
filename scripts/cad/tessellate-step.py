"""Open CASCADE로 STEP의 곡면을 삼각형 메시로 변환합니다. 단위는 mm입니다."""
import json
import math
import struct
import sys
from pathlib import Path

from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.IFSelect import IFSelect_RetDone
from OCP.Interface import Interface_Static
from OCP.STEPControl import STEPControl_Reader
from OCP.StlAPI import StlAPI_Writer


def convert(source, target, metadata):
    reader = STEPControl_Reader()
    Interface_Static.SetCVal_s("xstep.cascade.unit", "MM")
    if reader.ReadFile(str(source)) != IFSelect_RetDone or reader.TransferRoots() == 0:
        raise ValueError("STEP 파일의 CAD 형상을 읽을 수 없습니다.")
    shape = reader.OneShape()
    bounds = Bnd_Box()
    BRepBndLib.Add_s(shape, bounds)
    if bounds.IsVoid():
        raise ValueError("STEP 파일에 표시할 형상이 없습니다.")
    box = bounds.Get()
    dimensions = [box[i + 3] - box[i] for i in range(3)]
    if not all(math.isfinite(value) for value in dimensions) or max(dimensions) <= 0:
        raise ValueError("CAD 형상의 크기가 올바르지 않습니다.")
    # 제품 크기에 비례한 공차로 매우 작거나 큰 CAD도 동일한 화면 품질을 갖게 합니다.
    mesh = BRepMesh_IncrementalMesh(shape, max(dimensions) / 1000, False, 0.2, True)
    if not mesh.IsDone():
        raise ValueError("CAD 곡면을 메시로 변환하지 못했습니다.")
    writer = StlAPI_Writer()
    writer.ASCIIMode = False
    if not writer.Write(shape, str(target)):
        raise ValueError("CAD 메시를 저장하지 못했습니다.")
    with target.open("rb") as stream:
        stream.seek(80)
        triangles = struct.unpack("<I", stream.read(4))[0]
    if triangles == 0 or triangles > 1_500_000:
        raise ValueError("모델이 비어 있거나 너무 복잡합니다. 간략화한 STEP 파일을 올려 주세요.")
    metadata.write_text(json.dumps({"dimensionsMm": [round(value, 3) for value in dimensions], "sourceTriangles": triangles}), encoding="utf-8")


if __name__ == "__main__":
    try:
        convert(*(Path(argument) for argument in sys.argv[1:4]))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
