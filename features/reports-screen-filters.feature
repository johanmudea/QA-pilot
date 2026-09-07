# language: es
# HU-91237: Implementar pantalla de Reportes y filtros SP2
Característica: Pantalla de Reportes y filtros

  Como usuario del módulo de Evaluación de Proveedores
  Quiero una pantalla de Reportes con filtros de búsqueda
  Para ubicar información de PQRS para reportes operativos y de gestión

  Antecedentes:
    Dado que el usuario está en la pantalla de Reportes

  @hu:91237 @regression @smoke @testcase:91473
  Escenario: CP_01 - TC91473 - La pantalla muestra el mensaje descriptivo y no hay resultados antes de buscar
    Entonces el mensaje descriptivo "En este espacio podrás consultar y descargar reportes de PQRS" debe estar visible
    Y debe mostrarse un mensaje informativo indicando que se requiere una búsqueda

  @hu:91237 @regression @critical @testcase:91474
  Escenario: CP_02 - TC91474 - Se muestran los filtros iniciales
    Entonces los filtros "Tipo de requerimiento", "Fecha inicial", "Fecha final", "Número de registro", "Proceso al que pertenece" y "Compañía" deben estar visibles

  @hu:91237 @regression @critical @testcase:91475
  Escenario: CP_03 - TC91475 - Seleccionar Reclamos habilita el filtro Estado
    Cuando el usuario selecciona "Reclamos" en el filtro "Tipo de requerimiento"
    Entonces el filtro "Estado" debe habilitarse

  @hu:91237 @regression @testcase:91476
  Escenario: CP_04 - TC91476 - Seleccionar una Compañía habilita sus filtros dependientes y los reinicia al cambiar
    Cuando el usuario selecciona una "Compañía"
    Entonces los filtros "Usuario" y "Sociedad" deben habilitarse
    Cuando el usuario cambia la "Compañía" seleccionada
    Entonces los valores previamente seleccionados en los filtros dependientes deben limpiarse

  @hu:91237 @regression @critical @testcase:91477
  Escenario: CP_05 - TC91477 - Aplicar filtros ejecuta la consulta y conserva los filtros diligenciados
    Cuando el usuario aplica los filtros
    Entonces la consulta debe ejecutarse utilizando todos los criterios seleccionados
    Y los filtros diligenciados deben permanecer visibles después de la consulta

  @hu:91237 @regression @testcase:91478
  Escenario: CP_06 - TC91478 - Limpiar filtros restablece el componente a su estado inicial
    Cuando el usuario limpia los filtros
    Entonces todos los filtros deben volver a su estado inicial
