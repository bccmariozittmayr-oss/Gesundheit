/* Allgemeine Inhalte – keine persönlichen Daten.
   Quelle: gängige FODMAP-Tabellen (Monash-Prinzip) und Darmkur-Broschüre des Behandlers.
   s: ok = FODMAP-arm, mass = in Maßen, no = FODMAP-reich (meiden) */

const FODMAP=[
 {name:'Obst',open:true,items:[
  {n:'Ananas',s:'ok'},{n:'Banane (unreif, grünlich)',s:'ok'},{n:'Blaubeere / Heidelbeere',s:'ok'},{n:'Cranberry',s:'ok'},{n:'Erdbeere',s:'ok'},{n:'Grapefruit',s:'ok'},{n:'Himbeere',s:'ok'},{n:'Kiwi',s:'ok'},{n:'Kokosnuss',s:'ok'},{n:'Mandarine',s:'ok'},{n:'Maracuja',s:'ok'},{n:'Melone (Honig-, Zucker-)',s:'ok',why:'Wassermelone meiden'},{n:'Orange / Zitrone / Limette',s:'ok'},{n:'Papaya',s:'ok'},{n:'Pomelo',s:'ok'},{n:'Preiselbeere',s:'ok'},{n:'Rhabarber',s:'ok'},{n:'Trauben',s:'ok'},
  {n:'Apfel',s:'no',why:'Fruktose + Sorbit'},{n:'Aprikose / Marille',s:'no',why:'Sorbit'},{n:'Avocado',s:'no',why:'Sorbit'},{n:'Banane (reif, braun)',s:'no'},{n:'Birne',s:'no',why:'Fruktose + Sorbit'},{n:'Brombeere',s:'no',why:'Sorbit'},{n:'Datteln',s:'no'},{n:'Dosenobst',s:'no'},{n:'Feigen',s:'no'},{n:'Granatapfel',s:'no'},{n:'Johannisbeere / Ribisel',s:'no'},{n:'Kaki',s:'no'},{n:'Kirsche',s:'no',why:'Sorbit'},{n:'Litschi',s:'no'},{n:'Mango',s:'no'},{n:'Mirabelle',s:'no'},{n:'Nektarine',s:'no',why:'Sorbit'},{n:'Pfirsich',s:'no',why:'Sorbit'},{n:'Pflaume / Zwetschke',s:'no',why:'Sorbit'},{n:'Stachelbeere',s:'no'},{n:'Trockenobst (Rosinen, Dörrpflaumen …)',s:'no',why:'Sorbit'},{n:'Wassermelone',s:'no'}
 ]},
 {name:'Gemüse',open:true,items:[
  {n:'Aubergine / Melanzani',s:'ok'},{n:'Brokkoli',s:'ok'},{n:'Chinakohl',s:'ok'},{n:'Esskastanien / Maroni',s:'ok'},{n:'Fenchel',s:'ok'},{n:'Grünkohl',s:'ok'},{n:'Gurke',s:'ok'},{n:'Ingwer',s:'ok'},{n:'Karotte',s:'ok'},{n:'Kartoffel',s:'ok'},{n:'Kohlrabi',s:'ok'},{n:'Kopfsalat / Blattsalat',s:'ok'},{n:'Kresse',s:'ok'},{n:'Kürbis',s:'ok'},{n:'Mais',s:'ok'},{n:'Mangold',s:'ok'},{n:'Paprika',s:'ok'},{n:'Radieschen',s:'ok'},{n:'Schnittlauch',s:'ok',why:'Ersatz für Zwiebel'},{n:'Spinat',s:'ok'},{n:'Tofu (fest)',s:'ok'},{n:'Tomate',s:'ok'},{n:'Zucchini',s:'ok'},{n:'Grüne Bohnen / Fisolen',s:'ok'},
  {n:'Artischocke',s:'no'},{n:'Blumenkohl / Karfiol',s:'no',why:'Kohlgemüse – häufig schlecht verträglich'},{n:'Bohnen (außer grüne)',s:'no',why:'Hülsenfrucht'},{n:'Chicorée',s:'no'},{n:'Edamame',s:'no'},{n:'Erbsen',s:'no'},{n:'Frühlingszwiebel (weißer Teil)',s:'no',why:'Zwiebelgewächs'},{n:'Kaiserschote / Zuckerschote',s:'no'},{n:'Kichererbsen',s:'no'},{n:'Knoblauch',s:'no',why:'Fruktane'},{n:'Lauch / Porree',s:'no'},{n:'Linsen',s:'no'},{n:'Pilze / Champignons',s:'no'},{n:'Radicchio',s:'no'},{n:'Rosenkohl / Kohlsprossen',s:'no',why:'Kohl'},{n:'Rote Bete / Rote Rüben',s:'no'},{n:'Rotkohl / Blaukraut',s:'no',why:'Kohl'},{n:'Schalotten',s:'no'},{n:'Schwarzwurzel',s:'no'},{n:'Sellerie',s:'no'},{n:'Soja',s:'no'},{n:'Spargel',s:'no'},{n:'Süßkartoffel',s:'no'},{n:'Topinambur',s:'no'},{n:'Wirsing',s:'no',why:'Kohl'},{n:'Zuckermais (Dose)',s:'no'},{n:'Zwiebel',s:'no',why:'Fruktane'}
 ]},
 {name:'Getreide & Beilagen',items:[
  {n:'Amaranth',s:'ok'},{n:'Buchweizen',s:'ok'},{n:'Chiasamen',s:'ok'},{n:'Flohsamen(schalen)',s:'ok'},{n:'Glutenfreie Produkte',s:'ok'},{n:'Glutenfreies Brot (Buchweizen, Reis, Teff, Mais)',s:'ok',why:'Ersatz für Dinkel-/Weizentoast'},{n:'Hafer / Haferflocken / Haferschleim',s:'ok',why:'bei Glutenverzicht nur als „zertifiziert glutenfrei" kaufen'},{n:'Hirse / Teff',s:'ok'},{n:'Kartoffelmehl',s:'ok'},{n:'Polenta / Maisgrieß',s:'ok'},{n:'Quinoa',s:'ok'},{n:'Reis (alle Sorten)',s:'ok'},{n:'Sauerteigbrot (Dinkel/Roggen, lang geführt)',s:'mass',why:'FODMAP-arm, aber glutenhaltig'},
  {n:'Weizen (Brot, Semmeln, Nudeln, Gebäck)',s:'no',why:'häufiger Auslöser für Blähungen'},{n:'Dinkel (außer Sauerteig)',s:'no'},{n:'Gerste',s:'no'},{n:'Kamut',s:'no'},{n:'Roggen (außer Sauerteig)',s:'no'}
 ]},
 {name:'Milchprodukte & Ersatz',items:[
  {n:'Butter',s:'ok'},{n:'Camembert / Brie',s:'ok'},{n:'Cheddar',s:'ok'},{n:'Hartkäse (Parmesan, Bergkäse, Emmentaler)',s:'ok'},{n:'Laktosefreie Milch / Joghurt / Topfen',s:'ok'},{n:'Mandelmilch',s:'ok'},{n:'Reismilch',s:'ok'},
  {n:'Milch, Joghurt, Topfen (laktosehaltig)',s:'no'},{n:'Pudding, Eis, Milchschokolade',s:'no'},{n:'Sojamilch',s:'no'}
 ]},
 {name:'Eiweiß: Ei, Fisch, Fleisch',items:[
  {n:'Eier',s:'ok'},{n:'Fisch (Lachs, Forelle, Zander, Thunfisch …)',s:'ok'},{n:'Huhn / Pute',s:'ok'},{n:'Rind',s:'ok',why:'bevorzugt, max. 1–2× Fleisch pro Woche'},{n:'Wild',s:'ok'},{n:'Skyr / Cottage Cheese (laktosefrei)',s:'ok'},
  {n:'Schwein',s:'no',why:'in der Darmkur meiden'},{n:'Wurst, Speck, Schinken, Leberkäse',s:'no',why:'Verarbeitetes meiden'}
 ]},
 {name:'Nüsse & Samen',items:[
  {n:'Walnüsse',s:'mass',why:'max. 10 Stück – gut für Urolithin A'},{n:'Pekannüsse',s:'mass',why:'max. 10 Stück'},{n:'Mandeln',s:'mass',why:'max. 10 Stück'},{n:'Haselnüsse',s:'mass',why:'max. 10 Stück'},{n:'Paranüsse',s:'mass',why:'max. 1–2 – sehr selenreich'},{n:'Körner (Kürbis-, Sonnenblumen-, Leinsamen)',s:'mass',why:'max. 2 TL'},
  {n:'Cashewkerne',s:'no'},{n:'Pistazien',s:'no'}
 ]},
 {name:'Süßes & Sonstiges',items:[
  {n:'Haushaltszucker',s:'mass',why:'geringe Mengen'},{n:'Traubenzucker / Dextrose',s:'mass'},{n:'Ahornsirup',s:'mass'},{n:'Zuckerrübensirup',s:'mass'},{n:'Dunkle Schokolade (ab 70 %)',s:'mass',why:'kleine Menge, laktosearm'},
  {n:'Honig',s:'no',why:'Fruktose – im Haferschleim durch Ahornsirup ersetzen'},{n:'Agavensirup',s:'no'},{n:'Fruktosesirup / Glukose-Fruktose-Sirup',s:'no'},{n:'Zuckerfreie Kaugummis / Bonbons',s:'no',why:'Polyole = Sorbit, Xylit, Mannit'},{n:'Diabetiker-Lebensmittel',s:'no',why:'Polyole'},{n:'Light-Produkte mit Süßstoff',s:'no'}
 ]},
 {name:'Fette & Öle',items:[
  {n:'Olivenöl',s:'ok'},{n:'Rapsöl',s:'ok'},{n:'Leinöl',s:'ok'},{n:'Walnussöl',s:'ok'},{n:'Butter',s:'ok'},
  {n:'Kürbiskernöl',s:'mass',why:'nur in Maßen'},
  {n:'Sonnenblumenöl',s:'no',why:'oxidationsfreudig'},{n:'Kokosöl',s:'no',why:'gesättigte Fette'},{n:'Margarine',s:'no'},{n:'Distelöl / Maiskeimöl / Sojaöl',s:'no'}
 ]},
 {name:'Getränke',items:[
  {n:'Wasser (still oder wenig Kohlensäure)',s:'ok',why:'Ziel 2 Liter'},{n:'Kräutertee (Kamille, Minze, Ingwer, Zitronengras)',s:'ok'},{n:'Tee kurz gezogen (max. 3 Min.)',s:'ok'},{n:'Kaffee',s:'mass',why:'1 Tasse; in der Darmkur reduzieren'},{n:'Grüner Tee',s:'mass',why:'gut für die Darmflora, in Kur-Phase 1 aber tabu'},{n:'Gemüsesaft (bio)',s:'ok',why:'bis 750 ml/Tag'},
  {n:'Tee lange gezogen (5–6 Min.)',s:'no'},{n:'Fruchtsäfte',s:'no'},{n:'Limonaden, Cola, Energy',s:'no'},{n:'Kaffeeersatz (Malz, Zichorie)',s:'no'},{n:'Wein, Likör, Rum',s:'no'},{n:'Alkohol abends',s:'no',why:'Schlaf + Darm'},{n:'Sojadrink',s:'no'}
 ]}
];

