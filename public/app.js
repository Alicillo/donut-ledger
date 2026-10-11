// app.js - Donut SMP Economy Ledger Frontend Logic

let CURRENT_LANG = localStorage.getItem('dnt_lang') || 'en';
let CURRENT_THEME = localStorage.getItem('dnt_theme') || 'donut-dark';
if (CURRENT_THEME === 'donut-pink') CURRENT_THEME = 'redstone';

const THEME_NAMES = {
  'donut-dark': { en: 'Donut Dark', tr: 'Donut Koyu' },
  'obsidian': { en: 'Obsidian Void', tr: 'Obsidian Mor' },
  'emerald': { en: 'Emerald Rich', tr: 'Zümrüt Yeşil' },
  'redstone': { en: 'Redstone Power', tr: 'Redstone Gücü' },
  'cyber-gold': { en: 'Cyber Gold', tr: 'Siber Altın' }
};

function switchTheme(themeName, showNotification = true) {
  if (!THEME_NAMES[themeName]) themeName = 'donut-dark';
  CURRENT_THEME = themeName;
  localStorage.setItem('dnt_theme', themeName);

  if (themeName === 'donut-dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', themeName);
  }

  updateThemeChipsUi();

  if (showNotification) {
    const tName = THEME_NAMES[themeName][CURRENT_LANG] || THEME_NAMES[themeName].en;
    const msg = CURRENT_LANG === 'tr' ? `"${tName}" teması uygulandı.` : `"${tName}" theme applied.`;
    showToast(msg, 'success');
  }
}

function updateThemeChipsUi() {
  const activeBadge = document.getElementById('activeThemeBadge');
  if (activeBadge) {
    const tName = THEME_NAMES[CURRENT_THEME] ? (THEME_NAMES[CURRENT_THEME][CURRENT_LANG] || THEME_NAMES[CURRENT_THEME].en) : 'Donut Dark';
    activeBadge.textContent = tName;
  }

  document.querySelectorAll('.theme-chip').forEach(chip => {
    const dt = chip.getAttribute('data-theme');
    chip.classList.toggle('active', dt === CURRENT_THEME);
  });
}

function getWealthBadge(balance) {
  const bal = Number(balance || 0);
  let tier = 'starter';
  let nameEn = 'Hustler';
  let nameTr = 'Girişimci';
  let icon = 'fa-solid fa-seedling';

  if (bal >= 1000000000) { // 1B+
    tier = 'diamond';
    nameEn = 'Billionaire Elite';
    nameTr = 'Milyarder Elit';
    icon = 'fa-solid fa-gem';
  } else if (bal >= 500000000) { // 500M+
    tier = 'gold';
    nameEn = 'Donut Tycoon';
    nameTr = 'Donut Baronu';
    icon = 'fa-solid fa-crown';
  } else if (bal >= 100000000) { // 100M+
    tier = 'platinum';
    nameEn = 'Centurion';
    nameTr = 'Centurion';
    icon = 'fa-solid fa-medal';
  } else if (bal >= 10000000) { // 10M+
    tier = 'bronze';
    nameEn = 'Merchant';
    nameTr = 'Tüccar';
    icon = 'fa-solid fa-coins';
  }

  const title = CURRENT_LANG === 'tr' ? nameTr : nameEn;
  const html = `<span class="wealth-badge badge-${tier}" title="${title}"><i class="${icon}"></i> ${title}</span>`;
  return { tier, name: title, icon, html };
}

