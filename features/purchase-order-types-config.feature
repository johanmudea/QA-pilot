# language: es
# HU-91278: Configuración data maestra tipos de orden de compra SP2
# Solo backend (almacenamiento + servicio de consulta) — sin UI. Ver
# rules/automation-policy.md: son ideas de verificación de API/BD, no de UI.
Característica: Configuración maestra de tipos de orden de compra

  Como la plataforma
  Quiero almacenar y consultar los tipos de orden de compra por holding
  Para que la configuración de cada holding esté disponible en la data maestra

  @hu:91278 @regression @critical @testcase:91463
  Escenario: Se pueden configurar múltiples tipos de orden de compra por holding
    Dado que un holding tiene tipos de orden de compra configurados
    Entonces la estructura de almacenamiento debe permitir más de un tipo de orden de compra para ese holding

  @hu:91278 @regression @critical @testcase:91464
  Escenario: La consulta de tipos de orden de compra filtra por holding
    Dado que existen tipos de orden de compra para más de un holding
    Cuando se consultan los tipos de orden de compra para un holding específico
    Entonces solo deben retornarse los tipos de orden de compra de ese holding

  @hu:91278 @regression @testcase:91465
  Escenario: Los tipos de orden de compra están disponibles en la data maestra de configuraciones
    Dado que un holding tiene tipos de orden de compra configurados
    Entonces esa información debe estar disponible dentro de la data maestra de configuraciones
