# Envíos Distritos Frontend V2

Frontend local en HTML/CSS/JavaScript vanilla, preparado para migración posterior a WordPress.

## Qué cambia en V2

- `mode: live` por defecto.
- Un único webhook n8n funciona como gateway.
- El frontend envía `accion: consultar`, `accion: lotes` o `accion: generar`.
- `request_id` permanece estable desde la consulta hasta la generación para respetar idempotencia.
- Mejor manejo de errores JSON de n8n.
- Mantiene tema claro/oscuro y toda la UX de reutilización de V1.

## Endpoint esperado

`https://paneln8n.toga.pe/webhook/envios-distritos/solicitud`

El workflow debe estar ACTIVO para usar `/webhook/`.

## Ejecutar local

Desde esta carpeta:

```bash
python -m http.server 5500
```

Abrir:

`http://localhost:5500`

## CORS

En el Webhook de n8n permitir para pruebas:

`http://localhost:5500`

Más adelante se reemplaza por el origen real de WordPress.

## Seguridad

Nunca colocar `PIPELINE_API_KEY` en el navegador. n8n conserva la API key y actúa como gateway hacia el VPS.


## V3 - Bloqueo por fases
- Tras una consulta exitosa, `Consultar disponibilidad` queda bloqueado.
- Los campos de la solicitud quedan congelados para evitar que cambien después de calcular disponibilidad.
- `Limpiar` permanece siempre habilitado y reinicia a Fase 1.
- Tras generar un corte, `Generar corte` también queda bloqueado hasta limpiar.
- Si la consulta o generación falla, se habilita el reintento correspondiente.
