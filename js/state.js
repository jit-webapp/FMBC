// ไฟล์: js/state.js
// ตัวแปร State กลางที่ใช้เก็บข้อมูลของแอปพลิเคชัน

// ========================================
// DATABASE INSTANCE
// ========================================
let db;

// ========================================
// SPEECH RECOGNITION
// ========================================
const SpeechRecognition = window.SpeechRecognition ||
window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'th-TH'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
} else {
    console.warn("Web Speech API not supported in this browser.");
}

// ========================================
// AUTO LOCK STATE
// ========================================
// ********** NEW AUTO LOCK VARIABLES **********
let lastActivityTime = Date.now();
let autoLockTimeoutId = null;
// *********************************************

// ========================================
// MAIN STATE OBJECT
// ========================================
let state = {
    biometricId: null,
    transactions: [],
    categories: {
        income: [],
        expense: []
    },
    accounts: [], 
    frequentItems: [],
    autoCompleteList: [], 
    filterType: 'all', 
    searchTerm: '',
    homeFilterType: 'all', 
    homeViewMode: 'month',
    homeCurrentDate: new Date().toISOString().slice(0, 10),
    listViewMode: 'all',
    listCurrentDate: new Date().toISOString().slice(0, 10),
    password: null,
    homeCurrentPage: 1,
    homeItemsPerPage: 10, 
    listCurrentPage: 1,
    listItemsPerPage: 10,
    calendarCurrentDate: new Date().toISOString().slice(0, 10), 
    listChartMode: 'items',
    listGroupBy: 'none', 
    showBalanceCard: false, 
    isDarkMode: false, 
    settingsCollapse: {},
    autoLockTimeout: 0,
    budgets: [],
    notifySettings: {
        scheduled: true,
        recurring: true,
        budget: true
    },
    customNotifications: [],
    ignoredNotifications: [],
    notificationHistory: [],
    
    advFilterStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), // วันแรกของเดือน
    advFilterEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10), // วันสุดท้ายของเดือน
    advFilterType: 'all',
    advFilterSearch: ''
};

// ========================================
// CHART INSTANCES
// ========================================
// วางต่อจาก }; ของ state เหมือนเดิม
let chartInstanceCategory = null;
let chartInstanceTime = null;

// ========================================
// ACCOUNT DETAIL STATE
// ========================================
// ********** NEW: Account Detail Modal View State & Functions **********
let accountDetailState = {
    accountId: null,
    viewMode: 'all', // 'all', 'month', 'year'
    currentDate: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
};

// ========================================
// FIREBASE LISTENER
// ========================================
let notifUnsubscribe = null;

// ========================================
// CALENDAR INSTANCE
// ========================================
let calendar = null;

// ========================================
// CURRENT PAGE TRACKER
// ========================================
let currentPage = 'home';

// ========================================
// ADDITIONAL STATE VARIABLES
// ========================================
let myChart;
let myListPageBarChart;
let myExpenseByNameChart; 
let myCalendar = null;
let lastUndoAction = null;
let lastRedoAction = null;

let currentReceiptBase64 = null; 
const MAX_FILE_SIZE_MB = 100;

// --- เพิ่ม: ค่ากำหนดการบีบอัด
const COMPRESS_MAX_WIDTH = 1024; // ความกว้างหรือสูงสูงสุด (pixel) - 1024px ชัดพอสำหรับใบเสร็จ
const COMPRESS_QUALITY = 0.7;    // คุณภาพไฟล์ JPEG (0.0 - 1.0) - 0.7 คือ 70% (ชัดแต่ไฟล์เล็ก)

// เพิ่มตัวแปรเก็บ Cache วันหยุด เพื่อไม่ต้องโหลดซ้ำบ่อยๆ
const holidayCache = {};

let isTransitioning = false;

// Master Password Hash
const HASHED_MASTER_PASSWORD = '90b7a8f04fb00f2cf16545e365f4da47ace5446c49ced401d843b3f9e79efc09';