const I18N = {
  en: {
    flag: '🇺🇸',
    code: 'EN',
    brandSubtitle: 'ECONOMY LEDGER & SYNC',
    searchPlaceholder: 'Search player...',
    searchBtn: 'Search',
    tabDashboard: 'Dashboard',
    tabLeaderboard: 'Leaderboard',
    tabMod: 'Minecraft Mod',
    signIn: 'Sign In',
    
    // View Banner & Error Card
    playerProfile: 'Player Profile',
    returnToMyProfile: 'Return to My Profile',
    playerNotFound: (u) => `"${u}" Not Found On Web!`,
    playerNotFoundDesc: (u) => `"${u}" has not installed the Donut SMP client mod yet. Unlinked players do not appear on the ledger.`,
    howToInstall: 'How to Install Mod',
    backToProfile: 'Back to My Profile',

    // Guest onboarding
    welcomeTitle: 'Welcome to Donut SMP Economy Ledger',
    welcomeDesc: 'Your account is not linked yet. Connect your Minecraft account to automatically track your balance, <code>/ah</code> transactions, <code>/pay</code> transfers, and <code>/orders</code> revenue.',
    onboardStep1: '<strong>1.</strong> Place DonutLedger.jar into your Minecraft <code>mods/</code> folder',
    onboardStep2: '<strong>2.</strong> Type <code>/verify</code> in-game on donutsmp.net to copy your API key',
    onboardStep3: '<strong>3.</strong> Click Sign In on the website and paste your key!',
    verifyAndSignIn: 'Verify & Sign In',
    modGuideBtn: 'Mod Guide',

    // Hero
    notLinked: 'Not Linked',
    privateBadge: 'Private',
    publicBadge: 'Public',
    serverLabel: '<i class="fa-solid fa-server"></i> Server: <strong>donutsmp.net</strong>',
    profileVisibility: 'Profile Visibility',
    visibleToAll: 'Visible to all players',
    visibleToYou: 'Only visible to you',
    share: 'Share',
    keyTitle: 'Minecraft Mod API Key',
    syncActiveOnline: 'Minecraft Sync Active (Online)',

    // Stats
    totalBalance: 'Total Balance',
    liveDonutBal: '<i class="fa-solid fa-circle-check"></i> Live Donut SMP /bal',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expenses',
    netCashFlow: 'Net Cash Flow (Profit/Loss)',
    calculatedNetFlow: 'Calculated Net Flow',
    netProfit: '<i class="fa-solid fa-arrow-trend-up"></i> Net Profit',
    netLoss: '<i class="fa-solid fa-arrow-trend-down"></i> Net Loss',

    // Charts
    cashFlowTimeline: 'Cash Flow Timeline',
    categoryBreakdown: 'Category Breakdown',
    incomeLegend: 'Income',
    expenseLegend: 'Expenses',
    autoSyncBadge: 'Auto Sync',
    noChartData: 'No Data',

    // Ledger
    ledgerTitle: '<i class="fa-solid fa-receipt"></i> Financial Transaction Ledger',
    txSearchPlaceholder: 'Search transaction or item...',
    filterAllTypes: 'All Movements',
    filterIncomeOnly: 'Income Only (+)',
    filterExpenseOnly: 'Expenses Only (-)',
    filterInfoOnly: 'Order & Event Notifications (ℹ️)',
    filterAllCats: 'All Donut SMP Categories',
    thType: 'TYPE',
    thDesc: 'DESCRIPTION / ITEM',
    thCategory: 'CATEGORY',
    thSource: 'SOURCE',
    thDate: 'DATE & TIME',
    thAmount: 'AMOUNT',
    noTxFound: 'No Transactions Found',
    noTxDesc: 'No financial movements recorded yet. In-game /ah, /pay, /sell, and /orders events will appear here live.',

    // Leaderboard
    leaderboardTitle: 'Donut SMP Wealth Leaderboard & Public Profiles',
    leaderboardSubtitle: 'Official ranking of active players who have set their profile to <strong>Public</strong>. Unlinked or private profiles are not displayed.',
    loadingLeaderboard: 'Loading leaderboard...',
    noPublicPlayersTitle: 'No Public Players Yet',
    noPublicPlayersDesc: 'Players who link their account with the mod and set their profile to "Public" will be ranked here.',
    cardBalance: 'Balance',
    cardIncome: 'Total Income',
    cardInspect: 'View Profile & Ledger',

    // Mod Guide
    guideHeroBadge: '<i class="fa-solid fa-bolt"></i> DONUT SMP CLIENT MOD • FABRIC 1.21.X',
    guideHeroTitle: 'Automatic Real-Time Economy Synchronization',
    guideHeroDesc: 'The <strong>DonutLedger</strong> Fabric client mod automatically tracks your balance, <code>/ah</code> auction sales and purchases, <code>/orders</code> fulfillment, <code>/sell</code> server shop sales, and <code>/pay</code> player transfers on <strong>donutsmp.net</strong> and streams them directly to your personal ledger.',
    step1Title: 'Download & Install Client Mod',
    step1Desc: 'Place <code>DonutLedger.jar</code> into your Minecraft <code>.minecraft/mods/</code> directory and launch the game with Fabric 1.21.x.',
    downloadModBtn: 'Download DonutLedger.jar (Fabric 1.21.x)',
    step2Title: 'Type /verify In-Game',
    step2Desc: 'Join the Donut SMP server (<code>donutsmp.net</code>) and type the command in chat:',
    step2Subtext: 'Your unique API key is securely masked in chat and automatically copied to your Windows clipboard.',
    step3Title: 'Sign In on Website',
    step3Desc: 'Click "Sign In" in the top right corner and paste your Minecraft username and API key from your clipboard.',
    step3Badge: 'Secure & Unique Key Authentication',
    serverIpLabel: 'Server IP:',
    modVersionLabel: 'Mod Version:',

    // Calculator
    calcTitle: 'DONUT SMP CALCULATOR',
    calcClose: 'Close',

    // Modals
    loginModalTitle: '<i class="fa-solid fa-shield-halved"></i> Secure Sign In & Verification',
    loginModalDesc: 'To protect your ledger from unauthorized access, enter your <strong>Minecraft username and unique API Key</strong>.',
    loginUserLabel: 'Minecraft Username',
    loginUserPlaceholder: 'Minecraft Username',
    loginKeyLabel: 'Unique API Key (Required)',
    loginKeyHint: '<i class="fa-solid fa-info-circle"></i> To get your API Key, type <strong>verify</strong> in-game on donutsmp.net. Your key is automatically copied to your clipboard.',
    loginCancel: 'Cancel',
    loginSubmit: 'Sign In',

    apiKeyModalTitle: '<i class="fa-solid fa-key"></i> Minecraft Client Mod Secret API Key',
    apiKeyModalDesc: 'This secret key pairs your in-game client mod directly with your account. Never share this key with anyone!',
    copyKeyBtn: 'Copy',
    regenKeyBtn: 'Generate New Key (Revoke Old)',
    closeModalBtn: 'Close',

    userMenuTitle: '<i class="fa-solid fa-circle-user"></i> My Account',
    mcVerifiedBadge: 'Minecraft Verified',
    showApiKeyBtn: 'Show API Key',
    goToProfileBtn: 'Go to My Profile',
    signOutBtn: 'Sign Out',

    // Toasts & Alerts
    signedOutToast: 'Signed out successfully.',
    signedInToast: (u) => `Signed in as ${u}`,
    apiKeyCopiedToast: 'API Key copied to clipboard!',
    linkCopiedToast: 'Profile link copied to clipboard! Share it with your friends.',
    linkFirstToast: 'Please link your account first.',
    enterUsernameToast: 'Please enter your Minecraft username',
    keyRequiredToast: "API Key is required! Type 'verify' in-game on donutsmp.net to copy your key.",
    notLinkedToast: 'This player has not installed the mod yet! Please launch the mod in-game first.',
    invalidKeyToast: "Invalid API Key! Type 'verify' in-game to copy your valid key.",
    regenConfirm: 'Your old API key will be revoked. Continue?',
    regenFail: 'Failed to regenerate key.',
    privacyUpdated: 'Privacy updated.',
    privacyUpdateFail: 'Failed to update privacy.',

    // Public Chat
    chatHeaderTitle: 'PUBLIC CHAT',
    chatVerifiedOnlyText: 'Verified Players Only',
    chatLockedTitle: 'Read-Only Mode',
    chatLockedDesc: 'Sign in with your Minecraft API Key to chat.',
    chatSignInBtnText: 'Sign In',
    chatInputPlaceholder: 'Type a message...',
    chatEmptyFeed: 'No messages yet. Say hello!'
  },
  tr: {
    flag: '🇹🇷',
    code: 'TR',
    brandSubtitle: 'EKONOMİ DEFTERİ & SENKRONİZASYON',
    searchPlaceholder: 'Oyuncu ara...',
    searchBtn: 'Ara',
    tabDashboard: 'Panelim',
    tabLeaderboard: 'Sıralama',
    tabMod: 'Minecraft Modu',
    signIn: 'Giriş Yap',
    
    // View Banner & Error Card
    playerProfile: 'Oyuncu Profili',
    returnToMyProfile: 'Kendi Profilime Dön',
    playerNotFound: (u) => `"${u}" Sitede Bulunamadı!`,
    playerNotFoundDesc: (u) => `"${u}" adlı oyuncu henüz Donut SMP istemci modunu kurup hesabını bağlamamış. Bağlantısı olmayan oyuncular defterde yer almaz.`,
    howToInstall: 'Mod Nasıl Kurulur?',
    backToProfile: 'Kendi Profilime Dön',

    // Guest onboarding
    welcomeTitle: 'Donut SMP Finans Defterine Hoş Geldiniz',
    welcomeDesc: 'Hesabınız henüz bağlanmadı. Bakiyenizi, <code>/ah</code> işlemlerinizi, <code>/pay</code> transferlerinizi ve <code>/orders</code> kazançlarınızı otomatik takip etmek için hesabınızı bağlayın.',
    onboardStep1: '<strong>1.</strong> DonutLedger.jar dosyasını Minecraft <code>mods/</code> klasörüne atın',
    onboardStep2: '<strong>2.</strong> donutsmp.net sunucusunda sohbete <code>/verify</code> yazarak API anahtarınızı kopyalayın',
    onboardStep3: '<strong>3.</strong> Sitede Giriş Yap butonuna tıklayıp anahtarınızı yapıştırın!',
    verifyAndSignIn: 'Doğrula & Giriş Yap',
    modGuideBtn: 'Mod Rehberi',

    // Hero
    notLinked: 'Bağlı Değil',
    privateBadge: 'Gizli',
    publicBadge: 'Herkese Açık',
    serverLabel: '<i class="fa-solid fa-server"></i> Sunucu: <strong>donutsmp.net</strong>',
    profileVisibility: 'Profil Görünürlüğü',
    visibleToAll: 'Diğer oyuncular görebilir',
    visibleToYou: 'Yalnızca siz görebilirsiniz',
    share: 'Paylaş',
    keyTitle: 'Minecraft Mod API Anahtarı',
    syncActiveOnline: 'Minecraft Senkronizasyonu Aktif (Çevrimiçi)',

    // Stats
    totalBalance: 'Toplam Bakiye',
    liveDonutBal: '<i class="fa-solid fa-circle-check"></i> Donut SMP Güncel /bal',
    totalIncome: 'Toplam Gelir',
    totalExpense: 'Toplam Gider',
    netCashFlow: 'Net Nakit Akışı (Kâr/Zarar)',
    calculatedNetFlow: 'Hesaplanan Net Akış',
    netProfit: '<i class="fa-solid fa-arrow-trend-up"></i> Net Kârda',
    netLoss: '<i class="fa-solid fa-arrow-trend-down"></i> Net Zararda',

    // Charts
    cashFlowTimeline: 'Gelir & Gider Zaman Grafiği',
    categoryBreakdown: 'Kategori Dağılımı',
    incomeLegend: 'Gelir',
    expenseLegend: 'Gider',
    autoSyncBadge: 'Otomatik Kayıt',
    noChartData: 'Kayıt Yok',

    // Ledger
    ledgerTitle: '<i class="fa-solid fa-receipt"></i> Finansal İşlem Defteri',
    txSearchPlaceholder: 'İşlem veya item ara...',
    filterAllTypes: 'Tüm Hareketler',
    filterIncomeOnly: 'Yalnızca Gelir (+)',
    filterExpenseOnly: 'Yalnızca Gider (-)',
    filterInfoOnly: 'Sipariş & Olay Bildirimleri (ℹ️)',
    filterAllCats: 'Tüm Donut SMP Kategorileri',
    thType: 'TİP',
    thDesc: 'AÇIKLAMA / İTEM',
    thCategory: 'KATEGORİ',
    thSource: 'KAYNAK',
    thDate: 'TARİH & SAAT',
    thAmount: 'TUTAR',
    noTxFound: 'Kayıtlı İşlem Bulunamadı',
    noTxDesc: 'Henüz finansal hareket kaydedilmedi. Oyunda /ah, /pay, /sell veya /orders kullandıkça burada anında görünecektir.',

    // Leaderboard
    leaderboardTitle: 'Donut SMP Ekonomi Sıralaması & Oyuncu Profilleri',
    leaderboardSubtitle: 'Profilini <strong>Herkese Açık</strong> yapan aktif oyuncuların resmi sıralamasıdır. Gizli veya bağlı olmayan hesaplar gösterilmez.',
    loadingLeaderboard: 'Sıralama verileri yükleniyor...',
    noPublicPlayersTitle: 'Henüz Herkese Açık Oyuncu Yok',
    noPublicPlayersDesc: 'Modu kurup hesabını bağlayan ve profilini "Herkese Açık" yapan oyuncular burada listelenir.',
    cardBalance: 'Bakiye',
    cardIncome: 'Toplam Gelir',
    cardInspect: 'Profili & Defteri İncele',

    // Mod Guide
    guideHeroBadge: '<i class="fa-solid fa-bolt"></i> DONUT SMP İSTEMCİ MODU • FABRIC 1.21.X',
    guideHeroTitle: 'Gerçek Zamanlı Otomatik Ekonomi Senkronizasyonu',
    guideHeroDesc: '<strong>DonutLedger</strong> Fabric istemci modu; bakiyenizi, <code>/ah</code> açık artırma satış ve alışlarınızı, <code>/orders</code> siparişlerinizi, <code>/sell</code> market satışlarınızı ve <code>/pay</code> para transferlerinizi <strong>donutsmp.net</strong> sunucusundan anlık olarak dinler ve doğrudan kişisel defterinize kaydeder.',
    step1Title: 'Modu İndirin & Kurun',
    step1Desc: '<code>DonutLedger.jar</code> dosyasını Minecraft <code>.minecraft/mods/</code> klasörüne atın ve oyunu Fabric 1.21.x ile başlatın.',
    downloadModBtn: 'DonutLedger.jar İndir (Fabric 1.21.x)',
    step2Title: 'Oyunda /verify Yazın',
    step2Desc: 'Donut SMP sunucusuna (<code>donutsmp.net</code>) girdikten sonra sohbete komutu yazın:',
    step2Subtext: 'Size özel eşsiz API anahtarınız sohbette gizlenir ve otomatik olarak Windows panonuza kopyalanır.',
    step3Title: 'Sitede Giriş Yapın',
    step3Desc: 'Sağ üstteki "Giriş Yap" butonuna tıklayın, kullanıcı adınızı ve panonuzdaki API anahtarını yapıştırın.',
    step3Badge: 'Güvenli & Eşsiz Anahtar Doğrulaması',
    serverIpLabel: 'Sunucu IP:',
    modVersionLabel: 'Mod Sürümü:',

    // Calculator
    calcTitle: 'DONUT SMP HESAP MAKİNESİ',
    calcClose: 'Kapat',

    // Modals
    loginModalTitle: '<i class="fa-solid fa-shield-halved"></i> Güvenli Giriş & Doğrulama',
    loginModalDesc: 'Finansal defterinize yetkisiz erişimi önlemek için <strong>Minecraft kullanıcı adınız ve eşsiz API Anahtarınız</strong> gereklidir.',
    loginUserLabel: 'Minecraft Kullanıcı Adı',
    loginUserPlaceholder: 'Minecraft Kullanıcı Adı',
    loginKeyLabel: 'Eşsiz API Anahtarı (Zorunlu)',
    loginKeyHint: '<i class="fa-solid fa-info-circle"></i> API Anahtarınızı almak için donutsmp.net sunucusunda sohbete <strong>verify</strong> yazın. Anahtarınız otomatik panoya kopyalanır.',
    loginCancel: 'Vazgeç',
    loginSubmit: 'Giriş Yap',

    apiKeyModalTitle: '<i class="fa-solid fa-key"></i> Minecraft İstemci Modu Gizli API Anahtarı',
    apiKeyModalDesc: 'Bu gizli anahtar oyun içi istemci modunuzu hesabınızla doğrudan eşleştirir. Anahtarınızı kimseyle paylaşmayın!',
    copyKeyBtn: 'Kopyala',
    regenKeyBtn: 'Yeni Anahtar Üret (Eskisini İptal Et)',
    closeModalBtn: 'Kapat',

    userMenuTitle: '<i class="fa-solid fa-circle-user"></i> Hesabım',
    mcVerifiedBadge: 'Minecraft Doğrulandı',
    showApiKeyBtn: 'API Anahtarımı Göster',
    goToProfileBtn: 'Kendi Profilime Git',
    signOutBtn: 'Çıkış Yap',

    // Toasts & Alerts
    signedOutToast: 'Oturum kapatıldı.',
    signedInToast: (u) => `Giriş yapıldı: ${u}`,
    apiKeyCopiedToast: 'API Anahtarı panoya kopyalandı!',
    linkCopiedToast: 'Profil bağlantısı panoya kopyalandı! Arkadaşlarınızla paylaşabilirsiniz.',
    linkFirstToast: 'Lütfen önce hesabınızı bağlayın.',
    enterUsernameToast: 'Lütfen Minecraft kullanıcı adınızı girin',
    keyRequiredToast: "API Anahtarı zorunludur! Oyunda 'verify' yazarak kopyalayabilirsiniz.",
    notLinkedToast: 'Bu oyuncu henüz modu kurmamış! Lütfen önce oyunda modu çalıştırın.',
    invalidKeyToast: "Geçersiz API Anahtarı! Oyunda 'verify' yazarak geçerli anahtarınızı alın.",
    regenConfirm: 'Eski anahtarınız iptal edilecek. Devam edilsin mi?',
    regenFail: 'Anahtar yenilenemedi.',
    privacyUpdated: 'Gizlilik ayarı güncellendi.',
    privacyUpdateFail: 'Gizlilik güncellenemedi.',

    // Public Chat
    chatHeaderTitle: 'GENEL SOHBET',
    chatVerifiedOnlyText: 'Sadece Onaylı Oyuncular',
    chatLockedTitle: 'Sadece Okuma Modu',
    chatLockedDesc: 'Sohbette konuşmak için Minecraft API Anahtarınızla giriş yapın.',
    chatSignInBtnText: 'Giriş Yap',
    chatInputPlaceholder: 'Mesajınızı yazın...',
    chatEmptyFeed: 'Henüz mesaj yok. İlk mesajı sen yaz!'
  }
};

