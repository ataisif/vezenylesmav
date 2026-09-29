import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType, 
  AlignmentType,
  ShadingType
} from 'docx';

export interface GuideSection {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  tips?: string[];
  legalReference?: string;
}

export const USER_GUIDE_DATA: {
  title: string;
  subtitle: string;
  version: string;
  date: string;
  organization: string;
  sections: GuideSection[];
} = {
  title: 'MÁV PÁLYAMŰKÖDTETÉS — VEZÉNYLÉSTERVEZŐ RENDSZER',
  subtitle: 'Hivatalos Felhasználói Útmutató és Rendszerkezelési Kézikönyv',
  version: '2.5.0 (2026)',
  date: '2026. október',
  organization: 'MÁV Zrt. Pályaműködtetés — Forgalmi és TEB Szakszolgálatok',
  sections: [
    {
      id: 'intro',
      title: '1. Rendszer Áttekintés és Szabályozási Háttér',
      summary: 'A webalkalmazás a vasúti forgalmi és biztosítóberendezési (TEB) szakszolgálatok havi szolgálati beosztásának (vezénylésének) digitális tervezésére, automatikus generálására és jogszabályi ellenőrzésére szolgál.',
      steps: [
        'A rendszer maradéktalanul érvényesíti a MÁV Kollektív Szerződés (KSz) 24–43. § pontjait, valamint a 2025. augusztus 27-i megállapodás előírásait.',
        'Kezeli mind a Forgalmi (Főrendelkező, Rendelkező forgalmi szolgálattevő, Külső szolgálattevő, Váltókezelő), mind a Biztosítóberendezési TEB (Szakaszmérnök, Műszerész, Lakatos, Technikus) munkaköröket.',
        'Automatikus pihenőidő-ellenőrzéssel és lefedettségi szűk keresztmetszet hőtérképpel támogatja a vezénylőket.'
      ],
      tips: [
        'A tervezés előtt mindig győződjön meg arról, hogy a kívánt hónap és szolgálati hely van kiválasztva a felső sávban.',
        'A havi törvényes órakeret (statutory required hours) munkanapok × 8 óra alapján automatikusan kalkulálódik.'
      ],
      legalReference: 'MÁV KSz 24. § (Munkaidő-keret), Mt. 101–108. §'
    },
    {
      id: 'navigation',
      title: '2. Fejléc és Alapvető Kezelőszervek',
      summary: 'A fejlécben találhatók a legfontosabb navigációs fülek, szűrők és globális műveleti gombok.',
      steps: [
        'Szolgálati Hely Választó: Válasszon a meglévő állomások közül (Budapest-Kelenföld, Ferencváros, Győr, Cegléd, Miskolc TEB Szakasz stb.).',
        'Új Szolgálati Hely Hozzáadása (+ gomb): Létrehozhat új állomást vagy szakaszmérnökséget egyedi létszám-előírásokkal.',
        'Év és Hónap Kiválasztása: Válassza ki a tervezni kívánt évet (pl. 2026) és hónapot (pl. Október).',
        'Havi Beosztás Generálása (Varázspálca gomb): Automatikus algoritmus, amely a jóváhagyott szabadságok, munkarendek és pihenőidők figyelembevételével készít teljes havi beosztást.',
        'Exportálás (CSV) és Nyomtatás: Hivatalos MÁV formátumú nyomtatási nézet generálása papír alapú kifüggesztéshez.'
      ],
      tips: [
        'A "Csak Állomás Dolgozói" jelölőnégyzettel azonnal kiszűrheti az adott állomáshoz nem tartozó kollégákat.',
        'A fejléc jobb felső részén látható a nyitott KSz szabálysértések száma élő számlálóval.'
      ]
    },
    {
      id: 'grid',
      title: '3. A Vezénylési Rács (ScheduleGrid) Kezelése',
      summary: 'A központi naptárrácsban tekinthető át és szerkeszthető az összes dolgozó napi szolgálata.',
      steps: [
        'Szakterületi Szűrés: A rács feletti gombokkal egy kattintással válthat az "Összes", "🔧 Biztosítóberendezés TEB", vagy "🚆 Forgalom" dolgozók nézete között.',
        'Munkakör és Név szerinti Keresés: Használja a szöveges keresőmezőt vagy a munkakör legördülő szűrőt.',
        'Műszakok Színkódjai: N12 (12h nappal, kék), É12 (12h éjszaka, indigókék), BB-K (8h karbantartó, zöld), BB-HN (12h hibaelhárítás, cián), KÉSZ (készenlét, borostyán), SZAB (szabadság, smaragd), PIH (pihenőnap, sötétszürke).',
        'Óraegyenleg: A dolgozói sor bal oldalán látható a havi teljesített munkaórák száma és az eltérés (+/- órák a kötelező kerethez képest).'
      ],
      tips: [
        'Az ünnepnapok piros kiemeléssel jelennek meg, és a rendszer automatikusan számolja rájuk a 120%-os munkaszüneti pótlékot.',
        'A vasárnapi szolgálatok borostyán sárga fejléccel vannak megkülönböztetve.'
      ]
    },
    {
      id: 'heatmap',
      title: '4. Műszak Hőtérkép és Szűk Keresztmetszet Indikátor',
      summary: 'Vizuális hőtérkép rendszer, amely azonnal jelzi azokat a napokat, ahol egyszerre több munkatárs dolgozik kiemelt megterhelést jelentő műszakban.',
      steps: [
        'Hőtérkép Bekapcsolása: A rács feletti "Műszak Hőtérkép [AKTÍV / KI]" gombra kattintva kapcsolható be a vizuális kiemelés.',
        'Fókuszált Módok: Válasszon a "12h & Éjszaka", "Csak Éjszaka" vagy "Csak 12h" elemzési szűrők közül.',
        'Színfokozatok és Jelvények a cellákban: 1 fő = normál; 2 fő = borostyán keret + 🔥2; 3 fő = narancs keret + 🔥3; 4+ fő = vörös pulzáló keret + 🔥4+ láng-kitűző.',
        'Szűk Keresztmetszet Összesítő Sáv: A táblázat legfelső sorában látható az adott napon tapasztalható csúcsterhelés műszakkóddal ellátva (pl. 3×N12).'
      ],
      tips: [
        'A kiemelt terhelésű napokon vigye az egeret a láng ikonra: a felugró szöveg felsorolja az érintett kollégák nevét és a pihenőidő-kiesés lehetséges kockázatát a következő műszakban.'
      ]
    },
    {
      id: 'swap',
      title: '5. Szolgálat Módosítása és Műszakcsere Kérése',
      summary: 'Bármely naptárcellára kattintva megnyílik a szolgálatszerkesztő és az intelligens műszakcsere modul.',
      steps: [
        'Szolgálat Módosítása: Válasszon műszaktípust, állítsa be az egyéni kezdési és befejezési időt, jelölje be a túlórát vagy a 120 órán belüli rendkívüli módosítást.',
        'Műszakcsere Kérése (ÚJ fül): Kattintson a "Műszakcsere Kérése" fülre, vagy lebegtesse az egeret a cella felett és kattintson a megjelenő ⇄ ikonra.',
        'Cseremód Kiválasztása: Válasszon "Azonos napi csere" vagy "Kétirányú / Másnapi csere" között.',
        'Partner Kiválasztása: Válassza ki a kollégát, akivel cserélni kíván; a rendszer azonnal mutatja a partner adott napi beosztását és utazási idejét.',
        'Automatikus Pihenőidő Validáció: A rendszer valós időben kalkulálja az előző és következő szolgálatok közötti pihenőidőt (lakásra érkezéstől számítva, az utazási idő levonásával).',
        'Végrehajtás: Zöld (Engedélyezett) vagy Sárga (Figyelmeztetés) státusz esetén azonnal érvényesítheti a cserét, vagy beküldheti kérelemként.'
      ],
      tips: [
        'Piros (Szabálysértő) minősítés esetén a gombok zárolva maradnak, megakadályozva a törvénytelen (<8h pihenő vagy túl sok éjszaka) beosztást.',
        'A munkavállalók közös kérelmére történő csere a MÁV KSz 29. § 2. pontja alapján mentesül a 120 órás munkáltatói beosztásközlési szabály alól.'
      ],
      legalReference: 'MÁV KSz 41. § 1–2. pont, KSz 32. § 2. pont, KSz 29. § 2. pont'
    },
    {
      id: 'leaves',
      title: '6. Szabadságok és Munkavállalói Igények Kezelése',
      summary: 'A "Szabadságok & Igények" menüpontban rögzíthetők a dolgozói távollétek és szolgálati preferenciák.',
      steps: [
        'Kérelem Típusok: Rendes szabadság (Mt. 122. §), Véradói pótszabadság (+2 nap 4 véradás után - KSz 43. § 3.), Főrendelkezői rendkívüli szabadság (+2 nap - KSz 43. § 4.), Betegszabadság, Időszakos orvosi alkalmassági és Kötelező oktatás/vizsga (KSz 34. §).',
        'Kérelem Rögzítése: Válassza ki a dolgozót, a kérelem típusát, az időtartamot és az indoklást, majd kattintson a "Kérelem Mentése" gombra.',
        'Szinkronizálás a Beosztással: A jóváhagyott szabadságokat a rendszer azonnal zárolt (nem felülírható) státusszal bevezeti a havi naptárba.'
      ],
      tips: [
        'A Műszakcserék fül alatt a kollégák által kezdeményezett korábbi cserék története is visszakövethető.'
      ]
    },
    {
      id: 'compliance',
      title: '7. Kollektív Szerződés Audit és Compliance Ellenőrzés',
      summary: 'A "KSz Szabályzat & Audit" menüpont a teljes havi vezénylést másodpercenként ellenőrzi a vasúti munkajogi szabályok szerint.',
      steps: [
        'Szabálysértések Listája: Külön bontásban jeleníti meg a hibákat (ERROR, piros) és figyelmeztetéseket (WARNING, sárga).',
        'Közvetlen Ugrás a Hibához: A "Megtekintés a rácsban" gombra kattintva a naptár azonnal a hibás cellához navigál.',
        'Automatikus Javítás (Auto-Fix): Egyetlen kattintással átrendezi a beosztást úgy, hogy a pihenőidők és éjszakai műszakszámok megfeleljenek a szabályoknak.'
      ],
      tips: [
        'A képernyő jobb szélén lévő "MÁV Szabályzat" gombbal bármikor előhívható a teljes Kollektív Szerződés kivonatos jogszabálytára.'
      ],
      legalReference: 'MÁV KSz 28–43. §, 2025. aug. 27. Megállapodás III., VIII., IX.'
    }
  ]
};

