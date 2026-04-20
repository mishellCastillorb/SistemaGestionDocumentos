from django.contrib import admin
from .models import (
    Rol, Area, Usuario, TipoRegistro, QuejaDenuncia,
    EstadoExpediente, MotivoConclusion, Expediente
)
admin.site.register(Rol)
admin.site.register(Area)
admin.site.register(Usuario)
admin.site.register(TipoRegistro)
admin.site.register(QuejaDenuncia)


admin.site.register(EstadoExpediente)
admin.site.register(MotivoConclusion)
admin.site.register(Expediente)