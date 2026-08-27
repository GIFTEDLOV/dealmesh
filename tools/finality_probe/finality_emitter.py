# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *


class FinalityEmitter(gl.Contract):
    receiver: Address
    requested: bool
    self_marker: str

    def __init__(self, receiver: Address):
        self.receiver = receiver
        self.requested = False
        self.self_marker = ""

    @gl.public.write
    def emit_finalized(self, marker: str):
        if self.requested:
            raise gl.vm.UserError("PROBE_ALREADY_REQUESTED")
        target = gl.get_contract_at(self.receiver)
        target.emit(on="finalized").record(marker)
        self.requested = True

    @gl.public.write
    def emit_self_finalized(self, marker: str):
        if self.self_marker != "" or self.requested:
            raise gl.vm.UserError("PROBE_ALREADY_REQUESTED")
        target = gl.get_contract_at(gl.message.contract_address)
        target.emit(on="finalized").record_self(marker)
        self.requested = True

    @gl.public.write
    def record_self(self, marker: str):
        if gl.message.sender_address != gl.message.contract_address:
            raise gl.vm.UserError("PROBE_UNAUTHORIZED_SELF_CALLBACK")
        if self.self_marker != "":
            raise gl.vm.UserError("PROBE_ALREADY_RECORDED")
        self.self_marker = marker

    @gl.public.view
    def get_requested(self) -> bool:
        return self.requested

    @gl.public.view
    def get_self_marker(self) -> str:
        return self.self_marker