const STATE = {
  currentUser: {
    username: localStorage.getItem('dnt_username') || null,
    apiKey: localStorage.getItem('dnt_apikey') || null,
    isPublic: false
  },
  viewingUsername: null,
  isOwner: false,
  viewingData: null,
  allTransactions: [],
  filteredTransactions: [],
  timelineChart: null,
  categoryChart: null,
  calculator: {
    expression: '0',
    result: 0,
    isOpen: false
  }
};

// Language Dropdown Control
function toggleLangDropdown(event) {
  if (event) event.stopPropagation();
  const container = document.getElementById('langSelectorContainer');
  if (container) container.classList.toggle('active');
}

window.addEventListener('click', (e) => {
  const container = document.getElementById('langSelectorContainer');
  if (container && !container.contains(e.target)) {
    container.classList.remove('active');
  }
});

function setLanguage(lang) {
  if (!I18N[lang]) return;
  CURRENT_LANG = lang;
  localStorage.setItem('dnt_lang', lang);

  const container = document.getElementById('langSelectorContainer');
  if (container) container.classList.remove('active');

  const flagEl = document.getElementById('currentLangFlag');
  const flagImg = document.getElementById('currentLangFlagImg');
  const codeEl = document.getElementById('currentLangCode');
  if (flagEl) flagEl.textContent = I18N[lang].flag;
  if (flagImg) {
    flagImg.src = lang === 'tr' ? '/assets/flags/tr.svg' : '/assets/flags/us.svg';
    flagImg.alt = lang === 'tr' ? 'Turkey' : 'USA';
  }
  if (codeEl) codeEl.textContent = I18N[lang].code;

  const optEn = document.getElementById('langOptEn');
  const optTr = document.getElementById('langOptTr');
  if (optEn) optEn.classList.toggle('active', lang === 'en');
  if (optTr) optTr.classList.toggle('active', lang === 'tr');

  applyTranslations();

  // Re-render UI components if data is loaded
  if (STATE.viewingData) {
    renderProfileUI(STATE.viewingData, STATE.isOwner);
    filterTransactions();
    renderCharts(STATE.allTransactions);
  } else if (!STATE.currentUser.username) {
    renderUnlinkedGuestState();
  }

  const activeTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');
  if (activeTab === 'leaderboard') {
    fetchLeaderboard();
  }
}

function applyTranslations() {
  const t = I18N[CURRENT_LANG];
  document.documentElement.lang = CURRENT_LANG;

  // Navbar
  const navBrandSubtitle = document.getElementById('navBrandSubtitle');
  if (navBrandSubtitle) navBrandSubtitle.textContent = t.brandSubtitle;
  const globalPlayerSearch = document.getElementById('globalPlayerSearch');
  if (globalPlayerSearch) globalPlayerSearch.placeholder = t.searchPlaceholder;
  const navSearchBtn = document.getElementById('navSearchBtn');
  if (navSearchBtn) navSearchBtn.textContent = t.searchBtn;
  const tabDashboard = document.getElementById('tabLabelDashboard');
  if (tabDashboard) tabDashboard.textContent = t.tabDashboard;
  const tabLeaderboard = document.getElementById('tabLabelLeaderboard');
  if (tabLeaderboard) tabLeaderboard.textContent = t.tabLeaderboard;
  const tabMod = document.getElementById('tabLabelMod');
  if (tabMod) tabMod.textContent = t.tabMod;
  const navUsername = document.getElementById('navUsername');
  if (navUsername && !STATE.currentUser.username) navUsername.textContent = t.signIn;

  // Banner Return Btn
  const bannerReturnBtnText = document.getElementById('bannerReturnBtnText');
  if (bannerReturnBtnText) bannerReturnBtnText.textContent = t.returnToMyProfile;

  // Not Linked Error Card
  const notLinkedInstallBtnText = document.getElementById('notLinkedInstallBtnText');
  if (notLinkedInstallBtnText) notLinkedInstallBtnText.textContent = t.howToInstall;
  const notLinkedBackBtnText = document.getElementById('notLinkedBackBtnText');
  if (notLinkedBackBtnText) notLinkedBackBtnText.textContent = t.backToProfile;

  // Guest Onboarding
  const onboardTitle = document.getElementById('onboardTitle');
  if (onboardTitle) onboardTitle.textContent = t.welcomeTitle;
  const onboardDesc = document.getElementById('onboardDesc');
  if (onboardDesc) onboardDesc.innerHTML = t.welcomeDesc;
  const onboardStep1 = document.getElementById('onboardStep1');
  if (onboardStep1) onboardStep1.innerHTML = t.onboardStep1;
  const onboardStep2 = document.getElementById('onboardStep2');
  if (onboardStep2) onboardStep2.innerHTML = t.onboardStep2;
  const onboardStep3 = document.getElementById('onboardStep3');
  if (onboardStep3) onboardStep3.innerHTML = t.onboardStep3;
  const onboardSignInBtnText = document.getElementById('onboardSignInBtnText');
  if (onboardSignInBtnText) onboardSignInBtnText.textContent = t.verifyAndSignIn;
  const onboardGuideBtnText = document.getElementById('onboardGuideBtnText');
  if (onboardGuideBtnText) onboardGuideBtnText.textContent = t.modGuideBtn;

  // Hero labels
  const heroServerLabel = document.getElementById('heroServerLabel');
  if (heroServerLabel) heroServerLabel.innerHTML = t.serverLabel;
  const heroVisibilityLabel = document.getElementById('heroVisibilityLabel');
  if (heroVisibilityLabel) heroVisibilityLabel.textContent = t.profileVisibility;
  const heroShareBtnText = document.getElementById('heroShareBtnText');
  if (heroShareBtnText) heroShareBtnText.textContent = t.share;

  // Stats Grid labels
  const statLabelBalance = document.getElementById('statLabelBalance');
  if (statLabelBalance) statLabelBalance.textContent = t.totalBalance;
  const statFooterBalance = document.getElementById('statFooterBalance');
  if (statFooterBalance) statFooterBalance.innerHTML = t.liveDonutBal;
  const statLabelIncome = document.getElementById('statLabelIncome');
  if (statLabelIncome) statLabelIncome.textContent = t.totalIncome;
  const statLabelExpense = document.getElementById('statLabelExpense');
  if (statLabelExpense) statLabelExpense.textContent = t.totalExpense;
  const statLabelNetFlow = document.getElementById('statLabelNetFlow');
  if (statLabelNetFlow) statLabelNetFlow.textContent = t.netCashFlow;

  // Charts
  const chartTitleTimeline = document.getElementById('chartTitleTimeline');
  if (chartTitleTimeline) chartTitleTimeline.textContent = t.cashFlowTimeline;
  const chartPillIncome = document.getElementById('chartPillIncome');
  if (chartPillIncome) chartPillIncome.textContent = t.incomeLegend;
  const chartPillExpense = document.getElementById('chartPillExpense');
  if (chartPillExpense) chartPillExpense.textContent = t.expenseLegend;
  const chartTitleCategory = document.getElementById('chartTitleCategory');
  if (chartTitleCategory) chartTitleCategory.textContent = t.categoryBreakdown;
  const chartBadgeCategory = document.getElementById('chartBadgeCategory');
  if (chartBadgeCategory) chartBadgeCategory.textContent = t.autoSyncBadge;

  // Ledger Card
  const ledgerTitle = document.getElementById('ledgerTitle');
  if (ledgerTitle) ledgerTitle.innerHTML = t.ledgerTitle;

  // Refresh Mod Usage Age under avatar if viewing profile
  const heroModAge = document.getElementById('heroModAge');
  if (heroModAge && STATE.viewingData && STATE.viewingData.linkedAt) {
    heroModAge.innerHTML = formatModUsageDuration(STATE.viewingData.linkedAt);
  }

  const txSearchInput = document.getElementById('txSearchInput');
  if (txSearchInput) txSearchInput.placeholder = t.txSearchPlaceholder;
  const optTypeAll = document.getElementById('optTypeAll');
  if (optTypeAll) optTypeAll.textContent = t.filterAllTypes;
  const optTypeIncome = document.getElementById('optTypeIncome');
  if (optTypeIncome) optTypeIncome.textContent = t.filterIncomeOnly;
  const optTypeExpense = document.getElementById('optTypeExpense');
  if (optTypeExpense) optTypeExpense.textContent = t.filterExpenseOnly;
  const optTypeInfo = document.getElementById('optTypeInfo');
  if (optTypeInfo) optTypeInfo.textContent = t.filterInfoOnly;
  const optCatAll = document.getElementById('optCatAll');
  if (optCatAll) optCatAll.textContent = t.filterAllCats;
  const thType = document.getElementById('thType');
  if (thType) thType.textContent = t.thType;
  const thDesc = document.getElementById('thDesc');
  if (thDesc) thDesc.textContent = t.thDesc;
  const thCategory = document.getElementById('thCategory');
  if (thCategory) thCategory.textContent = t.thCategory;
  const thSource = document.getElementById('thSource');
  if (thSource) thSource.textContent = t.thSource;
  const thDate = document.getElementById('thDate');
  if (thDate) thDate.textContent = t.thDate;
  const thAmount = document.getElementById('thAmount');
  if (thAmount) thAmount.textContent = t.thAmount;
  const txEmptyTitle = document.getElementById('txEmptyTitle');
  if (txEmptyTitle) txEmptyTitle.textContent = t.noTxFound;
  const txEmptyDesc = document.getElementById('txEmptyDesc');
  if (txEmptyDesc) txEmptyDesc.textContent = t.noTxDesc;

  // Leaderboard tab
  const leaderboardTitle = document.getElementById('leaderboardTitle');
  if (leaderboardTitle) leaderboardTitle.textContent = t.leaderboardTitle;
  const leaderboardSubtitle = document.getElementById('leaderboardSubtitle');
  if (leaderboardSubtitle) leaderboardSubtitle.innerHTML = t.leaderboardSubtitle;

  // Mod Guide tab
  const guideHeroBadge = document.getElementById('guideHeroBadge');
  if (guideHeroBadge) guideHeroBadge.innerHTML = t.guideHeroBadge;
  const guideHeroTitle = document.getElementById('guideHeroTitle');
  if (guideHeroTitle) guideHeroTitle.textContent = t.guideHeroTitle;
  const guideHeroDesc = document.getElementById('guideHeroDesc');
  if (guideHeroDesc) guideHeroDesc.innerHTML = t.guideHeroDesc;
  const guideStep1Title = document.getElementById('guideStep1Title');
  if (guideStep1Title) guideStep1Title.textContent = t.step1Title;
  const guideStep1Desc = document.getElementById('guideStep1Desc');
  if (guideStep1Desc) guideStep1Desc.innerHTML = t.step1Desc;
  const guideDownloadBtnText = document.getElementById('guideDownloadBtnText');
  if (guideDownloadBtnText) guideDownloadBtnText.textContent = t.downloadModBtn;
  const guideStep2Title = document.getElementById('guideStep2Title');
  if (guideStep2Title) guideStep2Title.textContent = t.step2Title;
  const guideStep2Desc = document.getElementById('guideStep2Desc');
  if (guideStep2Desc) guideStep2Desc.innerHTML = t.step2Desc;
  const guideStep2Subtext = document.getElementById('guideStep2Subtext');
  if (guideStep2Subtext) guideStep2Subtext.textContent = t.step2Subtext;
  const guideStep3Title = document.getElementById('guideStep3Title');
  if (guideStep3Title) guideStep3Title.textContent = t.step3Title;
  const guideStep3Desc = document.getElementById('guideStep3Desc');
  if (guideStep3Desc) guideStep3Desc.innerHTML = t.step3Desc;
  const guideStep3BadgeText = document.getElementById('guideStep3BadgeText');
  if (guideStep3BadgeText) guideStep3BadgeText.textContent = t.step3Badge;
  const guideServerIpLabel = document.getElementById('guideServerIpLabel');
  if (guideServerIpLabel) guideServerIpLabel.textContent = t.serverIpLabel;
  const guideModVersionLabel = document.getElementById('guideModVersionLabel');
  if (guideModVersionLabel) guideModVersionLabel.textContent = t.modVersionLabel;

  // Calculator
  const calcTitleText = document.getElementById('calcTitleText');
  if (calcTitleText) calcTitleText.textContent = t.calcTitle;
  const calcCloseBtn = document.getElementById('calcCloseBtn');
  if (calcCloseBtn) calcCloseBtn.title = t.calcClose;

  // Login Modal
  const loginModalTitle = document.getElementById('loginModalTitle');
  if (loginModalTitle) loginModalTitle.innerHTML = t.loginModalTitle;
  const loginModalDesc = document.getElementById('loginModalDesc');
  if (loginModalDesc) loginModalDesc.innerHTML = t.loginModalDesc;
  const loginUserLabel = document.getElementById('loginUserLabel');
  if (loginUserLabel) loginUserLabel.textContent = t.loginUserLabel;
  const loginUsernameInput = document.getElementById('loginUsernameInput');
  if (loginUsernameInput) loginUsernameInput.placeholder = t.loginUserPlaceholder;
  const loginKeyLabel = document.getElementById('loginKeyLabel');
  if (loginKeyLabel) loginKeyLabel.textContent = t.loginKeyLabel;
  const loginKeyHint = document.getElementById('loginKeyHint');
  if (loginKeyHint) loginKeyHint.innerHTML = t.loginKeyHint;
  const loginCancelBtn = document.getElementById('loginCancelBtn');
  if (loginCancelBtn) loginCancelBtn.textContent = t.loginCancel;
  const loginSubmitBtnText = document.getElementById('loginSubmitBtnText');
  if (loginSubmitBtnText) loginSubmitBtnText.textContent = t.loginSubmit;

  // API Key Modal
  const apiKeyModalTitle = document.getElementById('apiKeyModalTitle');
  if (apiKeyModalTitle) apiKeyModalTitle.innerHTML = t.apiKeyModalTitle;
  const apiKeyModalDesc = document.getElementById('apiKeyModalDesc');
  if (apiKeyModalDesc) apiKeyModalDesc.textContent = t.apiKeyModalDesc;
  const copyKeyBtnText = document.getElementById('copyKeyBtnText');
  if (copyKeyBtnText) copyKeyBtnText.textContent = t.copyKeyBtn;
  const regenKeyBtnText = document.getElementById('regenKeyBtnText');
  if (regenKeyBtnText) regenKeyBtnText.textContent = t.regenKeyBtn;
  const closeKeyModalBtn = document.getElementById('closeKeyModalBtn');
  if (closeKeyModalBtn) closeKeyModalBtn.textContent = t.closeModalBtn;

  // User Menu Modal
  const userMenuTitle = document.getElementById('userMenuTitle');
  if (userMenuTitle) userMenuTitle.innerHTML = t.userMenuTitle;
  const mcVerifiedBadgeText = document.getElementById('mcVerifiedBadgeText');
  if (mcVerifiedBadgeText) mcVerifiedBadgeText.textContent = t.mcVerifiedBadge;
  const userMenuShowKeyBtnText = document.getElementById('userMenuShowKeyBtnText');
  if (userMenuShowKeyBtnText) userMenuShowKeyBtnText.textContent = t.showApiKeyBtn;
  const userMenuGoProfileBtnText = document.getElementById('userMenuGoProfileBtnText');
  if (userMenuGoProfileBtnText) userMenuGoProfileBtnText.textContent = t.goToProfileBtn;
  const userMenuSignOutBtnText = document.getElementById('userMenuSignOutBtnText');
  if (userMenuSignOutBtnText) userMenuSignOutBtnText.textContent = t.signOutBtn;
  const themePickerTitle = document.getElementById('themePickerTitle');
  if (themePickerTitle) themePickerTitle.textContent = CURRENT_LANG === 'tr' ? 'Özel Renk Teması' : 'Custom Theme';
  updateThemeChipsUi();

  // Public Chat Drawer Text
  const chatHeaderTitle = document.getElementById('chatHeaderTitle');
  if (chatHeaderTitle) chatHeaderTitle.textContent = t.chatHeaderTitle;
  const chatVerifiedOnlyText = document.getElementById('chatVerifiedOnlyText');
  if (chatVerifiedOnlyText) chatVerifiedOnlyText.textContent = t.chatVerifiedOnlyText;
  const chatLockedTitle = document.getElementById('chatLockedTitle');
  if (chatLockedTitle) chatLockedTitle.textContent = t.chatLockedTitle;
  const chatLockedDesc = document.getElementById('chatLockedDesc');
  if (chatLockedDesc) chatLockedDesc.textContent = t.chatLockedDesc;
  const chatSignInBtnText = document.getElementById('chatSignInBtnText');
  if (chatSignInBtnText) chatSignInBtnText.textContent = t.chatSignInBtnText;
  const chatInputMessage = document.getElementById('chatInputMessage');
  if (chatInputMessage) chatInputMessage.placeholder = t.chatInputPlaceholder;
}

