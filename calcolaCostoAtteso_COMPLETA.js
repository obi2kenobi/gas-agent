/**
 * FUNZIONE calcolaCostoAtteso COMPLETA
 * Versione corretta con VALIDATOR integrato
 *
 * FIRMA CORRETTA (8 parametri):
 * calcolaCostoAtteso(provincia, pesoReale, nPallet, cap, localita, cliente, dimensioniArticolo, businessUnit)
 */

function calcolaCostoAtteso(
  provincia,           // Es. "LI"
  pesoReale,          // Es. 335 kg
  nPallet,            // Es. 1
  cap,                // Es. "55049"
  localita,           // Es. "VIAREGGIO"
  cliente,            // Es. "CLI001"
  dimensioniArticolo, // Es. "2200×1180×670mm"
  businessUnit        // Es. "BIOC" o null
) {
  /**
   * Calcola costo spedizione DTE completo con:
   * - VALIDATOR integrato per validazione input
   * - Calcolo STANDARD + ESPRESSO
   * - Multi-contratto (FINO_A_220, FINO_A_240, A_PLT)
   * - Zone ECONOMY
   * - Supplementi località
   * - Analisi listino errato
   */

  // === INIZIALIZZAZIONE RISULTATO ===
  const risultato = {
    valido: false,
    contratto: null,
    tipoTariffa: 'STANDARD',
    scontoEconomy: 0,
    supplementoLocalita: 0,

    STANDARD: {
      noloBase: null,
      noloBaseOriginale: null,
      accessori: null,
      supplemento: 0,
      costoTotale: null,
      metodo: null,
      confidenza: null,
      dettaglioCalcolo: null
    },

    ESPRESSO: {
      noloBase: null,
      noloBaseOriginale: null,
      accessori: null,
      supplemento: 0,
      costoTotale: null,
      metodo: null,
      confidenza: null,
      dettaglioCalcolo: null
    },

    multiContratto: {
      FINO_A_220: null,
      FINO_A_240: null,
      A_PLT: null,
      analisiListino: {
        anomalia: false,
        listinoDovrebbe: null,
        listinoApplicato: null,
        sovrapprezzo: 0,
        percentuale: 0,
        gravita: null,
        messaggio: null
      }
    },

    note: []
  };

  // === VALIDAZIONE INPUT CON VALIDATOR ===
  try {
    // Valida provincia
    const validProv = VALIDATOR.provincia(provincia);
    if (!validProv.valido) {
      risultato.note.push(validProv.errore);
      return risultato;
    }
    provincia = validProv.provinciaNormalizzata;

    // Valida peso
    const validPeso = VALIDATOR.peso(pesoReale, 'Peso reale');
    if (!validPeso.valido) {
      risultato.note.push(validPeso.errore);
      return risultato;
    }
    pesoReale = validPeso.pesoNormalizzato;

    // Valida CAP (opzionale per calcolo base)
    if (cap) {
      const validCAP = VALIDATOR.cap(cap);
      if (!validCAP.valido) {
        risultato.note.push(validCAP.errore);
      } else {
        cap = validCAP.capNormalizzato;
        if (validCAP.warning) {
          risultato.note.push(validCAP.warning);
        }
      }
    }

  } catch (error) {
    risultato.note.push(`Errore validazione input: ${error.message}`);
    return risultato;
  }

  // === DETERMINA TIPO CONTRATTO ===
  const tipoContratto = getContrattoType(dimensioniArticolo, businessUnit);
  risultato.contratto = tipoContratto;

  if (!DTE_LISTINI[tipoContratto]) {
    risultato.note.push(`Contratto ${tipoContratto} non implementato`);
    return risultato;
  }

  // === DETERMINA FASCIA PESO ===
  const fasciaPeso = getFasciaPeso(pesoReale);

  if (!fasciaPeso || fasciaPeso === 'FUORI_SCALA') {
    risultato.note.push(`Peso ${pesoReale}kg fuori scala listino`);
    return risultato;
  }

  // === IDENTIFICA ZONA ECONOMY ===
  let tipoZonaEconomy = null;
  let scontoEconomy = 0;

  if (cap && localita) {
    tipoZonaEconomy = identificaZonaEconomy(cap, provincia, localita);

    if (tipoZonaEconomy === 'ECONOMY_EXTRA_LIGHT') {
      scontoEconomy = DTE_CONFIG.SCONTO_ECONOMY.EXTRA_LIGHT;
      risultato.tipoTariffa = 'ECONOMY EXTRA_LIGHT';
      risultato.scontoEconomy = scontoEconomy;
    } else if (tipoZonaEconomy === 'ECONOMY_QUARTER') {
      scontoEconomy = DTE_CONFIG.SCONTO_ECONOMY.QUARTER;
      risultato.tipoTariffa = 'ECONOMY QUARTER';
      risultato.scontoEconomy = scontoEconomy;
    }
  }

  // === SUPPLEMENTO LOCALITÀ ===
  let supplementoLocalita = 0;
  if (cap) {
    supplementoLocalita = getSupplementoLocalita(cap);
    if (supplementoLocalita > 0) {
      risultato.supplementoLocalita = supplementoLocalita;
      risultato.note.push(`Supplemento località: €${supplementoLocalita.toFixed(2)}`);
    }
  }

  // === CALCOLO ACCESSORI ===
  const accessori = calcolaAccessori(nPallet);

  // === CALCOLO PER ENTRAMBI I SERVIZI (STANDARD + ESPRESSO) ===
  const servizi = ['STANDARD', 'ESPRESSO'];

  for (const servizio of servizi) {
    const listino = DTE_LISTINI[tipoContratto][servizio];

    if (!listino[provincia]) {
      risultato[servizio].metodo = 'PROVINCIA_NON_IN_LISTINO';
      risultato[servizio].confidenza = 'NULLA';
      risultato[servizio].dettaglioCalcolo = `Provincia ${provincia} non in listino ${tipoContratto} ${servizio}`;
      continue;
    }

    const tariffeProvincia = listino[provincia];
    const noloListino = tariffeProvincia[fasciaPeso];

    if (!noloListino || noloListino === 0) {
      risultato[servizio].metodo = 'FASCIA_NON_IN_LISTINO';
      risultato[servizio].confidenza = 'NULLA';
      risultato[servizio].dettaglioCalcolo = `Fascia ${fasciaPeso} non disponibile`;
      continue;
    }

    // Salva nolo originale
    risultato[servizio].noloBaseOriginale = noloListino;

    // Applica sconto ECONOMY se presente
    let noloFinale = noloListino;
    if (scontoEconomy > 0) {
      noloFinale = noloListino * (1 - scontoEconomy);
    }

    risultato[servizio].noloBase = noloFinale;
    risultato[servizio].accessori = accessori;
    risultato[servizio].supplemento = supplementoLocalita;

    // Calcolo totale
    risultato[servizio].costoTotale =
      noloFinale +
      accessori.totale() +
      supplementoLocalita;

    risultato[servizio].metodo = 'LISTINO_UFFICIALE';
    risultato[servizio].confidenza = 'ALTA';
    risultato[servizio].dettaglioCalcolo =
      `${provincia}-${fasciaPeso}: Nolo €${noloListino.toFixed(2)}` +
      (scontoEconomy > 0 ? ` → €${noloFinale.toFixed(2)} (ECONOMY -${(scontoEconomy*100).toFixed(0)}%)` : '') +
      ` + Accessori €${accessori.totale().toFixed(2)}` +
      (supplementoLocalita > 0 ? ` + Supplemento €${supplementoLocalita.toFixed(2)}` : '') +
      ` = €${risultato[servizio].costoTotale.toFixed(2)}`;
  }

  // === CALCOLO MULTI-CONTRATTO (tutti e 3 i listini) ===
  const contratti = ['FINO_A_220', 'FINO_A_240', 'A_PLT'];

  for (const contratto of contratti) {
    if (!DTE_LISTINI[contratto]) continue;

    const listinoContratto = DTE_LISTINI[contratto]['STANDARD'];

    if (!listinoContratto[provincia]) continue;

    const tariffeContratto = listinoContratto[provincia];
    const noloContratto = tariffeContratto[fasciaPeso];

    if (!noloContratto || noloContratto === 0) continue;

    // Applica sconto ECONOMY se presente
    let noloFinaleContratto = noloContratto;
    if (scontoEconomy > 0) {
      noloFinaleContratto = noloContratto * (1 - scontoEconomy);
    }

    const costoTotaleContratto =
      noloFinaleContratto +
      accessori.totale() +
      supplementoLocalita;

    risultato.multiContratto[contratto] = {
      noloOriginale: noloContratto,
      noloBase: noloFinaleContratto,
      accessori: accessori.totale(),
      supplemento: supplementoLocalita,
      costoTotale: costoTotaleContratto
    };
  }

  // === ANALISI LISTINO ERRATO ===
  // Determina quale listino DOVREBBE essere usato
  const listinoDovrebbe = getContrattoType(dimensioniArticolo, businessUnit);

  // Calcola costi per tutti i listini disponibili
  const costoFINO_A_220 = risultato.multiContratto.FINO_A_220?.costoTotale || null;
  const costoFINO_A_240 = risultato.multiContratto.FINO_A_240?.costoTotale || null;
  const costoA_PLT = risultato.multiContratto.A_PLT?.costoTotale || null;

  // Trova il listino con costo più basso (quello che DTE probabilmente ha applicato)
  let listinoApplicato = null;
  let costoMinimo = Infinity;

  if (costoFINO_A_220 && costoFINO_A_220 < costoMinimo) {
    costoMinimo = costoFINO_A_220;
    listinoApplicato = 'FINO_A_220';
  }

  if (costoFINO_A_240 && costoFINO_A_240 < costoMinimo) {
    costoMinimo = costoFINO_A_240;
    listinoApplicato = 'FINO_A_240';
  }

  if (costoA_PLT && costoA_PLT < costoMinimo) {
    costoMinimo = costoA_PLT;
    listinoApplicato = 'A_PLT';
  }

  // Verifica se c'è anomalia (listino applicato diverso da quello dovuto)
  if (listinoApplicato && listinoDovrebbe && listinoApplicato !== listinoDovrebbe) {
    const costoDovrebbe = risultato.multiContratto[listinoDovrebbe]?.costoTotale || null;
    const costoApplicato = risultato.multiContratto[listinoApplicato]?.costoTotale || null;

    if (costoDovrebbe && costoApplicato && costoApplicato < costoDovrebbe) {
      const sovrapprezzo = costoDovrebbe - costoApplicato;
      const percentuale = (sovrapprezzo / costoApplicato) * 100;

      let gravita = 'BASSA';
      if (percentuale > 50) {
        gravita = 'ALTA';
      } else if (percentuale > 25) {
        gravita = 'MEDIA';
      }

      risultato.multiContratto.analisiListino = {
        anomalia: true,
        listinoDovrebbe: listinoDovrebbe,
        listinoApplicato: listinoApplicato,
        sovrapprezzo: sovrapprezzo,
        percentuale: percentuale,
        gravita: gravita,
        messaggio: `DTE ha applicato ${listinoApplicato} invece di ${listinoDovrebbe} → sovrapprezzo €${sovrapprezzo.toFixed(2)} (+${percentuale.toFixed(1)}%)`
      };

      risultato.note.push(`⚠️ LISTINO ERRATO: ${risultato.multiContratto.analisiListino.messaggio}`);
    }
  } else {
    // Nessuna anomalia
    risultato.multiContratto.analisiListino = {
      anomalia: false,
      listinoDovrebbe: listinoDovrebbe,
      listinoApplicato: listinoApplicato || listinoDovrebbe,
      sovrapprezzo: 0,
      percentuale: 0,
      gravita: null,
      messaggio: null
    };
  }

  // === VALIDAZIONE FINALE ===
  risultato.valido = (
    risultato.STANDARD.costoTotale !== null ||
    risultato.ESPRESSO.costoTotale !== null
  );

  return risultato;
}
