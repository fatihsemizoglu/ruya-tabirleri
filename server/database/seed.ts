import { supabase } from '../src/config/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Admin user data
const adminUser = {
  email: 'admin@mysticlogbook.com',
  password: 'admin123',
  full_name: 'Admin User',
  username: 'admin',
};

// Sample categories data
const categories = [
  // Main categories (no parent)
  { name: 'Hayvanlar', slug: 'hayvanlar', description: 'Hayvanlarla ilgili rüya tabirleri', icon: 'paw', order_index: 1 },
  { name: 'Doða', slug: 'doga', description: 'Doða olaylarý ve elementleri ile ilgili rüya tabirleri', icon: 'leaf', order_index: 2 },
  { name: 'Nesneler', slug: 'nesneler', description: 'Çeþitli nesnelerle ilgili rüya tabirleri', icon: 'box', order_index: 3 },
  { name: 'Kiþiler', slug: 'kisiler', description: 'Kiþiler ve iliþkilerle ilgili rüya tabirleri', icon: 'users', order_index: 4 },
  { name: 'Durumlar', slug: 'durumlar', description: 'Çeþitli durumlar ve olaylarla ilgili rüya tabirleri', icon: 'theater', order_index: 5 },
  { name: 'Renkler', slug: 'renkler', description: 'Renklerle ilgili rüya tabirleri', icon: 'palette', order_index: 6 },
  { name: 'Sayýlar', slug: 'sayilar', description: 'Sayýlarla ilgili rüya tabirleri', icon: 'numbers', order_index: 7 },
  { name: 'Yiyecekler', slug: 'yiyecekler', description: 'Yiyecek ve içeceklerle ilgili rüya tabirleri', icon: 'apple', order_index: 8 },
  
  // Sub-categories under Hayvanlar
  { name: 'Kuþlar', slug: 'kuslar', description: 'Kuþlarla ilgili rüya tabirleri', icon: 'bird', parent_slug: 'hayvanlar', order_index: 1 },
  { name: 'Evcil Hayvanlar', slug: 'evcil-hayvanlar', description: 'Evcil hayvanlarla ilgili rüya tabirleri', icon: 'dog', parent_slug: 'hayvanlar', order_index: 2 },
  { name: 'Vahþi Hayvanlar', slug: 'vahsi-hayvanlar', description: 'Vahþi hayvanlarla ilgili rüya tabirleri', icon: 'lion', parent_slug: 'hayvanlar', order_index: 3 },
  { name: 'Deniz Canlýlarý', slug: 'deniz-canlilari', description: 'Deniz canlýlarýyla ilgili rüya tabirleri', icon: 'fish', parent_slug: 'hayvanlar', order_index: 4 },
  
  // Sub-categories under Doða
  { name: 'Hava Olaylarý', slug: 'hava-olaylari', description: 'Hava olaylarýyla ilgili rüya tabirleri', icon: 'storm', parent_slug: 'doga', order_index: 1 },
  { name: 'Su', slug: 'su', description: 'Su ile ilgili rüya tabirleri', icon: 'water', parent_slug: 'doga', order_index: 2 },
  { name: 'Ateþ', slug: 'ates', description: 'Ateþ ile ilgili rüya tabirleri', icon: 'fire', parent_slug: 'doga', order_index: 3 },
  { name: 'Toprak', slug: 'toprak', description: 'Toprak ile ilgili rüya tabirleri', icon: 'earth', parent_slug: 'doga', order_index: 4 },
];