// Formatting helpers
function formatMoney(amount) {
  const num = Number(amount || 0);
  if (Math.abs(num) >= 1_000_000_000) {
    return '$' + (num / 1_000_000_000).toFixed(2) + 'B';
  }
  if (Math.abs(num) >= 1_000_000) {
    return '$' + (num / 1_000_000).toFixed(2) + 'M';
  }
  return '$' + num.toLocaleString('en-US');
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const locale = CURRENT_LANG === 'tr' ? 'tr-TR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatModUsageDuration(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `<i class="fa-solid fa-cube"></i> Since ${day}.${month}.${year}`;
}

function getAvatarUrl(username, size = 64) {
  const clean = encodeURIComponent((username || 'MHF_Steve').trim());
  return `/api/avatar/${clean}?size=${size}`;
}

function formatTransactionDescription(desc) {
  if (!desc) return CURRENT_LANG === 'tr' ? 'İşlem' : 'Transaction';
  if (CURRENT_LANG === 'tr') {
    return desc
      .replace(/Payment sent to (.+) \(\/pay\)/gi, '$1 adlı oyuncuya ödeme gönderildi (/pay)')
      .replace(/Payment received from (.+) \(\/pay\)/gi, '$1 adlı oyuncudan ödeme alındı (/pay)')
      .replace(/Purchased (.+) on Auction House/gi, 'Auction House üzerinden $1 satın alındı')
      .replace(/Sold (.+) to (.+)/gi, '$1 satıldı ($2)')
      .replace(/Sold (.+) on Auction House/gi, 'Auction House üzerinden $1 satıldı')
      .replace(/Claimed auction revenue \(\/ah claim\)/gi, 'Açık artırma geliri toplandı (/ah claim)')
      .replace(/Listed item on Auction House: (.+)/gi, 'Açık artırmaya ürün listelendi: $1')
      .replace(/Server shop sell \(\/sell\)/gi, 'Sunucu marketine ürün satışı (/sell)')
      .replace(/Sold (.+) to server shop:? (.+) \(\/sell\)/gi, 'Sunucu marketine satış yapıldı: $1 (/sell)')
      .replace(/Purchased from server shop: (.+) \(\/shop\)/gi, 'Sunucu marketinden ürün satın alındı: $1 (/shop)')
      .replace(/Order delivered: (.+)/gi, 'Sipariş teslim edildi: $1')
      .replace(/(.+) delivered your order: (.+)/gi, '$1 siparişinizi teslim etti: $2')
      .replace(/Order completed: (.+)/gi, 'Sipariş tamamlandı: $1')
      .replace(/Order cancelled: (.+)/gi, 'Sipariş iptal edildi: $1')
      .replace(/Order created: (.+)/gi, 'Sipariş oluşturuldu: $1')
      .replace(/Order completed successfully \(\/orders\)/gi, 'Sipariş görevi başarıyla tamamlandı (/orders)')
      .replace(/Order delivery reward received \(\/orders\)/gi, 'Sipariş teslimat ödülü alındı (/orders)');
  } else {
    return desc
      .replace(/(.+) adlı oyuncuya ödeme gönderildi \(\/pay\)/gi, 'Payment sent to $1 (/pay)')
      .replace(/(.+) adlı oyuncudan ödeme alındı \(\/pay\)/gi, 'Payment received from $1 (/pay)')
      .replace(/Auction House üzerinden (.+) satın alındı/gi, 'Purchased $1 on Auction House')
      .replace(/(.+) satıldı \((.+)\)/gi, 'Sold $1 to $2')
      .replace(/Auction House üzerinden (.+) satıldı/gi, 'Sold $1 on Auction House')
      .replace(/Açık artırma geliri toplandı \(\/ah claim\)/gi, 'Claimed auction revenue (/ah claim)')
      .replace(/Açık artırmaya ürün listelendi: (.+)/gi, 'Listed item on Auction House: $1')
      .replace(/Sunucu marketine ürün satışı \(\/sell\)/gi, 'Server shop sell (/sell)')
      .replace(/Sunucu marketine satış yapıldı: (.+) \(\/sell\)/gi, 'Sold $1 to server shop (/sell)')
      .replace(/Sunucu marketinden ürün satın alındı: (.+) \(\/shop\)/gi, 'Purchased from server shop: $1 (/shop)')
      .replace(/Sipariş teslim edildi: (.+)/gi, 'Order delivered: $1')
      .replace(/(.+) siparişinizi teslim etti: (.+)/gi, '$1 delivered your order: $2')
      .replace(/Sipariş tamamlandı: (.+)/gi, 'Order completed: $1')
      .replace(/Sipariş iptal edildi: (.+)/gi, 'Order cancelled: $1')
      .replace(/Sipariş oluşturuldu: (.+)/gi, 'Order created: $1')
      .replace(/Sipariş görevi başarıyla tamamlandı \(\/orders\)/gi, 'Order completed successfully (/orders)')
      .replace(/Sipariş teslimat ödülü alındı \(\/orders\)/gi, 'Order delivery reward received (/orders)');
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-circle-check text-emerald';
  if (type === 'error') icon = 'fa-triangle-exclamation text-crimson';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Navigation between Tabs
function navigateTo(tabName) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === `tab-${tabName}`);
  });

  // Persist active tab across refreshes
  sessionStorage.setItem('dnt_active_tab', tabName);
  try {
    const url = new URL(window.location);
    if (tabName === 'dashboard' && STATE.viewingUsername) {
      url.searchParams.set('player', STATE.viewingUsername);
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tabName);
      if (tabName !== 'dashboard') {
        url.searchParams.delete('player');
      }
    }
    window.history.replaceState({}, '', url.toString());
  } catch (e) {}

  if (tabName === 'leaderboard') {
    fetchLeaderboard();
  } else if (tabName === 'dashboard') {
    if (!STATE.viewingUsername) {
      if (STATE.currentUser.username) {
        loadPlayerProfile(STATE.currentUser.username);
      } else {
        renderUnlinkedGuestState();
      }
    }
  }
}