/* Rezepte: typ f = Frühstück, m = Mittag, a = Abend (leicht, ≥ 2 h vor dem Schlafen).
   fleisch:true zählt gegen „max. 2× Fleisch pro Woche". Zutaten mit Einkaufs-Kategorie. */
const Z=(n,kat)=>({n,kat});
const G='Gemüse',O='Obst',E='Eiweiß',M='Milchprodukte',K='Getreide & Beilagen',N='Nüsse & Samen',OE='Öle & Gewürze',GT='Getränke';
const REZEPTE=[
 // Frühstück
 {id:'f1',typ:'f',name:'Porridge mit Wasser, Beeren und Chiasamen',zutaten:[Z('Haferflocken (zertifiziert glutenfrei)',K),Z('Heidelbeeren / Himbeeren',O),Z('Chiasamen',N),Z('Walnüsse',N)]},
 {id:'f2',typ:'f',name:'Rührei mit Tomaten und Basilikum',zutaten:[Z('Eier',E),Z('Tomaten',G),Z('Basilikum',OE),Z('Olivenöl',OE),Z('Glutenfreies Brot (Buchweizen/Reis)',K)]},
 {id:'f3',typ:'f',name:'Buchweizenbrot mit Butter, laktosefreiem Topfen und Schnittlauch',zutaten:[Z('Buchweizenbrot (glutenfrei)',K),Z('Butter',M),Z('Laktosefreier Topfen',M),Z('Schnittlauch',G)]},
 {id:'f4',typ:'f',name:'Laktosefreies Joghurt mit Kiwi, Erdbeeren und Haferflocken',zutaten:[Z('Laktosefreies Joghurt',M),Z('Kiwi',O),Z('Erdbeeren',O),Z('Haferflocken',K),Z('Leinsamen geschrotet',N)]},
 {id:'f5',typ:'f',name:'Spanisches Omelette mit Kürbis und Kartoffelwürfeln',zutaten:[Z('Eier',E),Z('Kürbis',G),Z('Kartoffeln',G),Z('Olivenöl',OE),Z('Fenchel',G)]},
 {id:'f6',typ:'f',name:'Buchweizenbrot (glutenfrei) mit Hartkäse und Trauben',zutaten:[Z('Buchweizenbrot (glutenfrei)',K),Z('Hartkäse (Bergkäse)',M),Z('Trauben',O),Z('Butter',M)]},
 {id:'f7',typ:'f',name:'Haferschleim mit Wasser, Banane (unreif) und Zimt',zutaten:[Z('Haferflocken (zertifiziert glutenfrei)',K),Z('Banane (unreif)',O),Z('Zimt',OE)]},
 {id:'f8',typ:'f',name:'Skyr-Bowl mit Himbeeren, Haferflocken und Kürbiskernen',zutaten:[Z('Skyr laktosefrei',M),Z('Himbeeren',O),Z('Haferflocken',K),Z('Kürbiskerne',N)]},
 {id:'f9',typ:'f',name:'Haferschleim mit Wasser und Ananas, dazu Ei oder Skyr und Kamillentee',zutaten:[Z('Haferflocken (zertifiziert glutenfrei)',K),Z('Ananas (oder Erdbeeren, Kiwi, Heidelbeeren)',O),Z('Eier',E),Z('Skyr laktosefrei',M),Z('Kamillentee',GT)],tags:['schnell','tm'],tipp:'TM: 300 ml Wasser + 40 g Hafer, 6 Min/90°/Stufe 1. Süße kommt vom Obst (Ananas, Beeren, Kiwi – FODMAP-arm). Eiweiß dazu: 1–2 weiche Eier oder 150 g Skyr – ohne Eiweiß hält das Frühstück nicht bis Mittag.'},
 // Mittag
 {id:'m1',typ:'m',name:'Grillgemüse (Zucchini, Fenchel, Aubergine) mit Hühnerbrust',fleisch:true,zutaten:[Z('Hühnerbrust',E),Z('Zucchini',G),Z('Fenchel',G),Z('Aubergine',G),Z('Olivenöl',OE),Z('Reis',K)]},
 {id:'m2',typ:'m',name:'Gedünsteter Lachs mit Karotten, Zucchini und Kartoffeln',zutaten:[Z('Lachsfilet',E),Z('Karotten',G),Z('Zucchini',G),Z('Kartoffeln',G),Z('Zitrone',O),Z('Dille',OE)]},
 {id:'m3',typ:'m',name:'Kürbiscremesuppe mit Kokosmilch und Ingwer',zutaten:[Z('Kürbis',G),Z('Kokosmilch (max. 100 ml/Portion, ohne Inulin)',M),Z('Ingwer',G),Z('Kartoffeln',G),Z('Glutenfreies Brot (Buchweizen/Reis)',K)]},
 {id:'m4',typ:'m',name:'Faschierte Laibchen (Rind) mit Kartoffeln, Mangold und grünem Salat',fleisch:true,zutaten:[Z('Rinderfaschiertes',E),Z('Kartoffeln',G),Z('Mangold',G),Z('Blattsalat',G),Z('Eier',E),Z('Haferflocken',K),Z('Olivenöl',OE)]},
 {id:'m5',typ:'m',name:'Auberginengemüse mit Zanderfilet und Polenta',zutaten:[Z('Zanderfilet',E),Z('Aubergine',G),Z('Tomaten',G),Z('Polenta',K),Z('Olivenöl',OE)]},
 {id:'m6',typ:'m',name:'Ofengemüse mit Spiegelei',zutaten:[Z('Kartoffeln',G),Z('Karotten',G),Z('Zucchini',G),Z('Fenchel',G),Z('Eier',E),Z('Rosmarin',OE),Z('Olivenöl',OE)]},
 {id:'m7',typ:'m',name:'Quinoa-Bowl mit Tofu, Gurke, Fenchel und Sesam',zutaten:[Z('Quinoa',K),Z('Tofu (fest)',E),Z('Gurke',G),Z('Fenchel',G),Z('Sesam',N),Z('Limette',O),Z('Ingwer',G)]},
 {id:'m8',typ:'m',name:'Potato Wedges mit Hühnerkeulen und Salat',fleisch:true,zutaten:[Z('Hühnerkeulen',E),Z('Kartoffeln',G),Z('Blattsalat',G),Z('Gurke',G),Z('Olivenöl',OE),Z('Rosmarin',OE)]},
 {id:'m9',typ:'m',name:'Reispfanne mit Forelle, Fenchel und Karotten',zutaten:[Z('Forellenfilet',E),Z('Reis',K),Z('Fenchel',G),Z('Karotten',G),Z('Zitrone',O),Z('Olivenöl',OE)]},
 {id:'m10',typ:'m',name:'Kohlrabicremesuppe mit glutenfreiem Brot',zutaten:[Z('Kohlrabi',G),Z('Kartoffeln',G),Z('Laktosefreie Milch oder Mandelmilch',M),Z('Schnittlauch',G),Z('Glutenfreies Brot (Buchweizen/Reis)',K)]},
 {id:'m11',typ:'m',name:'Rinder-Reheintopf mit Mangold und Kartoffeln',fleisch:true,zutaten:[Z('Rindfleisch (Gulasch)',E),Z('Mangold',G),Z('Kartoffeln',G),Z('Karotten',G),Z('Tomaten (Dose, passiert)',G),Z('Kümmel',OE)]},
 {id:'m12',typ:'m',name:'Buchweizen-Nudeln mit Tomatensugo und Parmesan',zutaten:[Z('Buchweizen- oder Reisnudeln',K),Z('Tomaten (Dose, passiert)',G),Z('Parmesan',M),Z('Basilikum',OE),Z('Olivenöl',OE),Z('Zucchini',G)]},
 // Abend (leicht)
 {id:'a1',typ:'a',name:'Cremespinat mit Spiegelei und Kartoffeln',zutaten:[Z('Spinat (TK)',G),Z('Eier',E),Z('Kartoffeln',G),Z('Laktosefreie Milch oder Mandelmilch',M)]},
 {id:'a2',typ:'a',name:'Brokkolisalat mit Thunfisch und Reis',zutaten:[Z('Brokkoli',G),Z('Thunfisch (Dose, natur)',E),Z('Reis',K),Z('Zitrone',O),Z('Olivenöl',OE)]},
 {id:'a3',typ:'a',name:'Blattsalat mit knusprigen Tofuwürfeln und Kartoffelscheiben',zutaten:[Z('Blattsalat',G),Z('Tofu (fest)',E),Z('Kartoffeln',G),Z('Gurke',G),Z('Radieschen',G),Z('Rapsöl',OE)]},
 {id:'a4',typ:'a',name:'Camembert aus dem Rohr mit Trauben und glutenfreiem Brot',zutaten:[Z('Camembert',M),Z('Trauben',O),Z('Glutenfreies Brot (Buchweizen/Reis)',K),Z('Blattsalat',G)]},
 {id:'a5',typ:'a',name:'Gemüsesuppe mit Karotten, Zucchini, Fenchel und Hirse',zutaten:[Z('Karotten',G),Z('Zucchini',G),Z('Fenchel',G),Z('Hirse',K),Z('Ingwer',G),Z('Schnittlauch',G)]},
 {id:'a6',typ:'a',name:'Omelette mit Spinat, Tomaten und Parmesan',zutaten:[Z('Eier',E),Z('Spinat (TK)',G),Z('Tomaten',G),Z('Parmesan',M),Z('Olivenöl',OE)]},
 {id:'a7',typ:'a',name:'Gedünstete Forelle mit Fisolen und Kartoffeln',zutaten:[Z('Forellenfilet',E),Z('Grüne Bohnen / Fisolen',G),Z('Kartoffeln',G),Z('Zitrone',O),Z('Butter',M)]},
 {id:'a8',typ:'a',name:'Tomaten-Gurken-Salat mit Cottage Cheese und glutenfreiem Brot',zutaten:[Z('Tomaten',G),Z('Gurke',G),Z('Cottage Cheese laktosefrei',M),Z('Glutenfreies Brot (Buchweizen/Reis)',K),Z('Olivenöl',OE),Z('Schnittlauch',G)]},
 {id:'a9',typ:'a',name:'Kürbis-Kartoffel-Püree mit gebratener Hühnerbrust',fleisch:true,zutaten:[Z('Hühnerbrust',E),Z('Kürbis',G),Z('Kartoffeln',G),Z('Butter',M),Z('Muskat',OE)]},
 {id:'a10',typ:'a',name:'Reis-Gemüse-Pfanne mit Ei',zutaten:[Z('Reis',K),Z('Karotten',G),Z('Fenchel',G),Z('Zucchini',G),Z('Eier',E),Z('Ingwer',G),Z('Rapsöl',OE)]}
];