// Sample dreams data
const dreams = [
  // Kuþlar kategorisi için rüyalar
  {
    title: 'Rüyada Güvercin Görmek',
    slug: 'ruyada-guvercin-gormek',
    content: 'Rüyada güvercin görmek, barýþ, huzur ve sevginin habercisidir. Beyaz bir güvercin görmek, manevi temizliði ve saflýðý temsil eder. Rüyada güvercinlerin uçtuðunu görmek, güzel haberler alacaðýnýza iþaret eder. Güvercin beslemek, aile içi huzurun ve mutluluðun artacaðýný gösterir.',
    category_slug: 'kuslar',
    islamic_interpretation: 'Ýslam alimlerine göre, rüyada güvercin görmek hayýrlýdýr. Güvercin, mümin kiþiyi temsil eder. Beyaz güvercin, saliha bir eþ veya hayýrlý bir evlat anlamýna gelir. Güvercin sesi duymak, güzel haberler almaya iþarettir.',
    psychological_interpretation: 'Psikolojik açýdan güvercin, iç huzurun ve barýþýn sembolüdür. Rüyada güvercin görmek, kiþinin hayatýnda barýþ ve uyum aradýðýný gösterir. Stresli bir dönemden sonra huzura kavuþacaðýnýzýn müjdesidir.',
    keywords: ['güvercin', 'kuþ', 'barýþ', 'huzur', 'haber'],
    is_featured: true,
    view_count: 1250,
    like_count: 89,
  },
  {
    title: 'Rüyada Kartal Görmek',
    slug: 'ruyada-kartal-gormek',
    content: 'Rüyada kartal görmek, güç, otorite ve yüksek hedeflerin sembolüdür. Kartalýn uçtuðunu görmek, baþarýlý olacaðýnýza ve hedeflerinize ulaþacaðýnýza iþaret eder. Kartalýn avladýðýný görmek, maddi kazanç ve zafer anlamýna gelir.',
    category_slug: 'kuslar',
    islamic_interpretation: 'Ýslam tabirlerinde kartal, güçlü ve etkili bir yöneticiyi temsil eder. Kartal görmek, düþmanlara karþý üstün gelmeye ve zorluklarý aþmaya iþarettir. Kartalýn pençesinde bir þey taþmasý, devlet nimetine kavuþmak demektir.',
    psychological_interpretation: 'Kartal rüyasý, kiþinin güç arayýþýný ve liderlik özelliklerini yansýtýr. Yüksekten bakan bir kartal, kiþinin hayattan beklentilerinin yüksek olduðunu gösterir. Özgüven artýþý ve kararýlýk dönemine girildiðinin habercisidir.',
    keywords: ['kartal', 'güç', 'liderlik', 'baþarý', 'zafer'],
    is_featured: true,
    view_count: 980,
    like_count: 67,
  },
  {
    title: 'Rüyada Baykuþ Görmek',
    slug: 'ruyada-baykus-gormek',
    content: 'Rüyada baykuþ görmek genellikle gizemli haberlerin iþaretçisidir. Bazý kültürlerde uðursuz sayýlsa da, rüya tabirlerinde bilgelik ve içgörü anlamýna gelir. Baykuþun sesini duymak, önemli bir haber alýnacaðýna iþaret eder.',
    category_slug: 'kuslar',
    islamic_interpretation: 'Ýslam alimleri, baykuþ görmeyi farklý þekillerde yorumlamýþtýr. Bazýlarýna göre baykuþ, yaþlý ve bilgili bir kiþiyi temsil eder. Baykuþ sesi duymak, gizli sýrlarýn ortaya çýkmasýna veya önemli bir habere iþaret edebilir.',
    psychological_interpretation: 'Baykuþ, bilinçaltýnýn derinliklerini ve gizli bilgileri temsil eder. Rüyada baykuþ görmek, kiþinin sezgilerinin güçlendiðini ve içgörü kazanacaðýný gösterir. Gece baykuþu görmek, bilinmeyen korkularla yüzleþmeye iþarettir.',
    keywords: ['baykuþ', 'bilgelik', 'gizem', 'haber', 'sezi'],
    is_featured: false,
    view_count: 756,
    like_count: 45,
  },
  
  // Evcil Hayvanlar kategorisi için rüyalar
  {
    title: 'Rüyada Köpek Görmek',
    slug: 'ruyada-kopek-gormek',
    content: 'Rüyada köpek görmek, sadakat, dostluk ve korumayý temsil eder. Sevimli bir köpek görmek, sadýk bir arkadaþýnýzýn olduðunu gösterir. Köpeðin havlamasý, uyarý veya haber anlamýna gelebilir. Saldýrgan bir köpek, düþmanlýk veya tehlike iþaretidir.',
    category_slug: 'evcil-hayvanlar',
    islamic_interpretation: 'Ýslam tabirlerinde köpek, çeþitli anlamlara gelir. Köpek görmek bazen düþmaný, bazen de sadýk bir hizmetkarý temsil eder. Köpeðin ýsýrmasý, bir düþmandan zarar görmeye iþarettir. Köpek beslemek, koruma ve güvenlik anlamýna gelir.',
    psychological_interpretation: 'Köpek rüyasý, kiþinin sosyal iliþkilerini ve güven duygusunu yansýtýr. Sadýk bir köpek, güvenilir arkadaþlarýn varlýðýný gösterir. Saldýrgan köpek ise hayattaki tehditleri veya iç çatýþmalarý temsil eder.',
    keywords: ['köpek', 'sadakat', 'dostluk', 'koruma', 'uyarý'],
    is_featured: true,
    view_count: 1540,
    like_count: 112,
  },
  {
    title: 'Rüyada Kedi Görmek',
    slug: 'ruyada-kedi-gormek',
    content: 'Rüyada kedi görmek, feminen enerjiyi, baðýmsýzlýðý ve gizemi temsil eder. Sevimli bir kedi görmek, þans ve bereket anlamýna gelir. Kedinin mýrýldanmasý, huzur ve mutluluk iþaretidir. Siyah kedi görmek, bazý kültürlerde uðursuz sayýlsa da rüya tabirlerinde gizemli olaylara iþaret eder.',
    category_slug: 'evcil-hayvanlar',
    islamic_interpretation: 'Ýslam alimlerine göre kedi görmek hayýrlýdýr. Kedi, temiz ve zarif bir varlýk olarak kabul edilir. Kedi beslemek veya kediyle oynamak, hayýrlý rýzk ve bereket anlamýna gelir. Yavru kedi görmek, sevimli çocuklara iþarettir.',
    psychological_interpretation: 'Kedi rüyasý, kiþinin baðýmsýzlýk arzusunu ve feminen özelliklerini yansýtýr. Kedi görmek, sezgisel yeteneklerin güçlendiðini gösterir. Kedinin davranýþlarý, kiþinin duygusal durumunu yansýtýr.',
    keywords: ['kedi', 'baðýmsýzlýk', 'gizem', 'þans', 'feminen'],
    is_featured: false,
    view_count: 1320,
    like_count: 98,
  },
  
  // Vahþi Hayvanlar kategorisi için rüyalar
  {
    title: 'Rüyada Aslan Görmek',
    slug: 'ruyada-aslan-gormek',
    content: 'Rüyada aslan görmek, güç, cesaret ve liderliðin sembolüdür. Aslanýn sakin olduðunu görmek, otorite ve saygýnlýk anlamýna gelir. Aslanla karþýlaþmak, büyük bir sýnavla karþýlaþacaðýnýza iþaret eder. Aslaný yenmek, düþmanlarý alt etmeye ve zorluklarý aþmaya delalettir.',
    category_slug: 'vahsi-hayvanlar',
    islamic_interpretation: 'Ýslam tabirlerinde aslan, güçlü bir hükümdarý veya zorlu bir düþmaný temsil eder. Aslan görmek, cesaret ve kuvvete iþarettir. Aslanla dost olmak, güçlü kiþilerden yardým almak demektir. Aslanýn saldýrmasý, büyük bir tehlikeye iþaret eder.',
    psychological_interpretation: 'Aslan rüyasý, kiþinin iç gücünü ve liderlik potansiyelini yansýtýr. Aslan görmek, kiþinin hayatýnda daha cesur ve kararý olmasý gerektiðini gösterir. Aslanla mücadele etmek, içsel çatýþmalarýn üstesinden gelmeye iþarettir.',
    keywords: ['aslan', 'güç', 'cesaret', 'liderlik', 'otorite'],
    is_featured: true,
    view_count: 1890,
    like_count: 156,
  },
  {
    title: 'Rüyada Yýlan Görmek',
    slug: 'ruyada-yilan-gormek',
    content: 'Rüyada yýlan görmek, genellikle düþmanlýk, tehlike veya gizli tehditleri temsil eder. Yýlanýn ýsýrdýðýný görmek, bir düþmandan zarar görmeye iþaret eder. Yýlaný öldürmek, düþmanlarý yenmek anlamýna gelir. Bazý durumlarda yýlan, þifa ve dönüþümü de simgeleyebilir.',
    category_slug: 'vahsi-hayvanlar',
    islamic_interpretation: 'Ýslam alimlerine göre yýlan, düþmaný temsil eder. Yýlan görmek, gizli bir düþmanýn varlýðýna iþarettir. Yýlanýn evde olmasý, aile içi sorunlara delalettir. Yýlaný öldürmek, düþmaný alt etmeye ve tehlikeden kurtulmaya iþaret eder.',
    psychological_interpretation: 'Yýlan rüyasý, kiþinin bilinçaltýndaki korkularýný ve endiþelerini yansýtýr. Yýlan, dönüþüm ve yenilenmeyi de temsil edebilir. Yýlanla yüzleþmek, kiþinin korkularýyla baþa çýkmasý gerektiðini gösterir.',
    keywords: ['yýlan', 'düþman', 'tehlike', 'dönüþüm', 'korku'],
    is_featured: true,
    view_count: 2340,
    like_count: 189,
  },
  
  // Deniz Canlýlarý kategorisi için rüyalar
  {
    title: 'Rüyada Balýk Görmek',
    slug: 'ruyada-balik-gormek',
    content: 'Rüyada balýk görmek, bolluk, bereket ve rýzkýn sembolüdür. Canlý balýk görmek, hayýr ve bereket anlamýna gelir. Balýk tutmak, rýzkýn artacaðýna ve güzel haberler alýnacaðýna iþaret eder. Ölü balýk görmek, bazý tabirlere göre olumsuzluklarý temsil edebilir.',
    category_slug: 'deniz-canlilari',
    islamic_interpretation: 'Ýslam tabirlerinde balýk görmek çok hayýrlýdýr. Balýk, rýzkýn ve nimetin sembolüdür. Balýk tutmak, helal kazanca ve hayýrlý rýzka iþarettir. Büyük balýk görmek, büyük nimetlere kavuþmak demektir. Hz. Yunus kýssasý nedeniyle balýk ayný zamanda tövbe ve baðýþlanmayý da temsil eder.',
    psychological_interpretation: 'Balýk rüyasý, kiþinin duygusal derinliklerini ve bilinçaltýný temsil eder. Balýk tutmak, kiþinin hedeflerine ulaþacaðýný gösterir. Suda yüzen balýklar görmek, iç huzurun ve duygusal dengenin habercisidir.',
    keywords: ['balýk', 'bolluk', 'bereket', 'rýzýk', 'nimet'],
    is_featured: true,
    view_count: 2100,
    like_count: 167,
  },
  
  // Hava Olaylarý kategorisi için rüyalar
  {
    title: 'Rüyada Yaðmur Görmek',
    slug: 'ruyada-yagmur-gormek',
    content: 'Rüyada yaðmur görmek, bereket, rahmet ve temizliðin sembolüdür. Hafif yaðmur görmek, hayýr ve bereket anlamýna gelir. Þiddetli yaðmur, zorluklarýn ardýndan ferahlýða kavuþacaðýnýza iþaret edebilir. Yaðmurda ýslanmak, günahlardan arýnmaya ve manevi temizliðe delalettir.',
    category_slug: 'hava-olaylari',
    islamic_interpretation: 'Ýslam alimlerine göre yaðmur, Allah\'ýn rahmetini ve bereketini temsil eder. Yaðmur görmek, dualarýn kabulüne ve sýkýntýlarýn sona ermesine iþarettir. Kuraklýk sonrasý yaðmur, darlýktan sonra bolluða kavuþmak demektir.',
    psychological_interpretation: 'Yaðmur rüyasý, kiþinin duygusal arýnma ihtiyacýný yansýtýr. Yaðmur görmek, duygusal bir serbest býrakma ve rahatlama dönemine girildiðini gösterir. Yaðmurun þiddeti, duygusal yoðunluðu temsil eder.',
    keywords: ['yaðmur', 'bereket', 'rahmet', 'temizlik', 'arýnma'],
    is_featured: false,
    view_count: 890,
    like_count: 72,
  },
  {
    title: 'Rüyada Kar Görmek',
    slug: 'ruyada-kar-gormek',
    content: 'Rüyada kar görmek, saflýðý, temizliði ve yeni baþlangýçlarý temsil eder. Beyaz kar görmek, manevi temizlik ve günahlardan arýnmaya iþaret eder. Kar topu oynamak, neþeli haberler ve güzel geliþmeler anlamýna gelir. Kar fýrtýnasý, geçici zorluklarý temsil edebilir.',
    category_slug: 'hava-olaylari',
    islamic_interpretation: 'Ýslam tabirlerinde kar, rahmet ve bereket anlamýna gelir. Kar görmek, günahlardan arýnmaya ve manevi temizliðe iþarettir. Kar yaðýþý, sýkýntýlarýn sona ermesine ve ferahlýða kavuþmaya delalettir.',
    psychological_interpretation: 'Kar rüyasý, kiþinin iç dünyasýndaki saflýðý ve temizliði yansýtýr. Kar görmek, yeni bir baþlangýç yapmaya hazýr olduðunuzu gösterir. Beyaz kar, zihinsel berraklýðý ve netliði temsil eder.',
    keywords: ['kar', 'saflýk', 'temizlik', 'yeni baþlangýç', 'rahmet'],
    is_featured: false,
    view_count: 765,
    like_count: 58,
  },
  
  // Su kategorisi için rüyalar
  {
    title: 'Rüyada Deniz Görmek',
    slug: 'ruyada-deniz-gormek',
    content: 'Rüyada deniz görmek, geniþ ufuklarý, özgürlüðü ve bilinmeyeni temsil eder. Sakin bir deniz görmek, huzur ve istikrar anlamýna gelir. Dalgalý deniz, heyecanlý geliþmelere ve deðiþimlere iþaret eder. Denizde yüzmek, özgürlük ve macera arayýþýný gösterir.',
    category_slug: 'su',
    islamic_interpretation: 'Ýslam alimlerine göre deniz, dünya ve içindekileri temsil eder. Sakin deniz, rahatlýk ve geniþlik anlamýna gelir. Denizden su içmek, rýzkýn artmasýna ve hayýrlý nimetlere iþarettir. Denizde boðulmak, dünya iþlerine dalmaya delalettir.',
    psychological_interpretation: 'Deniz rüyasý, kiþinin duygusal derinliðini ve bilinçaltýný yansýtýr. Sakin deniz, duygusal dengeyi; dalgalý deniz ise duygusal çalkantýlarý temsil eder. Deniz kýyýsýnda olmak, bilinç ve bilinçaltý arasýndaki sýnýrý gösterir.',
    keywords: ['deniz', 'özgürlük', 'ufuk', 'duygusal', 'derinlik'],
    is_featured: true,
    view_count: 1670,
    like_count: 134,
  },
  {
    title: 'Rüyada Nehir Görmek',
    slug: 'ruyada-nehir-gormek',
    content: 'Rüyada nehir görmek, hayatýn akýþýný, deðiþimi ve yolculuðu temsil eder. Berrak bir nehir görmek, hayatýn güzel akacaðýna ve hedeflere ulaþýlacaðýna iþaret eder. Nehirde yüzmek, hayatýn akýþýna uyum saðlamayý gösterir. Nehrin taþmasý, beklenmedik geliþmelere delalettir.',
    category_slug: 'su',
    islamic_interpretation: 'Ýslam tabirlerinde nehir, rýzkýn ve hayatýn akýþýný temsil eder. Berrak nehir, helal rýzýk ve hayýrlý ömür anlamýna gelir. Nehirden su içmek, faydalý ilim ve hayýrlý rýzka iþarettir. Nehrin kurumasý, rýzkýn kesilmesine delalettir.',
    psychological_interpretation: 'Nehir rüyasý, kiþinin hayat yolculuðunu ve ilerleyiþini yansýtýr. Nehrin akýþý, kiþinin hayatýndaki deðiþimleri temsil eder. Berrak nehir, zihinsel berraklýðý; bulanýk nehir ise kafa karýþýklýðýný gösterir.',
    keywords: ['nehir', 'akýþ', 'deðiþim', 'yolculuk', 'hayat'],
    is_featured: false,
    view_count: 920,
    like_count: 76,
  },
  
  // Ateþ kategorisi için rüyalar
  {
    title: 'Rüyada Ateþ Görmek',
    slug: 'ruyada-ates-gormek',
    content: 'Rüyada ateþ görmek, tutkuyu, enerjiyi ve dönüþümü temsil eder. Kontrollü ateþ görmek, enerjiyi doðru yönlendirmeye ve baþarýya iþaret eder. Yangýn görmek, tehlikeli durumlarý veya büyük deðiþimleri temsil edebilir. Ateþle ýsýnmak, koruma ve güvenlik anlamýna gelir.',
    category_slug: 'ates',
    islamic_interpretation: 'Ýslam alimlerine göre ateþ, çeþitli anlamlara gelir. Ateþ görmek bazen fitneyi, bazen de ýþýðý ve aydýnlýðý temsil eder. Ateþle ýsýnmak, hayýr ve bereket anlamýna gelir. Yangýndan kaçmak, tehlikelerden korunmaya iþarettir.',
    psychological_interpretation: 'Ateþ rüyasý, kiþinin içsel enerjisini ve tutkularýný yansýtýr. Kontrollü ateþ, enerjinin doðru yönlendirildiðini gösterir. Yangýn, kontrolsüz duygularý veya hayatýndaki kaosu temsil edebilir.',
    keywords: ['ateþ', 'tutku', 'enerji', 'dönüþüm', 'deðiþim'],
    is_featured: false,
    view_count: 1100,
    like_count: 87,
  },
  
  // Kiþiler kategorisi için rüyalar
  {
    title: 'Rüyada Ölü Görmek',
    slug: 'ruyada-olu-gormek',
    content: 'Rüyada ölü görmek, geçmiþle baðlantýyý, biten bir dönemi veya manevi mesajlarý temsil eder. Ölen bir yakýnýnýzý görmek, onun için dua etmeniz gerektiðine iþaret edebilir. Ölüyle konuþmak, önemli mesajlar alýnacaðýna delalettir. Ölen birinin dirilmesi, unutulan bir konunun tekrar gündeme gelmesini gösterir.',
    category_slug: 'kisiler',
    islamic_interpretation: 'Ýslam tabirlerinde ölü görmek, genellikle hayýrlýdýr. Ölü, dünya iþlerinden el etek çekmiþ kiþiyi temsil eder. Ölüyle konuþmak, doðru yola iletilmeye ve hayýrlý iþler yapmaya iþarettir. Ölüye dua etmek, onun ruhuna sevap göndermek demektir.',
    psychological_interpretation: 'Ölü rüyasý, kiþinin geçmiþle olan baðýný ve biten dönemleri yansýtýr. Ölü görmek, bir dönemin sona erdiðini ve yeni bir baþlangýca hazýrlandýðýnýzý gösterebilir. Ölüyle konuþmak, içsel bir diyalog ve kendinle yüzleþmeyi temsil eder.',
    keywords: ['ölü', 'geçmiþ', 'dua', 'mesaj', 'dönüþ'],
    is_featured: true,
    view_count: 2890,
    like_count: 234,
  },
  {
    title: 'Rüyada Bebek Görmek',
    slug: 'ruyada-bebek-gormek',
    content: 'Rüyada bebek görmek, masumiyeti, yeni baþlangýçlarý ve potansiyeli temsil eder. Gülen bir bebek görmek, mutlu haberler ve güzel geliþmeler anlamýna gelir. Aðlayan bebek, dikkat edilmesi gereken konulara iþaret edebilir. Bebek bakmak, sorumluluk ve koruma içgüdüsünü gösterir.',
    category_slug: 'kisiler',
    islamic_interpretation: 'Ýslam alimlerine göre bebek görmek hayýrlýdýr. Bebek, sevinç ve mutluluk haberinin müjdecisidir. Güzel bir bebek görmek, hayýrlý rýzka ve berekete iþarettir. Bebek kucaða almak, sevinçli bir haber almak demektir.',
    psychological_interpretation: 'Bebek rüyasý, kiþinin iç dünyasýndaki masumiyeti ve yeni potansiyelleri yansýtýr. Bebek görmek, yeni bir projenin veya fikrin doðuþunu temsil eder. Bebeðe bakmak, kiþinin koruyucu ve besleyici yönünü gösterir.',
    keywords: ['bebek', 'masumiyet', 'yeni baþlangýç', 'potansiyel', 'sevinç'],
    is_featured: false,
    view_count: 1450,
    like_count: 118,
  },
  
  // Durumlar kategorisi için rüyalar
  {
    title: 'Rüyada Uçmak',
    slug: 'ruyada-ucmak',
    content: 'Rüyada uçmak, özgürlüðü, yükseliþi ve hedeflere ulaþmayý temsil eder. Yükseðe uçmak, baþarýlý olacaðýnýza ve hedeflerinize ulaþacaðýnýza iþaret eder. Düþmekten korkmadan uçmak, özgüvenin ve cesaretin göstergesidir. Kanatlarla uçmak, manevi yükseliþi temsil eder.',
    category_slug: 'durumlar',
    islamic_interpretation: 'Ýslam tabirlerinde uçmak, yükselmeye ve makam kazanmaya iþarettir. Uçmak, kiþinin durumunun iyileþeceðine ve zorluklardan kurtulacaðýna delalettir. Kuþ gibi uçmak, seyahate veya manevi yükseliþe iþaret edebilir.',
    psychological_interpretation: 'Uçma rüyasý, kiþinin özgürlük arzusunu ve sýnýrlarý aþma isteðini yansýtýr. Uçmak, kiþinin potansiyelinin farkýna varmasýný ve kendini aþmasýný temsil eder. Yükseðe uçmak, kiþisel geliþim ve baþarý arzusunu gösterir.',
    keywords: ['uçmak', 'özgürlük', 'yükseliþ', 'baþarý', 'hedef'],
    is_featured: true,
    view_count: 1980,
    like_count: 156,
  },
  {
    title: 'Rüyada Düþmek',
    slug: 'ruyada-dusmek',
    content: 'Rüyada düþmek, kontrol kaybýný, güvensizliði veya bir duruma hazýrlýksýz olmayý temsil eder. Yüksekten düþmek, büyük beklentilerin hayal kýrýklýðýna dönüþebileceðine iþaret edebilir. Düþüp kalkmak, zorluklarýn üstesinden gelmeyi gösterir. Kuyuya düþmek, beklenmedik sorunlara delalettir.',
    category_slug: 'durumlar',
    islamic_interpretation: 'Ýslam alimlerine göre düþmek, çeþitli anlamlara gelir. Yüksekten düþmek, makam kaybýna veya hataya iþaret edebilir. Düþüp yaralanmak, bir zorlukla karþýlaþmaya delalettir. Düþüp kalkmak, tövbe etmeye ve hatadan dönmeye iþarettir.',
    psychological_interpretation: 'Düþme rüyasý, kiþinin hayattaki güvensizliklerini ve korkularýný yansýtýr. Düþmek, kontrolü kaybetme korkusunu temsil eder. Yüksekten düþmek, kiþinin beklentilerinin yüksek olduðunu ve hayal kýrýklýðý yaþama riskini gösterir.',
    keywords: ['düþmek', 'kontrol', 'güvensizlik', 'korku', 'zorluk'],
    is_featured: false,
    view_count: 1230,
    like_count: 89,
  },
  
  // Renkler kategorisi için rüyalar
  {
    title: 'Rüyada Beyaz Renk Görmek',
    slug: 'ruyada-beyaz-renk-gormek',
    content: 'Rüyada beyaz renk görmek, saflýðý, temizliði ve manevi aydýnlýðý temsil eder. Beyaz elbise giymek, manevi temizlik ve günahlardan arýnmaya iþaret eder. Beyaz çiçek görmek, saflýðý ve masumiyeti temsil eder. Beyaz ev görmek, huzurlu bir yuva anlamýna gelir.',
    category_slug: 'renkler',
    islamic_interpretation: 'Ýslam tabirlerinde beyaz, hayýr ve bereket rengidir. Beyaz görmek, manevi temizliðe ve günahlardan arýnmaya iþarettir. Beyaz elbise giymek, saliha bir kiþi olmaya delalettir. Beyaz, ayný zamanda hac ve umre ile de yorumlanýr.',
    psychological_interpretation: 'Beyaz rüyasý, kiþinin iç dünyasýndaki saflýðý ve temizliði yansýtýr. Beyaz görmek, zihinsel berraklýðý ve yeni bir baþlangýç yapmaya hazýr olmayý gösterir. Beyaz, ayný zamanda barýþ ve huzur arayýþýný temsil eder.',
    keywords: ['beyaz', 'saflýk', 'temizlik', 'aydýnlýk', 'huzur'],
    is_featured: false,
    view_count: 870,
    like_count: 68,
  },
  {
    title: 'Rüyada Siyah Renk Görmek',
    slug: 'ruyada-siyah-renk-gormek',
    content: 'Rüyada siyah renk görmek, gizemi, bilinmeyeni veya üzüntüyü temsil edebilir. Siyah elbise giymek, bir yas veya üzüntü dönemine iþaret edebilir. Siyah taþ görmek, dayanýklýlýðý ve güçlü olmayý temsil eder. Siyah kuþ görmek, gizemli haberlere delalettir.',
    category_slug: 'renkler',
    islamic_interpretation: 'Ýslam alimlerine göre siyah, çeþitli anlamlara gelir. Siyah bazen güç ve kuvveti, bazen de üzüntüyü temsil eder. Siyah elbise giymek, bir üzüntü veya yasa iþaret edebilir. Ancak siyahýn anlamý, rüyanýn diðer unsurlarýna göre deðiþir.',
    psychological_interpretation: 'Siyah rüyasý, kiþinin bilinçaltýndaki korkularýný veya bastýrýlmýþ duygularýný yansýtýr. Siyah görmek, kiþinin bilinmeyenle yüzleþmesi gerektiðini gösterebilir. Siyah ayný zamanda güç ve otoriteyi de temsil edebilir.',
    keywords: ['siyah', 'gizem', 'bilinmeyen', 'güç', 'üzüntü'],
    is_featured: false,
    view_count: 920,
    like_count: 71,
  },
  
  // Sayýlar kategorisi için rüyalar
  {
    title: 'Rüyada Sayý Görmek',
    slug: 'ruyada-sayi-gormek',
    content: 'Rüyada sayý görmek, düzeni, hesabý ve belirli anlamlarý temsil eder. Her sayýnýn kendine özgü anlamý vardýr. Sayý saymak, planlý ve programlý olmaya iþaret eder. Sayý yazmak, önemli bir konuyu hesaplamayý gösterir.',
    category_slug: 'sayilar',
    islamic_interpretation: 'Ýslam tabirlerinde sayýlar önemli anlamlar taþýr. Bir (1) rakamý Allah\'ýn birliðini temsil eder. Üç (3) rakamý, tamamlanmýþ bir iþi gösterir. Yedi (7) rakamý, kainatýn düzenini ve bereketi temsil eder. Kýrk (40) rakamý, olgunlaþma ve tamamlanmaya iþarettir.',
    psychological_interpretation: 'Sayý rüyasý, kiþinin düzen ve kontrol arayýþýný yansýtýr. Sayý görmek, kiþinin hayatýndaki belirli dönemleri veya önemli tarihleri temsil edebilir. Sayýlarla uðraþmak, zihinsel aktiviteyi ve problem çözme yeteneðini gösterir.',
    keywords: ['sayý', 'düzen', 'hesap', 'anlam', 'sembol'],
    is_featured: false,
    view_count: 780,
    like_count: 54,
  },
  
  // Yiyecekler kategorisi için rüyalar
  {
    title: 'Rüyada Ekmek Görmek',
    slug: 'ruyada-ekmek-gormek',
    content: 'Rüyada ekmek görmek, rýzký, bereketi ve hayatýn temel ihtiyaçlarýný temsil eder. Taze ekmek görmek, bolluk ve bereket anlamýna gelir. Ekmek yemek, helal rýzka ve hayýrlý nimetlere iþaret eder. Ekmek bölmek, cömertlik ve paylaþmayý gösterir.',
    category_slug: 'yiyecekler',
    islamic_interpretation: 'Ýslam alimlerine göre ekmek, rýzkýn ve nimetin en belirgin sembolüdür. Beyaz ekmek görmek, helal rýzka ve berekete iþarettir. Ekmek yemek, hayatýn kolaylaþacaðýna ve rýzkýn artacaðýna delalettir. Ekmek vermek, sadaka ve hayýr yapmaya iþarettir.',
    psychological_interpretation: 'Ekmek rüyasý, kiþinin temel ihtiyaçlarýný ve güvenlik duygusunu yansýtýr. Ekmek görmek, kiþinin hayatýnda bolluk ve bereket arayýþýný gösterir. Ekmek paylaþmak, kiþinin cömertlik ve yardýmseverlik özelliklerini temsil eder.',
    keywords: ['ekmek', 'rýzýk', 'bereket', 'nimet', 'bolluk'],
    is_featured: true,
    view_count: 1560,
    like_count: 128,
  },
  {
    title: 'Rüyada Elma Görmek',
    slug: 'ruyada-elma-gormek',
    content: 'Rüyada elma görmek, güzelliði, bilgeliði ve bereketi temsil eder. Kýrmýzý elma görmek, sevgi ve tutkuya iþaret eder. Yeþil elma, umut ve yeni baþlangýçlarý temsil eder. Elma yemek, hayýrlý rýzka ve güzel haberlere delalettir.',
    category_slug: 'yiyecekler',
    islamic_interpretation: 'Ýslam tabirlerinde elma, hayýr ve bereket anlamýna gelir. Elma görmek, hayýrlý rýzka ve güzel nimetlere iþarettir. Elma vermek, sevgi ve dostluðu temsil eder. Elma aðacý görmek, bolluk ve bereketli bir ömre delalettir.',
    psychological_interpretation: 'Elma rüyasý, kiþinin arzularýný ve hedeflerini yansýtýr. Elma görmek, kiþinin hayatýnda güzel geliþmelerin olacaðýný gösterir. Elma yemek, kiþinin emeklerinin karþýlýðýný alacaðýný temsil eder.',
    keywords: ['elma', 'güzellik', 'bilgelik', 'bereket', 'sevgi'],
    is_featured: false,
    view_count: 890,
    like_count: 67,
  },
  {
    title: 'Rüyada Su Ýçmek',
    slug: 'ruyada-su-icmek',
    content: 'Rüyada su içmek, hayatýn kaynaðýna, manevi beslenmeye ve rahmete iþaret eder. Berrak su içmek, helal rýzka ve manevi huzura delalettir. Soðuk su içmek, ferahlýk ve rahatlama anlamýna gelir. Tatly su içmek, hayýr ve bereketi temsil eder.',
    category_slug: 'yiyecekler',
    islamic_interpretation: 'Ýslam alimlerine göre su içmek, rahmet ve bereketin sembolüdür. Berrak su içmek, imanýn artmasýna ve manevi huzura iþarettir. Kuyudan su içmek, rýzkýn artmasýna ve hayýrlý nimetlere delalettir. Suyun kesilmesi, rýzkýn daralmasýna iþaret edebilir.',
    psychological_interpretation: 'Su içme rüyasý, kiþinin manevi ve duygusal beslenme ihtiyacýný yansýtýr. Berrak su içmek, iç huzurun ve zihinsel berraklýðýn habercisidir. Susuzluk çekmek, kiþinin hayatýnda bir eksiklik hissettiðini gösterir.',
    keywords: ['su', 'hayat', 'rahmet', 'huzur', 'beslenme'],
    is_featured: false,
    view_count: 1120,
    like_count: 92,
  },
];