// Global Navbar Search
function searchPlayerGlobal() {
  const input = document.getElementById('globalPlayerSearch');
  const target = (input?.value || '').trim();
  if (!target) return;

  navigateTo('dashboard');
  loadPlayerProfile(target);
}

// Fetch Profile
async function loadPlayerProfile(username) {
  if (!username) {
    renderUnlinkedGuestState();
    return;
  }

  hideNotLinkedCard();

  try {
    const isOwner = STATE.currentUser.username && 
                    username.toLowerCase() === STATE.currentUser.username.toLowerCase();
    
    STATE.viewingUsername = username;
    STATE.isOwner = isOwner;

    const headers = {};
    if (isOwner && STATE.currentUser.apiKey) {
      headers['x-api-key'] = STATE.currentUser.apiKey;
    }

    const res = await fetch(`/api/player/${encodeURIComponent(username)}`, { headers });
    const data = await res.json();

    if (!res.ok) {
      if (data.code === 'NOT_LINKED') {
        showNotLinkedCard(username, data.message);
        return;
      }
      if (data.isPrivate) {
        renderPrivateProfileUI(username);
        return;
      }
      throw new Error(data.message || (CURRENT_LANG === 'tr' ? "Oyuncu profili yüklenemedi." : "Failed to load player profile."));
    }

    STATE.viewingData = data.player;
    STATE.allTransactions = data.player.transactions || [];
    
    if (isOwner && data.player.apiKey) {
      STATE.currentUser.apiKey = data.player.apiKey;
      localStorage.setItem('dnt_apikey', data.player.apiKey);
    }

    renderProfileUI(data.player, isOwner);
    filterTransactions();
    renderCharts(STATE.allTransactions);

  } catch (err) {
    console.error(err);
    showToast(err.message, "error");
  }
}

function showNotLinkedCard(username, customMsg) {
  const t = I18N[CURRENT_LANG];
  const notLinkedCard = document.getElementById('notLinkedCard');
  const notLinkedTitle = document.getElementById('notLinkedTitle');
  const notLinkedMsg = document.getElementById('notLinkedMessage');

  notLinkedTitle.textContent = t.playerNotFound(username);
  notLinkedMsg.textContent = customMsg || t.playerNotFoundDesc(username);
  notLinkedCard.style.display = 'flex';

  document.getElementById('playerHeroCard').style.display = 'none';
  document.getElementById('statsGrid').style.display = 'none';
  document.getElementById('chartsRow').style.display = 'none';
  document.getElementById('ledgerCard').style.display = 'none';
  document.getElementById('unlinkedOnboarding').style.display = 'none';
}

function hideNotLinkedCard() {
  const notLinkedCard = document.getElementById('notLinkedCard');
  if (notLinkedCard) notLinkedCard.style.display = 'none';

  document.getElementById('playerHeroCard').style.display = 'flex';
  document.getElementById('statsGrid').style.display = 'grid';
  document.getElementById('chartsRow').style.display = 'grid';
  document.getElementById('ledgerCard').style.display = 'block';
}

function renderUnlinkedGuestState() {
  const t = I18N[CURRENT_LANG];
  hideNotLinkedCard();
  document.getElementById('unlinkedOnboarding').style.display = 'flex';
  document.getElementById('viewBanner').style.display = 'none';
  document.getElementById('ownerActions').style.display = 'none';

  document.getElementById('navUsername').textContent = t.signIn;
  document.getElementById('navAvatar').src = getAvatarUrl('MHF_Steve', 36);

  document.getElementById('heroUsername').textContent = t.notLinked;
  const heroDescEl = document.getElementById('heroDesc');
  if (heroDescEl) heroDescEl.textContent = CURRENT_LANG === 'tr' ? 'İstemci modu henüz bağlanmadı. Oyunda /verify yazarak hesabınızı eşleyin.' : 'Client mod not linked yet. Type /verify in-game to pair your account.';
  const heroJoinDateEl = document.getElementById('heroJoinDate');
  if (heroJoinDateEl) heroJoinDateEl.textContent = CURRENT_LANG === 'tr' ? 'Bekleniyor' : 'Pending';

  document.getElementById('privacyBadge').className = 'badge badge-private';
  document.getElementById('privacyBadge').innerHTML = `<i class="fa-solid fa-lock"></i> ${t.notLinked}`;

  document.getElementById('statBalance').textContent = '$0';
  document.getElementById('statIncome').textContent = '+$0';
  document.getElementById('statExpense').textContent = '-$0';
  document.getElementById('statNetFlow').textContent = '$0';

  const onlineDotGuest = document.getElementById('heroOnlineIndicator');
  if (onlineDotGuest) onlineDotGuest.style.display = 'none';

  const heroBadgesRow = document.getElementById('heroBadgesRow');
  if (heroBadgesRow) heroBadgesRow.innerHTML = '';

  document.getElementById('txTableBody').innerHTML = '';
  document.getElementById('txEmptyState').style.display = 'block';
  document.getElementById('txEmptyTitle').textContent = CURRENT_LANG === 'tr' ? 'Henüz Veri Yok' : 'No Data Yet';
  document.getElementById('txEmptyDesc').textContent = CURRENT_LANG === 'tr' ? 'donutsmp.net sunucusunda /verify yazarak hesabınızı bağlayın.' : 'Connect your account by typing /verify in-game on donutsmp.net.';

  renderCharts([]);
}

function renderPrivateProfileUI(username) {
  const t = I18N[CURRENT_LANG];
  hideNotLinkedCard();
  document.getElementById('unlinkedOnboarding').style.display = 'none';
  document.getElementById('viewBanner').style.display = 'flex';
  
  const verifyBtnText = CURRENT_LANG === 'tr' ? 'Doğrula & Aç' : 'Verify & Unlock';
  const privateBannerDesc = CURRENT_LANG === 'tr'
    ? `<strong>${username}</strong> adlı oyuncunun profili gizlidir. Yalnızca eşsiz API Anahtarına sahip hesap sahibi bu defteri görebilir.`
    : `<strong>${username}</strong>'s profile is private. Only the account owner with the secret API Key can view this ledger.`;

  document.getElementById('bannerText').innerHTML = `
    ${privateBannerDesc}
    <button class="btn btn-sm btn-primary" style="margin-left:12px; padding:4px 12px; font-size:12px;" onclick="openLoginModalFor('${username}')">
      <i class="fa-solid fa-key"></i> ${verifyBtnText}
    </button>
  `;

  document.getElementById('heroUsername').textContent = username;
  document.getElementById('heroAvatar').src = getAvatarUrl(username, 120);
  const heroModAgePrivate = document.getElementById('heroModAge');
  if (heroModAgePrivate) heroModAgePrivate.style.display = 'none';
  const heroDescEl = document.getElementById('heroDesc');
  if (heroDescEl) heroDescEl.textContent = CURRENT_LANG === 'tr' ? 'Bu profil gizlidir. Görüntülemek için API Anahtarı ile doğrulayınız.' : 'This profile is private. Verify with your API Key to view.';
  const heroJoinDateEl = document.getElementById('heroJoinDate');
  if (heroJoinDateEl) heroJoinDateEl.textContent = t.privateBadge;

  const onlineDotPrivate = document.getElementById('heroOnlineIndicator');
  if (onlineDotPrivate) onlineDotPrivate.style.display = 'none';

  const heroBadgesRow = document.getElementById('heroBadgesRow');
  if (heroBadgesRow) heroBadgesRow.innerHTML = '';

  document.getElementById('privacyBadge').className = 'badge badge-private';
  document.getElementById('privacyBadge').innerHTML = `<i class="fa-solid fa-lock"></i> ${t.privateBadge}`;

  document.getElementById('ownerActions').style.display = 'none';
  document.getElementById('statBalance').textContent = t.privateBadge;
  document.getElementById('statIncome').textContent = t.privateBadge;
  document.getElementById('statExpense').textContent = t.privateBadge;
  document.getElementById('statNetFlow').textContent = t.privateBadge;

  document.getElementById('txTableBody').innerHTML = '';
  document.getElementById('txEmptyState').style.display = 'block';
  document.getElementById('txEmptyTitle').textContent = CURRENT_LANG === 'tr' ? 'Veriler Gizli' : 'Data Private';
  document.getElementById('txEmptyDesc').textContent = CURRENT_LANG === 'tr' ? 'Bu oyuncu finansal hareketlerini yalnızca kendine açık tutuyor.' : 'This player keeps their financial transactions private.';

  renderCharts([]);
}