/* Steht immer auf der Einkaufsliste als Erinnerung „Vorrat prüfen" */
const VORRAT=[
 {n:'Wasser / Mineralwasser (wenig Kohlensäure)',kat:'Getränke'},{n:'Kräutertee (Kamille, Minze, Ingwer)',kat:'Getränke'},
 {n:'Apfelessig (für Essigwasser)',kat:'Öle & Gewürze'},{n:'Olivenöl',kat:'Öle & Gewürze'},{n:'Leinsamen geschrotet',kat:'Nüsse & Samen'},{n:'Flohsamenschalen',kat:'Nüsse & Samen'},
 {n:'Sauerkraut (roh, fermentiert)',kat:'Sonstiges'},{n:'Kefir laktosefrei',kat:'Milchprodukte'},
 {n:'Präparate laut Plan (Nachschub?)',kat:'Vorrat / Präparate'}
];

/* Atemübungen – gängige Muster (4-7-8, 5-5, 4:6, Box 4-4-4-4, Stille) */
const ATEM=[
 {id:'478',name:'4-7-8',kurz:'4 ein · 7 halten · 8 aus',beschreibung:'Durch die Nase 4 s einatmen, 7 s halten, 8 s durch den Mund ausatmen. 4 Runden. Sehr wirksam zum Runterkommen – morgens und abends.',runden:4,muster:[{n:'Einatmen',s:4},{n:'Halten',s:7},{n:'Ausatmen',s:8}]},
 {id:'55',name:'5-5 kohärent',kurz:'5 ein · 5 aus',beschreibung:'Gleichmäßig 5 s ein, 5 s aus – 6 Atemzüge pro Minute. 5 Minuten, geht auch im Auto oder vor einem Termin.',runden:30,muster:[{n:'Einatmen',s:5},{n:'Ausatmen',s:5}]},
 {id:'46',name:'4:6 kohärent',kurz:'4 ein · 6 aus',beschreibung:'Längeres Ausatmen beruhigt stärker. 5 Minuten.',runden:30,muster:[{n:'Einatmen',s:4},{n:'Ausatmen',s:6}]},
 {id:'box',name:'Box-Breathing',kurz:'4 · 4 · 4 · 4',beschreibung:'4 s ein, 4 s halten, 4 s aus, 4 s halten. 6 Runden. Bei akutem Stress.',runden:6,muster:[{n:'Einatmen',s:4},{n:'Halten',s:4},{n:'Ausatmen',s:4},{n:'Halten',s:4}]},
 {id:'stille',name:'Stille',kurz:'15 Minuten',beschreibung:'15–30 Min. täglich ohne Bildschirm, ruhig atmen, ggf. binaurale Beats. „Raus aus dem Überlebensmodus."',stille:true,minuten:15}
];

