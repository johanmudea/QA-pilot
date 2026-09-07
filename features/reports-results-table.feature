# language: es
# HU-91238: Implementar tabla de resultados en Reportes SP2
Característica: Tabla de resultados de Reportes

  Como usuario del módulo de Evaluación de Proveedores
  Quiero ver los resultados de la consulta de Reportes en una tabla estructurada
  Para analizar los PQRS registrados y hacer seguimiento a su estado

  Antecedentes:
    Dado que el usuario está en la pantalla de Reportes con resultados cargados

  @hu:91238 @regression @critical @testcase:91467
  Escenario: CP_01 - TC91467 - La tabla de resultados muestra las columnas comunes
    Entonces la tabla de resultados debe mostrar las columnas "Número de registro", "Fecha de creación", "Creado por", "Proceso al que pertenece", "Centro / Planta", "ID Fiscal", "Nombre del proveedor", "Estado" y "Acción"

  @hu:91238 @regression @critical @testcase:91468
  Escenario: CP_02 - TC91468 - La columna Asignado a solo se muestra para Reclamos
    Dado que el Tipo de requerimiento consultado es "Reclamos"
    Entonces la columna "Asignado a" debe mostrarse

  @hu:91238 @regression @testcase:91469
  Escenario: CP_03 - TC91469 - La columna Asignado a se oculta para Felicitaciones
    Dado que el Tipo de requerimiento consultado es "Felicitaciones"
    Entonces la columna "Asignado a" no debe mostrarse

  @hu:91238 @regression @testcase:91470
  Escenario: CP_04 - TC91470 - La columna Acción permanece fija y abre el detalle del registro
    Cuando el usuario hace clic en el ícono de Acción de una fila
    Entonces debe mostrarse el detalle de ese registro
    Y la columna Acción debe permanecer fija durante el desplazamiento horizontal

  @hu:91238 @regression @testcase:91471
  Escenario: CP_05 - TC91471 - Una consulta sin resultados muestra una alerta informativa
    Dado que la consulta no arroja resultados
    Entonces debe mostrarse una alerta informativa indicando que no hay resultados