async function seedDatabase() {
  try {
    console.log('Seeder starting...');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      supabase.from('dream_likes').delete().neq('id', ''),
      supabase.from('favorites').delete().neq('id', ''),
      supabase.from('view_history').delete().neq('id', ''),
      supabase.from('comments').delete().neq('id', ''),
      supabase.from('dreams').delete().neq('id', ''),
      supabase.from('categories').delete().neq('id', ''),
      supabase.from('user_roles').delete().neq('id', ''),
      supabase.from('profiles').delete().neq('id', ''),
      supabase.from('users').delete().neq('id', ''),
    ]);
    console.log('Existing data cleared.');
    
    // Create admin user
    console.log('Creating admin user...');
    const adminUserId = uuidv4();
    const adminProfileId = uuidv4();
    const adminRoleId = uuidv4();
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    const now = new Date().toISOString();
    
    await supabase.from('users').insert({ id: adminUserId, email: adminUser.email, password: hashedPassword, created_at: now, updated_at: now });
    await supabase.from('profiles').insert({ id: adminProfileId, user_id: adminUserId, email: adminUser.email, full_name: adminUser.full_name, username: adminUser.username, created_at: now, updated_at: now });
    await supabase.from('user_roles').insert({ id: adminRoleId, user_id: adminUserId, role: 'admin', created_at: now });
    console.log('Admin user created.');
    
    // Store category IDs for parent relationships
    const categoryIds: { [key: string]: string } = {};
    
    // Insert main categories first (without parents)
    console.log('Inserting main categories...');
    for (const category of categories.filter(c => !c.parent_slug)) {
      const id = uuidv4();
      categoryIds[category.slug] = id;
      await supabase.from('categories').insert({ id, name: category.name, slug: category.slug, description: category.description, icon: category.icon, parent_id: null, order_index: category.order_index, created_at: now, updated_at: now });
    }
    
    // Insert sub-categories (with parents)
    console.log('Inserting sub-categories...');
    for (const category of categories.filter(c => c.parent_slug)) {
      const id = uuidv4();
      categoryIds[category.slug] = id;
      await supabase.from('categories').insert({ id, name: category.name, slug: category.slug, description: category.description, icon: category.icon, parent_id: categoryIds[category.parent_slug!], order_index: category.order_index, created_at: now, updated_at: now });
    }
    
    console.log(`Inserted ${categories.length} categories`);
    
    // Insert dreams
    console.log('Inserting dreams...');
    for (const dream of dreams) {
      const id = uuidv4();
      const categoryId = categoryIds[dream.category_slug];
      
      await supabase.from('dreams').insert({
        id,
        title: dream.title,
        slug: dream.slug,
        content: dream.content,
        category_id: categoryId,
        islamic_interpretation: dream.islamic_interpretation,
        psychological_interpretation: dream.psychological_interpretation,
        keywords: dream.keywords,
        is_featured: dream.is_featured,
        is_published: true,
        view_count: dream.view_count,
        like_count: dream.like_count,
        meta_title: dream.title + ' - Rüya Tabiri',
        meta_description: dream.content.substring(0, 160) + '...',
        created_at: now,
        updated_at: now,
      });
    }
    
    console.log(`Inserted ${dreams.length} dreams`);
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
