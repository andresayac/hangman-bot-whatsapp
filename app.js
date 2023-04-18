const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')


const hangmanTemplate = async (errorList) => {

    let person = ["O", "|", "/", "\\", "/ '", "\\"];
    let gallows = ["  ", "  ", "  ", "  ", "  ", "  "];

    for (let i = 0; i < errorList.length; i++) {
        gallows[i] = person[i];
    }

    let template = "*-------*\n";
    template += "||      |    \n";
    template += "||     " + gallows[0] + "    \n";
    template += "||   " + gallows[1] + " " + gallows[0] + " " + gallows[2] + "  \n";
    template += "||   " + gallows[4] + " " + gallows[5] + "   \n";
    template += "||           \n";
    template += "||=========\n\n";

    return template;
}

let words = ['hola', 'mundo', 'perro', 'gato', 'computadora', 'teclado', 'mouse', 'monitor', 'celular', 'telefono', 'casa', 'carro', 'moto', 'bicicleta', 'avion', 'barco', 'helicoptero', 'avioneta', 'pizza', 'playa', 'playstation', 'pelota', 'bicicleta', 'cine', 'teatro', 'computacion', 'programacion', 'nube', 'sol', 'luna', 'estrella', 'planeta', 'guitarra', 'bateria', 'piano', 'musica', 'baile', 'arte', 'pintura', 'escultura', 'literatura', 'poesia', 'escritura', 'trabajo', 'familia', 'amigos', 'vacaciones', 'aventura', 'historia', 'ciencia', 'naturaleza', 'montaña', 'bosque', 'mar', 'rio', 'desierto', 'jungla', 'medicina', 'enfermedad', 'salud', 'vida', 'muerte', 'amor', 'odio', 'felicidad', 'tristeza', 'esperanza', 'sueño', 'pesadilla', 'fantasia', 'realidad', 'cultura', 'religion', 'filosofia', 'politica', 'economia', 'tecnologia', 'internet', 'redes sociales', 'videojuegos', 'deporte', 'equipo', 'campeonato', 'victoria', 'derrota', 'batalla', 'guerra', 'paz', 'justicia', 'libertad', 'democracia', 'derechos', 'humanos', 'educacion', 'conocimiento', 'creatividad', 'innovacion', 'empatia', 'solidaridad', 'respeto', 'tolerancia', 'humildad', 'generosidad', 'optimismo', 'perseverancia', 'sabiduria', 'curiosidad', 'diversion', 'alegria', 'entretenimiento', 'viaje', 'destino', 'aventura', 'sabor', 'aroma', 'textura', 'color', 'forma', 'sonido', 'silencio', 'emocion', 'sentimiento', 'pensamiento', 'accion', 'reaccion', 'creencia', 'opinion', 'actitud', 'comportamiento', 'habilidad', 'talento', 'virtud', 'defecto', 'error', 'fracaso', 'exito', 'logro', 'proyecto', 'objetivo', 'meta', 'plan', 'estrategia', 'accion', 'reaccion', 'sorpresa', 'adrenalina', 'riesgo', 'seguridad', 'proteccion', 'aprendizaje', 'enseñanza', 'entrenamiento', 'ejercicio', 'practica', 'habito', 'costumbre', 'tradicion', 'moda', 'estilo', 'personalidad', 'caracter', 'comunicacion', 'dialogo', 'conversacion', 'negociacion', 'compromiso', 'responsabilidad', 'dedicacion', 'esfuerzo']
let STATE_APP = []

