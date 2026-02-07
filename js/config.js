// ไฟล์: js/config.js
// ค่าคงที่และการตั้งค่าระบบทั้งหมด

// ========================================
// DATABASE CONFIGURATION
// ========================================
const DB_NAME = 'expenseTrackerDB_JamesIT';
const DB_VERSION = 8; // *** อัปเดตเป็นเวอร์ชัน 8 ***

const STORE_TRANSACTIONS = 'transactions';
const STORE_CATEGORIES = 'categories';
const STORE_FREQUENT_ITEMS = 'frequentItems';
const STORE_CONFIG = 'config';
const STORE_ACCOUNTS = 'accounts'; 
const STORE_AUTO_COMPLETE = 'autoComplete'; 
const STORE_RECURRING = 'recurring'; // *** เพิ่ม Store ใหม่ ***
const STORE_BUDGETS = 'budgets'; // [NEW]
const STORE_CUSTOM_NOTIFY = 'custom_notifications';
const STORE_NOTIFICATIONS = 'notifications'; // <--- (เก็บประวัติแจ้งเตือนที่จะ Sync)
const STORE_DRAFTS = 'drafts'; // *** เพิ่ม Store สำหรับ Draft ***
const LINE_USER_ID_KEY = 'lineUserId'; // LineID

// ========================================
// PAGE CONFIGURATION
// ========================================
const PAGE_IDS = ['page-home', 'page-list', 'page-calendar', 'page-accounts', 'page-settings', 'page-guide']; // เพิ่ม 'page-accounts'

// ========================================
// SECURITY CONFIGURATION
// ========================================
// ********** Master Password Config **********
const VALID_MASTER_HASH = '90b7a8f04fb00f2cf16545e365f4da47ace5446c49ced401d843b3f9e79efc09';
// ************************************************

// ********** NEW AUTO LOCK VARIABLES **********
const AUTOLOCK_CONFIG_KEY = 'autoLockTimeout';
// *********************************************

// ********** NEW DARK MODE VARIABLE **********
const DARK_MODE_CONFIG_KEY = 'isDarkMode'; 
// *********************************************

// +++ เพิ่มส่วนนี้ +++
const AUTO_CONFIRM_CONFIG_KEY = 'autoConfirmPassword';
// ++++++++++++++++++

const DEFAULT_PASSWORD = '1234';

// ========================================
// DEFAULT DATA
// ========================================
const DEFAULT_CATEGORIES = {
    income: ['เงินเดือน', 'รายได้เสริม', 'ค่าคอม', 'รายได้อื่นๆ'],
    expense: ['อาหาร', 'เครื่องดื่ม', 'เดินทาง', 'ของใช้ส่วนตัว', 'ของใช้ในบ้าน', 'รายจ่ายอื่นๆ']
};
const DEFAULT_FREQUENT_ITEMS = ['กินข้าว', 'รายจ่ายทั่วไป'];

// ========================================
// UI CONFIGURATION
// ========================================
// *** NEW: Icon Choices for Account Settings ***
const ICON_CHOICES = [
    'fa-wallet', 'fa-piggy-bank', 'fa-credit-card', 'fa-money-bill-wave', 
    'fa-sack-dollar', 'fa-building-columns', 'fa-car', 'fa-house', 
    'fa-utensils', 'fa-dumbbell', 'fa-plane', 'fa-graduation-cap', 
    'fa-shopping-cart', 'fa-hospital', 'fa-gift', 'fa-receipt',
    'fa-file-invoice-dollar', 'fa-briefcase', 'fa-mobile-screen', 'fa-store', 
    'fa-person-running', 'fa-paw', 'fa-heart', 'fa-lightbulb'
];

// [1] ตั้งค่าระดับตัวอักษร (ปรับปรุงใหม่ 6 ระดับ)
const fontSettings = [
    { label: 'เล็กสุดๆ', size: '12px' }, // ระดับ 0
    { label: 'เล็ก', size: '14px' },      // ระดับ 1
    { label: 'ปกติ', size: '16px' },      // ระดับ 2 (ค่ามาตรฐาน)
    { label: 'ใหญ่', size: '18px' },      // ระดับ 3
    { label: 'ใหญ่มาก', size: '20px' },   // ระดับ 4
    { label: 'ใหญ่สุดๆ', size: '24px' }   // ระดับ 5
];
