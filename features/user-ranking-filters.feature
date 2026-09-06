# language: es
# HU-90059: Implementar Ranking de usuarios y filtros SP1
Característica: Pantalla de Ranking de usuarios y filtros

  Como usuario del módulo de Evaluación de Proveedores
  Quiero una pantalla de Ranking de Usuarios con filtros
  Para analizar el desempeño en la gestión de PQRS por usuario

  Antecedentes:
    Dado que el usuario está en la pantalla de Ranking de Usuarios

  @hu:90059 @regression @smoke @testcase:91430
  Escenario: La pantalla muestra los mensajes descriptivo y de confidencialidad
    Entonces el mensaje descriptivo "En este espacio podrás consultar el ranking y detalle de los usuarios" debe estar visible
    Y el mensaje de confidencialidad debe estar visible

  @hu:90059 @regression @critical @testcase:91431
  Escenario: Se muestran los filtros iniciales
    Entonces los filtros "Fecha inicial", "Fecha final", "Tipo de requerimiento", "Área del responsable", "Proceso al que pertenece" y "Compañía" deben estar visibles
    Y el contador de resultados debe estar visible

  @hu:90059 @regression @critical @testcase:91432
  Escenario: Seleccionar Reclamos en Tipo de requerimiento habilita sus filtros dependientes
    Cuando el usuario selecciona "Reclamos" en el filtro "Tipo de requerimiento"
    Entonces los filtros "Tipo de gestión" y "Estado" deben habilitarse

  @hu:90059 @regression @testcase:91433
  Escenario: Seleccionar Felicitaciones en Tipo de requerimiento habilita su filtro dependiente
    Cuando el usuario selecciona "Felicitaciones" en el filtro "Tipo de requerimiento"
    Entonces el filtro "Tipo de felicitación" debe habilitarse

  @hu:90059 @regression @testcase:91434
  Escenario: Seleccionar una Compañía habilita sus filtros dependientes y los reinicia al cambiar
    Cuando el usuario selecciona una "Compañía"
    Entonces los filtros "Usuario responsable" y "Sociedad" deben habilitarse
    Cuando el usuario cambia la "Compañía" seleccionada
    Entonces los valores previamente seleccionados en "Usuario responsable" y "Sociedad" deben limpiarse

  @hu:90059 @regression @critical @testcase:91435
  Escenario: Aplicar filtros actualiza el contador de resultados
    Cuando el usuario aplica los filtros
    Entonces el contador de resultados debe actualizarse según la consulta

  @hu:90059 @regression @testcase:91436
  Escenario: Limpiar filtros restablece el componente a su estado inicial
    Cuando el usuario limpia los filtros
    Entonces todos los filtros deben volver a su estado inicial