const flowAhorcado = addKeyword(['Ahorcado']).
    addAnswer(
        [
            'El juego del ahorcado es un juego de adivinanza de palabras en el que un jugador intenta adivinar una palabra seleccionada al azar por otro jugador. El jugador tiene un número limitado de intentos para adivinar la palabra antes de que se complete un dibujo de un hombre ahorcado. Por cada intento incorrecto, se añade una parte más al dibujo. Si el jugador completa el dibujo antes de adivinar la palabra, pierde. Si el jugador adivina la palabra antes de completar el dibujo, gana.\n\n',
            'Escriba *jugar* para iniciar el juego'
        ],
        { capture: true },
        async (ctx, { fallBack, flowDynamic, gotoFlow }) => {
            if (ctx.body === 'jugar') {

                let randomIndex = Math.floor(Math.random() * words.length);
                let randomWord = words[randomIndex];
                let hiddenWord = randomWord.replace(/./g, '➖ ');

                STATE_APP[ctx.from].hiddenWord = hiddenWord
                STATE_APP[ctx.from].randomWord = randomWord
                STATE_APP[ctx.from].attempts = 0
                STATE_APP[ctx.from].state = 'playing'
                STATE_APP[ctx.from].errorList = []
                STATE_APP[ctx.from].successList = []

                await flowDynamic([
                    { body: `Hola ${ctx.pushName}` },
                    { body: `Tu palabra tiene una longitud de ${hiddenWord.length / 2} letras` },
                    { body: `Indicio: ${hiddenWord}` },
                ]);
            }


        },
    )
    .addAnswer('Digite una letra', { capture: true },
        async (ctx, { fallBack, flowDynamic, gotoFlow, endFlow }) => {
            let letter = ctx.body

            letter = letter.toLowerCase()
            if (letter === STATE_APP[ctx.from].randomWord) {
                STATE_APP[ctx.from].state = 'not_playing'
                await flowDynamic([{ body: `¡Felicidades! Has adivinado la palabra "*${STATE_APP[ctx.from].randomWord}*" en ${STATE_APP[ctx.from].attempts} intentos` }]);
                await gotoFlow(flowPrincipal);
                return;
            }

            if (letter.length > 1) {
                await flowDynamic([{ body: 'Solo puede digitar una letra' }]);
                await fallBack();
                return;
            }

            const regex = /^[a-zA-Z]+$/;
            if (!regex.test(letter)) {
                await flowDynamic([{ body: 'Solo se permiten letras y no simbolos' }]);
                await fallBack();
                return;
            }



            let hiddenWord = STATE_APP[ctx.from]?.hiddenWord ?? '';
            let randomWord = STATE_APP[ctx.from]?.randomWord ?? '';
            let attempts = STATE_APP[ctx.from]?.attempts ?? 0;

            if (STATE_APP[ctx.from].state === 'playing') {
                if (randomWord.includes(letter)) {
                    let newHiddenWord = ''
                    for (let i = 0; i < randomWord.length; i++) {
                        if (randomWord[i] === letter) {
                            newHiddenWord += letter + ' '
                            STATE_APP[ctx.from].successList.push(letter)
                        } else {
                            newHiddenWord += hiddenWord[i * 2] + ' '
                        }
                    }
                    STATE_APP[ctx.from].hiddenWord = newHiddenWord
                } else {
                    STATE_APP[ctx.from].errorList.push(letter)
                    await flowDynamic([{ body: `La letra *${letter}* no se encuentra` }]);
                    let menssage = await hangmanTemplate(STATE_APP[ctx.from].errorList)
                    await flowDynamic([{ body: `${menssage}` }]);
                    await fallBack();
                }

                STATE_APP[ctx.from].attempts = attempts + 1

                if (!STATE_APP[ctx.from].hiddenWord.includes('➖')) {
                    STATE_APP[ctx.from].state = 'not_playing'
                    await flowDynamic([{ body: `¡Felicidades! Has adivinado la palabra "*${randomWord}*" en ${attempts} intentos` }]);
                    await gotoFlow(flowPrincipal);
                    return;
                } else if (STATE_APP[ctx.from].errorList.length >= 6) {
                    STATE_APP[ctx.from].state = 'not_playing'
                    await flowDynamic([{ body: "¡Lo siento! Has perdido el juego" }, { body: `La palabra era: "*${randomWord}*"` }]);
                    await gotoFlow(flowPrincipal);
                    return;
                } else {
                    await flowDynamic([{ body: `Indicio: ${STATE_APP[ctx.from].hiddenWord}` }]);
                    await fallBack();
                }
            }
        })


const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAnswer([
        '🙌 Hola bienvenido a este *Chatbot*',
        '  👉 *Ahorcado* Para Jugar.',
        '\nEscriba la opción que esta en negrilla para continuar, en caso que no salgan los botones.'
    ])
    .addAnswer(['o selecione la opción'],
        { buttons: [{ body: 'Ahorcado' }], },
        (ctx) => {
            STATE_APP[ctx.from] = { ...STATE_APP[ctx.from], name: ctx.pushName ?? ctx.from };
        },
        [flowAhorcado]
    )


const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal])
    const adapterProvider = createProvider(BaileysProvider)
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
    QRPortalWeb()
}

main()