function renderProfileUI(player, isOwner) {
  const t = I18N[CURRENT_LANG];
  document.getElementById('unlinkedOnboarding').style.display = 'none';

  // Update Header Pill
  if (STATE.currentUser.username) {
    document.getElementById('navUsername').textContent = STATE.currentUser.username;
    document.getElementById('navAvatar').src = getAvatarUrl(STATE.currentUser.username, 36);
  } else {
    document.getElementById('navUsername').textContent = t.signIn;
    document.getElementById('navAvatar').src = getAvatarUrl('MHF_Steve', 36);
  }

  // Update Hero
  document.getElementById('heroUsername').textContent = player.username;
  document.getElementById('heroAvatar').src = getAvatarUrl(player.username, 120);

  // Update Mod Usage Age below Avatar
  const heroModAge = document.getElementById('heroModAge');
  if (heroModAge) {
    if (player.linkedAt) {
      heroModAge.innerHTML = formatModUsageDuration(player.linkedAt);
      heroModAge.style.display = 'block';
    } else {
      heroModAge.style.display = 'none';
    }
  }

  const heroBadgesRow = document.getElementById('heroBadgesRow');
  if (heroBadgesRow) {
    const verifiedHtml = player.isLinked
      ? `<span class="wealth-badge badge-special" title="${CURRENT_LANG === 'tr' ? 'Onaylı Oyuncu' : 'Verified Player'}"><i class="fa-solid fa-circle-check"></i> ${CURRENT_LANG === 'tr' ? 'Doğrulandı' : 'Verified'}</span>`
      : '';
    heroBadgesRow.innerHTML = `${getWealthBadge(player.balance).html} ${verifiedHtml}`;
  }

  const heroDescEl = document.getElementById('heroDesc');
  if (heroDescEl) heroDescEl.textContent = CURRENT_LANG === 'tr' ? 'Donut SMP Finans Defteri & Canlı İstemci Mod Senkronizasyonu' : 'Donut SMP Financial Ledger & Real-Time Client Mod Sync';
  const heroJoinDateEl = document.getElementById('heroJoinDate');
  if (heroJoinDateEl) heroJoinDateEl.textContent = formatDate(player.linkedAt);

  // Online indicator
  const onlineDot = document.getElementById('heroOnlineIndicator');
  if (onlineDot) {
    if (player.isOnline) {
      onlineDot.style.display = 'block';
      onlineDot.title = t.syncActiveOnline;
    } else {
      onlineDot.style.display = 'none';
    }
  }

  // Banner handling
  const banner = document.getElementById('viewBanner');
  if (isOwner) {
    banner.style.display = 'none';
    document.getElementById('ownerActions').style.display = 'flex';
  } else {
    banner.style.display = 'flex';
    document.getElementById('bannerText').innerHTML = CURRENT_LANG === 'tr'
      ? `Şu an <strong>${player.username}</strong> adlı oyuncunun herkese açık profilini inceliyorsunuz.`
      : `You are currently viewing <strong>${player.username}</strong>'s public ledger.`;
    document.getElementById('ownerActions').style.display = 'none';
  }

  // Privacy Badge & Checkbox
  const privBadge = document.getElementById('privacyBadge');
  const privCheckbox = document.getElementById('privacyCheckbox');
  const privSubText = document.getElementById('privacySubText');

  if (player.isPublic) {
    privBadge.className = 'badge badge-public';
    privBadge.innerHTML = `<i class="fa-solid fa-lock-open"></i> ${t.publicBadge}`;
    if (privCheckbox) privCheckbox.checked = true;
    if (privSubText) privSubText.textContent = t.visibleToAll;
  } else {
    privBadge.className = 'badge badge-private';
    privBadge.innerHTML = `<i class="fa-solid fa-lock"></i> ${t.privateBadge}`;
    if (privCheckbox) privCheckbox.checked = false;
    if (privSubText) privSubText.textContent = t.visibleToYou;
  }

  // Stats
  document.getElementById('statBalance').textContent = formatMoney(player.balance || 0);
  document.getElementById('statIncome').textContent = '+' + formatMoney(player.stats?.totalIncome || 0);
  document.getElementById('statExpense').textContent = '-' + formatMoney(player.stats?.totalExpense || 0);

  const netFlow = player.stats?.netCashflow || 0;
  const netEl = document.getElementById('statNetFlow');
  const netFooter = document.getElementById('statNetFlowFooter');
  if (netFlow >= 0) {
    netEl.className = 'stat-value text-emerald';
    netEl.textContent = '+' + formatMoney(netFlow);
    netFooter.innerHTML = `<span class="text-emerald">${t.netProfit}</span>`;
  } else {
    netEl.className = 'stat-value text-crimson';
    netEl.textContent = formatMoney(netFlow);
    netFooter.innerHTML = `<span class="text-crimson">${t.netLoss}</span>`;
  }
}

// Toggle Privacy
async function togglePrivacy(isPublic) {
  const t = I18N[CURRENT_LANG];
  if (!STATE.isOwner) return;

  try {
    const res = await fetch('/api/player/privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: STATE.currentUser.username,
        apiKey: STATE.currentUser.apiKey,
        isPublic
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(t.privacyUpdated, 'success');
      loadPlayerProfile(STATE.currentUser.username);
    } else {
      showToast(data.message || t.privacyUpdateFail, 'error');
    }
  } catch (err) {
    showToast(t.privacyUpdateFail, "error");
  }
}

// Return to own profile
function returnToMyProfile() {
  closeUserMenuModal();
  window.history.pushState({}, '', '/');
  navigateTo('dashboard');
  const myUser = STATE.currentUser.username || localStorage.getItem('dnt_username');
  if (myUser) {
    loadPlayerProfile(myUser);
  } else {
    renderUnlinkedGuestState();
  }
}

// Share profile link
function copyShareLink() {
  const t = I18N[CURRENT_LANG];
  if (!STATE.viewingUsername) return;
  const url = `${window.location.origin}/?player=${encodeURIComponent(STATE.viewingUsername)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast(t.linkCopiedToast, "success");
  });
}

// Filter and Render Transaction Table
function filterTransactions() {
  const query = (document.getElementById('txSearchInput')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('txTypeFilter')?.value || 'all';
  const catFilter = document.getElementById('txCategoryFilter')?.value || 'all';

  STATE.filteredTransactions = STATE.allTransactions.filter(tx => {
    const desc = (tx.description || '').toLowerCase();
    const cat = (tx.category || '').toLowerCase();
    const matchesQuery = desc.includes(query) || cat.includes(query);
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCat = catFilter === 'all' || tx.category === catFilter;
    return matchesQuery && matchesType && matchesCat;
  });

  renderTransactionTable(STATE.filteredTransactions);
}

function renderTransactionTable(transactions) {
  const tbody = document.getElementById('txTableBody');
  const emptyState = document.getElementById('txEmptyState');

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  tbody.innerHTML = transactions.map(tx => {
    const isIncome = tx.type === 'income';
    const isInfo = tx.type === 'info';
    const descLower = (tx.description || '').toLowerCase();
    const isOrder = tx.category === 'Orders System' || descLower.includes('order') || descLower.includes('sipariş');
    
    let typeBadgeClass;
    let typeIcon;
    let sign;
    let amountClass;
    let amountDisplay;

    if (isOrder) {
      if (isIncome) {
        typeBadgeClass = 'order-income';
        typeIcon = 'fa-truck-ramp-box';
        sign = '+';
        amountClass = 'text-emerald';
        amountDisplay = sign + formatMoney(tx.amount);
      } else if (tx.type === 'expense' && tx.amount > 0) {
        typeBadgeClass = 'order-expense';
        typeIcon = 'fa-box';
        sign = '-';
        amountClass = 'text-crimson';
        amountDisplay = sign + formatMoney(tx.amount);
      } else {
        typeBadgeClass = 'order-info';
        typeIcon = 'fa-boxes-stacked';
        sign = '';
        amountClass = 'text-cyan';
        amountDisplay = (tx.amount && tx.amount > 0) ? formatMoney(tx.amount) : '<span class="text-muted">—</span>';
      }
    } else if (isInfo) {
      typeBadgeClass = 'info';
      typeIcon = 'fa-circle-info';
      sign = '';
      amountClass = 'text-cyan';
      amountDisplay = (tx.amount && tx.amount > 0) ? formatMoney(tx.amount) : '<span class="text-muted">—</span>';
    } else if (isIncome) {
      typeBadgeClass = 'income';
      typeIcon = 'fa-arrow-up';
      sign = '+';
      amountClass = 'text-emerald';
      amountDisplay = sign + formatMoney(tx.amount);
    } else {
      typeBadgeClass = 'expense';
      typeIcon = 'fa-arrow-down';
      sign = '-';
      amountClass = 'text-crimson';
      amountDisplay = sign + formatMoney(tx.amount);
    }

    const sourceLabel = CURRENT_LANG === 'tr' 
      ? '<span class="source-tag plugin"><i class="fa-solid fa-cube"></i> Mod Kaydı</span>'
      : '<span class="source-tag plugin"><i class="fa-solid fa-cube"></i> Mod Sync</span>';
    const localizedDesc = formatTransactionDescription(tx.description);

    return `
      <tr>
        <td>
          <div class="tx-badge-type ${typeBadgeClass}">
            <i class="fa-solid ${typeIcon}"></i>
          </div>
        </td>
        <td>
          <strong>${escapeHtml(localizedDesc)}</strong>
        </td>
        <td>
          <span class="category-tag">${escapeHtml(tx.category || 'Donut SMP')}</span>
        </td>
        <td>${sourceLabel}</td>
        <td class="text-muted">${formatDate(tx.timestamp)}</td>
        <td class="text-right tx-amount ${amountClass}">${amountDisplay}</td>
      </tr>
    `;
  }).join('');
}

// Chart.js Rendering
function renderCharts(transactions) {
  renderTimelineChart(transactions);
  renderCategoryChart(transactions);
}

function renderTimelineChart(transactions) {
  const t = I18N[CURRENT_LANG];
  const ctx = document.getElementById('timelineChart')?.getContext('2d');
  if (!ctx) return;

  if (STATE.timelineChart) {
    STATE.timelineChart.destroy();
  }

  if (!transactions || transactions.length === 0) {
    STATE.timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [t.noChartData],
        datasets: [{ label: t.cardBalance, data: [0], borderColor: '#64748b', borderWidth: 1 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } }
        }
      }
    });
    return;
  }

  const locale = CURRENT_LANG === 'tr' ? 'tr-TR' : 'en-US';
  const sorted = [...transactions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const labels = sorted.map(tx => new Date(tx.timestamp).toLocaleDateString(locale, { month: 'short', day: 'numeric' }));
  
  let incomeAccum = 0;
  let expenseAccum = 0;
  const incomeData = [];
  const expenseData = [];

  sorted.forEach(tx => {
    if (tx.type === 'income') incomeAccum += Number(tx.amount);
    if (tx.type === 'expense') expenseAccum += Number(tx.amount);
    incomeData.push(incomeAccum);
    expenseData.push(expenseAccum);
  });

  STATE.timelineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: t.totalIncome,
          data: incomeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#10b981'
        },
        {
          label: t.totalExpense,
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94a3b8',
            callback: value => '$' + (value >= 1_000_000 ? (value / 1_000_000) + 'M' : value.toLocaleString())
          }
        }
      }
    }
  });
}

function renderCategoryChart(transactions) {
  const t = I18N[CURRENT_LANG];
  const ctx = document.getElementById('categoryChart')?.getContext('2d');
  if (!ctx) return;

  if (STATE.categoryChart) {
    STATE.categoryChart.destroy();
  }

  const categoryTotals = {};
  (transactions || []).forEach(tx => {
    const cat = tx.category || 'Donut SMP';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(tx.amount || 0);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const colors = [
    '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', 
    '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'
  ];

  STATE.categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length > 0 ? labels : [t.noChartData],
      datasets: [{
        data: data.length > 0 ? data : [1],
        backgroundColor: labels.length > 0 ? colors.slice(0, labels.length) : ['rgba(255,255,255,0.05)'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#cbd5e1',
            boxWidth: 12,
            font: { size: 11, family: 'Plus Jakarta Sans' }
          }
        }
      },
      cutout: '72%'
    }
  });
}

// Leaderboard Fetch
async function fetchLeaderboard() {
  const t = I18N[CURRENT_LANG];
  const container = document.getElementById('leaderboardList');
  container.innerHTML = `<div style="color: #94a3b8; padding: 2rem;">${t.loadingLeaderboard}</div>`;

  try {
    const res = await fetch('/api/stats/leaderboard');
    const data = await res.json();

    if (!data.success || !data.leaderboard || data.leaderboard.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem;">
          <i class="fa-solid fa-plug-circle-exclamation fa-2x text-muted"></i>
          <h4 style="color: #f8fafc; margin-top: 1rem;">${t.noPublicPlayersTitle}</h4>
          <p style="color: #94a3b8; max-width: 500px; margin: 0.5rem auto;">
            ${t.noPublicPlayersDesc}
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.leaderboard.map((p, idx) => {
      let rankClass = 'rank-other';
      if (idx === 0) rankClass = 'rank-1';
      else if (idx === 1) rankClass = 'rank-2';
      else if (idx === 2) rankClass = 'rank-3';

      return `
        <div class="player-card">
          <div class="rank-badge ${rankClass}">#${idx + 1}</div>
          <div class="player-card-header">
            <img class="player-card-avatar" src="${getAvatarUrl(p.username, 64)}" alt="${escapeHtml(p.username)}" onerror="this.onerror=null; this.src='https://mineskin.eu/helm/' + encodeURIComponent('${p.username}') + '/64.png';">
            <div class="player-card-info">
              <h4>${escapeHtml(p.username)}</h4>
              <div style="margin: 4px 0 6px 0;">${getWealthBadge(p.balance).html}</div>
              <p><i class="fa-solid fa-lock-open text-emerald"></i> ${t.publicBadge}</p>
            </div>
          </div>
          <div class="player-card-stats">
            <div class="card-mini-stat">
              <span>${t.cardBalance}</span>
              <strong class="text-emerald">${formatMoney(p.balance)}</strong>
            </div>
            <div class="card-mini-stat">
              <span>${t.cardIncome}</span>
              <strong>${formatMoney(p.totalIncome)}</strong>
            </div>
          </div>
          <button class="btn btn-sm btn-outline" onclick="inspectPlayer('${p.username}')">
            <i class="fa-solid fa-eye"></i> ${t.cardInspect}
          </button>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="empty-state">${CURRENT_LANG === 'tr' ? 'Sıralama yüklenemedi.' : 'Failed to load leaderboard.'}</div>`;
  }
}

function inspectPlayer(username) {
  window.history.pushState({}, '', `/?player=${encodeURIComponent(username)}`);
  navigateTo('dashboard');
  loadPlayerProfile(username);
}

// Modal Handlers
function openLoginModal() {
  document.getElementById('loginUsernameInput').value = STATE.currentUser.username || '';
  document.getElementById('loginApiKeyInput').value = STATE.currentUser.apiKey || '';
  document.getElementById('loginModal').classList.add('active');
}
function openLoginModalFor(username) {
  document.getElementById('loginUsernameInput').value = username || '';
  document.getElementById('loginApiKeyInput').value = '';
  openLoginModal();
  document.getElementById('loginApiKeyInput').focus();
}
function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('active');
}
function toggleLoginKeyVisibility() {
  const input = document.getElementById('loginApiKeyInput');
  const btn = document.getElementById('loginKeyEyeBtn');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  }
}

// STRICT LOGIN
async function submitLogin() {
  const t = I18N[CURRENT_LANG];
  const usernameInput = document.getElementById('loginUsernameInput');
  const apiKeyInput = document.getElementById('loginApiKeyInput');

  let username = (usernameInput ? usernameInput.value : '').trim();
  let apiKey = (apiKeyInput ? apiKeyInput.value : '').trim();

  apiKey = apiKey.replace(/§[0-9a-fk-or]/gi, '').replace(/^["'`]+|["'`]+$/g, '').trim();
  const match = apiKey.match(/dnt_sec_[a-zA-Z0-9_]+/);
  if (match) {
    apiKey = match[0];
  }
  if (apiKeyInput) apiKeyInput.value = apiKey;

  if (!username) {
    showToast(t.enterUsernameToast, "error");
    if (usernameInput) usernameInput.focus();
    return;
  }

  if (!apiKey) {
    showToast(t.keyRequiredToast, "error");
    if (apiKeyInput) apiKeyInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/player/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, apiKey })
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.code === 'NOT_LINKED') {
        showToast(t.notLinkedToast, "error");
        return;
      }
      if (data.code === 'INVALID_KEY') {
        showToast(t.invalidKeyToast, "error");
        return;
      }
      throw new Error(data.message || (CURRENT_LANG === 'tr' ? "Giriş başarısız." : "Sign in failed."));
    }

    STATE.currentUser.username = data.player.username;
    STATE.currentUser.apiKey = data.player.apiKey;
    localStorage.setItem('dnt_username', data.player.username);
    localStorage.setItem('dnt_apikey', data.player.apiKey);
    
    closeLoginModal();
    updateChatAuthUi();
    showToast(t.signedInToast(data.player.username), 'success');
    window.history.pushState({}, '', '/');
    loadPlayerProfile(data.player.username);

  } catch (err) {
    showToast(err.message, "error");
  }
}

