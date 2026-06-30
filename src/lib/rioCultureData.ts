export interface RioCultureItem {
  id: number;
  phrase: string;
  translation: string;
  source: string;
  vibe: string;
}

export const RIO_CULTURE_ITEMS: RioCultureItem[] = [
  {
    id: 1,
    phrase: "Olha que coisa mais linda, mais cheia de graça, é ela, menina, que vem e que passa, num doce balanço a caminho do mar.",
    translation: "Mira qué cosa más linda, más llena de gracia, es ella, esa niña, que viene y pasa, en un dulce balanceo camino al mar.",
    source: "Garota de Ipanema (Jobim & Vinícius)",
    vibe: "🌅 Ipanema Vibe"
  },
  {
    id: 2,
    phrase: "Minha alma canta, vejo o Rio de Janeiro, estou morrendo de saudades...",
    translation: "Mi alma canta, veo Río de Janeiro, me muero de nostalgia/extrañitis...",
    source: "Samba do Avião (Tom Jobim)",
    vibe: "✈️ Regreso Soñado"
  },
  {
    id: 3,
    phrase: "Carioca não gosta de dias nublados; a gente pertence ao sol, à praia e ao mar.",
    translation: "Al carioca no le gustan los días nublados; nosotros pertenecemos al sol, a la playa y al mar.",
    source: "Expresão Popular",
    vibe: "🌊 Mar e Sol"
  },
  {
    id: 4,
    phrase: "Tristeza não tem fim, felicidade sim.",
    translation: "La tristeza no tiene fin, la felicidad sí (disfruta cada instante de luz).",
    source: "A Felicidade (Vinícius de Moraes)",
    vibe: "✨ Filosofia de Vida"
  },
  {
    id: 5,
    phrase: "Deixa o mar levar pra longe todo o mal que possa existir.",
    translation: "Deja que el mar se lleve lejos todo el mal que pueda existir.",
    source: "Ditado Carioca",
    vibe: "🍃 Purificação"
  },
  {
    id: 6,
    phrase: "Viver e não ter a vergonha de ser feliz, cantar e cantar a beleza de ser um eterno aprendiz.",
    translation: "Vivir y no tener la vergüenza de ser feliz, cantar y cantar la belleza de ser un eterno aprendiz.",
    source: "O Que É, O Que É? (Gonzaguinha)",
    vibe: "🎤 Alegria Pura"
  },
  {
    id: 7,
    phrase: "Coisa mais bonita é você, assim, justinho você, tudo em você é muito lindo.",
    translation: "Cosa más bonita eres tú, así, exactamente tú, todo en ti es muy hermoso.",
    source: "Coisa Mais Linda (João Gilberto)",
    vibe: "🌸 Bossa Romântica"
  }
];

export function getDailyCultureItem(): RioCultureItem {
  const dayOfYear = new Date().getDate();
  const index = dayOfYear % RIO_CULTURE_ITEMS.length;
  return RIO_CULTURE_ITEMS[index];
}
