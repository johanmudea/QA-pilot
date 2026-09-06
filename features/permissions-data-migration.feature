# language: es
# HU-89938: Migración de permisos, datos y creación de roles para nuevas tablas SP1
# Migración de backend/datos — sin UI. Ver rules/automation-policy.md: son ideas de
# verificación de BD, no automatización de UI. No requieren la app en vivo para
# redactarse, pero sí herramientas de base de datos/API (database/, api/) para
# automatizarse algún día — mientras tanto quedan manuales (documentadas aquí para
# trazabilidad, aún no ejecutables).
Característica: Migración de permisos y datos a las nuevas tablas

  Como la plataforma
  Quiero que los datos y permisos se migren a la nueva estructura de tablas sin pérdidas
  Para garantizar la continuidad de la información

  @hu:89938 @regression @critical @testcase:91426
  Escenario: Los datos migrados conservan integridad y relaciones
    Dado que se ejecutó la migración de datos de las tablas antiguas a las nuevas tablas
    Entonces cada registro de las tablas antiguas debe tener su correspondiente registro en las nuevas tablas
    Y las relaciones existentes entre registros deben conservarse

  @hu:89938 @regression @critical @testcase:91427
  Escenario: Los datos migrados no presentan duplicidades ni inconsistencias
    Dado que se ejecutó la migración de datos de las tablas antiguas a las nuevas tablas
    Entonces no deben existir registros duplicados en las nuevas tablas
    Y no deben existir inconsistencias entre las tablas antiguas y las nuevas

  @hu:89938 @regression @testcase:91428
  Escenario: Los permisos se migran y quedan correctamente configurados en la nueva estructura
    Dado que se ejecutó la migración de permisos
    Entonces los permisos previamente configurados deben existir en la nueva estructura
    Y los permisos de nueva creación deben estar correctamente configurados
