# language: es
# HU-91254: Implementar sección Ranking con filtros en la pestaña PQRS de Ranking de Proveedores SP2
Característica: Sección Ranking con filtros en la pestaña PQRS del Ranking de Proveedores

  Como usuario del módulo de Evaluación de Proveedores
  Quiero filtrar y segmentar la sección Ranking de la pestaña PQRS
  Para analizar los Reclamos y Felicitaciones según criterios organizacionales y geográficos

  Antecedentes:
    Dado que el usuario está en la pestaña PQRS de la pantalla de Ranking de Proveedores

  @hu:91254 @regression @smoke @ac:1 @testcase:91501
  Escenario: CP_01 - TC91501 - [AC 1] La sección Ranking se muestra debajo de la sección de la gráfica
    Entonces debe mostrarse una sección "Ranking" debajo de la sección de la gráfica

  @hu:91254 @regression @critical @ac:5-10 @testcase:91502
  Escenario: CP_02 - TC91502 - [AC 5-10] Se muestran los filtros iniciales
    Entonces los filtros "Fecha inicial", "Fecha final", "Tipo de requerimiento", "Proceso al que pertenece", "Asociado a" y "Compañía" deben estar visibles

  @hu:91254 @regression @critical @ac:11,13 @testcase:91503
  Escenario: CP_03 - TC91503 - [AC 11,13] Seleccionar una Compañía habilita sus filtros dependientes y los reinicia al cambiar
    Cuando el usuario selecciona una "Compañía"
    Entonces el filtro "Sociedad" debe habilitarse
    Cuando el usuario cambia la "Compañía" seleccionada
    Entonces los valores previamente seleccionados en los filtros dependientes deben limpiarse

  @hu:91254 @regression @ac:12 @testcase:91504
  Escenario: CP_04 - TC91504 - [AC 12] Seleccionar una Sociedad habilita Centro / Planta
    Cuando el usuario selecciona una "Sociedad"
    Entonces el filtro "Centro / Planta" debe habilitarse

  @hu:91254 @regression @critical @ac:19 @testcase:91505
  Escenario: CP_05 - TC91505 - [AC 19] Aplicar filtros solo afecta los resultados de la tabla Ranking
    Cuando el usuario aplica los filtros
    Entonces solo los resultados de la tabla Ranking deben reflejar los filtros aplicados

  @hu:91254 @regression @ac:16 @testcase:91506
  Escenario: CP_06 - TC91506 - [AC 16] Limpiar filtros restablece el componente a su estado inicial
    Cuando el usuario limpia los filtros
    Entonces todos los filtros deben volver a su estado inicial