// API Key Modal
let apiKeyRevealTimer = null;

function openApiKeyModal() {
  const t = I18N[CURRENT_LANG];
  if (!STATE.currentUser.apiKey) {
    showToast(t.linkFirstToast, "error");
    return;
  }
  const input = document.getElementById('modalApiKeyValue');
  const btn = document.getElementById('toggleKeyVisibilityBtn');
  input.value = STATE.currentUser.apiKey;
  input.type = 'password';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  if (apiKeyRevealTimer) {
    clearTimeout(apiKeyRevealTimer);
    apiKeyRevealTimer = null;
  }
  document.getElementById('apiKeyModal').classList.add('active');
}

function closeApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  if (modal) modal.classList.remove('active');
  const input = document.getElementById('modalApiKeyValue');
  const btn = document.getElementById('toggleKeyVisibilityBtn');
  if (input) input.type = 'password';
  if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  if (apiKeyRevealTimer) {
    clearTimeout(apiKeyRevealTimer);
    apiKeyRevealTimer = null;
  }
}

function toggleKeyVisibility() {
  const input = document.getElementById('modalApiKeyValue');
  const btn = document.getElementById('toggleKeyVisibilityBtn');
  if (!input) return;

  if (apiKeyRevealTimer) {
    clearTimeout(apiKeyRevealTimer);
    apiKeyRevealTimer = null;
  }

  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    apiKeyRevealTimer = setTimeout(() => {
      if (input) input.type = 'password';
      if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
      apiKeyRevealTimer = null;
    }, 10000);
  } else {
    input.type = 'password';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  }
}

function copyModalApiKey() {
  const t = I18N[CURRENT_LANG];
  const key = document.getElementById('modalApiKeyValue').value;
  navigator.clipboard.writeText(key).then(() => {
    showToast(t.apiKeyCopiedToast, "success");
  });
}

async function regenerateApiKey() {
  const t = I18N[CURRENT_LANG];
  if (!confirm(t.regenConfirm)) return;
  try {
    const res = await fetch('/api/player/regen-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: STATE.currentUser.username,
        apiKey: STATE.currentUser.apiKey
      })
    });
    const data = await res.json();
    if (data.success) {
      STATE.currentUser.apiKey = data.apiKey;
      localStorage.setItem('dnt_apikey', data.apiKey);
      document.getElementById('modalApiKeyValue').value = data.apiKey;
      showToast(data.message || (CURRENT_LANG === 'tr' ? "Yeni API anahtarı üretildi." : "New API key generated."), "success");
    }
  } catch (err) {
    showToast(t.regenFail, "error");
  }
}

// Calculator Logic
function toggleCalculator() {
  const widget = document.getElementById('calcWidget');
  STATE.calculator.isOpen = !STATE.calculator.isOpen;
  if (STATE.calculator.isOpen) {
    widget.classList.add('active');
  } else {
    widget.classList.remove('active');
  }
}

function updateCalcDisplay() {
  const exprEl = document.getElementById('calcExpression');
  const resEl = document.getElementById('calcResult');
  exprEl.textContent = STATE.calculator.expression;
  
  try {
    const sanitized = sanitizeCalcExpr(STATE.calculator.expression);
    if (sanitized) {
      const val = evaluateMathExpr(sanitized);
      if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
        resEl.textContent = '= ' + formatMoney(val);
        return;
      }
    }
  } catch (e) {
    // Incomplete expression while typing
  }
  resEl.textContent = '= ' + (STATE.calculator.result ? formatMoney(STATE.calculator.result) : '0');
}

function sanitizeCalcExpr(raw) {
  if (!raw) return '';
  return raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/%/g, ' * 0.01 ');
}

function evaluateMathExpr(expr) {
  const cleaned = expr.replace(/[+\-*\/×÷−\s]+$/, '').trim();
  if (!cleaned) return 0;
  if (!/^[0-9+\-*\/.\s()]+$/.test(cleaned)) return NaN;
  try {
    return Function('"use strict"; return (' + cleaned + ')')();
  } catch (e) {
    return NaN;
  }
}

function calcAppend(char) {
  let expr = STATE.calculator.expression;
  const isOp = ['+', '-', '*', '/', '×', '÷', '−'].includes(char);
  
  if (expr === '0' || ['Error', 'Undefined', 'Hata', 'Tanımsız'].includes(expr)) {
    if (isOp) {
      expr = '0' + char;
    } else if (char === '.') {
      expr = '0.';
    } else {
      expr = char;
    }
  } else {
    const lastChar = expr.slice(-1);
    const lastIsOp = ['+', '-', '*', '/', '×', '÷', '−'].includes(lastChar);
    if (isOp && lastIsOp) {
      expr = expr.slice(0, -1) + char;
    } else if (char === '.' && lastChar === '.') {
      // ignore double dots
    } else {
      expr += char;
    }
  }
  STATE.calculator.expression = expr;
  updateCalcDisplay();
}

function calcClear() {
  STATE.calculator.expression = '0';
  STATE.calculator.result = 0;
  updateCalcDisplay();
}

function calcBackspace() {
  if (STATE.calculator.expression.length <= 1 || ['Error', 'Undefined', 'Hata', 'Tanımsız'].includes(STATE.calculator.expression)) {
    STATE.calculator.expression = '0';
  } else {
    STATE.calculator.expression = STATE.calculator.expression.slice(0, -1);
  }
  updateCalcDisplay();
}

function calcAppendStack(multiplier) {
  let expr = STATE.calculator.expression;
  if (expr === '0' || ['Error', 'Undefined', 'Hata', 'Tanımsız'].includes(expr)) {
    expr = String(multiplier);
  } else {
    const trimmed = expr.replace(/[+\-*\/×÷−\s]+$/, '');
    expr = (trimmed || '0') + ` * ${multiplier}`;
  }
  STATE.calculator.expression = expr;
  calcEvaluate();
}

function calcAppendMultiplier(multiplier) {
  let expr = STATE.calculator.expression;
  if (expr === '0' || ['Error', 'Undefined', 'Hata', 'Tanımsız'].includes(expr)) {
    expr = String(multiplier);
  } else {
    const trimmed = expr.replace(/[+\-*\/×÷−\s]+$/, '');
    expr = (trimmed || '0') + ` * ${multiplier}`;
  }
  STATE.calculator.expression = expr;
  calcEvaluate();
}

function calcEvaluate() {
  try {
    const sanitized = sanitizeCalcExpr(STATE.calculator.expression);
    const val = evaluateMathExpr(sanitized);
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      STATE.calculator.result = val;
      STATE.calculator.expression = String(val);
      document.getElementById('calcResult').textContent = '= ' + formatMoney(val);
      document.getElementById('calcExpression').textContent = String(val);
    } else {
      document.getElementById('calcResult').textContent = '= ' + (CURRENT_LANG === 'tr' ? 'Tanımsız' : 'Undefined');
    }
  } catch (err) {
    document.getElementById('calcResult').textContent = '= ' + (CURRENT_LANG === 'tr' ? 'Hata' : 'Error');
  }
}