/* Standard-Regeln, falls im Plan keine hinterlegt sind */
const REGELN_STANDARD=[
 {titel:'Essenszeiten',punkte:['Essfenster max. 11 Stunden, z.B. 8–19 Uhr (16:8)','Mindestens 2 Stunden vor dem Schlafen nichts mehr essen','Keine Snacks zwischendurch, schon gar keine Kohlenhydrat-Snacks','Nur zu 80 % satt essen']},
 {titel:'Reihenfolge beim Essen',punkte:['Mit Gemüse, Salat oder einem Glas Essigwasser beginnen','Kohlenhydrate nie alleine und nie als Erstes','Süßes oder Obst nur direkt nach der Hauptmahlzeit','Gut kauen, langsam essen']},
 {titel:'Was drauf soll',punkte:['Ballaststoffe bei jeder Mahlzeit (Ziel > 30 g/Tag): Hafer, Kartoffeln, Gemüse, Leinsamen, Chia, Flohsamen','Eiweiß bei jeder Mahlzeit: Ei, Fisch, Skyr, Topfen (laktosefrei), Cottage Cheese','Fette: Olivenöl, Rapsöl, Leinöl, Walnussöl','Fermentiertes: Sauerkraut, Kimchi, Kefir, Joghurt (laktosefrei)','2 Liter Wasser oder Kräutertee']},
 {titel:'Was weg soll',punkte:['FODMAP-reich: Zwiebel, Knoblauch, Kohl, Bohnen, Weizen, Milchzucker (siehe Ampel)','Sorbit: Steinobst, Apfel, Birne, zuckerfreie Kaugummis','Fleisch nur 1–2× pro Woche, bevorzugt Rind oder Wild; kein Schwein','Wurst, Speck, Schinken, Leberkäse, Fertigprodukte, Industriezucker','Sonnenblumenöl, Kokosöl, Margarine','Alkohol abends; Kaffee reduzieren']}
];

