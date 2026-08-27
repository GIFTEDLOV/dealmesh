# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class FinalityReceiver(gl.Contract):
    marker: str

    def __init__(self):
        self.marker = ""

    @gl.public.write
    def record(self, marker: str):
        if self.marker != "":
            raise gl.vm.UserError("PROBE_ALREADY_RECORDED")
        self.marker = marker

    @gl.public.view
    def get_marker(self) -> str:
        return self.marker
