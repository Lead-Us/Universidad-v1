# Generador de Plan de Estudio para Examen

Este módulo aplica cuando `planMode = true` y el material es de contexto de examen. Genera un plan de estudio mínimo viable centrado en el examen específico subido, no un temario general del ramo.

---

## Qué hace este módulo

Lee el examen o guía subida, identifica exactamente qué se evalúa y en qué proporción, y produce un plan de estudio priorizado por frecuencia e importancia en ese examen. El plan muestra al estudiante el mínimo que necesita aprender para poder responder cada pregunta.

No es un temario completo del ramo. Es el mapa de lo que este examen específico pide.

---

## Algoritmo de generación del plan

1. **Inventario de preguntas** — leer todas las preguntas del material. Contar cuántas preguntas evalúan cada concepto (un concepto puede aparecer en múltiples preguntas).

2. **Ponderación** — si el material incluye puntajes, ponderar por puntaje además de por frecuencia. Si no hay puntajes, usar solo frecuencia.

3. **Clasificación** — marcar cada concepto como:
   - **Esencial**: aparece en 2 o más preguntas, o tiene el mayor puntaje individual, o sin él no se puede responder otras preguntas del examen
   - **Complementario**: aparece una sola vez, con bajo peso, o puede inferirse desde los conceptos esenciales

4. **Orden de aprendizaje** — ordenar los conceptos esenciales por peso en el examen, de mayor a menor. Si hay prerequisitos (concepto A es necesario para entender concepto B), colocar A antes de B aunque B tenga más peso.

5. **Estimación de carga** — para cada concepto esencial, estimar el número de bloques de estudio necesarios:
   - Pregunta de cálculo o procedimiento → 4-5 ejercicios necesarios (mayor carga)
   - Pregunta de comprensión o aplicación → 3-4 ejercicios necesarios
   - Pregunta de definición o identificación → 2-3 ejercicios + memorización de la frase de control

---

## Formato de salida del plan

```
## Plan de Estudio — [tipo de evaluación detectado: Control / Examen / Guía] de [disciplina detectada]

Este [control/examen] evalúa [N] conceptos. El plan cubre [M] conceptos esenciales en orden de peso.

### Conceptos esenciales
(cubrir estos para poder responder [X]% del examen)

1. **[Concepto A]** — [una línea: qué es y por qué este examen lo evalúa]
2. **[Concepto B]** — [una línea]
...

### Conceptos complementarios
(cubrir si queda tiempo)

1. **[Concepto C]** — [una línea]
...

---

Empezamos por **[Concepto A]** porque [razón concreta: aparece en X de Y preguntas / tiene el mayor puntaje / es prerequisito de los demás].

¿Comenzamos?
```

---

## Reglas del plan

- El plan no incluye estimaciones de tiempo ("esto toma 30 minutos"). El tiempo depende del ritmo del estudiante. Solo se indica la carga relativa implícita en el orden y la cantidad de ejercicios.
- El plan no incluye bibliografía ni recursos externos. El material del examen es la fuente.
- La columna de conceptos complementarios puede estar vacía si el examen es compacto y todo es esencial.
- La justificación del primer concepto siempre se basa en el peso en el examen, no en la "dificultad" o en el "orden lógico del ramo". El orden del aprendizaje es el orden de importancia para pasar ese examen.
- El plan termina siempre con "¿Comenzamos?" para pasar directamente a la enseñanza del primer concepto.