/* Kochtipps je Rezept: tags = schnell (≤ 15 Min.), tm (Thermomix), buero (Büro/unterwegs), vorkochen */
const REZEPT_TIPPS={
 f1:{tags:['schnell','tm'],tipp:'TM: 250 ml Wasser + 50 g Hafer, 7 Min/90°/Stufe 1. Beeren erst am Schluss. Im Büro: Overnight-Oats im Glas.'},
 f2:{tags:['schnell'],tipp:'Tomaten kurz in Olivenöl, Eier drüber, Basilikum am Schluss. 8 Minuten.'},
 f3:{tags:['schnell','buero'],tipp:'Kein Kochen. Topfen mit Schnittlauch verrühren – hält 2 Tage im Kühlschrank.'},
 f4:{tags:['schnell','buero'],tipp:'Alles ins Glas schichten, Deckel drauf, mitnehmen.'},
 f5:{tags:['vorkochen'],tipp:'Kürbis und Kartoffeln vom Vortag verwenden, dann 10 Minuten. Kalt auch fürs Büro.'},
 f6:{tags:['schnell','buero'],tipp:'Kein Kochen.'},
 f7:{tags:['schnell','tm'],tipp:'TM: 300 ml Flüssigkeit + 40 g Hafer, 6 Min/90°/Stufe 1.'},
 f8:{tags:['schnell','buero'],tipp:'Kein Kochen, 3 Minuten.'},
 m1:{tags:['vorkochen'],tipp:'Gemüse in Streifen, mit Öl und Rosmarin 20 Min. bei 200° ins Rohr; Huhn in der Pfanne. Doppelte Menge → morgen Büro.'},
 m2:{tags:['tm'],tipp:'TM: Gemüse in den Varoma, Lachs oben drauf, 20 Min/Varoma/Stufe 1. Zitrone, Dille, fertig.'},
 m3:{tags:['tm','vorkochen'],tipp:'TM: Kürbis + Kartoffel + Ingwer + 600 ml Wasser 20 Min/100°/Stufe 1, dann 1 Min/Stufe 8, Kokosmilch dazu. Einfrieren in Portionen.'},
 m4:{tags:['vorkochen'],tipp:'Statt Zwiebel: Schnittlauch und Kümmel ins Faschierte. Laibchen auf Vorrat, kalt fürs Büro.'},
 m5:{tags:[],tipp:'Aubergine in Würfeln mit Tomaten 15 Min. schmoren, Zander 3 Min. je Seite. Polenta: 1:4 mit Wasser.'},
 m6:{tags:['vorkochen'],tipp:'Blech mit Gemüse ins Rohr, 25 Min. bei 200°. Ei zum Schluss in der Pfanne. Reste = Frühstück.'},
 m7:{tags:['buero','vorkochen'],tipp:'Quinoa (1:2 Wasser, 15 Min.) auf Vorrat. Tofu knusprig anbraten. Kalt als Büro-Bowl perfekt.'},
 m8:{tags:[],tipp:'Kartoffelspalten mit Öl und Paprikapulver 30 Min. bei 200°, Keulen daneben aufs Blech.'},
 m9:{tags:['schnell'],tipp:'Reis vom Vortag, Fenchel und Karotten fein hobeln, alles 8 Min. in der Pfanne, Forelle drauflegen.'},
 m10:{tags:['tm','vorkochen'],tipp:'TM: Kohlrabi + Kartoffel + 500 ml Wasser 18 Min/100°/Stufe 1, pürieren 1 Min/Stufe 8, Milch dazu.'},
 m11:{tags:['tm','vorkochen'],tipp:'TM: Fleisch anbraten 5 Min/120°/Linkslauf, Gemüse + Tomaten + 300 ml Wasser 60 Min/100°/Linkslauf. Ohne Zwiebel – Kümmel gibt den Geschmack.'},
 m12:{tags:['schnell'],tipp:'Nudeln 8 Min., Sugo mit Basilikum und Olivenöl, Zucchini-Würfel mitdünsten. Knoblauch-Trick: Zehe im Öl anbraten und wieder rausnehmen – Geschmack bleibt, FODMAPs nicht.'},
 a1:{tags:['schnell','tm'],tipp:'TK-Spinat mit Milch erwärmen (TM: 8 Min/90°/Stufe 1), Ei in der Pfanne.'},
 a2:{tags:['schnell','buero'],tipp:'Brokkoli 5 Min. dämpfen, mit Thunfisch, Reis, Zitrone, Öl mischen. Kalt ideal fürs Büro.'},
 a3:{tags:['schnell'],tipp:'Tofu in Würfeln mit Rapsöl knusprig, Kartoffelscheiben vom Vortag dazu.'},
 a4:{tags:['schnell'],tipp:'Camembert 12 Min. bei 180° ins Rohr. Brot toasten.'},
 a5:{tags:['tm','vorkochen'],tipp:'TM: Gemüse + Hirse + 700 ml Wasser 20 Min/100°/Stufe 1. Leicht, warm, eiweißarm – dazu ein Ei oder Skyr.'},
 a6:{tags:['schnell'],tipp:'10 Minuten. Spinat vorher gut ausdrücken.'},
 a7:{tags:['tm'],tipp:'TM: Kartoffeln + Fisolen in den Varoma, Forelle oben, 22 Min/Varoma/Stufe 1.'},
 a8:{tags:['schnell','buero'],tipp:'Kein Kochen. 5 Minuten.'},
 a9:{tags:['tm'],tipp:'TM: Kürbis + Kartoffel 20 Min/100°/Stufe 1, pürieren, Butter + Muskat. Huhn in der Pfanne.'},
 a10:{tags:['schnell'],tipp:'Reis vom Vortag, Gemüse fein würfeln, alles 8 Min. in der Pfanne, Ei drüberschlagen.'}
};
REZEPTE.forEach(r=>Object.assign(r,REZEPT_TIPPS[r.id]||{}));