/**
 * Generates an authentic Microsoft Word (.docx) document containing the complete user guide.
 */
export async function generateUserGuideDOCX(): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in twips
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: [
          // Header / Title block
          new Paragraph({
            text: USER_GUIDE_DATA.organization,
            style: 'Header',
            spacing: { after: 120 }
          }),
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: USER_GUIDE_DATA.title,
                bold: true,
                size: 32,
                color: '0F172A'
              })
            ],
            spacing: { after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: USER_GUIDE_DATA.subtitle,
                italics: true,
                size: 24,
                color: '475569'
              })
            ],
            spacing: { after: 240 }
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Verziószám: ', bold: true }),
                          new TextRun(USER_GUIDE_DATA.version)
                        ]
                      })
                    ],
                    shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' }
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'Kiadás dátuma: ', bold: true }),
                          new TextRun(USER_GUIDE_DATA.date)
                        ]
                      })
                    ],
                    shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' }
                  })
                ]
              })
            ]
          }),

          new Paragraph({ text: '', spacing: { after: 360 } }),

          // Sections
          ...USER_GUIDE_DATA.sections.flatMap(section => [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [
                new TextRun({
                  text: section.title,
                  bold: true,
                  size: 26,
                  color: 'D97706' // Amber-600
                })
              ],
              spacing: { before: 280, after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: section.summary,
                  italics: true,
                  size: 21,
                  color: '334155'
                })
              ],
              spacing: { after: 160 }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: 'Lépésről-lépésre útmutató:',
                  bold: true,
                  size: 20,
                  color: '0F172A'
                })
              ],
              spacing: { after: 80 }
            }),

            ...section.steps.map(step => new Paragraph({
              children: [
                new TextRun({ text: '• ', bold: true, color: 'D97706' }),
                new TextRun({ text: step, size: 20, color: '1E293B' })
              ],
              spacing: { after: 80 },
              indent: { left: 360 }
            })),

            ...(section.tips && section.tips.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Hasznos tippek & jó tanácsok:', bold: true, size: 20, color: '0284C7' })
                ],
                spacing: { before: 120, after: 80 }
              }),
              ...section.tips.map(tip => new Paragraph({
                children: [
                  new TextRun({ text: '💡 ', size: 18 }),
                  new TextRun({ text: tip, size: 20, italics: true, color: '0369A1' })
                ],
                spacing: { after: 80 },
                indent: { left: 360 }
              }))
            ] : []),

            ...(section.legalReference ? [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Vonatkozó MÁV KSz szabályzat: ', bold: true, size: 18, color: '64748B' }),
                  new TextRun({ text: section.legalReference, size: 18, color: '475569' })
                ],
                spacing: { before: 100, after: 240 }
              })
            ] : [
              new Paragraph({ text: '', spacing: { after: 180 } })
            ])
          ])
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * Triggers a direct download of the User Guide in Word (.docx) format.
 */
export async function downloadUserGuideDOCX(): Promise<void> {
  const blob = await generateUserGuideDOCX();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'MAV_Vezenylestervezo_Felhasznaloi_Utmutato.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