// User Menu & Logout
function handleNavUserClick() {
  if (STATE.currentUser.username) {
    openUserMenuModal();
  } else {
    openLoginModal();
  }
}

function openUserMenuModal() {
  const modal = document.getElementById('userMenuModal');
  if (!modal) return;
  document.getElementById('userMenuName').textContent = STATE.currentUser.username;
  document.getElementById('userMenuAvatar').src = getAvatarUrl(STATE.currentUser.username, 80);

  const badgesRow = document.getElementById('userMenuBadgesRow');
  if (badgesRow) {
    const bal = STATE.viewingData && STATE.viewingData.username &&
      STATE.viewingData.username.toLowerCase() === STATE.currentUser.username.toLowerCase()
        ? STATE.viewingData.balance
        : 0;
    const verifiedHtml = `<span class="wealth-badge badge-special" title="${CURRENT_LANG === 'tr' ? 'Onaylı Oyuncu' : 'Verified Player'}"><i class="fa-solid fa-circle-check"></i> ${CURRENT_LANG === 'tr' ? 'Doğrulandı' : 'Verified'}</span>`;
    badgesRow.innerHTML = `${getWealthBadge(bal).html} ${verifiedHtml}`;
  }
  updateThemeChipsUi();

  modal.classList.add('active');
}

function closeUserMenuModal() {
  const modal = document.getElementById('userMenuModal');
  if (modal) modal.classList.remove('active');
}

function logoutUser() {
  const t = I18N[CURRENT_LANG];
  STATE.currentUser = { username: '', apiKey: '' };
  STATE.isOwner = false;
  localStorage.removeItem('dnt_username');
  localStorage.removeItem('dnt_apikey');
  closeUserMenuModal();
  updateChatAuthUi();
  showToast(t.signedOutToast, "info");
  renderUnlinkedGuestState();
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// Silent background updater for real-time live sync
async function refreshPlayerProfileSilently(username) {
  if (!username) return;
  try {
    const isOwner = STATE.currentUser.username && 
                    username.toLowerCase() === STATE.currentUser.username.toLowerCase();
    const headers = {};
    if (isOwner && STATE.currentUser.apiKey) {
      headers['x-api-key'] = STATE.currentUser.apiKey;
    }

    const res = await fetch(`/api/player/${encodeURIComponent(username)}`, { headers });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !data.player) return;

    const oldBal = STATE.viewingData ? STATE.viewingData.balance : null;
    const oldTxCount = STATE.allTransactions ? STATE.allTransactions.length : 0;
    const newTxCount = data.player.transactions ? data.player.transactions.length : 0;

    if (oldBal !== data.player.balance || oldTxCount !== newTxCount) {
      STATE.viewingData = data.player;
      STATE.allTransactions = data.player.transactions || [];
      renderProfileUI(data.player, isOwner);
      filterTransactions();
      renderCharts(STATE.allTransactions);
    }
  } catch (e) {
    // Silent fail in background
  }
}

// Auto-refresh poll every 3 seconds
setInterval(() => {
  if (STATE.viewingUsername && document.visibilityState === 'visible') {
    refreshPlayerProfileSilently(STATE.viewingUsername);
  }
}, 3000);

// ============================================================
// PUBLIC GLOBAL CHAT LOGIC (Verified Players Only Can Talk)
// ============================================================
let CHAT_DRAWER_OPEN = false;
let LAST_CHAT_MSG_ID = null;
let LAST_CHAT_COUNT = 0;

function togglePublicChat(forceState) {
  const drawer = document.getElementById('publicChatDrawer');
  if (!drawer) return;
  if (typeof forceState === 'boolean') {
    CHAT_DRAWER_OPEN = forceState;
  } else {
    CHAT_DRAWER_OPEN = !CHAT_DRAWER_OPEN;
  }
  drawer.classList.toggle('open', CHAT_DRAWER_OPEN);
  if (CHAT_DRAWER_OPEN) {
    updateChatAuthUi();
    fetchChatMessages(true);
    const unreadDot = document.getElementById('chatUnreadDot');
    if (unreadDot) unreadDot.style.display = 'none';
    const notifBadge = document.getElementById('chatNotificationBadge');
    if (notifBadge) notifBadge.style.display = 'none';
    const toggleBtn = document.getElementById('chatToggleBtn');
    if (toggleBtn) toggleBtn.classList.remove('has-unread');
  }
}

function updateChatAuthUi() {
  const isAuth = !!(STATE.currentUser.username && STATE.currentUser.apiKey);
  const inputBox = document.getElementById('chatAuthInputBox');
  const lockedNotice = document.getElementById('chatLockedNotice');
  const authorName = document.getElementById('chatAuthorName');

  if (isAuth) {
    if (inputBox) inputBox.style.display = 'block';
    if (lockedNotice) lockedNotice.style.display = 'none';
    if (authorName) authorName.textContent = STATE.currentUser.username;
  } else {
    if (inputBox) inputBox.style.display = 'none';
    if (lockedNotice) lockedNotice.style.display = 'flex';
  }
}

async function fetchChatMessages(forceScroll = false) {
  try {
    const res = await fetch('/api/chat/messages');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.messages)) return;

    const latestMsg = data.messages[data.messages.length - 1];
    const latestId = latestMsg ? latestMsg.id : null;
    const hasNewContent = latestId !== LAST_CHAT_MSG_ID || data.messages.length !== LAST_CHAT_COUNT;

    if (hasNewContent || forceScroll) {
      if (!CHAT_DRAWER_OPEN && LAST_CHAT_MSG_ID !== null && latestId !== LAST_CHAT_MSG_ID) {
        const unreadDot = document.getElementById('chatUnreadDot');
        if (unreadDot) unreadDot.style.display = 'block';
        const notifBadge = document.getElementById('chatNotificationBadge');
        if (notifBadge) notifBadge.style.display = 'flex';
        const toggleBtn = document.getElementById('chatToggleBtn');
        if (toggleBtn) toggleBtn.classList.add('has-unread');
      }
      LAST_CHAT_MSG_ID = latestId;
      LAST_CHAT_COUNT = data.messages.length;
      renderChatMessages(data.messages);
      if (forceScroll || CHAT_DRAWER_OPEN) {
        scrollChatToBottom();
      }
    }
  } catch (err) {}
}

function scrollChatToBottom() {
  const container = document.getElementById('chatMessagesContainer');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function renderChatMessages(messages) {
  const list = document.getElementById('chatMessagesList');
  if (!list) return;
  const t = I18N[CURRENT_LANG] || I18N.en;

  if (messages.length === 0) {
    list.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:2rem 1rem;">${t.chatEmptyFeed || 'No messages yet. Say hello!'}</div>`;
    return;
  }

  list.innerHTML = messages.map(m => {
    const isOwn = STATE.currentUser.username && m.username &&
      m.username.toLowerCase() === STATE.currentUser.username.toLowerCase();
    const badge = getWealthBadge(m.balance);
    const d = new Date(m.timestamp);
    const timeStr = isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `
      <div class="chat-msg-row ${isOwn ? 'own-msg' : ''}">
        <img class="chat-msg-avatar" src="${getAvatarUrl(m.username, 32)}" alt="${escapeHtml(m.username)}" onclick="inspectPlayer('${m.username}')" title="Inspect ${escapeHtml(m.username)}">
        <div class="chat-msg-content-box">
          <div class="chat-msg-meta">
            <span class="chat-msg-author" onclick="inspectPlayer('${m.username}')">${escapeHtml(m.username)}</span>
            <span class="wealth-badge badge-${badge.tier}" style="font-size:0.58rem; padding:1px 5px;">
              <i class="${badge.icon}"></i> ${badge.name}
            </span>
            <span class="chat-msg-time">${timeStr}</span>
          </div>
          <div class="chat-msg-bubble">${escapeHtml(m.message)}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function sendChatMessage() {
  const input = document.getElementById('chatInputMessage');
  if (!input) return;
  const text = (input.value || '').trim();
  if (!text) return;

  if (!STATE.currentUser.apiKey) {
    showToast(CURRENT_LANG === 'tr' ? 'Lütfen önce giriş yapın!' : 'Please sign in first!', 'error');
    openLoginModal();
    return;
  }

  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': STATE.currentUser.apiKey
      },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (data.code === 'SPAM_WARNING' || data.code === 'CHAT_COOLDOWN') {
        const msg = CURRENT_LANG === 'tr'
          ? (data.message || 'Çok hızlı mesaj gönderiyorsunuz! Tekrarında 1 dakika susturulacaksınız.')
          : (data.reason === 'REPEAT'
              ? 'Please do not repeat the same message! Continued spam will result in a 1-minute mute.'
              : 'You are chatting too fast! Continued spam will result in a 1-minute mute.');
        showToast(msg, 'warning');
        return;
      }
      if (data.code === 'MUTED') {
        const rem = data.remainingSeconds || data.durationSeconds || 60;
        const msg = CURRENT_LANG === 'tr'
          ? (data.message || `Spam nedeniyle geçici olarak susturuldunuz. Kalan süre: ${rem} saniye.`)
          : `You are temporarily muted due to spam. Remaining time: ${rem}s.`;
        showToast(msg, 'error');
        return;
      }
      if (data.code === 'UNAUTHORIZED') {
        showToast(CURRENT_LANG === 'tr' ? 'Lütfen önce giriş yapın!' : 'Please sign in first!', 'error');
        openLoginModal();
        return;
      }
      showToast(data.message || (CURRENT_LANG === 'tr' ? 'Mesaj gönderilemedi' : 'Failed to send message'), 'error');
      return;
    }

    input.value = '';
    const counter = document.getElementById('chatCharCounter');
    if (counter) counter.textContent = '200';
    fetchChatMessages(true);
  } catch (err) {
    showToast(CURRENT_LANG === 'tr' ? 'Bağlantı hatası' : 'Connection error', 'error');
  }
}

// Global chat poll every 3.5 seconds
setInterval(() => {
  if (document.visibilityState === 'visible') {
    fetchChatMessages(false);
  }
}, 3500);

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize theme first
  switchTheme(CURRENT_THEME, false);

  // Initialize language selector state
  setLanguage(CURRENT_LANG);

  // Initialize public chat state
  updateChatAuthUi();
  fetchChatMessages(false);

  // Character counter for chat
  const chatInput = document.getElementById('chatInputMessage');
  const charCounter = document.getElementById('chatCharCounter');
  if (chatInput && charCounter) {
    chatInput.addEventListener('input', () => {
      charCounter.textContent = 200 - chatInput.value.length;
    });
  }

  const params = new URLSearchParams(window.location.search);
  const requestedPlayer = params.get('player');
  const requestedTab = params.get('tab');
  const savedTab = sessionStorage.getItem('dnt_active_tab');

  if (requestedPlayer) {
    navigateTo('dashboard');
    loadPlayerProfile(requestedPlayer);
  } else if (requestedTab) {
    navigateTo(requestedTab);
  } else if (savedTab) {
    navigateTo(savedTab);
  } else {
    // Default initial landing: Minecraft Mod tab
    navigateTo('plugin-info');
  }
});