const TIPPS=[
 {titel:'Grundtricks FODMAP-arm kochen',punkte:[
  'Zwiebel und Knoblauch ersetzen: Schnittlauch, der grüne Teil der Frühlingszwiebel, Ingwer, Kümmel, Kräuter.',
  'Knoblauch-Trick: Zehe im Öl anbraten und vor dem Weiterkochen rausnehmen. FODMAPs sind wasserlöslich, nicht öllöslich – Geschmack bleibt, Bauchweh nicht.',
  'Milchprodukte: laktosefrei kaufen oder Hartkäse (Parmesan, Bergkäse) – der hat praktisch keinen Milchzucker.',
  'Brot: glutenfrei (Buchweizen, Reis, Teff, Mais) statt Semmel, Dinkel- oder Weizentoast.',
  'Fleisch: 1–2× pro Woche, Rind oder Huhn. Kein Schwein, keine Wurst.',
  'Süß: kleine Menge Ahornsirup oder Haushaltszucker. Kein Honig, kein Agavensirup, nichts „zuckerfrei".',
  'Jede Mahlzeit mit Gemüse/Salat beginnen, Eiweiß dazu, Kohlenhydrate nie allein.']},
 {titel:'⚡ Schnelle Küche (unter 15 Minuten)',tag:'schnell'},
 {titel:'🏢 Im Büro oder unterwegs',punkte:[
  'Mitnehmen: Skyr/Joghurt laktosefrei mit Beeren, Overnight-Oats, Reis-Thunfisch-Bowl, Quinoa-Tofu-Bowl, hartgekochte Eier, Hartkäse mit Trauben, Walnüsse (max. 10).',
  'Bestellen: Gegrilltes Huhn/Fisch mit Reis oder Kartoffeln und Salat. Dressing nur Öl/Essig. „Ohne Zwiebel und Knoblauch" sagen.',
  'Meiden beim Essen gehen: Panniertes (Weizen), Rahmsaucen (Laktose), Zwiebelrostbraten, Linsen, Kohl, Pizza/Pasta aus Weizen.',
  'Kaffee mit Kuchen beim Kunden: vorher Eiweiß (Ei, Skyr, Handvoll Nüsse), spätestens 15–16 Uhr.',
  'Getränk: Wasser oder Kräutertee. Kein Fruchtsaft, keine Limo.'],tag:'buero'},
 {titel:'🥡 Vorkochen am Sonntag',punkte:['Reis, Quinoa, Kartoffeln und Ofengemüse auf Vorrat – daraus werden in 8 Minuten Pfannen, Bowls und Salate.','Suppen in Portionen einfrieren.'],tag:'vorkochen'},
 {titel:'Thermomix-Gerichte',punkte:['Varoma = Dämpfen: Fisch oben, Gemüse unten – alles in einem Gang. Cremesuppen: kochen, pürieren, fertig. Porridge: 7 Min/90°/Stufe 1.'],tag:'tm'}
];

