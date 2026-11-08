/**
 * VILLA CONFIG — única fuente de verdad.
 * Para vender esta plantilla a otra villa: edita SOLO este archivo (+ index.html: <title> y noindex).
 * Todo texto visible que dependa de la villa vive aquí, en pares { es, en }.
 *
 * ⚠️  Todo lo marcado con  // VERIFICAR  es un dato inventado o sin confirmar: confírmalo con el dueño antes de publicar.
 */
window.VILLA_CONFIG = {
  // true = contenido de ejemplo: muestra la etiqueta "Ejemplo" en reseñas y deja el sitio en noindex (ver index.html).
  demoMode: true,

  name: "Villa Azul Caribe",
  siteUrl: "https://villaazulcaribe.com", // VERIFICAR: dominio real
  timezone: "America/Santo_Domingo",       // las fechas "hoy/mañana" se calculan en la zona de la villa

  contact: {
    whatsapp: "18090000000",               // VERIFICAR: número real, solo dígitos con código de país
    phoneDisplay: "+1 (809) 000-0000",     // VERIFICAR
    email: "reservas@villaazulcaribe.com", // VERIFICAR
    address: { es: "Costambar, Puerto Plata, República Dominicana", en: "Costambar, Puerto Plata, Dominican Republic" }
  },
  geo: { lat: 19.8033, lng: -70.697 },     // VERIFICAR: coordenadas reales (aprox. está bien, no publiques la exacta)

  capacity: { guests: 10, bedrooms: 5, bathrooms: 5 },
  stay: { checkIn: "15:00", checkOut: "11:00", minNights: 2 }, // VERIFICAR minNights

  pricing: {
    currency: "USD",
    basePerNight: 350,
    highSeasonPerNight: 450,
    highSeasonMonths: [11, 0, 1, 2, 3],    // 0 = enero … 11 = diciembre
    cleaningFee: 120,
    directDiscountPercent: 10,
    securityDeposit: 300
  },

  // Noches NO disponibles (ambos extremos incluidos). Fuente: tu calendario / export .ics de Airbnb o Booking.
  // Ejemplo: { from: "2026-12-20", to: "2026-12-27" }
  blockedRanges: [],

  // Solo con datos REALES (Airbnb/Google). null = no se muestra ni se publica en schema.org.
  rating: null, // ej.: { value: 4.9, count: 31, source: "Airbnb" }

  // Mensaje de urgencia: solo si es verdad y verificable. null = oculto.
  urgency: null, // ej.: { es: "Quedan 2 fines de semana libres en diciembre", en: "Only 2 weekends left in December" }

  // Tiempo de respuesta: solo si lo puedes cumplir. null = oculto.
  responseTime: null, // ej.: { es: "Respondemos en menos de 1 hora (8am–10pm)", en: "We reply within 1 hour (8am–10pm)" }

  highlights: [
    { icon: "users", title: { es: "10 huéspedes · 5 suites", en: "10 guests · 5 suites" },
      desc: { es: "Cinco dormitorios con baño en suite y camas king y queen, pensados para grupos y familias.", en: "Five en-suite bedrooms with king and queen beds, designed for groups and families." },
      tag: { es: "Privacidad total", en: "Total privacy" } },
    { icon: "pool", title: { es: "Piscina privada infinity", en: "Private infinity pool" },
      desc: { es: "Piscina de borde infinito con iluminación nocturna, tumbonas y zona lounge exterior.", en: "Infinity-edge pool with night lighting, sun loungers and an outdoor lounge area." },
      tag: { es: "Solo para huéspedes", en: "Guests only" } },
    { icon: "beach", title: { es: "A 5 min de la playa", en: "5 min from the beach" },
      desc: { es: "En un enclave residencial de Costambar, a pocos minutos de la playa.", en: "In a residential enclave in Costambar, minutes from the beach." },
      tag: { es: "Costa norte", en: "North coast" } }, // VERIFICAR distancia real a pie
    { icon: "chef", title: { es: "Chef personal", en: "Personal chef" },
      desc: { es: "Cocina dominicana e internacional y mariscos frescos. Menús a tu medida, bajo petición.", en: "Dominican and international cuisine with fresh seafood. Tailored menus, on request." },
      tag: { es: "Bajo petición", en: "On request" } },
    { icon: "wifi", title: { es: "WiFi de alta velocidad (Starlink)", en: "High-speed WiFi (Starlink)" },
      desc: { es: "Internet satelital con cobertura en habitaciones, jardín y piscina, apto para teletrabajo.", en: "Satellite internet covering bedrooms, garden and pool, suitable for remote work." },
      tag: { es: "Apto para teletrabajo", en: "Remote-work friendly" } }, // VERIFICAR: Starlink NO es simétrico; no prometas "300 Mbps simétricos"
    { icon: "ac", title: { es: "Climatización en cada habitación", en: "Air conditioning in every room" },
      desc: { es: "Aire acondicionado independiente por estancia y ventiladores de techo.", en: "Independent air conditioning in each room plus ceiling fans." },
      tag: { es: "Confort todo el año", en: "Year-round comfort" } } // VERIFICAR: generador de respaldo (se quitó la promesa "24/7")
  ],

  // IMPORTANTE: fotos de stock (Unsplash) como marcador de posición. Reemplázalas por fotos REALES de la villa.
  gallery: [
    { cat: "pool", id: "photo-1580587771525-78b9dba3b914", title: { es: "Piscina infinity al atardecer", en: "Infinity pool at dusk" } },
    { cat: "pool", id: "photo-1576013551627-0cc20b96c2a7", title: { es: "Solárium y zona lounge", en: "Sun deck & lounge" } },
    { cat: "rooms", id: "photo-1618773928121-c32242e63f39", title: { es: "Suite principal con cama king", en: "Master suite with king bed" } },
    { cat: "rooms", id: "photo-1590490360182-c33d57733427", title: { es: "Suite junior con terraza", en: "Junior suite with terrace" } },
    { cat: "kitchen", id: "photo-1600585154340-be6161a56a0c", title: { es: "Cocina equipada", en: "Fully equipped kitchen" } },
    { cat: "kitchen", id: "photo-1617806118233-18e1de247200", title: { es: "Comedor interior", en: "Indoor dining room" } },
    { cat: "outdoor", id: "photo-1512917774080-9991f1c4c750", title: { es: "Fachada iluminada y jardines", en: "Illuminated facade & gardens" } },
    { cat: "outdoor", id: "photo-1600596542815-ffad4c1539a9", title: { es: "Terraza exterior", en: "Outdoor terrace" } }
  ],

  // multiplier: "nights" = precio × noches · número = veces fijas · 1 = una vez
  experiences: [
    { id: "chef", price: 150, multiplier: "nights", img: "photo-1555396273-367ea4eb4db5",
      title: { es: "Chef gourmet privado", en: "Private gourmet chef" },
      desc: { es: "Menús de 3 tiempos con mariscos frescos locales y cocina criolla o internacional.", en: "3-course menus with fresh local seafood and Creole or international cuisine." },
      unit: { es: "por día", en: "per day" } },
    { id: "transport", price: 90, multiplier: 2, img: "photo-1549317661-bd32c8ce0db2", // VERIFICAR: ¿ida y vuelta?
      title: { es: "Traslado privado desde el aeropuerto (POP/STI)", en: "Private airport transfer (POP/STI)" },
      desc: { es: "Recepción en SUV con chofer bilingüe y bebidas frías de bienvenida. Precio por trayecto; se cotiza ida y vuelta.", en: "SUV pickup with a bilingual driver and welcome drinks. Priced per trip; quoted round trip." },
      unit: { es: "por trayecto × 2", en: "per trip × 2" } },
    { id: "catamaran", price: 480, multiplier: 1, img: "photo-1507525428034-b723cf961d3e",
      title: { es: "Paseo privado en catamarán", en: "Private catamaran charter" },
      desc: { es: "Navegación por la costa norte y snorkel en arrecifes. Precio por grupo.", en: "North-coast sailing and reef snorkeling. Price per group." },
      unit: { es: "por grupo", en: "per group" } },
    { id: "events", price: 250, multiplier: 1, img: "photo-1519741497674-611481863552",
      title: { es: "Decoración y velada especial", en: "Special evening setup" },
      desc: { es: "Velas, flores tropicales y montaje romántico o de cumpleaños junto a la piscina.", en: "Candlelight, tropical flowers and a romantic or birthday setup by the pool." },
      unit: { es: "por montaje", en: "per setup" } }
  ],

  perks: [ // VERIFICAR cada promesa con el dueño: son compromisos comerciales
    { es: "Tarifa directa sin cargos de plataforma", en: "Direct rate with no platform fees" },
    { es: "Cóctel de bienvenida de cortesía", en: "Complimentary welcome cocktail" },
    { es: "Atención personalizada antes y durante tu viaje", en: "Personal assistance before and during your trip" },
    { es: "Cancelación gratuita hasta 30 días antes", en: "Free cancellation up to 30 days before" }
  ],

  // Reseñas DE EJEMPLO. Sustituir por reseñas reales y poner demoMode:false + rating real.
  reviews: [
    { name: "Marcus & Elena V.", from: "Miami, EE. UU.", date: { es: "Octubre 2024", en: "October 2024" }, sample: true,
      text: { es: "Superó nuestras expectativas. El chef preparó una langosta inolvidable y la piscina al atardecer no tiene comparación. Reservar directo por WhatsApp fue rápido.", en: "Exceeded all expectations. The chef made an unforgettable lobster and the pool at sunset is unmatched. Booking direct on WhatsApp was quick." } },
    { name: "Sophie L.", from: "Montréal, Canadá", date: { es: "Septiembre 2024", en: "September 2024" }, sample: true,
      text: { es: "Fuimos 8 personas para mi cumpleaños número 40. Espacio inmenso, impecable y con total privacidad.", en: "Eight of us came for my 40th birthday. Huge, spotless and completely private." } },
    { name: "Guillermo M.", from: "Madrid, España", date: { es: "Agosto 2024", en: "August 2024" }, sample: true,
      text: { es: "Atención de primera desde que aterrizamos. El internet funcionó perfecto para teletrabajar.", en: "First-class service from the moment we landed. The internet worked perfectly for remote work." } }
  ],

  // VERIFICAR todas las distancias con Google Maps usando la dirección real.
  distances: [
    { icon: "🌊", name: { es: "Playa de Costambar", en: "Costambar Beach" }, time: { es: "5 min a pie", en: "5 min walk" } },
    { icon: "✈️", name: { es: "Aeropuerto Puerto Plata (POP)", en: "Puerto Plata Airport (POP)" }, time: { es: "20 min en auto", en: "20 min drive" } },
    { icon: "✈️", name: { es: "Aeropuerto Cibao, Santiago (STI)", en: "Cibao Airport, Santiago (STI)" }, time: { es: "1 h 10 min en auto", en: "1 h 10 min drive" } },
    { icon: "⛳", name: { es: "Campo de golf de Playa Dorada", en: "Playa Dorada Golf Course" }, time: { es: "15 min en auto", en: "15 min drive" } },
    { icon: "🏛️", name: { es: "Centro histórico y Teleférico", en: "Historic center & Cable Car" }, time: { es: "15 min en auto", en: "15 min drive" } }
  ],

  faq: [
    { q: { es: "¿Cuáles son los horarios de check-in y check-out?", en: "What are the check-in and check-out times?" },
      a: { es: "Check-in desde las 3:00 PM y check-out hasta las 11:00 AM. Check-in anticipado o check-out tardío: sujeto a disponibilidad, consúltanos.", en: "Check-in from 3:00 PM and check-out by 11:00 AM. Early check-in or late check-out is subject to availability — just ask." } },
    { q: { es: "¿Cómo funcionan el anticipo, el depósito y los pagos?", en: "How do the deposit and payments work?" },
      a: { es: "Se bloquean las fechas con un anticipo del 50 % y el resto se paga 7 días antes de la llegada. Además se solicita un depósito de seguridad reembolsable de $300 USD, devuelto tras la inspección de salida. Los métodos de pago se confirman por WhatsApp.", en: "A 50% deposit secures your dates; the balance is due 7 days before arrival. A refundable $300 USD security deposit is also required and returned after the departure inspection. Payment methods are confirmed on WhatsApp." } },
    { q: { es: "¿Se permiten niños y mascotas?", en: "Are children and pets allowed?" },
      a: { es: "Sí, la villa es apta para familias con niños. Las mascotas se aceptan previa consulta y puede aplicar un cargo único de limpieza de $50 USD.", en: "Yes, the villa is family-friendly. Pets are welcome with prior approval and a one-time $50 USD cleaning fee may apply." } }, // VERIFICAR
    { q: { es: "¿Se pueden hacer celebraciones o cenas privadas?", en: "Can we hold celebrations or private dinners?" },
      a: { es: "Sí, celebraciones íntimas (cenas, cumpleaños, aniversarios) con autorización previa. La ocupación para dormir es de 10 huéspedes; consulta el límite de visitantes. No se permite música exterior después de las 11:00 PM.", en: "Yes — intimate celebrations (dinners, birthdays, anniversaries) with prior approval. Sleeping capacity is 10 guests; ask about the visitor limit. No outdoor music after 11:00 PM." } }, // VERIFICAR límite de visitantes
    { q: { es: "¿Cuál es la política de cancelación?", en: "What is the cancellation policy?" },
      a: { es: "Reembolso del 100 % hasta 30 días antes del check-in. Entre 15 y 29 días puedes reprogramar sin penalización dentro de los siguientes 12 meses. Con menos de 15 días la reserva no es reembolsable.", en: "100% refund up to 30 days before check-in. Between 15 and 29 days you can reschedule at no cost within the next 12 months. Within 15 days the booking is non-refundable." } } // VERIFICAR: la última regla la inventé para cerrar el hueco; decide con el dueño
  ]
};
