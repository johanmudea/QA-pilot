# language: es
# HU-90075: Implementar tabla de resultados en la Consulta de Proveedores 360 SP1
Característica: Tabla de resultados de la Consulta de Proveedores 360

  Como usuario del módulo de Evaluación de Proveedores
  Quiero ver los resultados de la Consulta de Proveedores 360 en una tabla estructurada
  Para identificar rápidamente proveedores y acceder a su detalle individual

  Antecedentes:
    Dado que el usuario está en la pantalla de Consulta de Proveedores 360 con resultados cargados

  @hu:90075 @regression @critical @testcase:91449
  Escenario: CP_01 - TC91449 - La tabla de resultados solo se muestra después de ejecutar una búsqueda
    Entonces la tabla de resultados debe estar visible
    Y debe mostrarse el total de resultados obtenidos

  @hu:90075 @regression @critical @testcase:91450
  Escenario: CP_02 - TC91450 - La tabla de resultados muestra todas las columnas esperadas
    Entonces la tabla de resultados debe mostrar las columnas "Nombre del proveedor", "ID Fiscal", "Código o ID ERP", "Tipo de información" y "Acción"

  @hu:90075 @regression @testcase:91451
  Escenario: CP_03 - TC91451 - La columna Tipo de información muestra solo las fuentes con datos disponibles
    Entonces la columna "Tipo de información" debe mostrar un logo únicamente por cada fuente (PQRS, SAP, Prevsis) que tenga información disponible para ese proveedor
    Y deben mostrarse múltiples logos cuando más de una fuente tenga información

  @hu:90075 @regression @testcase:91452
  Escenario: CP_04 - TC91452 - La columna Acción permanece fija y abre el detalle del proveedor
    Cuando el usuario hace clic en el ícono de Acción de una fila
    Entonces debe mostrarse el detalle de ese proveedor
    Y la columna Acción debe permanecer fija durante el desplazamiento horizontal

  @hu:90075 @regression @testcase:91453
  Escenario: CP_05 - TC91453 - Aplicar un nuevo filtro reinicia la paginación en la página 1
    Dado que el usuario está viendo resultados en una página distinta a la primera
    Cuando el usuario aplica un nuevo filtro
    Entonces los resultados deben reiniciarse desde la primera página