/* Videos zu den Atemübungen (geprüft 06.09.2026 – Erfinder bzw. deutschsprachige Anleitungen) */
const ATEM_VIDEOS={
 '478':[{t:'Dr. Andrew Weil (Erfinder) – Anleitung',u:'https://www.youtube.com/watch?v=YRPh_GaiL8s'},{t:'Dr. Weil – Wirkung & Demonstration (2024)',u:'https://www.youtube.com/watch?v=Egr8iGBg8Oc'}],
 '55':[{t:'Kohärentes Atmen 5 Min. inkl. Einführung (deutsch)',u:'https://www.youtube.com/watch?v=Lu7Fb4zwKhE'},{t:'Rhythmus 5 s ein/aus – 10 Min. (deutsch)',u:'https://www.youtube.com/watch?v=-CaKwpHoaCQ'}],
 '46':[{t:'Rhythmus-Video 5-5 verwenden, beim Ausatmen bewusst länger (deutsch)',u:'https://www.youtube.com/watch?v=-CaKwpHoaCQ'}],
 'box':[{t:'Geführte Box-Atmung 4-4-4-4 (deutsch)',u:'https://www.youtube.com/watch?v=wazCdqIBi2c'}],
 'stille':[{t:'Vagusnerv-Meditation – Nervensystem beruhigen (deutsch)',u:'https://www.youtube.com/watch?v=MoRUOUpNsGM'}]
};
ATEM.forEach(x=>x.videos=ATEM_VIDEOS[x.id]||[]);


/* Zutaten-Check: Schlagwörter auf Zutatenlisten von Verpackungen. s: no = passt nicht, mass = Vorsicht */
const ZUTATEN_CHECK=[
 {k:['weizen','dinkel','roggen','gerste','kamut','gluten','grieß','bulgur','couscous','seitan','malz'],s:'no',why:'Gluten'},
 {k:['hafer'],s:'mass',why:'Hafer – nur zertifiziert glutenfrei'},
 {k:['milch','molke','laktose','lactose','sahne','rahm','joghurt','topfen','quark','magermilchpulver','süßmolke','buttermilch'],s:'no',why:'Laktose (außer ausdrücklich laktosefrei)'},
 {k:['zwiebel','knoblauch','lauch','porree','schalotte'],s:'no',why:'Fruktane (Zwiebel/Knoblauch)'},
 {k:['honig','agavendicksaft','agavensirup','fruktose','fructose','fruktosesirup','glukose-fruktose','fructose-glucose','isoglukose','apfel','birne','mango','wassermelone'],s:'no',why:'Fruktose'},
 {k:['sorbit','sorbitol','e420','mannit','mannitol','e421','xylit','xylitol','e967','maltit','maltitol','e965','isomalt','e953','erythrit'],s:'no',why:'Polyole / Sorbit'},
 {k:['inulin','chicorée','zichorie','oligofruktose','fos','gos','topinambur'],s:'no',why:'Inulin/Oligosaccharide'},
 {k:['bohnen','kichererbse','linsen','soja','erbsen','edamame'],s:'no',why:'Hülsenfrüchte / Soja'},
 {k:['cashew','pistazie'],s:'no',why:'FODMAP-reiche Nüsse'},
 {k:['paprika'],s:'no',why:'Paprika (persönlich)'},
 {k:['blumenkohl','karfiol','rosenkohl','rotkohl','wirsing','weißkohl','kraut'],s:'mass',why:'Kohl'},
 {k:['sonnenblumenöl','margarine','kokosöl','palmöl','distelöl','maiskeimöl','sojaöl'],s:'mass',why:'ungünstiges Fett'},
 {k:['aroma','konservierungsstoff','emulgator','farbstoff','süßungsmittel','aspartam','sucralose','acesulfam','e4','e3','e2','e1'],s:'mass',why:'Zusatzstoffe'},
 {k:['zucker','saccharose','dextrose','traubenzucker','glukosesirup','glucosesirup','sirup'],s:'mass',why:'Zucker – kleine Mengen ok'},
 {k:['schwein','speck','schinken','salami','wurst'],s:'mass',why:'Schwein / Verarbeitetes'}
];
function zutatenCheck(text){
  const t=(text||'').toLowerCase();const hits=[];
  const lf=/laktosefrei|lactosefrei|lactose-free|laktose-frei/.test(t);const gf=/glutenfrei|gluten-free|sans gluten|senza glutine/.test(t);
  ZUTATEN_CHECK.forEach(r=>{const f=r.k.filter(k=>t.includes(k));if(!f.length)return;
    if(r.why.startsWith('Laktose')&&lf)return; if(r.why==='Gluten'&&gf)return; if(r.why.startsWith('Hafer')&&gf)return;
    hits.push({why:r.why,s:r.s,found:[...new Set(f)].slice(0,4)});});
  const no=hits.filter(h=>h.s==='no'),mass=hits.filter(h=>h.s==='mass');
  return {verdict:no.length?'no':mass.length?'mass':'ok',no,mass,lf,gf};
}
